-- Migration — Observations administratives sur une préinscription
-- Colonne `admin_note` (notes internes) + RPC d'écriture. La lecture passe par
-- admin_fetch_preinscriptions (SETOF preinscriptions → inclut la colonne).
-- Appliquée en production le 2026-06-17.

ALTER TABLE public.preinscriptions ADD COLUMN IF NOT EXISTS admin_note text;

CREATE OR REPLACE FUNCTION public.admin_update_preinscription_note(p_admin_token text, p_id bigint, p_note text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE public.preinscriptions SET admin_note = NULLIF(p_note, '') WHERE id = p_id;
END; $function$;
GRANT EXECUTE ON FUNCTION public.admin_update_preinscription_note(text, bigint, text) TO anon, authenticated;
