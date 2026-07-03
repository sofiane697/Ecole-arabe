-- ══════════════════════════════════════════════════════════════════════════════
-- Correctifs audit 2026-07-03 — S2 / S3
--
-- S3 — Contenus de cours privés :
--   • La table `contenus` (vidéos, PDF, textes des cours) était SELECT-ouverte
--     à anon : tout le contenu pédagogique était lisible sans compte.
--     → policy SELECT supprimée ; lecture via 2 RPCs token-gated (élève, admin).
--   • Le bucket storage `cours` avait 3 policies PUBLIQUES : lecture (listing
--     de tous les fichiers), upload et delete ouverts à anon — n'importe qui
--     pouvait déposer des fichiers arbitraires ou tout supprimer.
--     → les 3 policies sont supprimées. Les écritures passent par l'Edge
--     Function `cours-file` (token admin + service_role). La lecture des
--     fichiers existants reste par URL publique exacte (bucket public non
--     listable — les URLs ne s'obtiennent que via les RPCs contenus).
--
-- S2 — Auth admin des Edge Functions par TOKEN de session :
--   `send-welcome-email` et `eleve-photo` vérifiaient un simple UUID admin
--   (non secret, non révocable). Elles sont redéployées avec x-admin-token +
--   _is_admin(p_admin_token). Les anciennes vérifs par UUID sont supprimées.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── S3.a : table contenus fermée à anon ────────────────────────────────────
DROP POLICY IF EXISTS contenus_select_anon ON public.contenus;

-- Lecture élève : session résolue côté serveur.
CREATE OR REPLACE FUNCTION public.fetch_contenus_for_eleve_secure(p_token text, p_niveau_id uuid)
RETURNS SETOF public.contenus
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_eleve UUID;
BEGIN
  v_eleve := public._resolve_eleve_session(p_token);
  IF v_eleve IS NULL THEN RAISE EXCEPTION 'Session invalide'; END IF;
  RETURN QUERY
  SELECT * FROM public.contenus WHERE niveau_id = p_niveau_id ORDER BY ordre;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fetch_contenus_for_eleve_secure(text, uuid) TO anon, authenticated;

-- Lecture admin (page Cours).
CREATE OR REPLACE FUNCTION public.admin_fetch_contenus(p_admin_token text, p_niveau_id uuid)
RETURNS SETOF public.contenus
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT * FROM public.contenus WHERE niveau_id = p_niveau_id ORDER BY ordre;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_fetch_contenus(text, uuid) TO anon, authenticated;

-- ─── S3.b : bucket cours — fermeture des policies publiques ─────────────────
DROP POLICY IF EXISTS "Public read cours"  ON storage.objects;
DROP POLICY IF EXISTS "Auth upload cours"  ON storage.objects;
DROP POLICY IF EXISTS "Auth delete cours"  ON storage.objects;

-- ─── S2 : suppression des vérifs admin par UUID (legacy) ────────────────────
-- Plus aucun appelant : les 2 Edge Functions sont redéployées sur le token.
DROP FUNCTION IF EXISTS public._is_admin(uuid);
DROP FUNCTION IF EXISTS public.verify_admin_session(uuid);
