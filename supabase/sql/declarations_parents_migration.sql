-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Déclarations parent (retard/absence préventif)
-- Ajoute :
--   • table `declarations_parents` (préavis retard/absence soumis par le parent)
--   • fonctions SECURITY DEFINER pour parent, enseignant et admin
--
-- À exécuter dans Supabase Dashboard → SQL Editor.
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
        'create_declaration_parent',
        'fetch_declarations_parent',
        'fetch_declarations_classe',
        'count_declarations_enseignant',
        'admin_fetch_declarations',
        'admin_count_nouvelles_declarations',
        'admin_mark_declarations_vues'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. Table declarations_parents ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.declarations_parents (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  eleve_id     UUID        NOT NULL REFERENCES public.profils_eleves(id) ON DELETE CASCADE,
  parent_id    UUID        NOT NULL REFERENCES public.parents(id)        ON DELETE CASCADE,
  type         VARCHAR(10) NOT NULL CHECK (type IN ('retard', 'absence')),
  date         DATE        NOT NULL,
  heure_prevue TIME,
  motif        TEXT CHECK (char_length(motif) <= 500),
  vue_admin    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decl_eleve    ON public.declarations_parents (eleve_id);
CREATE INDEX IF NOT EXISTS idx_decl_date     ON public.declarations_parents (date DESC);
CREATE INDEX IF NOT EXISTS idx_decl_vu_admin ON public.declarations_parents (vue_admin) WHERE vue_admin = false;

ALTER TABLE public.declarations_parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "declarations_parents_no_anon" ON public.declarations_parents;

-- Tout accès direct bloqué — uniquement via les fonctions SECURITY DEFINER.
CREATE POLICY "declarations_parents_no_anon"
  ON public.declarations_parents FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 2. _parent_owns_eleve ───────────────────────────────────────────────────
-- Helper déjà existant dans parents_migration.sql, inclus ici pour s'assurer
-- qu'il est disponible même si la migration est exécutée seule.
CREATE OR REPLACE FUNCTION public._parent_owns_eleve(p_token TEXT, p_eleve_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  v_parent_id := public._resolve_parent_session(p_token);
  IF v_parent_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.parent_eleves
    WHERE parent_id = v_parent_id AND eleve_id = p_eleve_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public._parent_owns_eleve(TEXT, UUID) TO anon, authenticated;

-- ─── 3. create_declaration_parent ────────────────────────────────────────────
-- Crée un préavis retard/absence depuis le portail parent.
-- Sécurités :
--   • token vérifié via _resolve_parent_session
--   • ownership élève vérifié via _parent_owns_eleve
--   • date ne peut pas être dans le passé (>= CURRENT_DATE)
--   • motif max 500 chars
--   • rate limit : max 3 par enfant/date, max 10 par parent/24h
CREATE OR REPLACE FUNCTION public.create_declaration_parent(
  p_token        TEXT,
  p_eleve_id     UUID,
  p_type         TEXT,
  p_date         DATE,
  p_heure_prevue TIME DEFAULT NULL,
  p_motif        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID;
  v_decl_id   UUID;
  v_count_day INTEGER;
  v_count_24h INTEGER;
BEGIN
  v_parent_id := public._resolve_parent_session(p_token);
  IF v_parent_id IS NULL THEN
    RAISE EXCEPTION 'Session parent invalide ou expirée';
  END IF;

  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé : cet élève n''est pas rattaché à votre compte';
  END IF;

  IF p_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date ne peut pas être dans le passé';
  END IF;

  IF p_type NOT IN ('retard', 'absence') THEN
    RAISE EXCEPTION 'Type invalide : utilisez retard ou absence';
  END IF;

  IF char_length(p_motif) > 500 THEN
    RAISE EXCEPTION 'Le motif ne peut pas dépasser 500 caractères';
  END IF;

  -- Max 3 déclarations par enfant et par date
  SELECT COUNT(*) INTO v_count_day
  FROM public.declarations_parents
  WHERE eleve_id = p_eleve_id AND date = p_date AND parent_id = v_parent_id;

  IF v_count_day >= 3 THEN
    RAISE EXCEPTION 'Limite atteinte : maximum 3 déclarations par enfant et par date';
  END IF;

  -- Max 10 déclarations par parent dans les 24 dernières heures
  SELECT COUNT(*) INTO v_count_24h
  FROM public.declarations_parents
  WHERE parent_id = v_parent_id AND created_at >= now() - INTERVAL '24 hours';

  IF v_count_24h >= 10 THEN
    RAISE EXCEPTION 'Trop de déclarations soumises. Réessayez dans 24h.';
  END IF;

  INSERT INTO public.declarations_parents (
    eleve_id, parent_id, type, date, heure_prevue, motif, vue_admin
  ) VALUES (
    p_eleve_id, v_parent_id, p_type, p_date,
    CASE WHEN p_type = 'retard' THEN p_heure_prevue ELSE NULL END,
    NULLIF(TRIM(p_motif), ''),
    false
  )
  RETURNING id INTO v_decl_id;

  RETURN json_build_object('success', true, 'id', v_decl_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_declaration_parent(TEXT, UUID, TEXT, DATE, TIME, TEXT) TO anon, authenticated;

-- ─── 4. fetch_declarations_parent ────────────────────────────────────────────
-- Retourne les déclarations soumises par CE parent pour un élève donné.
-- Filtre par parent_id pour protéger la confidentialité entre co-parents.
-- Fenêtre : 90 derniers jours → futur.
CREATE OR REPLACE FUNCTION public.fetch_declarations_parent(
  p_token    TEXT,
  p_eleve_id UUID
)
RETURNS TABLE (
  id           UUID,
  type         TEXT,
  date         DATE,
  heure_prevue TEXT,
  motif        TEXT,
  created_at   TIMESTAMPTZ
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
  SELECT
    d.id,
    d.type::TEXT,
    d.date,
    CASE WHEN d.heure_prevue IS NOT NULL
         THEN to_char(d.heure_prevue, 'HH24:MI')
         ELSE NULL
    END,
    d.motif,
    d.created_at
  FROM public.declarations_parents d
  WHERE d.eleve_id  = p_eleve_id
    AND d.parent_id = v_parent_id
    AND d.date >= CURRENT_DATE - INTERVAL '90 days'
  ORDER BY d.date DESC, d.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_declarations_parent(TEXT, UUID) TO anon, authenticated;

-- ─── 5. fetch_declarations_classe ────────────────────────────────────────────
-- Retourne les déclarations pour les élèves d'une classe (usage enseignant).
-- Vérifie que l'enseignant appartient à la classe.
-- Fenêtre : hier → futur (pour que l'enseignant voie celles du jour même).
CREATE OR REPLACE FUNCTION public.fetch_declarations_classe(
  p_enseignant_id UUID,
  p_classe_id     UUID
)
RETURNS TABLE (
  id           UUID,
  eleve_id     UUID,
  eleve_prenom TEXT,
  eleve_nom    TEXT,
  type         TEXT,
  date         DATE,
  heure_prevue TEXT,
  motif        TEXT,
  created_at   TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.enseignant_classes
    WHERE enseignant_id = p_enseignant_id AND classe_id = p_classe_id
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
    d.created_at
  FROM public.declarations_parents d
  JOIN public.profils_eleves e ON e.id = d.eleve_id
  WHERE e.classe_id = p_classe_id
    AND d.date >= CURRENT_DATE - INTERVAL '1 day'
  ORDER BY d.date ASC, d.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_declarations_classe(UUID, UUID) TO anon, authenticated;

-- ─── 6. count_declarations_enseignant ────────────────────────────────────────
-- Compte les déclarations à venir (aujourd'hui + futur) pour toutes les classes
-- de l'enseignant. Utilisé pour le badge sidebar.
CREATE OR REPLACE FUNCTION public.count_declarations_enseignant(
  p_enseignant_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT d.id) INTO v_count
  FROM public.declarations_parents d
  JOIN public.profils_eleves e ON e.id = d.eleve_id
  JOIN public.enseignant_classes ec ON ec.classe_id = e.classe_id
  WHERE ec.enseignant_id = p_enseignant_id
    AND d.date >= CURRENT_DATE;

  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.count_declarations_enseignant(UUID) TO anon, authenticated;

-- ─── 7. admin_fetch_declarations ─────────────────────────────────────────────
-- Liste paginée de toutes les déclarations, avec jointures élève + classe + parent.
-- Note : parent_id UUID retiré de la réponse (sur-exposition de données).
DROP FUNCTION IF EXISTS public.admin_fetch_declarations(UUID, INTEGER, INTEGER) CASCADE;
CREATE FUNCTION public.admin_fetch_declarations(
  p_admin_id UUID,
  p_limit    INTEGER DEFAULT 25,
  p_offset   INTEGER DEFAULT 0
)
RETURNS TABLE (
  id           UUID,
  eleve_id     UUID,
  eleve_prenom TEXT,
  eleve_nom    TEXT,
  classe_nom   TEXT,
  type         TEXT,
  date         DATE,
  heure_prevue TEXT,
  motif        TEXT,
  vue_admin    BOOLEAN,
  parent_label TEXT,
  created_at   TIMESTAMPTZ,
  total_count  BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.eleve_id,
    e.prenom::TEXT,
    e.nom::TEXT,
    COALESCE(cl.nom, '—')::TEXT,
    d.type::TEXT,
    d.date,
    CASE WHEN d.heure_prevue IS NOT NULL
         THEN to_char(d.heure_prevue, 'HH24:MI')
         ELSE NULL
    END,
    d.motif,
    d.vue_admin,
    TRIM(
      COALESCE(p.pere_prenom || ' ' || p.pere_nom, '') ||
      CASE WHEN p.pere_nom IS NOT NULL AND p.mere_nom IS NOT NULL THEN ' / ' ELSE '' END ||
      COALESCE(p.mere_prenom || ' ' || p.mere_nom, '')
    )::TEXT,
    d.created_at,
    COUNT(*) OVER ()
  FROM public.declarations_parents d
  JOIN public.profils_eleves e  ON e.id  = d.eleve_id
  LEFT JOIN public.classes cl   ON cl.id = e.classe_id
  JOIN public.parents p         ON p.id  = d.parent_id
  ORDER BY d.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_declarations(UUID, INTEGER, INTEGER) TO anon, authenticated;

-- ─── 8. admin_count_nouvelles_declarations ────────────────────────────────────
-- Retourne le nombre de déclarations non vues par l'admin (badge sidebar).
CREATE OR REPLACE FUNCTION public.admin_count_nouvelles_declarations(
  p_admin_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN RETURN 0; END IF;
  SELECT COUNT(*) INTO v_count
  FROM public.declarations_parents
  WHERE vue_admin = false;
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_count_nouvelles_declarations(UUID) TO anon, authenticated;

-- ─── 9. admin_mark_declarations_vues ─────────────────────────────────────────
-- Marque toutes les déclarations comme vues par l'admin (appelé à l'ouverture de la page).
CREATE OR REPLACE FUNCTION public.admin_mark_declarations_vues(
  p_admin_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.declarations_parents
  SET vue_admin = true
  WHERE vue_admin = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_mark_declarations_vues(UUID) TO anon, authenticated;
