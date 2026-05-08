-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.D.1 : Verrouillage TOTAL `enseignants` + `enseignant_classes`
--
-- Tables concernées :
--   • `enseignants` (contient password_hash bcrypt — RGPD critique)
--   • `enseignant_classes` (jointure many-to-many enseignant ↔ classes)
--
-- Stratégie « lockdown total » : tout accès direct via PostgREST refusé pour
-- anon/authenticated. Les RPCs SECURITY DEFINER existantes côté élève/enseignant
-- (fetch_enseignants_de_eleve_secure, login_enseignant, etc.) continuent de
-- fonctionner car elles tournent en propriétaire.
--
-- Cette migration crée 6 RPCs admin manquantes pour fermer toutes les voies
-- REST directes côté supabaseAdmin.js + 1 RPC enseignant pour fetchMyPresence.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage ───────────────────────────────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_fetch_enseignants',
        'admin_insert_enseignant',
        'admin_update_enseignant',
        'admin_delete_enseignant',
        'admin_fetch_enseignant_classes',
        'admin_set_enseignant_classes',
        'fetch_my_presence_secure'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. admin_fetch_enseignants ─────────────────────────────────────────────
-- Liste tous les enseignants (sans password_hash). Pas de pagination — la table
-- est petite (< 100 enseignants pour un institut).
CREATE OR REPLACE FUNCTION public.admin_fetch_enseignants(p_admin_id UUID)
RETURNS TABLE (
  id                   UUID,
  nom                  TEXT,
  prenom               TEXT,
  email                TEXT,
  telephone            TEXT,
  identifiant          TEXT,
  must_change_password BOOLEAN,
  actif                BOOLEAN,
  statut_presence      TEXT,
  presence_updated_at  TIMESTAMPTZ,
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
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT, e.email::TEXT, e.telephone::TEXT,
         e.identifiant::TEXT, e.must_change_password, e.actif,
         e.statut_presence::TEXT, e.presence_updated_at, e.created_at
  FROM public.enseignants e
  ORDER BY e.nom, e.prenom;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_enseignants(UUID) TO anon, authenticated;

-- ─── 2. admin_insert_enseignant ─────────────────────────────────────────────
-- Crée la ligne `enseignants` (sans password). Le mot de passe est posé après
-- via `admin_create_enseignant(p_id, p_identifiant, p_password)` qui existe
-- déjà en base.
CREATE OR REPLACE FUNCTION public.admin_insert_enseignant(
  p_admin_id UUID,
  p_data     JSONB
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
  IF COALESCE(p_data->>'nom', '') = '' OR COALESCE(p_data->>'prenom', '') = '' THEN
    RAISE EXCEPTION 'nom et prenom requis';
  END IF;
  INSERT INTO public.enseignants (nom, prenom, email, telephone, actif)
  VALUES (
    p_data->>'nom',
    p_data->>'prenom',
    p_data->>'email',
    p_data->>'telephone',
    COALESCE((p_data->>'actif')::BOOLEAN, true)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_insert_enseignant(UUID, JSONB) TO anon, authenticated;

-- ─── 3. admin_update_enseignant ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_enseignant(
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
  UPDATE public.enseignants SET
    nom       = COALESCE(NULLIF(p_data->>'nom', ''),    nom),
    prenom    = COALESCE(NULLIF(p_data->>'prenom', ''), prenom),
    email     = COALESCE(NULLIF(p_data->>'email', ''),  email),
    telephone = COALESCE(p_data->>'telephone', telephone),
    actif     = COALESCE((p_data->>'actif')::BOOLEAN, actif)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_enseignant(UUID, UUID, JSONB) TO anon, authenticated;

-- ─── 4. admin_delete_enseignant ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_enseignant(
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
  DELETE FROM public.enseignants WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_enseignant(UUID, UUID) TO anon, authenticated;

-- ─── 5. admin_fetch_enseignant_classes ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_enseignant_classes(
  p_admin_id     UUID,
  p_enseignant_id UUID
)
RETURNS SETOF UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT classe_id FROM public.enseignant_classes
  WHERE enseignant_id = p_enseignant_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_enseignant_classes(UUID, UUID) TO anon, authenticated;

-- ─── 6. admin_set_enseignant_classes ────────────────────────────────────────
-- Remplace l'ensemble des assignations en une seule transaction (DELETE+INSERT
-- atomique). Évite la fenêtre où l'enseignant n'a aucune classe entre les deux
-- statements REST séquentiels (audit B-X de la phase 1).
CREATE OR REPLACE FUNCTION public.admin_set_enseignant_classes(
  p_admin_id     UUID,
  p_enseignant_id UUID,
  p_classe_ids   UUID[]
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.enseignant_classes WHERE enseignant_id = p_enseignant_id;
  IF p_classe_ids IS NOT NULL AND array_length(p_classe_ids, 1) > 0 THEN
    INSERT INTO public.enseignant_classes (enseignant_id, classe_id)
    SELECT p_enseignant_id, unnest(p_classe_ids);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_enseignant_classes(UUID, UUID, UUID[]) TO anon, authenticated;

-- ─── 7. fetch_my_presence_secure (côté enseignant) ──────────────────────────
-- Remplace l'accès REST direct `enseignants?id=eq.X&select=statut_presence`
-- introduit en phase B4 pour ne pas écraser le statut au reload.
CREATE OR REPLACE FUNCTION public.fetch_my_presence_secure(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ens_id  UUID;
  v_statut  TEXT;
BEGIN
  v_ens_id := public._resolve_enseignant_session(p_token);
  IF v_ens_id IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;
  SELECT statut_presence::TEXT INTO v_statut
  FROM public.enseignants WHERE id = v_ens_id;
  RETURN v_statut;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fetch_my_presence_secure(TEXT) TO anon, authenticated;

-- ─── 8. RLS LOCKDOWN TOTAL ──────────────────────────────────────────────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('enseignants', 'enseignant_classes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

CREATE POLICY "enseignants_no_direct_anon" ON public.enseignants
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE POLICY "enseignant_classes_no_direct_anon" ON public.enseignant_classes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
