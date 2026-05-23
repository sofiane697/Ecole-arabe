-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.E : Verrouillage `inscriptions`, `messages`,
-- `chat_messages`, `eleve_sessions`.
--
-- Stratégies par table :
--   • `inscriptions` : INSERT public AUTORISÉ (formulaire site `App.jsx:422`),
--     SELECT/UPDATE/DELETE admin-only via RPCs.
--   • `messages` : INSERT public AUTORISÉ (contact `App.jsx:619`),
--     SELECT/UPDATE/DELETE admin-only via RPCs.
--   • `chat_messages` : LOCKDOWN TOTAL (RPCs `_secure` côté élève/enseignant
--     + nouvelles RPCs admin pour la surveillance).
--   • `eleve_sessions` : LOCKDOWN TOTAL (RPCs heartbeat/end existantes côté
--     élève + nouvelles RPCs admin pour le tracking).
--
-- 9 RPCs admin créées ici. Côté élève/enseignant : aucun changement (les RPCs
-- existent déjà en base).
-- ══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'admin_fetch_inscriptions',
        'admin_update_inscription_statut',
        'admin_update_inscription_eleve_id',
        'admin_fetch_messages',
        'admin_update_message_lu',
        'admin_delete_message',
        'admin_fetch_eleve_sessions',
        'admin_fetch_all_conversations',
        'admin_fetch_conversation_messages'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. INSCRIPTIONS ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_inscriptions(p_admin_id UUID)
RETURNS SETOF inscriptions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY SELECT * FROM public.inscriptions ORDER BY created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_inscriptions(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_inscription_statut(
  p_admin_token TEXT, p_id BIGINT, p_statut TEXT
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.inscriptions SET statut = p_statut WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_inscription_statut(TEXT, BIGINT, TEXT)
  TO anon, authenticated;

-- Lier une inscription à un élève (post-conversion).
CREATE OR REPLACE FUNCTION public.admin_update_inscription_eleve_id(
  p_admin_token TEXT, p_id BIGINT, p_eleve_id UUID
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.inscriptions SET eleve_id = p_eleve_id, statut = 'converti'
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_inscription_eleve_id(TEXT, BIGINT, UUID)
  TO anon, authenticated;

-- ─── 2. MESSAGES (formulaire contact) ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_messages(p_admin_id UUID)
RETURNS SETOF messages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY SELECT * FROM public.messages ORDER BY created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_messages(UUID) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_message_lu(
  p_admin_id UUID, p_id UUID, p_lu BOOLEAN
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.messages SET lu = p_lu WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_message_lu(UUID, UUID, BOOLEAN)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_message(p_admin_id UUID, p_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.messages WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_message(UUID, UUID) TO anon, authenticated;

-- ─── 3. ELEVE_SESSIONS (tracking visites élève) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_fetch_eleve_sessions(
  p_admin_id UUID, p_eleve_id UUID, p_from TIMESTAMPTZ, p_to TIMESTAMPTZ
)
RETURNS SETOF eleve_sessions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT * FROM public.eleve_sessions
  WHERE eleve_id = p_eleve_id
    AND started_at >= p_from AND started_at <= p_to
  ORDER BY started_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_eleve_sessions(UUID, UUID, TIMESTAMPTZ, TIMESTAMPTZ)
  TO anon, authenticated;

-- ─── 4. CHAT_MESSAGES (surveillance admin) ───────────────────────────────────
-- Toutes les conversations dédupliquées en SQL (DISTINCT ON), avec jointures
-- sur profils_eleves et enseignants pour afficher le nom et la photo.
CREATE OR REPLACE FUNCTION public.admin_fetch_all_conversations(p_admin_id UUID)
RETURNS TABLE (
  eleve_id           UUID,
  enseignant_id      UUID,
  contenu            TEXT,
  created_at         TIMESTAMPTZ,
  sender_role        TEXT,
  eleve_nom          TEXT,
  eleve_prenom       TEXT,
  eleve_classe_id    UUID,
  eleve_photo_url    TEXT,
  eleve_photo_scale  NUMERIC,
  eleve_photo_pos_x  NUMERIC,
  eleve_photo_pos_y  NUMERIC,
  enseignant_nom     TEXT,
  enseignant_prenom  TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT DISTINCT ON (m.eleve_id, m.enseignant_id)
    m.eleve_id, m.enseignant_id, m.contenu, m.created_at, m.sender_role::TEXT,
    e.nom::TEXT, e.prenom::TEXT, e.classe_id,
    e.photo_url, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
    t.nom::TEXT, t.prenom::TEXT
  FROM public.chat_messages m
  LEFT JOIN public.profils_eleves e ON e.id = m.eleve_id
  LEFT JOIN public.enseignants t    ON t.id = m.enseignant_id
  ORDER BY m.eleve_id, m.enseignant_id, m.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_all_conversations(UUID)
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_fetch_conversation_messages(
  p_admin_id UUID, p_eleve_id UUID, p_enseignant_id UUID
)
RETURNS SETOF chat_messages
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT * FROM public.chat_messages
  WHERE eleve_id = p_eleve_id AND enseignant_id = p_enseignant_id
  ORDER BY created_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_conversation_messages(UUID, UUID, UUID)
  TO anon, authenticated;

-- ─── 5. RLS ─────────────────────────────────────────────────────────────────

-- Drop EXHAUSTIF des policies existantes
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('inscriptions', 'messages', 'chat_messages', 'eleve_sessions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- inscriptions : INSERT public OK (formulaire site), tout le reste bloqué
CREATE POLICY "inscriptions_insert_public" ON public.inscriptions
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "inscriptions_no_select_anon" ON public.inscriptions
  FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "inscriptions_no_update_anon" ON public.inscriptions
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "inscriptions_no_delete_anon" ON public.inscriptions
  FOR DELETE TO anon, authenticated USING (false);

-- messages : pareil (formulaire contact)
CREATE POLICY "messages_insert_public" ON public.messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "messages_no_select_anon" ON public.messages
  FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "messages_no_update_anon" ON public.messages
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "messages_no_delete_anon" ON public.messages
  FOR DELETE TO anon, authenticated USING (false);

-- chat_messages : full lockdown (RPCs élève/enseignant/admin uniquement)
CREATE POLICY "chat_messages_no_direct_anon" ON public.chat_messages
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- eleve_sessions : full lockdown (RPCs élève heartbeat + RPC admin)
CREATE POLICY "eleve_sessions_no_direct_anon" ON public.eleve_sessions
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
