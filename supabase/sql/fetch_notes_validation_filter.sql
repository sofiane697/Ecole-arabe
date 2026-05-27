-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Fix bug "notes non validées visibles côté parent" (audit 2026-05-27)
--
-- Symptôme : un enseignant qui saisit une note avant d'avoir validé l'évaluation
-- (bouton "Valider la série") la voit apparaître instantanément côté parent.
-- Cas concret : note "NA" provisoire saisie pendant la correction → panique
-- parentale → message à l'enseignant → explication "c'était provisoire".
--
-- Cause : `fetch_notes_for_parent` (parents_migration.sql:521-547) ne filtre pas
-- sur `evaluations.valide_le IS NOT NULL`. La colonne `valide_le` a été ajoutée
-- par `evaluations_validation.sql` pour différer la publication mais la RPC
-- parent n'a pas été mise à jour.
--
-- Fix :
--   1. Backfill `valide_le = NOW()` sur toutes les évaluations existantes pour
--      ne pas masquer rétroactivement les notes déjà publiées avant ce fix.
--   2. CREATE OR REPLACE `fetch_notes_for_parent` avec le filtre.
--
-- TODO connu : la RPC `fetch_notes_for_eleve` (côté portail élève) souffre
-- probablement du même bug mais n'est pas versionnée dans ce repo. À fixer
-- manuellement côté Supabase Dashboard avec le même filtre.
--
-- Idempotente. À appliquer sur la base `nsdnzqdbpdncrksgxtar`.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Backfill des évaluations existantes ─────────────────────────────────
-- Toutes les évaluations créées avant l'introduction du champ valide_le sont
-- considérées comme déjà validées (sinon elles disparaîtraient des portails
-- parent et élève au moment de la migration). Le nouveau comportement
-- s'applique uniquement aux évaluations créées après ce backfill.
UPDATE public.evaluations
   SET valide_le = NOW()
 WHERE valide_le IS NULL;

-- ─── 2. fetch_notes_for_parent avec filtre valide_le ────────────────────────
-- Signature identique à parents_migration.sql:521 — CREATE OR REPLACE suffit,
-- pas besoin de DROP.
CREATE OR REPLACE FUNCTION public.fetch_notes_for_parent(p_token TEXT, p_eleve_id UUID)
RETURNS TABLE (
  id           UUID,
  evaluation_id UUID,
  score        NUMERIC,
  absent       BOOLEAN,
  commentaire  TEXT,
  eval_titre   TEXT,
  eval_date    DATE
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT n.id, n.evaluation_id, n.score, n.absent, n.commentaire,
         e.titre::TEXT, e.date_evaluation
  FROM public.notes n
  JOIN public.evaluations e ON e.id = n.evaluation_id
  WHERE n.eleve_id = p_eleve_id
    AND e.valide_le IS NOT NULL
  ORDER BY e.date_evaluation DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_notes_for_parent(TEXT, UUID) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. SELECT COUNT(*) FROM evaluations WHERE valide_le IS NULL;
--      -- doit être 0 immédiatement après la migration
--   2. Test fonctionnel :
--      - Enseignant crée une évaluation, saisit une note SANS valider la série.
--      - Parent connecté ne voit PAS la note.
--      - Enseignant clique "Valider la série".
--      - Parent rafraîchit et voit la note.
-- ══════════════════════════════════════════════════════════════════════════════
