-- Migration — admin_create_user : paramètre p_actif (audit P3)
--
-- La conversion d'une préinscription crée le compte en 2 temps : INSERT
-- (actif=true par défaut) puis PATCH actif=false. Si le 2e appel échouait
-- (réseau), le compte restait ACTIF et non rattaché à la préinscription.
-- On ajoute p_actif (DEFAULT true → compat avec la création classique dans
-- « Gestion des élèves ») pour créer le compte directement dans le bon état.

DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_admin_token text, p_identifiant text, p_password text, p_nom text, p_prenom text,
  p_actif boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
DECLARE v_id UUID := gen_random_uuid();
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  INSERT INTO profils_eleves (id, identifiant, password_hash, nom, prenom, must_change_password, actif)
  VALUES (v_id, lower(trim(p_identifiant)), extensions.crypt(p_password, extensions.gen_salt('bf')), p_nom, p_prenom, true, COALESCE(p_actif, true));
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text, boolean) TO anon, authenticated;
