-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RPC fetch_note_acks_eleve_for_enseignant
--
-- Objectif : permettre au portail enseignant d'afficher dans la fiche élève
-- (onglet Notes) si chaque note a été accusée de réception ("signée") par un
-- parent, et par qui.
--
-- Différence vs RPCs existantes :
--   • fetch_note_acks_for_enseignant(token, eval_id) → par éval (déjà OK pour
--     l'écran "Notes" qui affiche une éval à la fois)
--   • admin_fetch_note_acks(admin_token, eleve_id)   → côté admin
--   • CETTE RPC : par élève, côté enseignant — nécessaire pour la fiche élève
--
-- Sécurité : utilise `_enseignant_owns_eleve` (lance une exception si
-- l'enseignant n'a pas accès à cet élève via au moins une de ses classes).
--
-- Idempotente.
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.fetch_note_acks_eleve_for_enseignant(
  p_token    TEXT,
  p_eleve_id UUID
)
RETURNS TABLE (
  note_id      UUID,
  parent_label TEXT,
  created_at   TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ownership : exception si l'élève n'est pas dans une classe de l'enseignant
  PERFORM public._enseignant_owns_eleve(p_token, p_eleve_id);

  RETURN QUERY
  SELECT
    nar.note_id,
    TRIM(
      COALESCE(p.pere_prenom || ' ' || p.pere_nom, '') ||
      CASE WHEN p.pere_nom IS NOT NULL AND p.mere_nom IS NOT NULL THEN ' / ' ELSE '' END ||
      COALESCE(p.mere_prenom || ' ' || p.mere_nom, '')
    )::TEXT,
    nar.created_at
  FROM public.note_accusations_reception nar
  JOIN public.parents p ON p.id = nar.parent_id
  WHERE nar.eleve_id = p_eleve_id
  ORDER BY nar.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_note_acks_eleve_for_enseignant(TEXT, UUID)
  TO anon, authenticated;
