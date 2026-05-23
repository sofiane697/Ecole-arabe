-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Persistance de l'état "Série validée" sur les évaluations
--
-- Avant cette migration, le bouton "Valider la série" côté enseignant n'agissait
-- que sur un state React local : à chaque refresh / changement d'onglet, l'état
-- était perdu et le bouton redevenait actif.
--
-- Cette migration :
--   1. Ajoute la colonne `valide_le TIMESTAMPTZ` sur `evaluations`
--      (NULL = en cours, sinon = date/heure de validation).
--   2. Recrée `fetch_evaluations_classe_secure` pour exposer ce champ.
--      (DROP + CREATE car la signature RETURNS TABLE change.)
--   3. Crée la RPC `valider_evaluation_secure(token, eval_id, valider)` qui
--      set/clear `valide_le` après vérification d'ownership.
--
-- Idempotente. À exécuter sur la base `nsdnzqdbpdncrksgxtar`.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Colonne valide_le ───────────────────────────────────────────────────
ALTER TABLE public.evaluations
  ADD COLUMN IF NOT EXISTS valide_le TIMESTAMPTZ;

-- ─── 2. fetch_evaluations_classe_secure (étendue avec valide_le) ────────────
-- DROP requis car la signature de retour change (ajout d'une colonne TABLE).
DROP FUNCTION IF EXISTS public.fetch_evaluations_classe_secure(text, uuid);

CREATE FUNCTION public.fetch_evaluations_classe_secure(
  p_token TEXT,
  p_classe_id UUID
)
RETURNS TABLE (
  id                 UUID,
  classe_id          UUID,
  enseignant_id      UUID,
  titre              TEXT,
  date_evaluation    DATE,
  score_max          NUMERIC,
  created_at         TIMESTAMPTZ,
  valide_le          TIMESTAMPTZ,
  enseignant_nom     TEXT,
  enseignant_prenom  TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public._enseignant_owns_classe(p_token, p_classe_id);
  RETURN QUERY
  SELECT v.id, v.classe_id, v.enseignant_id,
         v.titre::TEXT, v.date_evaluation, v.score_max, v.created_at, v.valide_le,
         e.nom::TEXT, e.prenom::TEXT
  FROM public.evaluations v
  LEFT JOIN public.enseignants e ON e.id = v.enseignant_id
  WHERE v.classe_id = p_classe_id
  ORDER BY v.date_evaluation ASC NULLS LAST, v.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_evaluations_classe_secure(TEXT, UUID)
  TO anon, authenticated;

-- ─── 3. valider_evaluation_secure ───────────────────────────────────────────
-- Vérifie que l'enseignant identifié par le token est le propriétaire de
-- l'évaluation, puis set/clear `valide_le`. Retourne la nouvelle valeur pour
-- éviter un round-trip de relecture côté client.
DROP FUNCTION IF EXISTS public.valider_evaluation_secure(text, uuid, boolean);

CREATE FUNCTION public.valider_evaluation_secure(
  p_token         TEXT,
  p_evaluation_id UUID,
  p_valider       BOOLEAN
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ens   UUID;
  v_owner UUID;
  v_new   TIMESTAMPTZ;
BEGIN
  v_ens := public._resolve_enseignant_session(p_token);
  IF v_ens IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;

  SELECT enseignant_id INTO v_owner
    FROM public.evaluations
   WHERE id = p_evaluation_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Évaluation introuvable';
  END IF;
  IF v_owner <> v_ens THEN
    RAISE EXCEPTION 'Modification interdite';
  END IF;

  v_new := CASE WHEN p_valider THEN NOW() ELSE NULL END;

  UPDATE public.evaluations
     SET valide_le = v_new
   WHERE id = p_evaluation_id;

  RETURN v_new;
END;
$$;

GRANT EXECUTE ON FUNCTION public.valider_evaluation_secure(TEXT, UUID, BOOLEAN)
  TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. SELECT column_name FROM information_schema.columns
--        WHERE table_name='evaluations' AND column_name='valide_le';  -- 1 row
--   2. SELECT proname FROM pg_proc WHERE proname='valider_evaluation_secure'; -- 1 row
--   3. Test côté front : valider une série → refresh → état persisté.
-- ══════════════════════════════════════════════════════════════════════════════
