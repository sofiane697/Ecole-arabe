-- Migration — Conversion en 2 temps : création (inactif) puis activation
-- À la conversion d'une préinscription : on crée le compte INACTIF côté front, on
-- le rattache à la préinscription (eleve_id) et on passe la demande à « contacté »
-- (Traité). C'est l'ACTIVATION du compte qui fait passer la demande à « inscrit ».
-- Appliquée en production le 2026-06-17.

-- Lien préinscription ↔ compte créé + passage à « contacté ».
CREATE OR REPLACE FUNCTION public.admin_link_preinscription_eleve(p_admin_token text, p_id bigint, p_eleve_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE public.preinscriptions
     SET eleve_id = p_eleve_id, statut = 'contacté'
   WHERE id = p_id;
END; $function$;
GRANT EXECUTE ON FUNCTION public.admin_link_preinscription_eleve(text, bigint, uuid) TO anon, authenticated;

-- À l'activation du compte : la préinscription liée passe à « inscrit » (sauf si refusée).
CREATE OR REPLACE FUNCTION public.admin_inscrire_preinscription_by_eleve(p_admin_token text, p_eleve_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE public.preinscriptions
     SET statut = 'inscrit'
   WHERE eleve_id = p_eleve_id AND statut <> 'refusé';
END; $function$;
GRANT EXECUTE ON FUNCTION public.admin_inscrire_preinscription_by_eleve(text, uuid) TO anon, authenticated;
