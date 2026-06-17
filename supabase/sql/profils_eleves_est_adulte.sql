-- Migration — Séparation étudiants (adultes) / élèves (enfants)
-- Ajoute une colonne marqueur `est_adulte` sur profils_eleves et l'expose dans
-- les RPC de lecture + écriture. Les comptes existants restent à false (élèves).
-- Appliquée en production le 2026-06-17.

ALTER TABLE public.profils_eleves
  ADD COLUMN IF NOT EXISTS est_adulte BOOLEAN NOT NULL DEFAULT false;

-- ─── admin_update_eleve : accepte est_adulte (retour void → CREATE OR REPLACE) ───
CREATE OR REPLACE FUNCTION public.admin_update_eleve(p_admin_token text, p_id uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Acces refuse : session admin requise'; END IF;
  UPDATE public.profils_eleves SET
    nom            = COALESCE(NULLIF(p_data->>'nom', ''), nom),
    prenom         = COALESCE(NULLIF(p_data->>'prenom', ''), prenom),
    email_contact  = COALESCE(p_data->>'email_contact', email_contact),
    telephone      = COALESCE(p_data->>'telephone', telephone),
    actif          = COALESCE((p_data->>'actif')::BOOLEAN, actif),
    est_adulte     = COALESCE((p_data->>'est_adulte')::BOOLEAN, est_adulte),
    classe_id      = CASE WHEN p_data ? 'classe_id' THEN NULLIF(p_data->>'classe_id', '')::UUID ELSE classe_id END,
    date_naissance = CASE WHEN p_data ? 'date_naissance' THEN NULLIF(p_data->>'date_naissance', '')::DATE ELSE date_naissance END,
    photo_url      = COALESCE(p_data->>'photo_url', photo_url),
    photo_path     = COALESCE(p_data->>'photo_path', photo_path),
    photo_scale    = COALESCE((p_data->>'photo_scale')::NUMERIC, photo_scale),
    photo_pos_x    = COALESCE((p_data->>'photo_pos_x')::NUMERIC, photo_pos_x),
    photo_pos_y    = COALESCE((p_data->>'photo_pos_y')::NUMERIC, photo_pos_y)
  WHERE id = p_id;
END; $function$;

-- ─── admin_fetch_eleves : expose est_adulte (DROP + CREATE car le type change) ───
DROP FUNCTION IF EXISTS public.admin_fetch_eleves(text);
CREATE FUNCTION public.admin_fetch_eleves(p_admin_token text)
 RETURNS TABLE(id uuid, nom text, prenom text, email_contact text, telephone text, identifiant text, must_change_password boolean, actif boolean, est_adulte boolean, classe_id uuid, niveau_scolaire_id uuid, date_naissance date, photo_url text, photo_path text, photo_scale numeric, photo_pos_x numeric, photo_pos_y numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Acces refuse : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT, e.email_contact::TEXT,
         e.telephone::TEXT, e.identifiant::TEXT, e.must_change_password, e.actif, e.est_adulte,
         e.classe_id, e.niveau_scolaire_id, e.date_naissance,
         e.photo_url, e.photo_path, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
         e.created_at
  FROM public.profils_eleves e ORDER BY e.created_at DESC;
END; $function$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleves(text) TO anon, authenticated;

-- ─── admin_fetch_eleve_by_id : idem ───
DROP FUNCTION IF EXISTS public.admin_fetch_eleve_by_id(text, uuid);
CREATE FUNCTION public.admin_fetch_eleve_by_id(p_admin_token text, p_eleve_id uuid)
 RETURNS TABLE(id uuid, nom text, prenom text, email_contact text, telephone text, identifiant text, must_change_password boolean, actif boolean, est_adulte boolean, classe_id uuid, niveau_scolaire_id uuid, date_naissance date, photo_url text, photo_path text, photo_scale numeric, photo_pos_x numeric, photo_pos_y numeric, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Acces refuse : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT, e.email_contact::TEXT,
         e.telephone::TEXT, e.identifiant::TEXT, e.must_change_password, e.actif, e.est_adulte,
         e.classe_id, e.niveau_scolaire_id, e.date_naissance,
         e.photo_url, e.photo_path, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
         e.created_at
  FROM public.profils_eleves e WHERE e.id = p_eleve_id;
END; $function$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleve_by_id(text, uuid) TO anon, authenticated;
