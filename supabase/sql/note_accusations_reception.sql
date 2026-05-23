-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Accusés de réception des notes (signature parent)
--
-- Fonctionnalité :
--   Un parent clique "J'ai pris connaissance" sur une note → enregistrement
--   horodaté visible par l'enseignant et l'administration.
--
-- Ajoute :
--   • table `note_accusations_reception` (un ACK par note par parent)
--   • RPC parent_acknowledge_note       (écriture parent)
--   • RPC fetch_note_acks_for_parent    (lecture parent — propres ACKs)
--   • RPC fetch_note_acks_for_enseignant (lecture enseignant — ACKs de son éval)
--   • RPC admin_fetch_note_acks         (lecture admin — ACKs d'un élève)
--
-- Pattern :
--   • Table RLS USING(false) — accès uniquement via RPCs SECURITY DEFINER.
--   • Parent : token opaque → _resolve_parent_session (jamais parent_id client)
--   • Enseignant : token opaque → _resolve_enseignant_session
--   • Admin : p_admin_token TEXT → _is_admin(TEXT) (Phase 3)
--
-- Idempotent : peut être ré-exécuté sans casser l'existant.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des signatures existantes ──────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'parent_acknowledge_note',
        'fetch_note_acks_for_parent',
        'fetch_note_acks_for_enseignant',
        'admin_fetch_note_acks'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. Table note_accusations_reception ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.note_accusations_reception (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id     UUID        NOT NULL REFERENCES public.notes(id)           ON DELETE CASCADE,
  eleve_id    UUID        NOT NULL REFERENCES public.profils_eleves(id)  ON DELETE CASCADE,
  parent_id   UUID        NOT NULL REFERENCES public.parents(id)         ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (note_id, parent_id)  -- père et mère peuvent signer indépendamment
);

CREATE INDEX IF NOT EXISTS idx_nar_note_id   ON public.note_accusations_reception (note_id);
CREATE INDEX IF NOT EXISTS idx_nar_eleve_id  ON public.note_accusations_reception (eleve_id);
CREATE INDEX IF NOT EXISTS idx_nar_parent_id ON public.note_accusations_reception (parent_id);

ALTER TABLE public.note_accusations_reception ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nar_no_direct_access" ON public.note_accusations_reception;

CREATE POLICY "nar_no_direct_access"
  ON public.note_accusations_reception FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 2. parent_acknowledge_note ──────────────────────────────────────────────
-- Enregistre la signature d'un parent pour une note donnée.
-- Sécurités :
--   • token vérifié via _resolve_parent_session
--   • ownership vérifié : la note doit appartenir à un élève du parent
--   • doublon ignoré (ON CONFLICT DO NOTHING) — idempotent
CREATE OR REPLACE FUNCTION public.parent_acknowledge_note(
  p_token   TEXT,
  p_note_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_eleve_id  UUID;
BEGIN
  v_parent_id := public._resolve_parent_session(p_token);
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Session parent invalide ou expirée';
  END IF;

  -- Récupérer l'élève de la note et vérifier le lien parent_eleves
  SELECT n.eleve_id INTO v_eleve_id
  FROM public.notes n
  JOIN public.parent_eleves pe ON pe.eleve_id = n.eleve_id
  WHERE n.id = p_note_id
    AND pe.parent_id = v_parent_id;

  IF v_eleve_id IS NULL THEN
    RAISE EXCEPTION 'Accès refusé : cette note ne correspond pas à un de vos enfants';
  END IF;

  INSERT INTO public.note_accusations_reception (note_id, eleve_id, parent_id)
  VALUES (p_note_id, v_eleve_id, v_parent_id)
  ON CONFLICT (note_id, parent_id) DO NOTHING;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.parent_acknowledge_note(TEXT, UUID) TO anon, authenticated;

-- ─── 3. fetch_note_acks_for_parent ───────────────────────────────────────────
-- Retourne les note_id déjà signés par CE parent pour un élève donné.
-- Filtre par parent_id → père et mère voient uniquement leurs propres signatures.
CREATE OR REPLACE FUNCTION public.fetch_note_acks_for_parent(
  p_token    TEXT,
  p_eleve_id UUID
)
RETURNS TABLE (
  note_id    UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  v_parent_id := public._resolve_parent_session(p_token);
  IF v_parent_id IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.parent_eleves
    WHERE parent_id = v_parent_id AND eleve_id = p_eleve_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT nar.note_id, nar.created_at
  FROM public.note_accusations_reception nar
  WHERE nar.eleve_id  = p_eleve_id
    AND nar.parent_id = v_parent_id
  ORDER BY nar.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_note_acks_for_parent(TEXT, UUID) TO anon, authenticated;

-- ─── 4. fetch_note_acks_for_enseignant ───────────────────────────────────────
-- Retourne tous les ACKs des notes d'une évaluation donnée.
-- Restreint à l'enseignant propriétaire de l'évaluation.
CREATE OR REPLACE FUNCTION public.fetch_note_acks_for_enseignant(
  p_token         TEXT,
  p_evaluation_id UUID
)
RETURNS TABLE (
  note_id      UUID,
  eleve_id     UUID,
  parent_label TEXT,
  created_at   TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ens_id    UUID;
  v_eval_owner UUID;
BEGIN
  v_ens_id := public._resolve_enseignant_session(p_token);
  IF v_ens_id IS NULL THEN RETURN; END IF;

  SELECT ev.enseignant_id INTO v_eval_owner
  FROM public.evaluations ev
  WHERE ev.id = p_evaluation_id;

  IF v_eval_owner IS NULL OR v_eval_owner != v_ens_id THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    nar.note_id,
    nar.eleve_id,
    TRIM(
      COALESCE(p.pere_prenom || ' ' || p.pere_nom, '') ||
      CASE WHEN p.pere_nom IS NOT NULL AND p.mere_nom IS NOT NULL THEN ' / ' ELSE '' END ||
      COALESCE(p.mere_prenom || ' ' || p.mere_nom, '')
    )::TEXT,
    nar.created_at
  FROM public.note_accusations_reception nar
  JOIN public.notes n    ON n.id  = nar.note_id
  JOIN public.parents p  ON p.id  = nar.parent_id
  WHERE n.evaluation_id = p_evaluation_id
  ORDER BY nar.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_note_acks_for_enseignant(TEXT, UUID) TO anon, authenticated;

-- ─── 5. admin_fetch_note_acks ─────────────────────────────────────────────────
-- Retourne tous les ACKs d'un élève avec le titre et la date de l'évaluation.
-- Usage : fiche élève dans le portail admin.
-- Authentification Phase 3 : p_admin_token TEXT → _is_admin(TEXT)
CREATE OR REPLACE FUNCTION public.admin_fetch_note_acks(
  p_admin_token TEXT,
  p_eleve_id    UUID
)
RETURNS TABLE (
  note_id       UUID,
  evaluation_id UUID,
  eval_titre    TEXT,
  eval_date     DATE,
  parent_label  TEXT,
  created_at    TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  RETURN QUERY
  SELECT
    nar.note_id,
    ev.id,
    ev.titre::TEXT,
    ev.date_evaluation,
    TRIM(
      COALESCE(p.pere_prenom || ' ' || p.pere_nom, '') ||
      CASE WHEN p.pere_nom IS NOT NULL AND p.mere_nom IS NOT NULL THEN ' / ' ELSE '' END ||
      COALESCE(p.mere_prenom || ' ' || p.mere_nom, '')
    )::TEXT,
    nar.created_at
  FROM public.note_accusations_reception nar
  JOIN public.notes n        ON n.id  = nar.note_id
  JOIN public.evaluations ev ON ev.id = n.evaluation_id
  JOIN public.parents p      ON p.id  = nar.parent_id
  WHERE nar.eleve_id = p_eleve_id
  ORDER BY ev.date_evaluation DESC, nar.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_note_acks(TEXT, UUID) TO anon, authenticated;
