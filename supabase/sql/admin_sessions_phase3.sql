-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Phase 3 : Auth admin réelle (token + expiration)
--
-- Avant cette phase : `verify_admin_session(p_id UUID)` ne faisait qu'un lookup
-- dans `profils_admins`. Si un attaquant obtenait un UUID admin (fuite log,
-- exfiltration via console, partage de session), il pouvait forger une session
-- admin et appeler toutes les RPCs admin_*.
--
-- Stratégie : pattern session_token comme `parent_sessions`,
-- `eleve_auth_sessions`, `enseignant_auth_sessions`. Chaque login génère un
-- token aléatoire (32 bytes hex) avec expiration 7j. Le client stocke le token
-- en sessionStorage. Toutes les RPCs admin_* prennent désormais `p_admin_token`
-- au lieu de `p_admin_id`, le serveur résout l'admin_id côté SQL.
--
-- IMPACT BREAKING : tous les admins connectés actuels seront déconnectés et
-- devront se reloguer (leur session "ancienne" n'a pas de token). Acceptable
-- une fois (single-tenant institut).
--
-- Migration en deux temps :
--   3.A (cette migration) — infra : table admin_sessions, helpers, login_v2
--   3.B (à venir) — migration des 59 RPCs admin_* vers p_admin_token
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Table admin_sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token       TEXT        PRIMARY KEY,
  admin_id    UUID        NOT NULL REFERENCES public.profils_admins(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT,
  ip_hint     TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires  ON public.admin_sessions (expires_at);

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_sessions_no_direct" ON public.admin_sessions;
CREATE POLICY "admin_sessions_no_direct"
  ON public.admin_sessions FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 2. Helper _resolve_admin_session ───────────────────────────────────────
-- Résout un token vers un admin_id. NULL si invalide ou expiré.
-- Utilisé par les RPCs admin_* migrées vers le pattern token.
CREATE OR REPLACE FUNCTION public._resolve_admin_session(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_admin_id UUID;
BEGIN
  IF p_token IS NULL OR length(p_token) = 0 THEN RETURN NULL; END IF;
  SELECT admin_id INTO v_admin_id
  FROM public.admin_sessions
  WHERE token = p_token AND expires_at > now();
  RETURN v_admin_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public._resolve_admin_session(TEXT) TO anon, authenticated;

-- ─── 3. Helper _is_admin_token (variante du _is_admin existant) ─────────────
-- Vérifie qu'un token appartient à un admin actif. Surcharge de `_is_admin`
-- avec signature TEXT plutôt que UUID — Postgres dispatche selon le type
-- d'argument, donc les deux peuvent coexister sans conflit.
CREATE OR REPLACE FUNCTION public._is_admin(p_admin_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_admin_token IS NULL OR length(p_admin_token) = 0 THEN RETURN FALSE; END IF;
  RETURN public._resolve_admin_session(p_admin_token) IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public._is_admin(TEXT) TO anon, authenticated;

-- ─── 4. login_admin_custom v2 — génère un token ─────────────────────────────
-- Remplace l'ancienne version. Les callers existants reçoivent maintenant
-- `{id, identifiant, display_name, token, expires_at}`. Le frontend doit
-- stocker le `token` et le passer à toutes les RPCs admin_* migrées.
CREATE OR REPLACE FUNCTION public.login_admin_custom(p_identifiant TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_admin     profils_admins;
  v_token     TEXT;
  v_expires   TIMESTAMPTZ;
BEGIN
  -- Rate-limit (pré-existant)
  PERFORM check_auth_rate_limit(lower(trim(p_identifiant)));

  SELECT * INTO v_admin FROM profils_admins WHERE identifiant = lower(trim(p_identifiant));
  IF NOT FOUND THEN
    INSERT INTO auth_attempts(identifiant, success) VALUES (lower(trim(p_identifiant)), false);
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  IF extensions.crypt(p_password, v_admin.password_hash) <> v_admin.password_hash THEN
    INSERT INTO auth_attempts(identifiant, success) VALUES (lower(trim(p_identifiant)), false);
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  -- Génère un token aléatoire 32 bytes hex (256 bits d'entropie).
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + INTERVAL '7 days';

  INSERT INTO public.admin_sessions (token, admin_id, expires_at)
  VALUES (v_token, v_admin.id, v_expires);

  -- Nettoyage opportuniste : on purge les sessions expirées de cet admin
  -- (pas un cleanup global pour rester rapide).
  DELETE FROM public.admin_sessions
  WHERE admin_id = v_admin.id AND expires_at <= now();

  INSERT INTO auth_attempts(identifiant, success) VALUES (lower(trim(p_identifiant)), true);

  RETURN json_build_object(
    'id',           v_admin.id,
    'identifiant',  v_admin.identifiant,
    'display_name', v_admin.display_name,
    'token',        v_token,
    'expires_at',   v_expires
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_admin_custom(TEXT, TEXT) TO anon, authenticated;

-- ─── 5. logout_admin ────────────────────────────────────────────────────────
-- Invalide une session admin (DELETE de la ligne).
CREATE OR REPLACE FUNCTION public.logout_admin(p_admin_token TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_admin_token IS NULL OR length(p_admin_token) = 0 THEN RETURN; END IF;
  DELETE FROM public.admin_sessions WHERE token = p_admin_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.logout_admin(TEXT) TO anon, authenticated;

-- ─── 6. verify_admin_session_token ──────────────────────────────────────────
-- Nouvelle RPC pour le vérif au mount de AdminApp. Retourne l'admin info si
-- token valide, NULL sinon. Le frontend l'appelle pour reconstituer l'état
-- au refresh sans avoir à se reloguer.
CREATE OR REPLACE FUNCTION public.verify_admin_session_token(p_admin_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_admin    profils_admins;
BEGIN
  v_admin_id := public._resolve_admin_session(p_admin_token);
  IF v_admin_id IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO v_admin FROM public.profils_admins WHERE id = v_admin_id;
  RETURN json_build_object(
    'id',           v_admin.id,
    'identifiant',  v_admin.identifiant,
    'display_name', v_admin.display_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_admin_session_token(TEXT) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- Note : la migration des 59 RPCs admin_* vers `p_admin_token` est dans la
-- partie 3.B (`admin_sessions_phase3b.sql`). Tant qu'elle n'est pas appliquée,
-- les RPCs existantes continuent d'accepter `p_admin_id UUID` — la faille
-- "vol d'UUID admin" reste partiellement ouverte. Côté JS, le token est déjà
-- stocké et envoyé, donc dès que la 3.B est déployée, le verrou complet est
-- en place sans nouveau changement frontend.
-- ══════════════════════════════════════════════════════════════════════════════
