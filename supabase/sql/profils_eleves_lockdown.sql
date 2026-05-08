-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.D.2 : Verrouillage TOTAL `profils_eleves`
--
-- Table la plus sensible du projet :
--   • Hashes bcrypt élèves (password_hash)
--   • Identifiants, emails de contact (PII enfants)
--   • Liens vers classes, niveaux scolaires
--
-- Stratégie « lockdown total » : USING(false) WITH CHECK(false). Toutes les
-- voies passent désormais par RPCs SECURITY DEFINER qui sélectionnent
-- explicitement les colonnes sûres (JAMAIS password_hash, jamais photo_path
-- brut sans authentif).
--
-- RPCs côté élève/enseignant/parent existent déjà :
--   • fetch_eleve_self_secure, fetch_eleves_de_classe_secure (enseignant)
--   • fetch_parent_enfants (parent)
--   • verify_eleve_session, login_eleve (élève)
-- 5 RPCs admin sont créées ici pour fermer les voies REST directes restantes.
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_fetch_eleves',
        'admin_fetch_eleve_by_id',
        'admin_fetch_eleve_id_par_identifiant',
        'admin_update_eleve',
        'admin_delete_eleve_full'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. admin_fetch_eleves ─────────────────────────────────────────────────
-- Liste des élèves. Whitelist explicite des colonnes — JAMAIS password_hash.
CREATE OR REPLACE FUNCTION public.admin_fetch_eleves(p_admin_id UUID)
RETURNS TABLE (
  id                   UUID,
  nom                  TEXT,
  prenom               TEXT,
  email                TEXT,
  email_contact        TEXT,
  telephone            TEXT,
  identifiant          TEXT,
  must_change_password BOOLEAN,
  actif                BOOLEAN,
  classe_id            UUID,
  niveau_scolaire_id   UUID,
  date_naissance       DATE,
  photo_url            TEXT,
  photo_path           TEXT,
  photo_scale          NUMERIC,
  photo_pos_x          NUMERIC,
  photo_pos_y          NUMERIC,
  created_at           TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT, e.email::TEXT, e.email_contact::TEXT,
         e.telephone::TEXT, e.identifiant::TEXT, e.must_change_password, e.actif,
         e.classe_id, e.niveau_scolaire_id, e.date_naissance,
         e.photo_url, e.photo_path, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
         e.created_at
  FROM public.profils_eleves e
  ORDER BY e.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleves(UUID) TO anon, authenticated;

-- ─── 2. admin_fetch_eleve_by_id ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_eleve_by_id(p_admin_id UUID, p_eleve_id UUID)
RETURNS TABLE (
  id                   UUID,
  nom                  TEXT,
  prenom               TEXT,
  email                TEXT,
  email_contact        TEXT,
  telephone            TEXT,
  identifiant          TEXT,
  must_change_password BOOLEAN,
  actif                BOOLEAN,
  classe_id            UUID,
  niveau_scolaire_id   UUID,
  date_naissance       DATE,
  photo_url            TEXT,
  photo_path           TEXT,
  photo_scale          NUMERIC,
  photo_pos_x          NUMERIC,
  photo_pos_y          NUMERIC,
  created_at           TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT, e.email::TEXT, e.email_contact::TEXT,
         e.telephone::TEXT, e.identifiant::TEXT, e.must_change_password, e.actif,
         e.classe_id, e.niveau_scolaire_id, e.date_naissance,
         e.photo_url, e.photo_path, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
         e.created_at
  FROM public.profils_eleves e
  WHERE e.id = p_eleve_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleve_by_id(UUID, UUID) TO anon, authenticated;

-- ─── 3. admin_fetch_eleve_id_par_identifiant ───────────────────────────────
-- Fallback utilisé après création quand createEleve ne retourne pas l'UUID.
CREATE OR REPLACE FUNCTION public.admin_fetch_eleve_id_par_identifiant(
  p_admin_id    UUID,
  p_identifiant TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  SELECT id INTO v_id FROM public.profils_eleves WHERE identifiant = p_identifiant;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleve_id_par_identifiant(UUID, TEXT)
  TO anon, authenticated;

-- ─── 4. admin_update_eleve ─────────────────────────────────────────────────
-- Whitelist explicite des champs éditables. password_hash, identifiant,
-- niveau_scolaire_id ne sont PAS éditables ici — il y a déjà des RPCs
-- dédiées (`admin_reset_eleve_password`, `admin_update_eleve_niveau_scolaire`).
CREATE OR REPLACE FUNCTION public.admin_update_eleve(
  p_admin_id UUID,
  p_id       UUID,
  p_data     JSONB
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.profils_eleves SET
    nom            = COALESCE(NULLIF(p_data->>'nom', ''),    nom),
    prenom         = COALESCE(NULLIF(p_data->>'prenom', ''), prenom),
    email          = COALESCE(p_data->>'email', email),
    email_contact  = COALESCE(p_data->>'email_contact', email_contact),
    telephone      = COALESCE(p_data->>'telephone', telephone),
    actif          = COALESCE((p_data->>'actif')::BOOLEAN, actif),
    classe_id      = CASE WHEN p_data ? 'classe_id'
                          THEN NULLIF(p_data->>'classe_id', '')::UUID
                          ELSE classe_id END,
    date_naissance = CASE WHEN p_data ? 'date_naissance'
                          THEN NULLIF(p_data->>'date_naissance', '')::DATE
                          ELSE date_naissance END,
    photo_url      = COALESCE(p_data->>'photo_url', photo_url),
    photo_path     = COALESCE(p_data->>'photo_path', photo_path),
    photo_scale    = COALESCE((p_data->>'photo_scale')::NUMERIC, photo_scale),
    photo_pos_x    = COALESCE((p_data->>'photo_pos_x')::NUMERIC, photo_pos_x),
    photo_pos_y    = COALESCE((p_data->>'photo_pos_y')::NUMERIC, photo_pos_y)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_eleve(UUID, UUID, JSONB)
  TO anon, authenticated;

-- ─── 5. admin_delete_eleve_full ────────────────────────────────────────────
-- Le DELETE de l'élève cascade automatiquement sur les FK ON DELETE CASCADE :
-- eleve_progression, parent_eleves, eleve_sessions, eleve_auth_sessions, etc.
-- chat_messages reste à supprimer explicitement (la FK n'a pas de cascade).
CREATE OR REPLACE FUNCTION public.admin_delete_eleve_full(
  p_admin_id UUID,
  p_id       UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  -- Purge messages chat (pas de cascade FK).
  DELETE FROM public.chat_messages WHERE eleve_id = p_id;
  -- DELETE profil — cascade FK purge eleve_progression, parent_eleves, etc.
  DELETE FROM public.profils_eleves WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_eleve_full(UUID, UUID)
  TO anon, authenticated;

-- ─── 6. RLS LOCKDOWN TOTAL ────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profils_eleves'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "profils_eleves_no_direct_anon" ON public.profils_eleves
  FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);
