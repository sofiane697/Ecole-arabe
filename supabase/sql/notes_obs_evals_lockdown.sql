-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.C : Verrouillage TOTAL des données scolaires sensibles
--
-- Cible : `notes`, `evaluations`, `observations`, `retards_absences`.
--
-- Stratégie « lockdown total » (USING(false) WITH CHECK(false)) :
--   • Données RGPD sur mineurs (notes scolaires, appréciations, absences) :
--     pas question de laisser le SELECT ouvert à anon comme en phase 2.B.
--   • Tous les accès passent par RPCs SECURITY DEFINER existantes (24 RPCs
--     déjà en base, drift dépôt ↔ DB depuis longtemps), token-based pour
--     élève/enseignant/parent et admin-id pour admin.
--
-- Cette migration :
--   1. Crée 3 RPCs admin manquantes (les seules voies REST directes côté JS) :
--        admin_fetch_notes_eleve, admin_fetch_observations_eleve,
--        admin_fetch_retards_absences_eleve.
--   2. Verrouille les 4 tables (USING(false) WITH CHECK(false)).
--   3. NE versionne PAS les 24 RPCs déjà en base (drift à corriger en migration
--      dédiée plus tard via pg_get_functiondef ; hors scope sécurité).
--
-- À exécuter APRÈS `cours_rls_lockdown.sql`. Idempotent.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage ───────────────────────────────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_fetch_notes_eleve',
        'admin_fetch_observations_eleve',
        'admin_fetch_retards_absences_eleve'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. admin_fetch_notes_eleve ──────────────────────────────────────────────
-- Remplace l'accès REST direct `fetchNotesEleve` côté admin (Eleves.jsx fiche
-- élève). Le retour inclut les colonnes de `evaluations` jointes pour afficher
-- le titre/date/score_max sans round-trip supplémentaire.
CREATE OR REPLACE FUNCTION public.admin_fetch_notes_eleve(
  p_admin_id UUID,
  p_eleve_id UUID
)
RETURNS TABLE (
  id              UUID,
  evaluation_id   UUID,
  eleve_id        UUID,
  enseignant_id   UUID,
  score           NUMERIC,
  absent          BOOLEAN,
  commentaire     TEXT,
  created_at      TIMESTAMPTZ,
  eval_titre      TEXT,
  eval_date       DATE,
  eval_score_max  NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT n.id, n.evaluation_id, n.eleve_id, n.enseignant_id,
         n.score, n.absent, n.commentaire, n.created_at,
         e.titre::TEXT, e.date_evaluation, e.score_max
  FROM public.notes n
  JOIN public.evaluations e ON e.id = n.evaluation_id
  WHERE n.eleve_id = p_eleve_id
  ORDER BY e.date_evaluation DESC, n.created_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_notes_eleve(UUID, UUID)
  TO anon, authenticated;

-- ─── 2. admin_fetch_observations_eleve ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_observations_eleve(
  p_admin_id UUID,
  p_eleve_id UUID
)
RETURNS TABLE (
  id            UUID,
  eleve_id      UUID,
  enseignant_id UUID,
  classe_id     UUID,
  type          TEXT,
  contenu       TEXT,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT o.id, o.eleve_id, o.enseignant_id, o.classe_id,
         o.type::TEXT, o.contenu, o.created_at, o.updated_at
  FROM public.observations o
  WHERE o.eleve_id = p_eleve_id
  ORDER BY o.created_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_observations_eleve(UUID, UUID)
  TO anon, authenticated;

-- ─── 3. admin_fetch_retards_absences_eleve ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_retards_absences_eleve(
  p_admin_id UUID,
  p_eleve_id UUID
)
RETURNS TABLE (
  id            UUID,
  eleve_id      UUID,
  enseignant_id UUID,
  classe_id     UUID,
  type          TEXT,
  date          DATE,
  commentaire   TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT r.id, r.eleve_id, r.enseignant_id, r.classe_id,
         r.type::TEXT, r.date, r.commentaire, r.created_at
  FROM public.retards_absences r
  WHERE r.eleve_id = p_eleve_id
  ORDER BY r.date DESC, r.created_at DESC
  LIMIT 500;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_retards_absences_eleve(UUID, UUID)
  TO anon, authenticated;

-- ─── 4. RLS LOCKDOWN TOTAL ───────────────────────────────────────────────────
-- Drop EXHAUSTIF des policies existantes via énumération (leçon phase 2.A : un
-- nom oublié laisserait la table accessible). On boucle sur pg_policies.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('notes', 'evaluations', 'observations', 'retards_absences')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "notes_no_direct_anon" ON public.notes
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "evaluations_no_direct_anon" ON public.evaluations
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "observations_no_direct_anon" ON public.observations
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "retards_absences_no_direct_anon" ON public.retards_absences
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. SET LOCAL ROLE anon; SELECT count(*) FROM notes; -- doit retourner 0.
--   2. RPCs élève/enseignant/parent/admin doivent fonctionner avec token/admin valide.
--   3. Les 24 RPCs existantes en base (non versionnées ici, à versionner dans
--      une migration drift_recovery dédiée) continuent de marcher car elles
--      tournent en SECURITY DEFINER → indépendantes du RLS.
-- ══════════════════════════════════════════════════════════════════════════════
