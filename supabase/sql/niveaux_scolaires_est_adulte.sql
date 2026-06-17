-- Migration — Filtre Enfant/Adulte sur les niveaux scolaires
-- Marqueur `est_adulte` sur niveaux_scolaires + RPC (création/màj). Classification
-- initiale par préfixe : « A-… » = adulte, sinon enfant. La lecture passe par un
-- SELECT REST direct (renvoie la colonne automatiquement).
-- Appliquée en production le 2026-06-17.

ALTER TABLE public.niveaux_scolaires
  ADD COLUMN IF NOT EXISTS est_adulte BOOLEAN NOT NULL DEFAULT false;

UPDATE public.niveaux_scolaires SET est_adulte = (nom LIKE 'A-%');

-- Création : accepte est_adulte (DROP + CREATE car ajout d'un argument).
DROP FUNCTION IF EXISTS public.admin_create_niveau_scolaire(text, text, integer);
CREATE FUNCTION public.admin_create_niveau_scolaire(p_admin_token text, p_nom text, p_ordre integer DEFAULT 0, p_est_adulte boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF COALESCE(trim(p_nom), '') = '' THEN
    RAISE EXCEPTION 'nom requis';
  END IF;
  INSERT INTO public.niveaux_scolaires (nom, ordre, est_adulte)
  VALUES (trim(p_nom), COALESCE(p_ordre, 0), COALESCE(p_est_adulte, false))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;
GRANT EXECUTE ON FUNCTION public.admin_create_niveau_scolaire(text, text, integer, boolean) TO anon, authenticated;

-- Mise à jour : gère est_adulte dans p_data.
CREATE OR REPLACE FUNCTION public.admin_update_niveau_scolaire(p_admin_token text, p_id uuid, p_data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.niveaux_scolaires SET
    nom        = COALESCE(NULLIF(trim(p_data->>'nom'), ''), nom),
    ordre      = COALESCE((p_data->>'ordre')::INTEGER, ordre),
    est_adulte = COALESCE((p_data->>'est_adulte')::BOOLEAN, est_adulte)
  WHERE id = p_id;
END;
$function$;
