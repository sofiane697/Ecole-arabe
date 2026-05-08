-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Versionnement des RPCs admin parents + durcissement RLS
--
-- Contexte : audit du 2026-05-08 a identifié deux problèmes critiques :
--   • 7 RPCs admin (admin_fetch_parents_paginated, admin_create_parent_standalone,
--     admin_update_parent, admin_delete_parent, admin_fetch_eleves_of_parent,
--     admin_fetch_parents_of_eleve, admin_unlink_parent_eleve) existaient en base
--     mais n'étaient pas versionnées dans le repo (drift dépôt ↔ DB).
--   • Les policies RLS sur `parents` et `parent_eleves` étaient `USING(true)` pour
--     `anon`, ce qui exposait :
--       - lecture/écriture/suppression des parents (noms, emails, téléphones, hashes
--         bcrypt) directement via la clé anon publique du bundle JS,
--       - INSERT arbitraire dans `parent_eleves` permettant à un attaquant de se
--         rattacher à n'importe quel élève (RGPD-critique sur des données de mineurs).
--
-- Cette migration :
--   1. Versionne les définitions exactes des 7 RPCs telles qu'elles existent en base
--      (snapshot fidèle), pour que le repo redevienne source de vérité.
--   2. Verrouille les policies RLS via `USING(false) WITH CHECK(false)` pour `anon`,
--      forçant tous les accès à passer par les RPCs SECURITY DEFINER.
--
-- À exécuter dans Supabase Dashboard → SQL Editor.
-- À exécuter APRÈS `parents_migration.sql`.
-- Idempotent : peut être ré-exécuté sans casser l'existant.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des signatures existantes ──────────────────────────────────
-- DROP préalable pour permettre les évolutions de signature ultérieures sans
-- conflit. CASCADE pour purger les éventuelles policies/vues dépendantes
-- (aucune attendue en l'état mais safe).
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_fetch_parents_paginated',
        'admin_create_parent_standalone',
        'admin_update_parent',
        'admin_delete_parent',
        'admin_fetch_eleves_of_parent',
        'admin_fetch_parents_of_eleve',
        'admin_unlink_parent_eleve'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. admin_fetch_parents_paginated ────────────────────────────────────────
-- Liste paginée des parents avec recherche libre et compteur total.
-- Recherche case-insensitive sur identifiant, email, téléphone, et concat
-- "{nom} {prenom}" (père et mère séparément).
-- Limite plafonnée à 200 (anti-DoS), valeurs par défaut pratiques.
-- Le total est obtenu via `COUNT(*) OVER ()` calculé une seule fois sur le
-- résultat filtré (refacto post-audit 2026-05-08 — supprime la duplication du
-- prédicat WHERE et garantit la cohérence count/lignes en cas d'évolution).
-- `enfants` est un JSONB agrégé incluant le lien parent↔enfant.
CREATE OR REPLACE FUNCTION public.admin_fetch_parents_paginated(
  p_admin_id UUID,
  p_search   TEXT DEFAULT NULL,
  p_limit    INT  DEFAULT 25,
  p_offset   INT  DEFAULT 0
)
RETURNS TABLE (
  id                   UUID,
  identifiant          TEXT,
  pere_nom             TEXT,
  pere_prenom          TEXT,
  mere_nom             TEXT,
  mere_prenom          TEXT,
  email                TEXT,
  telephone            TEXT,
  actif                BOOLEAN,
  must_change_password BOOLEAN,
  created_at           TIMESTAMPTZ,
  enfants              JSONB,
  total_count          BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_like  TEXT := CASE WHEN COALESCE(p_search,'') = '' THEN NULL
                       ELSE '%' || lower(p_search) || '%' END;
  v_limit INT  := LEAST(GREATEST(COALESCE(p_limit, 25), 1), 200);
  v_off   INT  := GREATEST(COALESCE(p_offset, 0), 0);
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT p.*, COUNT(*) OVER () AS total_count
    FROM public.parents p
    WHERE v_like IS NULL
       OR lower(p.identifiant) LIKE v_like
       OR lower(p.email) LIKE v_like
       OR lower(p.telephone) LIKE v_like
       OR lower(COALESCE(p.pere_nom,'') || ' ' || COALESCE(p.pere_prenom,'')) LIKE v_like
       OR lower(COALESCE(p.mere_nom,'') || ' ' || COALESCE(p.mere_prenom,'')) LIKE v_like
  )
  SELECT f.id,
         f.identifiant::TEXT,
         f.pere_nom::TEXT, f.pere_prenom::TEXT,
         f.mere_nom::TEXT, f.mere_prenom::TEXT,
         f.email::TEXT, f.telephone::TEXT,
         f.actif, f.must_change_password, f.created_at,
         COALESCE((
           SELECT jsonb_agg(
             jsonb_build_object(
               'eleve_id',  e.id,
               'nom',       e.nom,
               'prenom',    e.prenom,
               'classe_id', e.classe_id,
               'lien',      pe.lien
             )
             ORDER BY e.nom, e.prenom
           )
           FROM public.parent_eleves pe
           JOIN public.profils_eleves e ON e.id = pe.eleve_id
           WHERE pe.parent_id = f.id
         ), '[]'::jsonb) AS enfants,
         f.total_count
  FROM filtered f
  ORDER BY f.created_at DESC
  LIMIT v_limit OFFSET v_off;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_parents_paginated(UUID, TEXT, INT, INT)
  TO anon, authenticated;

-- ─── 2. admin_create_parent_standalone ───────────────────────────────────────
-- Identique à admin_create_parent mais sans rattachement initial à un élève
-- (utilisé pour créer un compte « foyer » qu'on rattachera plus tard).
CREATE OR REPLACE FUNCTION public.admin_create_parent_standalone(
  p_admin_id    UUID,
  p_identifiant TEXT,
  p_password    TEXT,
  p_pere_nom    TEXT,
  p_pere_prenom TEXT,
  p_mere_nom    TEXT,
  p_mere_prenom TEXT,
  p_email       TEXT,
  p_telephone   TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
-- ATTENTION (audit 2026-05-08) : `p_password` voyage en clair dans le payload
-- POST PostgREST. Supabase journalise les requêtes API dans le dashboard Logs
-- (tronquées à 1 KiB par défaut, mais le mot de passe peut y figurer).
-- Une mitigation via `SET log_statement = 'none'` n'est pas possible côté
-- fonction (paramètre superuser-only). Pour aller plus loin :
--   (a) hash côté client (bcrypt-WASM) avant envoi (lourd CPU sur mobile),
--   (b) proxy Edge Function qui reçoit le mdp en clair en HTTPS et appelle
--       cette RPC avec le service_role (les logs PostgreSQL n'enregistrent
--       alors que l'appel SQL paramétré, pas le payload HTTP).
-- Statut : risque accepté, logs Supabase admin-only.
AS $$
DECLARE new_parent_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (COALESCE(p_pere_nom,'') = '' AND COALESCE(p_mere_nom,'') = '') THEN
    RAISE EXCEPTION 'Au moins un parent (père ou mère) doit être renseigné';
  END IF;
  INSERT INTO public.parents (
    identifiant, password_hash,
    pere_nom, pere_prenom, mere_nom, mere_prenom,
    email, telephone, must_change_password, actif
  ) VALUES (
    p_identifiant,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    NULLIF(p_pere_nom, ''), NULLIF(p_pere_prenom, ''),
    NULLIF(p_mere_nom, ''), NULLIF(p_mere_prenom, ''),
    p_email, public.normalize_phone(p_telephone),
    true, true
  ) RETURNING id INTO new_parent_id;
  RETURN new_parent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_parent_standalone(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO anon, authenticated;

-- ─── 3. admin_update_parent ──────────────────────────────────────────────────
-- Patch partiel. Sémantique :
--   • NULL → ne change pas (COALESCE).
--   • Pour email et téléphone, '' (chaîne vide) compte aussi comme « ne change
--     pas » : on n'autorise pas de vider ces champs (ils sont NOT NULL en base).
--   • pere_nom / mere_nom / prénoms acceptent NULL = inchangé. Une chaîne vide
--     écraserait la valeur — comportement actuel à conserver pour permettre à
--     l'UI de "vider" un côté du foyer (ex. famille mono-parentale).
CREATE OR REPLACE FUNCTION public.admin_update_parent(
  p_admin_id    UUID,
  p_id          UUID,
  p_pere_nom    TEXT    DEFAULT NULL,
  p_pere_prenom TEXT    DEFAULT NULL,
  p_mere_nom    TEXT    DEFAULT NULL,
  p_mere_prenom TEXT    DEFAULT NULL,
  p_email       TEXT    DEFAULT NULL,
  p_telephone   TEXT    DEFAULT NULL,
  p_actif       BOOLEAN DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  UPDATE public.parents SET
    pere_nom    = COALESCE(p_pere_nom,    pere_nom),
    pere_prenom = COALESCE(p_pere_prenom, pere_prenom),
    mere_nom    = COALESCE(p_mere_nom,    mere_nom),
    mere_prenom = COALESCE(p_mere_prenom, mere_prenom),
    email       = COALESCE(NULLIF(p_email,''), email),
    telephone   = CASE
      WHEN p_telephone IS NULL OR p_telephone = '' THEN telephone
      ELSE public.normalize_phone(p_telephone)
    END,
    actif       = COALESCE(p_actif, actif)
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_parent(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN
) TO anon, authenticated;

-- ─── 4. admin_delete_parent ──────────────────────────────────────────────────
-- Refuse la suppression si des enfants sont encore rattachés. Cela force l'admin
-- à détacher explicitement les enfants d'abord, évitant une cascade silencieuse
-- dévastatrice (un foyer entier supprimé en un clic).
-- Les sessions et déclarations parents sont, elles, nettoyées automatiquement
-- par les FK ON DELETE CASCADE existantes.
--
-- Audit 2026-05-08 :
--   • Anti-énumération : le message d'erreur ne révèle plus le nombre d'enfants
--     rattachés (leak quantitatif de PII de mineurs si admin compromis).
--   • Anti-race : `pg_advisory_xact_lock(hashtext)` sérialise les opérations
--     concurrentes sur le même parent_id pour éviter qu'un INSERT dans
--     parent_eleves se glisse entre le COUNT et le DELETE.
CREATE OR REPLACE FUNCTION public.admin_delete_parent(
  p_admin_id UUID,
  p_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  -- Verrou advisory transaction-local sur le parent ciblé.
  -- Empêche un INSERT/DELETE concurrent dans parent_eleves de fausser le COUNT.
  -- hashtext(p_id::TEXT) → entier 32 bits stable, scope = ce parent uniquement.
  PERFORM pg_advisory_xact_lock(hashtext('admin_delete_parent:' || p_id::TEXT));

  SELECT COUNT(*) INTO v_count FROM public.parent_eleves WHERE parent_id = p_id;
  IF v_count > 0 THEN
    -- Message générique : ne révèle pas combien d'enfants sont rattachés.
    RAISE EXCEPTION 'Impossible de supprimer : des enfants sont encore rattachés. Détachez-les d''abord.';
  END IF;
  DELETE FROM public.parents WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_parent(UUID, UUID)
  TO anon, authenticated;

-- ─── 5. admin_fetch_eleves_of_parent ─────────────────────────────────────────
-- Retourne tous les enfants rattachés à un parent (utilisé sur la fiche parent).
-- IMPORTANT : la 1ʳᵉ colonne s'appelle `eleve_id` (pas `id`) — le frontend
-- (`Parents.jsx:620`) lit explicitement `e.eleve_id`. Ne PAS renommer.
CREATE OR REPLACE FUNCTION public.admin_fetch_eleves_of_parent(
  p_admin_id  UUID,
  p_parent_id UUID
)
RETURNS TABLE (
  eleve_id        UUID,
  nom             TEXT,
  prenom          TEXT,
  classe_id       UUID,
  classe_nom      TEXT,
  lien            TEXT,
  date_naissance  DATE,
  actif           BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT,
         e.classe_id, c.nom::TEXT,
         pe.lien::TEXT,
         e.date_naissance, e.actif
  FROM public.parent_eleves pe
  JOIN public.profils_eleves e ON e.id = pe.eleve_id
  LEFT JOIN public.classes c ON c.id = e.classe_id
  WHERE pe.parent_id = p_parent_id
  ORDER BY e.nom, e.prenom;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_eleves_of_parent(UUID, UUID)
  TO anon, authenticated;

-- ─── 6. admin_fetch_parents_of_eleve ─────────────────────────────────────────
-- Retourne tous les parents rattachés à un élève (utilisé sur la fiche élève).
CREATE OR REPLACE FUNCTION public.admin_fetch_parents_of_eleve(
  p_admin_id UUID,
  p_eleve_id UUID
)
RETURNS TABLE (
  id                   UUID,
  identifiant          TEXT,
  pere_nom             TEXT,
  pere_prenom          TEXT,
  mere_nom             TEXT,
  mere_prenom          TEXT,
  email                TEXT,
  telephone            TEXT,
  lien                 TEXT,
  actif                BOOLEAN,
  must_change_password BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT p.id, p.identifiant::TEXT,
         p.pere_nom::TEXT, p.pere_prenom::TEXT,
         p.mere_nom::TEXT, p.mere_prenom::TEXT,
         p.email::TEXT, p.telephone::TEXT,
         pe.lien::TEXT, p.actif, p.must_change_password
  FROM public.parent_eleves pe
  JOIN public.parents p ON p.id = pe.parent_id
  WHERE pe.eleve_id = p_eleve_id
  ORDER BY pe.created_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_parents_of_eleve(UUID, UUID)
  TO anon, authenticated;

-- ─── 7. admin_unlink_parent_eleve ────────────────────────────────────────────
-- Supprime la ligne pivot entre un parent et un élève. Le parent et l'élève
-- restent en base — seule la relation est détruite. Idempotent : aucun effet
-- si la relation n'existe pas.
CREATE OR REPLACE FUNCTION public.admin_unlink_parent_eleve(
  p_admin_id  UUID,
  p_parent_id UUID,
  p_eleve_id  UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.parent_eleves
  WHERE parent_id = p_parent_id AND eleve_id = p_eleve_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_unlink_parent_eleve(UUID, UUID, UUID)
  TO anon, authenticated;

-- ─── 8. Verrouillage RLS ─────────────────────────────────────────────────────
-- Cœur de la migration. Une fois ces policies en place, tout accès direct via
-- PostgREST (clé anon) à `parents` ou `parent_eleves` est refusé. Seules les
-- fonctions SECURITY DEFINER (qui s'exécutent avec les droits du propriétaire,
-- typiquement postgres) peuvent lire/écrire ces tables.
--
-- IMPORTANT — Avant cette migration, l'audit du 2026-05-08 a confirmé qu'aucun
-- fetch REST direct à ces tables n'existe côté JS :
--   • src/admin/* → passe par les RPCs admin_*
--   • src/parent/* → passe par les RPCs *_for_parent (token-based)
--   • src/enseignant/* → ne touche pas ces tables
--   • src/portail/* → ne touche pas ces tables

DROP POLICY IF EXISTS "parents_all_anon"             ON public.parents;
DROP POLICY IF EXISTS "parent_eleves_all_anon"       ON public.parent_eleves;
DROP POLICY IF EXISTS "parents_no_direct_anon"       ON public.parents;
DROP POLICY IF EXISTS "parent_eleves_no_direct_anon" ON public.parent_eleves;

CREATE POLICY "parents_no_direct_anon"
  ON public.parents FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "parent_eleves_no_direct_anon"
  ON public.parent_eleves FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. Sélection directe via la clé anon doit retourner 0 ligne :
--        SELECT * FROM public.parents LIMIT 1;
--        SELECT * FROM public.parent_eleves LIMIT 1;
--   2. Login admin → page Parents : la liste se charge, recherche fonctionne.
--   3. Login admin → fiche élève → section Parents : liste, attache, détache.
--   4. Login parent → dashboard : enfants, notes, observations s'affichent.
-- ══════════════════════════════════════════════════════════════════════════════
