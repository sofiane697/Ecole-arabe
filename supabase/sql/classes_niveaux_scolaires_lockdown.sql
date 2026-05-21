-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.F : Verrouillage WRITE de `niveaux_scolaires` et `classes`
--
-- Ces deux tables n'étaient pas couvertes par les phases précédentes (2.A–2.E).
-- Toute requête REST anon pouvait INSERT/PATCH/DELETE sans authentification.
--
-- Stratégie identique à la Phase 2.B (cours_rls_lockdown.sql) :
--   • SELECT reste ouvert — portails élève/enseignant/admin lisent ces tables
--     en REST direct pour peupler les listes de classes et niveaux.
--   • INSERT/UPDATE/DELETE bloqués pour anon — toutes les écritures passent
--     désormais par RPCs admin_* SECURITY DEFINER avec vérification _is_admin.
--
-- RPCs créées (6) — pattern Phase 3 (p_admin_token TEXT) :
--   admin_create_niveau_scolaire, admin_update_niveau_scolaire, admin_delete_niveau_scolaire
--   admin_create_classe,          admin_update_classe,          admin_delete_classe
--
-- Schémas :
--   niveaux_scolaires : id UUID, nom TEXT NOT NULL, ordre INTEGER
--   classes           : id UUID, niveau_id UUID NOT NULL, nom TEXT NOT NULL
--
-- Idempotent — DROP IF EXISTS + OR REPLACE sur toutes les fonctions.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des signatures existantes ──────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_create_niveau_scolaire', 'admin_update_niveau_scolaire', 'admin_delete_niveau_scolaire',
        'admin_create_classe',          'admin_update_classe',          'admin_delete_classe'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. NIVEAUX SCOLAIRES ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_create_niveau_scolaire(
  p_admin_token TEXT,
  p_nom         TEXT,
  p_ordre       INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF COALESCE(trim(p_nom), '') = '' THEN
    RAISE EXCEPTION 'nom requis';
  END IF;
  INSERT INTO public.niveaux_scolaires (nom, ordre)
  VALUES (trim(p_nom), COALESCE(p_ordre, 0))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_niveau_scolaire(TEXT, TEXT, INTEGER) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_niveau_scolaire(
  p_admin_token TEXT,
  p_id          UUID,
  p_data        JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.niveaux_scolaires SET
    nom   = COALESCE(NULLIF(trim(p_data->>'nom'), ''),   nom),
    ordre = COALESCE((p_data->>'ordre')::INTEGER,        ordre)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_niveau_scolaire(TEXT, UUID, JSONB) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_niveau_scolaire(
  p_admin_token TEXT,
  p_id          UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.niveaux_scolaires WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_niveau_scolaire(TEXT, UUID) TO anon, authenticated;

-- ─── 2. CLASSES ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_create_classe(
  p_admin_token TEXT,
  p_niveau_id   UUID,
  p_nom         TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF p_niveau_id IS NULL THEN
    RAISE EXCEPTION 'niveau_id requis';
  END IF;
  IF COALESCE(trim(p_nom), '') = '' THEN
    RAISE EXCEPTION 'nom requis';
  END IF;
  INSERT INTO public.classes (niveau_id, nom)
  VALUES (p_niveau_id, trim(p_nom))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_classe(TEXT, UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_classe(
  p_admin_token TEXT,
  p_id          UUID,
  p_nom         TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF COALESCE(trim(p_nom), '') = '' THEN
    RAISE EXCEPTION 'nom requis';
  END IF;
  UPDATE public.classes SET nom = trim(p_nom) WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_classe(TEXT, UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_classe(
  p_admin_token TEXT,
  p_id          UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.classes WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_classe(TEXT, UUID) TO anon, authenticated;

-- ─── 3. RLS LOCKDOWN ÉCRITURE (SELECT reste ouvert) ──────────────────────────

ALTER TABLE public.niveaux_scolaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes            ENABLE ROW LEVEL SECURITY;

-- Purge des anciennes policies pour ne pas laisser de policy permissive orpheline.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('niveaux_scolaires', 'classes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- SELECT ouvert (portails élève / enseignant / admin lisent en REST direct)
CREATE POLICY "niveaux_scolaires_select_anon" ON public.niveaux_scolaires
  FOR SELECT TO anon, authenticated USING (true);

-- Toute écriture directe bloquée — passe par les RPCs admin_* ci-dessus
CREATE POLICY "niveaux_scolaires_no_write_anon" ON public.niveaux_scolaires
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "classes_select_anon" ON public.classes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "classes_no_write_anon" ON public.classes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration (à exécuter dans l'éditeur SQL Supabase) :
--
--   -- 1. Lecture toujours ouverte
--   SET LOCAL ROLE anon;
--   SELECT count(*) FROM niveaux_scolaires;   -- doit retourner > 0
--   SELECT count(*) FROM classes;             -- doit retourner > 0
--
--   -- 2. Écriture directe bloquée
--   SET LOCAL ROLE anon;
--   INSERT INTO niveaux_scolaires (nom) VALUES ('test');  -- doit échouer
--   UPDATE classes SET nom = 'hack' WHERE id = (SELECT id FROM classes LIMIT 1);  -- 0 lignes
--
--   -- 3. RPCs admin fonctionnent avec token valide
--   SELECT admin_create_niveau_scolaire('<token_valide>', 'Test N3', 3);  -- retourne UUID
-- ══════════════════════════════════════════════════════════════════════════════
