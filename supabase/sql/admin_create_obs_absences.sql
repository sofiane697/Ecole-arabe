-- ─── Admin : créer observations et retards/absences depuis la fiche élève ────
-- Pattern Phase 3 : token opaque TEXT → _is_admin(TEXT)
-- enseignant_id = NULL car l'entrée est créée par l'admin, pas un enseignant

-- ─── 1. Créer une appréciation ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_observation(
  p_admin_token TEXT,
  p_eleve_id    UUID,
  p_classe_id   UUID,
  p_type        TEXT,    -- 'general' | 'comportement' | 'progression'
  p_contenu     TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  IF p_contenu IS NULL OR trim(p_contenu) = '' THEN
    RAISE EXCEPTION 'Le contenu de l''appréciation est obligatoire';
  END IF;

  IF p_type NOT IN ('general', 'comportement', 'progression') THEN
    RAISE EXCEPTION 'Type d''appréciation invalide : %', p_type;
  END IF;

  INSERT INTO public.observations (eleve_id, enseignant_id, classe_id, type, contenu)
  VALUES (p_eleve_id, NULL, p_classe_id, p_type, trim(p_contenu))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_observation(TEXT, UUID, UUID, TEXT, TEXT)
  TO anon, authenticated;


-- ─── 2. Créer un retard ou une absence ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_retard_absence(
  p_admin_token TEXT,
  p_eleve_id    UUID,
  p_classe_id   UUID,
  p_type        TEXT,    -- 'retard' | 'absence'
  p_date        DATE,
  p_commentaire TEXT     -- optionnel
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  IF p_type NOT IN ('retard', 'absence') THEN
    RAISE EXCEPTION 'Type invalide : %', p_type;
  END IF;

  IF p_date IS NULL THEN
    RAISE EXCEPTION 'La date est obligatoire';
  END IF;

  INSERT INTO public.retards_absences (eleve_id, enseignant_id, classe_id, type, date, commentaire)
  VALUES (p_eleve_id, NULL, p_classe_id, p_type, p_date, p_commentaire)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_retard_absence(TEXT, UUID, UUID, TEXT, DATE, TEXT)
  TO anon, authenticated;
