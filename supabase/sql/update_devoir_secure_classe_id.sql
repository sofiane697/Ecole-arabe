-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Fix Bug B2 (audit 2026-05-27)
--
-- Symptôme : un enseignant qui modifie le `classe_id` d'un devoir voit son
-- changement ignoré silencieusement. Les élèves de l'ancienne classe continuent
-- à voir le devoir, les élèves de la nouvelle classe ne le voient pas.
--
-- Cause : la RPC `update_devoir_secure` n'accepte pas le paramètre `p_classe_id`
-- (signature historique à 5 paramètres). Le frontend ne l'envoyait pas non plus
-- (cf. src/enseignant/supabaseEnseignant.js:243-253 avant cette migration).
--
-- Fix : DROP + CREATE de la fonction avec un 6ᵉ paramètre `p_classe_id UUID`
-- et vérification d'ownership de la nouvelle classe via `_enseignant_owns_classe`.
--
-- ATTENTION ordre de déploiement :
--   1. Appliquer cette migration sur Supabase (la fonction à 5 params disparaît).
--   2. Déployer le frontend qui envoie maintenant les 6 params.
--   Fenêtre critique : ~quelques secondes pendant lesquelles un enseignant qui
--   sauvegarde un devoir verra une erreur RPC. Acceptable vu le faible trafic.
--
-- Idempotente. À appliquer sur la base `nsdnzqdbpdncrksgxtar`.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Drop ancienne signature (5 paramètres, sans classe_id) ──────────────
DROP FUNCTION IF EXISTS public.update_devoir_secure(text, bigint, text, text, date);

-- ─── 2. Nouvelle signature (6 paramètres, avec classe_id) ───────────────────
CREATE OR REPLACE FUNCTION public.update_devoir_secure(
  p_token       TEXT,
  p_id          BIGINT,
  p_titre       TEXT,
  p_description TEXT,
  p_date_limite DATE,
  p_classe_id   UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ens   UUID;
  v_owner UUID;
BEGIN
  v_ens := public._resolve_enseignant_session(p_token);
  IF v_ens IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;

  SELECT enseignant_id INTO v_owner
    FROM public.devoirs
   WHERE id = p_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Devoir introuvable';
  END IF;
  IF v_owner <> v_ens THEN
    RAISE EXCEPTION 'Modification interdite';
  END IF;

  -- L'enseignant doit aussi être propriétaire de la (nouvelle) classe cible.
  -- _enseignant_owns_classe raise une exception si non-owner.
  PERFORM public._enseignant_owns_classe(p_token, p_classe_id);

  UPDATE public.devoirs
     SET titre       = p_titre,
         description = p_description,
         date_limite = p_date_limite,
         classe_id   = p_classe_id
   WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_devoir_secure(TEXT, BIGINT, TEXT, TEXT, DATE, UUID)
  TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. SELECT proname, pg_get_function_arguments(oid)
--        FROM pg_proc WHERE proname='update_devoir_secure';
--      -- doit retourner 1 ligne avec 6 arguments dont p_classe_id uuid
--   2. Test fonctionnel : modifier un devoir et changer la classe → vérifier
--      que les élèves de la nouvelle classe le voient et les anciens ne le
--      voient plus.
-- ══════════════════════════════════════════════════════════════════════════════
