-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.B : Verrouillage WRITE des tables pédagogiques
--
-- Cible : `modules`, `thematiques`, `lecons`, `niveaux`, `contenus`.
--
-- Stratégie « lockdown ciblé » (Option B post-audit) :
--   • LECTURE reste OUVERTE à anon — les portails élève/enseignant/admin
--     consomment massivement ces tables en SELECT direct (≈40 fetchs REST).
--     Migrer toutes ces lectures vers RPCs serait coûteux et sans bénéfice
--     sécurité (le contenu pédagogique est public-ish une fois auth).
--   • ÉCRITURE bloquée à anon — INSERT/UPDATE/DELETE refusés. Seules les RPCs
--     admin_* SECURITY DEFINER (avec vérification _is_admin) peuvent écrire.
--
-- Cela ferme la faille critique F-4 identifiée à l'audit phase 2.A : un anon
-- pouvait PATCH `niveaux.score_requis = 0` et neutraliser l'anti-triche QCM.
--
-- ÉCRITURES IMPACTÉES (15 wrappers JS dans supabaseAdmin.js) :
--   • create/update/delete pour chacune des 5 tables (5 × 3 = 15).
--
-- À exécuter APRÈS `eleve_qcm_lockdown.sql`. Idempotent.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des signatures existantes ──────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_create_module',     'admin_update_module',     'admin_delete_module',
        'admin_create_thematique', 'admin_update_thematique', 'admin_delete_thematique',
        'admin_create_lecon',      'admin_update_lecon',      'admin_delete_lecon',
        'admin_create_niveau',     'admin_update_niveau',     'admin_delete_niveau',
        'admin_create_contenu',    'admin_update_contenu',    'admin_delete_contenu'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. MODULES ──────────────────────────────────────────────────────────────
-- Schéma : id, titre, description, image_url, ordre, actif, niveaux_scolaires_ids,
--          image_scale, image_pos_x, image_pos_y.
-- Le payload JSONB permet un patch partiel propre — chaque champ est COALESCED
-- avec sa valeur actuelle. La whitelist implicite : seuls les champs listés
-- ci-dessous sont pris en compte (le reste du JSONB est ignoré).

CREATE OR REPLACE FUNCTION public.admin_create_module(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF COALESCE(p_data->>'titre', '') = '' THEN
    RAISE EXCEPTION 'titre requis';
  END IF;

  INSERT INTO public.modules (
    titre, description, image_url, ordre, actif, niveaux_scolaires_ids,
    image_scale, image_pos_x, image_pos_y
  ) VALUES (
    p_data->>'titre',
    p_data->>'description',
    p_data->>'image_url',
    COALESCE((p_data->>'ordre')::INT, 0),
    COALESCE((p_data->>'actif')::BOOLEAN, true),
    COALESCE(
      (SELECT array_agg(value::TEXT::UUID)
       FROM jsonb_array_elements(COALESCE(p_data->'niveaux_scolaires_ids', '[]'::JSONB))),
      '{}'::UUID[]
    ),
    COALESCE((p_data->>'image_scale')::NUMERIC, 1.0),
    COALESCE((p_data->>'image_pos_x')::NUMERIC, 50),
    COALESCE((p_data->>'image_pos_y')::NUMERIC, 50)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_module(UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_module(
  p_admin_id UUID,
  p_id       BIGINT,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.modules SET
    titre        = COALESCE(NULLIF(p_data->>'titre', ''), titre),
    description  = COALESCE(p_data->>'description', description),
    image_url    = COALESCE(p_data->>'image_url', image_url),
    ordre        = COALESCE((p_data->>'ordre')::INT, ordre),
    actif        = COALESCE((p_data->>'actif')::BOOLEAN, actif),
    niveaux_scolaires_ids = COALESCE(
      (SELECT array_agg(value::TEXT::UUID)
       FROM jsonb_array_elements(p_data->'niveaux_scolaires_ids')),
      niveaux_scolaires_ids
    ),
    image_scale  = COALESCE((p_data->>'image_scale')::NUMERIC, image_scale),
    image_pos_x  = COALESCE((p_data->>'image_pos_x')::NUMERIC, image_pos_x),
    image_pos_y  = COALESCE((p_data->>'image_pos_y')::NUMERIC, image_pos_y)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_module(UUID, BIGINT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_module(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.modules WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_module(UUID, BIGINT) TO anon, authenticated;

-- ─── 2. THÉMATIQUES ──────────────────────────────────────────────────────────
-- Schéma : id, module_id (FK NOT NULL), titre, description, image_url, ordre,
--          niveaux_scolaires_ids, image_scale, image_pos_x, image_pos_y.

CREATE OR REPLACE FUNCTION public.admin_create_thematique(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (p_data->>'module_id') IS NULL THEN
    RAISE EXCEPTION 'module_id requis';
  END IF;
  IF COALESCE(p_data->>'titre', '') = '' THEN
    RAISE EXCEPTION 'titre requis';
  END IF;

  INSERT INTO public.thematiques (
    module_id, titre, description, image_url, ordre, niveaux_scolaires_ids,
    image_scale, image_pos_x, image_pos_y
  ) VALUES (
    (p_data->>'module_id')::BIGINT,
    p_data->>'titre',
    p_data->>'description',
    p_data->>'image_url',
    COALESCE((p_data->>'ordre')::INT, 0),
    COALESCE(
      (SELECT array_agg(value::TEXT::UUID)
       FROM jsonb_array_elements(COALESCE(p_data->'niveaux_scolaires_ids', '[]'::JSONB))),
      '{}'::UUID[]
    ),
    COALESCE((p_data->>'image_scale')::NUMERIC, 1.0),
    COALESCE((p_data->>'image_pos_x')::NUMERIC, 50),
    COALESCE((p_data->>'image_pos_y')::NUMERIC, 50)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_thematique(UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_thematique(
  p_admin_id UUID,
  p_id       BIGINT,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.thematiques SET
    titre        = COALESCE(NULLIF(p_data->>'titre', ''), titre),
    description  = COALESCE(p_data->>'description', description),
    image_url    = COALESCE(p_data->>'image_url', image_url),
    ordre        = COALESCE((p_data->>'ordre')::INT, ordre),
    niveaux_scolaires_ids = COALESCE(
      (SELECT array_agg(value::TEXT::UUID)
       FROM jsonb_array_elements(p_data->'niveaux_scolaires_ids')),
      niveaux_scolaires_ids
    ),
    image_scale  = COALESCE((p_data->>'image_scale')::NUMERIC, image_scale),
    image_pos_x  = COALESCE((p_data->>'image_pos_x')::NUMERIC, image_pos_x),
    image_pos_y  = COALESCE((p_data->>'image_pos_y')::NUMERIC, image_pos_y)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_thematique(UUID, BIGINT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_thematique(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.thematiques WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_thematique(UUID, BIGINT) TO anon, authenticated;

-- ─── 3. LEÇONS ───────────────────────────────────────────────────────────────
-- Schéma : id, thematique_id (FK NOT NULL), titre, description, image_url,
--          ordre, image_scale, image_pos_x, image_pos_y.

CREATE OR REPLACE FUNCTION public.admin_create_lecon(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (p_data->>'thematique_id') IS NULL THEN
    RAISE EXCEPTION 'thematique_id requis';
  END IF;
  IF COALESCE(p_data->>'titre', '') = '' THEN
    RAISE EXCEPTION 'titre requis';
  END IF;

  INSERT INTO public.lecons (
    thematique_id, titre, description, image_url, ordre,
    image_scale, image_pos_x, image_pos_y
  ) VALUES (
    (p_data->>'thematique_id')::BIGINT,
    p_data->>'titre',
    p_data->>'description',
    p_data->>'image_url',
    COALESCE((p_data->>'ordre')::INT, 0),
    COALESCE((p_data->>'image_scale')::NUMERIC, 1.0),
    COALESCE((p_data->>'image_pos_x')::NUMERIC, 50),
    COALESCE((p_data->>'image_pos_y')::NUMERIC, 50)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_lecon(UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_lecon(
  p_admin_id UUID,
  p_id       BIGINT,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.lecons SET
    titre        = COALESCE(NULLIF(p_data->>'titre', ''), titre),
    description  = COALESCE(p_data->>'description', description),
    image_url    = COALESCE(p_data->>'image_url', image_url),
    ordre        = COALESCE((p_data->>'ordre')::INT, ordre),
    image_scale  = COALESCE((p_data->>'image_scale')::NUMERIC, image_scale),
    image_pos_x  = COALESCE((p_data->>'image_pos_x')::NUMERIC, image_pos_x),
    image_pos_y  = COALESCE((p_data->>'image_pos_y')::NUMERIC, image_pos_y)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_lecon(UUID, BIGINT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_lecon(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.lecons WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_lecon(UUID, BIGINT) TO anon, authenticated;

-- ─── 4. NIVEAUX ──────────────────────────────────────────────────────────────
-- Schéma : id, module_id, thematique_id, lecon_id, titre, description,
--          image_url, ordre, score_requis, image_scale, image_pos_x, image_pos_y.
-- IMPORTANT — score_requis : c'est précisément le champ qui était writable par
-- anon (faille F-4). En passant par cette RPC, l'admin contrôle qui peut le
-- modifier. La borne minimum à 50 dans submit_qcm_secure reste en defense-in-depth.

CREATE OR REPLACE FUNCTION public.admin_create_niveau(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF COALESCE(p_data->>'titre', '') = '' THEN
    RAISE EXCEPTION 'titre requis';
  END IF;

  INSERT INTO public.niveaux (
    module_id, thematique_id, lecon_id, titre, description, image_url,
    ordre, score_requis, image_scale, image_pos_x, image_pos_y
  ) VALUES (
    (p_data->>'module_id')::BIGINT,
    (p_data->>'thematique_id')::BIGINT,
    (p_data->>'lecon_id')::BIGINT,
    p_data->>'titre',
    p_data->>'description',
    p_data->>'image_url',
    COALESCE((p_data->>'ordre')::INT, 0),
    COALESCE((p_data->>'score_requis')::INT, 80),
    COALESCE((p_data->>'image_scale')::NUMERIC, 1.0),
    COALESCE((p_data->>'image_pos_x')::NUMERIC, 50),
    COALESCE((p_data->>'image_pos_y')::NUMERIC, 50)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_niveau(UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_niveau(
  p_admin_id UUID,
  p_id       BIGINT,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.niveaux SET
    module_id     = COALESCE((p_data->>'module_id')::BIGINT, module_id),
    thematique_id = COALESCE((p_data->>'thematique_id')::BIGINT, thematique_id),
    lecon_id      = COALESCE((p_data->>'lecon_id')::BIGINT, lecon_id),
    titre         = COALESCE(NULLIF(p_data->>'titre', ''), titre),
    description   = COALESCE(p_data->>'description', description),
    image_url     = COALESCE(p_data->>'image_url', image_url),
    ordre         = COALESCE((p_data->>'ordre')::INT, ordre),
    score_requis  = COALESCE((p_data->>'score_requis')::INT, score_requis),
    image_scale   = COALESCE((p_data->>'image_scale')::NUMERIC, image_scale),
    image_pos_x   = COALESCE((p_data->>'image_pos_x')::NUMERIC, image_pos_x),
    image_pos_y   = COALESCE((p_data->>'image_pos_y')::NUMERIC, image_pos_y)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_niveau(UUID, BIGINT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_niveau(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.niveaux WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_niveau(UUID, BIGINT) TO anon, authenticated;

-- ─── 5. CONTENUS ─────────────────────────────────────────────────────────────
-- Schéma : id, niveau_id, type (NOT NULL), titre (NOT NULL), contenu, ordre.

CREATE OR REPLACE FUNCTION public.admin_create_contenu(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (p_data->>'niveau_id') IS NULL THEN
    RAISE EXCEPTION 'niveau_id requis';
  END IF;
  IF COALESCE(p_data->>'type', '') = '' THEN
    RAISE EXCEPTION 'type requis';
  END IF;
  IF COALESCE(p_data->>'titre', '') = '' THEN
    RAISE EXCEPTION 'titre requis';
  END IF;

  INSERT INTO public.contenus (niveau_id, type, titre, contenu, ordre)
  VALUES (
    (p_data->>'niveau_id')::BIGINT,
    p_data->>'type',
    p_data->>'titre',
    p_data->>'contenu',
    COALESCE((p_data->>'ordre')::INT, 0)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_contenu(UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_contenu(
  p_admin_id UUID,
  p_id       BIGINT,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.contenus SET
    niveau_id = COALESCE((p_data->>'niveau_id')::BIGINT, niveau_id),
    type      = COALESCE(NULLIF(p_data->>'type', ''), type),
    titre     = COALESCE(NULLIF(p_data->>'titre', ''), titre),
    contenu   = COALESCE(p_data->>'contenu', contenu),
    ordre     = COALESCE((p_data->>'ordre')::INT, ordre)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_contenu(UUID, BIGINT, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_contenu(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.contenus WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_contenu(UUID, BIGINT) TO anon, authenticated;

-- ─── 5b. CHECK constraint anti-orphelin sur niveaux ─────────────────────────
-- Audit phase 2.B (A4) : `admin_update_niveau` permet de COALESCE module_id,
-- thematique_id, lecon_id. Si l'admin envoie explicitement les 3 à NULL dans
-- le payload, le COALESCE conserve les valeurs existantes — donc en pratique
-- pas de risque via la RPC. Mais cette CHECK constraint est une defense-in-depth
-- contre toute autre voie (SQL direct via owner, future RPC mal écrite).
-- La table contient 17 niveaux à la migration, tous avec au moins un parent.
ALTER TABLE public.niveaux
  DROP CONSTRAINT IF EXISTS niveaux_at_least_one_parent;
ALTER TABLE public.niveaux
  ADD CONSTRAINT niveaux_at_least_one_parent
  CHECK (module_id IS NOT NULL OR thematique_id IS NOT NULL OR lecon_id IS NOT NULL);

-- ─── 6. RLS LOCKDOWN ÉCRITURE (SELECT reste ouvert) ──────────────────────────
-- Pattern « lockdown WRITE » : on conserve un policy SELECT permissive pour
-- garder les lectures massives via REST direct côté élève/enseignant/admin,
-- mais on bloque toute écriture directe.
--
-- Postgres applique l'OR sur les policies multiples :
--   - Pour SELECT : la policy SELECT USING(true) autorise → accès.
--   - Pour INSERT/UPDATE/DELETE : aucune policy permissive ne s'applique
--     (la policy ALL USING(false) WITH CHECK(false) refuse) → bloqué.
--
-- IMPORTANT : on droppe TOUTES les policies historiques (anon_all,
-- admin_all_*, service_all) avant de créer les nouvelles. Sinon, une policy
-- permissive existante neutraliserait le verrou (leçon apprise phase 2.A).

DROP POLICY IF EXISTS "anon_all"                ON public.modules;
DROP POLICY IF EXISTS "admin_all_modules"        ON public.modules;
DROP POLICY IF EXISTS "modules_select_anon"      ON public.modules;
DROP POLICY IF EXISTS "modules_no_write_anon"    ON public.modules;

DROP POLICY IF EXISTS "anon_all"                  ON public.thematiques;
DROP POLICY IF EXISTS "admin_all_thematiques"     ON public.thematiques;
DROP POLICY IF EXISTS "thematiques_select_anon"   ON public.thematiques;
DROP POLICY IF EXISTS "thematiques_no_write_anon" ON public.thematiques;

DROP POLICY IF EXISTS "anon_all"             ON public.lecons;
DROP POLICY IF EXISTS "admin_all_lecons"     ON public.lecons;
DROP POLICY IF EXISTS "service_all"          ON public.lecons;
DROP POLICY IF EXISTS "lecons_select_anon"   ON public.lecons;
DROP POLICY IF EXISTS "lecons_no_write_anon" ON public.lecons;

DROP POLICY IF EXISTS "anon_all"               ON public.niveaux;
DROP POLICY IF EXISTS "admin_all_niveaux"      ON public.niveaux;
DROP POLICY IF EXISTS "niveaux_select_anon"    ON public.niveaux;
DROP POLICY IF EXISTS "niveaux_no_write_anon"  ON public.niveaux;

DROP POLICY IF EXISTS "anon_all"               ON public.contenus;
DROP POLICY IF EXISTS "admin_all_contenus"     ON public.contenus;
DROP POLICY IF EXISTS "contenus_select_anon"   ON public.contenus;
DROP POLICY IF EXISTS "contenus_no_write_anon" ON public.contenus;

-- Création des policies SELECT-only ouvertes + ALL block.
CREATE POLICY "modules_select_anon" ON public.modules
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "modules_no_write_anon" ON public.modules
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "thematiques_select_anon" ON public.thematiques
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "thematiques_no_write_anon" ON public.thematiques
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "lecons_select_anon" ON public.lecons
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "lecons_no_write_anon" ON public.lecons
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "niveaux_select_anon" ON public.niveaux
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "niveaux_no_write_anon" ON public.niveaux
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "contenus_select_anon" ON public.contenus
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "contenus_no_write_anon" ON public.contenus
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. Lecture côté portails inchangée :
--        SET LOCAL ROLE anon;
--        SELECT count(*) FROM modules;     -- doit retourner > 0
--        SELECT count(*) FROM niveaux;     -- doit retourner > 0
--   2. Écriture refusée :
--        SET LOCAL ROLE anon;
--        UPDATE niveaux SET score_requis = 0 WHERE id = 33;  -- doit échouer (0 lignes)
--        INSERT INTO modules (titre) VALUES ('test');         -- doit échouer
--   3. RPCs admin fonctionnent avec UUID admin valide.
-- ══════════════════════════════════════════════════════════════════════════════
