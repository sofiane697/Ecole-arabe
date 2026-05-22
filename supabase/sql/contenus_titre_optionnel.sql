-- ══════════════════════════════════════════════════════════════════════════════
-- contenus_titre_optionnel.sql
-- Rend le champ `titre` optionnel dans la table contenus et dans les fonctions
-- admin_create_contenu / admin_update_contenu.
-- Idempotent — peut être rejoué sans risque.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Rendre la colonne nullable avec une valeur par défaut chaîne vide
ALTER TABLE public.contenus
  ALTER COLUMN titre DROP NOT NULL,
  ALTER COLUMN titre SET DEFAULT '';

-- 2. Recréer admin_create_contenu sans la vérification du titre
CREATE OR REPLACE FUNCTION public.admin_create_contenu(
  p_admin_id UUID,
  p_data     JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id BIGINT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (p_data->>'niveau_id') IS NULL THEN
    RAISE EXCEPTION 'niveau_id requis';
  END IF;
  IF COALESCE(p_data->>'type', '') = '' THEN
    RAISE EXCEPTION 'type requis';
  END IF;

  INSERT INTO public.contenus (niveau_id, type, titre, contenu, ordre)
  VALUES (
    (p_data->>'niveau_id')::BIGINT,
    p_data->>'type',
    COALESCE(p_data->>'titre', ''),
    p_data->>'contenu',
    COALESCE((p_data->>'ordre')::INT, 0)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_contenu(UUID, JSONB) TO anon, authenticated;
