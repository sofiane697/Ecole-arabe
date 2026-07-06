-- ══════════════════════════════════════════════════════════════════════════════
-- Cohérence UI admin (2026-07-06) — le nom de classe est toujours précédé de son
-- niveau scolaire ("Niveau — Classe") partout où il est affiché côté admin.
-- Les composants front qui reçoivent classe_id + la liste des classes/niveaux
-- préfixent déjà côté client (helper src/shared/classeLabel.js). Les 2 RPCs
-- ci-dessous renvoient un `classe_nom` déjà assemblé côté serveur (jointure
-- directe sans exposer classe_id/niveau_id) : on les aligne sur le même format.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── admin_fetch_eleves_of_parent — fiche parent, "Enfants rattachés" ───────
CREATE OR REPLACE FUNCTION public.admin_fetch_eleves_of_parent(p_admin_token text, p_parent_id uuid)
 RETURNS TABLE(eleve_id uuid, nom text, prenom text, classe_id uuid, classe_nom text, lien text, date_naissance date, actif boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Acces refuse : session admin requise';
  END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT,
         e.classe_id,
         CASE WHEN c.id IS NOT NULL THEN (COALESCE(ns.nom || ' — ', '') || c.nom)::TEXT ELSE NULL END,
         pe.lien::TEXT,
         e.date_naissance, e.actif
  FROM public.parent_eleves pe
  JOIN public.profils_eleves e ON e.id = pe.eleve_id
  LEFT JOIN public.classes c ON c.id = e.classe_id
  LEFT JOIN public.niveaux_scolaires ns ON ns.id = c.niveau_id
  WHERE pe.parent_id = p_parent_id
  ORDER BY e.nom, e.prenom;
END;
$function$;

-- ─── admin_fetch_declarations — liste des déclarations retard/absence ───────
CREATE OR REPLACE FUNCTION public.admin_fetch_declarations(
  p_admin_token text,
  p_limit       integer DEFAULT 25,
  p_offset      integer DEFAULT 0
)
 RETURNS TABLE(
   id uuid, eleve_id uuid, eleve_prenom text, eleve_nom text, classe_nom text,
   type text, date date, heure_prevue text, motif text, vue_admin boolean,
   parent_label text, created_at timestamptz, total_count bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.eleve_id,
    INITCAP(e.prenom)::TEXT,
    UPPER(e.nom)::TEXT,
    COALESCE(NULLIF(TRIM(COALESCE(nv.nom || ' — ', '') || COALESCE(cl.nom, '')), ''), '—')::TEXT,
    d.type::TEXT,
    d.date,
    CASE WHEN d.heure_prevue IS NOT NULL
         THEN to_char(d.heure_prevue, 'HH24:MI')
         ELSE NULL
    END,
    d.motif,
    d.vue_admin,
    TRIM(
      COALESCE(INITCAP(p.pere_prenom) || ' ' || UPPER(p.pere_nom), '') ||
      CASE WHEN p.pere_nom IS NOT NULL AND p.mere_nom IS NOT NULL THEN ' / ' ELSE '' END ||
      COALESCE(INITCAP(p.mere_prenom) || ' ' || UPPER(p.mere_nom), '')
    )::TEXT,
    d.created_at,
    COUNT(*) OVER ()
  FROM public.declarations_parents d
  JOIN public.profils_eleves e  ON e.id  = d.eleve_id
  LEFT JOIN public.classes cl   ON cl.id = e.classe_id
  LEFT JOIN public.niveaux_scolaires nv ON nv.id = cl.niveau_id
  JOIN public.parents p         ON p.id  = d.parent_id
  ORDER BY d.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$function$;
