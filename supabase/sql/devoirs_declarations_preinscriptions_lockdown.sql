-- ══════════════════════════════════════════════════════════════════════════════
-- Correctifs audit 2026-07-03 — S0 / S1 / D1
--
-- S0 — La table `devoirs` était restée totalement ouverte à anon
--      (policy `devoirs_anon_all` USING(true) WITH CHECK(true)) : n'importe qui
--      avec la clé anon pouvait lire/créer/modifier/supprimer tous les devoirs.
--      Plus AUCUN code front n'accède à cette table en REST direct (tous les
--      portails passent par des RPCs SECURITY DEFINER : fetch_devoirs_for_eleve,
--      fetch_devoirs_for_parent, *_devoir_secure) → lockdown sans régression.
--
-- S1 — 3 RPCs enseignant prenaient un `p_enseignant_id` brut sans vérifier de
--      session : avec un UUID d'enseignant (non secret), on pouvait lire les
--      déclarations d'absence des élèves (noms + motifs) et les marquer vues.
--      → recréées avec `p_token` résolu par _resolve_enseignant_session, comme
--      toutes les autres RPCs enseignant.
--
-- D1 — `preinscriptions.eleve_id` n'avait aucune FK : la suppression d'un élève
--      laissait des références fantômes (4 constatées en prod), bloquant la
--      fiche (bouton « Activer » → compte introuvable, reconversion impossible).
--      → nettoyage des liens morts + FK ON DELETE SET NULL. Avec eleve_id NULL,
--      la fiche repropose la conversion (comportement UI existant).
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── S0 : verrouillage de `devoirs` ─────────────────────────────────────────
ALTER TABLE public.devoirs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS devoirs_anon_all  ON public.devoirs;
DROP POLICY IF EXISTS devoirs_no_direct ON public.devoirs;
CREATE POLICY devoirs_no_direct ON public.devoirs
  FOR ALL USING (false) WITH CHECK (false);

-- ─── S1 : RPCs déclarations enseignant → auth par token de session ──────────
DROP FUNCTION IF EXISTS public.fetch_declarations_classe(uuid, uuid);
DROP FUNCTION IF EXISTS public.mark_declaration_vue_enseignant(uuid, uuid);
DROP FUNCTION IF EXISTS public.count_declarations_enseignant(uuid);

CREATE FUNCTION public.fetch_declarations_classe(p_token text, p_classe_id uuid)
RETURNS TABLE(
  id uuid, eleve_id uuid, eleve_prenom text, eleve_nom text, type text,
  date date, heure_prevue text, motif text, vue_enseignant boolean,
  created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ens UUID;
BEGIN
  v_ens := public._resolve_enseignant_session(p_token);
  IF v_ens IS NULL THEN RAISE EXCEPTION 'Session invalide'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.enseignant_classes
    WHERE enseignant_id = v_ens AND classe_id = p_classe_id
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.eleve_id,
    e.prenom::TEXT,
    e.nom::TEXT,
    d.type::TEXT,
    d.date,
    CASE WHEN d.heure_prevue IS NOT NULL
         THEN to_char(d.heure_prevue, 'HH24:MI')
         ELSE NULL
    END,
    d.motif,
    d.vue_enseignant,
    d.created_at
  FROM public.declarations_parents d
  JOIN public.profils_eleves e ON e.id = d.eleve_id
  WHERE e.classe_id = p_classe_id
    AND d.date >= CURRENT_DATE - INTERVAL '1 day'
  ORDER BY d.vue_enseignant ASC, d.date ASC, d.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.fetch_declarations_classe(text, uuid) TO anon, authenticated;

CREATE FUNCTION public.mark_declaration_vue_enseignant(p_token text, p_declaration_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ens UUID;
BEGIN
  v_ens := public._resolve_enseignant_session(p_token);
  IF v_ens IS NULL THEN RAISE EXCEPTION 'Session invalide'; END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.declarations_parents d
    JOIN public.profils_eleves e     ON e.id = d.eleve_id
    JOIN public.enseignant_classes ec ON ec.classe_id = e.classe_id
    WHERE d.id = p_declaration_id
      AND ec.enseignant_id = v_ens
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  UPDATE public.declarations_parents
  SET vue_enseignant = true
  WHERE id = p_declaration_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_declaration_vue_enseignant(text, uuid) TO anon, authenticated;

CREATE FUNCTION public.count_declarations_enseignant(p_token text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_ens UUID; v_count INTEGER;
BEGIN
  v_ens := public._resolve_enseignant_session(p_token);
  IF v_ens IS NULL THEN RAISE EXCEPTION 'Session invalide'; END IF;

  SELECT COUNT(DISTINCT d.id) INTO v_count
  FROM public.declarations_parents d
  JOIN public.profils_eleves e     ON e.id = d.eleve_id
  JOIN public.enseignant_classes ec ON ec.classe_id = e.classe_id
  WHERE ec.enseignant_id = v_ens
    AND d.date >= CURRENT_DATE
    AND d.vue_enseignant = false;

  RETURN COALESCE(v_count, 0);
END;
$$;
GRANT EXECUTE ON FUNCTION public.count_declarations_enseignant(text) TO anon, authenticated;

-- ─── D1 : intégrité preinscriptions.eleve_id ────────────────────────────────
-- Nettoyage des références fantômes existantes (élèves supprimés).
UPDATE public.preinscriptions p
SET eleve_id = NULL
WHERE p.eleve_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profils_eleves e WHERE e.id = p.eleve_id);

-- FK : la suppression d'un élève délie proprement la préinscription.
ALTER TABLE public.preinscriptions
  DROP CONSTRAINT IF EXISTS preinscriptions_eleve_id_fkey;
ALTER TABLE public.preinscriptions
  ADD CONSTRAINT preinscriptions_eleve_id_fkey
  FOREIGN KEY (eleve_id) REFERENCES public.profils_eleves(id) ON DELETE SET NULL;
