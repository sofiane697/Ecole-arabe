-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Ajouter tracking "consultée" pour les pré-inscriptions.
--
-- Nouvelle colonne `viewed_at` : timestamp quand l'admin a consulté la fiche
-- pour la 1ère fois. NULL = pas encore consultée.
--
-- Le badge admin ne compte que `statut='nouveau' AND viewed_at IS NULL`.
-- ══════════════════════════════════════════════════════════════════════════════

-- Ajouter la colonne
ALTER TABLE public.inscriptions ADD COLUMN viewed_at TIMESTAMPTZ DEFAULT NULL;

-- Créer la RPC admin pour marquer comme "consultée"
CREATE OR REPLACE FUNCTION public.admin_mark_inscription_viewed(
  p_admin_token TEXT, p_inscription_id BIGINT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : token admin requis';
  END IF;
  UPDATE public.inscriptions
  SET viewed_at = COALESCE(viewed_at, NOW())
  WHERE id = p_inscription_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_mark_inscription_viewed(TEXT, BIGINT)
  TO anon, authenticated;
