-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Portail Parent (Institut As-Safaa)
-- Ajoute :
--   • table `parents`          (comptes parents : foyer ou individu)
--   • table `parent_eleves`    (jointure many-to-many parent ↔ élève)
--   • table `parent_sessions`  (jetons de session opaques, non falsifiables côté client)
--   • fonctions SECURITY DEFINER miroirs du pattern élève/enseignant
--
-- À exécuter dans Supabase Dashboard → SQL Editor.
-- Idempotent : peut être ré-exécuté sans casser l'existant.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des anciennes signatures ──────────────────────────────────
-- CREATE OR REPLACE FUNCTION ne remplace pas une fonction quand la signature
-- change : il crée une surcharge. On drop donc TOUTES les versions existantes
-- de nos fonctions avant de les recréer plus bas. Rend le script pleinement
-- idempotent entre deux itérations de la feature (ex: ajout de `p_admin_id`).
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'login_parent', 'logout_parent', 'change_parent_password',
        'admin_create_parent', 'admin_find_parent_by_contact',
        'admin_link_parent_eleve', 'admin_reset_parent_password',
        'fetch_parent_enfants',
        'fetch_notes_for_parent', 'fetch_observations_for_parent',
        'fetch_devoirs_for_parent', 'fetch_absences_for_parent',
        '_resolve_parent_session', '_is_admin',
        -- _parent_owns_eleve volontairement absent : il est aussi défini dans
        -- declarations_parents_migration.sql, et un DROP CASCADE ici détruirait
        -- les fonctions de déclaration qui en dépendent. CREATE OR REPLACE plus bas
        -- suffit car la signature BOOLEAN est désormais alignée entre les deux fichiers.
        'normalize_phone'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. Tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parents (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  identifiant           VARCHAR(20) UNIQUE NOT NULL,
  password_hash         VARCHAR(255) NOT NULL,
  pere_nom              VARCHAR(100),
  pere_prenom           VARCHAR(100),
  mere_nom              VARCHAR(100),
  mere_prenom           VARCHAR(100),
  email                 VARCHAR(255) NOT NULL,
  telephone             VARCHAR(30)  NOT NULL,
  must_change_password  BOOLEAN      DEFAULT true,
  actif                 BOOLEAN      DEFAULT true,
  created_at            TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parents_email     ON public.parents (lower(email));
CREATE INDEX IF NOT EXISTS idx_parents_telephone ON public.parents (telephone);

CREATE TABLE IF NOT EXISTS public.parent_eleves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NOT NULL REFERENCES public.parents(id)        ON DELETE CASCADE,
  eleve_id   UUID NOT NULL REFERENCES public.profils_eleves(id) ON DELETE CASCADE,
  lien       VARCHAR(20) DEFAULT 'parents',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, eleve_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_eleves_parent ON public.parent_eleves (parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_eleves_eleve  ON public.parent_eleves (eleve_id);

-- Sessions parent — token opaque généré côté serveur. Le client ne stocke jamais
-- `parents.id` sensible : seul ce token (non falsifiable) sert à s'authentifier
-- sur les RPC data. Empêche un parent de bidouiller sessionStorage pour voler
-- l'identité d'un autre (→ vol des données scolaires d'autres enfants).
CREATE TABLE IF NOT EXISTS public.parent_sessions (
  token       TEXT        PRIMARY KEY,
  parent_id   UUID        NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);
CREATE INDEX IF NOT EXISTS idx_parent_sessions_parent ON public.parent_sessions (parent_id);

-- RLS ouvert pour `anon` (cohérent avec le reste du projet).
ALTER TABLE public.parents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_eleves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_sessions  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parents_all_anon"         ON public.parents;
DROP POLICY IF EXISTS "parent_eleves_all_anon"   ON public.parent_eleves;
DROP POLICY IF EXISTS "parent_sessions_no_anon"  ON public.parent_sessions;

CREATE POLICY "parents_all_anon"
  ON public.parents FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "parent_eleves_all_anon"
  ON public.parent_eleves FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);

-- parent_sessions est DÉLIBÉRÉMENT verrouillée : aucun accès direct depuis anon.
-- Toute lecture/écriture passe par les fonctions SECURITY DEFINER ci-dessous.
-- Empêche `GET /rest/v1/parent_sessions` de lister les tokens actifs.
CREATE POLICY "parent_sessions_no_anon"
  ON public.parent_sessions FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 2. Fonction utilitaire : normalisation du téléphone ─────────────────────
-- Retire espaces, tirets, points, parenthèses ; convertit +33X... en 0X...
CREATE OR REPLACE FUNCTION public.normalize_phone(p_tel TEXT)
RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  t TEXT;
BEGIN
  IF p_tel IS NULL THEN RETURN NULL; END IF;
  t := regexp_replace(p_tel, '[\s\.\-\(\)]', '', 'g');
  IF t LIKE '+33%' THEN
    t := '0' || substring(t FROM 4);
  END IF;
  RETURN t;
END;
$$;

-- ─── 3. login_parent ─────────────────────────────────────────────────────────
-- Retourne un jeton de session opaque (32 bytes aléatoires) au lieu de l'id parent.
-- Le client stocke ce jeton et l'utilise pour toutes les RPC suivantes. L'id
-- parent réel ne quitte jamais le serveur → impossible à usurper via DevTools.
-- IMPORTANT : RETURNS TABLE utilise TEXT (et pas VARCHAR) pour éviter
-- l'erreur "structure of query does not match function result type" — PostgreSQL
-- ne cast pas implicitement VARCHAR(n) ↔ TEXT dans le retour d'une fonction.
CREATE OR REPLACE FUNCTION public.login_parent(
  p_identifiant TEXT,
  p_password    TEXT
)
RETURNS TABLE (
  session_token         TEXT,
  identifiant           TEXT,
  pere_nom              TEXT,
  pere_prenom           TEXT,
  mere_nom              TEXT,
  mere_prenom           TEXT,
  email                 TEXT,
  telephone             TEXT,
  must_change_password  BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_parent  public.parents;
  v_token   TEXT;
BEGIN
  SELECT p.* INTO v_parent
  FROM public.parents p
  WHERE p.identifiant = p_identifiant
    AND p.actif = true
    AND p.password_hash = extensions.crypt(p_password, p.password_hash);

  IF v_parent.id IS NULL THEN
    RETURN; -- identifiants invalides : tableau vide
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO public.parent_sessions (token, parent_id) VALUES (v_token, v_parent.id);
  -- Nettoyage best-effort : purge les sessions expirées de ce parent
  DELETE FROM public.parent_sessions WHERE parent_id = v_parent.id AND expires_at < now();

  RETURN QUERY SELECT
    v_token,
    v_parent.identifiant::TEXT, v_parent.pere_nom::TEXT, v_parent.pere_prenom::TEXT,
    v_parent.mere_nom::TEXT, v_parent.mere_prenom::TEXT,
    v_parent.email::TEXT, v_parent.telephone::TEXT,
    v_parent.must_change_password;
END;
$$;

GRANT EXECUTE ON FUNCTION public.login_parent(TEXT, TEXT) TO anon, authenticated;

-- ─── 3.b logout_parent : révoque la session côté serveur ─────────────────────
CREATE OR REPLACE FUNCTION public.logout_parent(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.parent_sessions WHERE token = p_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.logout_parent(TEXT) TO anon, authenticated;

-- ─── 3.c _resolve_parent_session : token → parent_id (ou NULL si invalide) ───
-- Helper interne appelé en tête de chaque RPC parent. Vérifie aussi l'expiration.
CREATE OR REPLACE FUNCTION public._resolve_parent_session(p_token TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_token IS NULL OR length(p_token) = 0 THEN RETURN NULL; END IF;
  SELECT parent_id INTO v_id
  FROM public.parent_sessions
  WHERE token = p_token AND expires_at > now();
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public._resolve_parent_session(TEXT) TO anon, authenticated;

-- ─── 4. change_parent_password ───────────────────────────────────────────────
-- Prend le jeton de session (pas un id manipulable côté client). Vérifie aussi
-- l'ancien mot de passe. Retourne true si changé, false sinon.
CREATE OR REPLACE FUNCTION public.change_parent_password(
  p_token TEXT,
  p_old   TEXT,
  p_new   TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_parent_id UUID;
  v_hash      TEXT;
BEGIN
  v_parent_id := public._resolve_parent_session(p_token);
  IF v_parent_id IS NULL THEN RETURN false; END IF;

  SELECT password_hash INTO v_hash FROM public.parents WHERE id = v_parent_id AND actif = true;
  IF v_hash IS NULL OR v_hash <> extensions.crypt(p_old, v_hash) THEN
    RETURN false;
  END IF;

  UPDATE public.parents
  SET password_hash = extensions.crypt(p_new, extensions.gen_salt('bf')),
      must_change_password = false
  WHERE id = v_parent_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_parent_password(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── Helper interne : vérifie qu'un p_admin_id correspond à un admin existant.
-- Aligne le pattern sur verify_admin_session déjà utilisé côté JS. Retourne
-- true/false ; les fonctions admin_* la rappellent en tête pour bloquer tout
-- appel non-authentifié via la clé anon.
CREATE OR REPLACE FUNCTION public._is_admin(p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_admin_id IS NULL THEN RETURN false; END IF;
  RETURN EXISTS (SELECT 1 FROM public.profils_admins WHERE id = p_admin_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public._is_admin(UUID) TO anon, authenticated;

-- ─── 5. admin_create_parent ──────────────────────────────────────────────────
-- Crée un compte parent ET la ligne parent_eleves en une seule transaction.
-- Retourne l'id du parent créé. Exige un p_admin_id valide.
CREATE OR REPLACE FUNCTION public.admin_create_parent(
  p_admin_id      UUID,
  p_identifiant   TEXT,
  p_password      TEXT,
  p_pere_nom      TEXT,
  p_pere_prenom   TEXT,
  p_mere_nom      TEXT,
  p_mere_prenom   TEXT,
  p_email         TEXT,
  p_telephone     TEXT,
  p_eleve_id      UUID,
  p_lien          TEXT DEFAULT 'parents'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_parent_id UUID;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF (COALESCE(p_pere_nom,'') = '' AND COALESCE(p_mere_nom,'') = '') THEN
    RAISE EXCEPTION 'Au moins un parent (père ou mère) doit être renseigné';
  END IF;

  INSERT INTO public.parents (
    identifiant, password_hash,
    pere_nom, pere_prenom, mere_nom, mere_prenom,
    email, telephone,
    must_change_password, actif
  ) VALUES (
    p_identifiant,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    NULLIF(p_pere_nom, ''),   NULLIF(p_pere_prenom, ''),
    NULLIF(p_mere_nom, ''),   NULLIF(p_mere_prenom, ''),
    p_email,
    public.normalize_phone(p_telephone),
    true, true
  )
  RETURNING id INTO new_parent_id;

  INSERT INTO public.parent_eleves (parent_id, eleve_id, lien)
  VALUES (new_parent_id, p_eleve_id, COALESCE(p_lien, 'parents'))
  ON CONFLICT (parent_id, eleve_id) DO NOTHING;

  RETURN new_parent_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_parent(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT
) TO anon, authenticated;

-- ─── 6. admin_find_parent_by_contact ─────────────────────────────────────────
-- Recherche un parent existant par email OU téléphone (normalisés).
-- Retourne aussi la liste des enfants déjà rattachés (aggrégée en JSONB).
-- Exige une session admin valide pour éviter l'énumération massive des parents.
CREATE OR REPLACE FUNCTION public.admin_find_parent_by_contact(
  p_admin_id UUID,
  p_email    TEXT,
  p_tel      TEXT
)
RETURNS TABLE (
  id           UUID,
  identifiant  TEXT,
  pere_nom     TEXT,
  pere_prenom  TEXT,
  mere_nom     TEXT,
  mere_prenom  TEXT,
  email        TEXT,
  telephone    TEXT,
  enfants      JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tel TEXT := public.normalize_phone(p_tel);
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT p.id, p.identifiant::TEXT,
         p.pere_nom::TEXT, p.pere_prenom::TEXT, p.mere_nom::TEXT, p.mere_prenom::TEXT,
         p.email::TEXT, p.telephone::TEXT,
         COALESCE(
           (SELECT jsonb_agg(jsonb_build_object(
               'eleve_id', e.id,
               'nom',      e.nom,
               'prenom',   e.prenom,
               'classe_id', e.classe_id
             ))
            FROM public.parent_eleves pe
            JOIN public.profils_eleves e ON e.id = pe.eleve_id
            WHERE pe.parent_id = p.id),
           '[]'::jsonb
         ) AS enfants
  FROM public.parents p
  WHERE (COALESCE(p_email, '') <> '' AND lower(p.email) = lower(p_email))
     OR (COALESCE(v_tel, '') <> ''  AND p.telephone = v_tel);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_find_parent_by_contact(UUID, TEXT, TEXT) TO anon, authenticated;

-- ─── 7. admin_link_parent_eleve ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_link_parent_eleve(
  p_admin_id  UUID,
  p_parent_id UUID,
  p_eleve_id  UUID,
  p_lien      TEXT DEFAULT 'parents'
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  INSERT INTO public.parent_eleves (parent_id, eleve_id, lien)
  VALUES (p_parent_id, p_eleve_id, COALESCE(p_lien, 'parents'))
  ON CONFLICT (parent_id, eleve_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_link_parent_eleve(UUID, UUID, UUID, TEXT) TO anon, authenticated;

-- ─── 8. admin_reset_parent_password ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_reset_parent_password(
  p_admin_id      UUID,
  p_id            UUID,
  p_new_password  TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  UPDATE public.parents
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      must_change_password = true
  WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_parent_password(UUID, UUID, TEXT) TO anon, authenticated;

-- ─── 9. fetch_parent_enfants ─────────────────────────────────────────────────
-- Retourne la liste complète des enfants du parent identifié par le jeton.
-- Appelée après login côté portail parent pour peupler le sélecteur.
CREATE OR REPLACE FUNCTION public.fetch_parent_enfants(p_token TEXT)
RETURNS TABLE (
  eleve_id          UUID,
  nom               TEXT,
  prenom            TEXT,
  classe_id         UUID,
  classe_nom        TEXT,
  niveau_scolaire_id UUID,
  photo_url         TEXT,
  photo_scale       NUMERIC,
  photo_pos_x       NUMERIC,
  photo_pos_y       NUMERIC,
  date_naissance    DATE,
  lien              TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := public._resolve_parent_session(p_token);
BEGIN
  IF v_parent_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT e.id, e.nom::TEXT, e.prenom::TEXT,
         e.classe_id, c.nom::TEXT AS classe_nom,
         e.niveau_scolaire_id,
         e.photo_url, e.photo_scale, e.photo_pos_x, e.photo_pos_y,
         e.date_naissance,
         pe.lien::TEXT
  FROM public.parent_eleves pe
  JOIN public.profils_eleves e ON e.id = pe.eleve_id
  LEFT JOIN public.classes c   ON c.id = e.classe_id
  WHERE pe.parent_id = v_parent_id
  ORDER BY e.prenom, e.nom;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_parent_enfants(TEXT) TO anon, authenticated;

-- ─── 10. Helper interne : le parent identifié par le token est-il rattaché à l'élève ?
-- Prend le jeton (pas un id manipulable), le résout en parent_id, puis vérifie
-- parent_eleves. Empêche un parent A de lire les données d'un enfant qui n'est
-- pas le sien, même si A bidouille le jeton ou l'eleve_id côté client.
-- Retourne TRUE si autorisé, FALSE sinon.
-- Signature alignée avec declarations_parents_migration.sql (RETURNS BOOLEAN) :
-- les deux fichiers définissent désormais la même signature, donc CREATE OR REPLACE
-- réussit dans n'importe quel ordre d'exécution sans avoir besoin de DROP préalable
-- (qui détruirait les fonctions dépendantes via CASCADE).
--
-- Migration depuis l'ancienne version UUID : si une fonction _parent_owns_eleve
-- existe déjà avec RETURNS UUID, on la drop avec CASCADE puisque CREATE OR REPLACE
-- ne peut pas changer le type de retour. Les fonctions dépendantes (fetch_*) sont
-- recréées plus bas dans ce même fichier ; les fonctions du module déclarations
-- doivent être recréées en réexécutant declarations_parents_migration.sql.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_type t ON p.prorettype = t.oid
    WHERE p.proname = '_parent_owns_eleve'
      AND p.pronamespace = 'public'::regnamespace
      AND t.typname = 'uuid'
  ) THEN
    DROP FUNCTION IF EXISTS public._parent_owns_eleve(TEXT, UUID) CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._parent_owns_eleve(p_token TEXT, p_eleve_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent_id UUID := public._resolve_parent_session(p_token);
BEGIN
  IF v_parent_id IS NULL OR p_eleve_id IS NULL THEN RETURN FALSE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.parent_eleves
    WHERE parent_id = v_parent_id AND eleve_id = p_eleve_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public._parent_owns_eleve(TEXT, UUID) TO anon, authenticated;

-- ─── 11. fetch_notes_for_parent ──────────────────────────────────────────────
-- Aligné sur le vrai schéma `evaluations` : pas de `matiere` ni `type`, la date
-- s'appelle `date_evaluation`. Le score de `notes` est NUMERIC (pas INTEGER).
-- #variable_conflict use_column : évite l'ambiguïté entre l'OUT param `id` et
-- les colonnes `id` de `notes` / `evaluations`.
CREATE OR REPLACE FUNCTION public.fetch_notes_for_parent(p_token TEXT, p_eleve_id UUID)
RETURNS TABLE (
  id           UUID,
  evaluation_id UUID,
  score        NUMERIC,
  absent       BOOLEAN,
  commentaire  TEXT,
  eval_titre   TEXT,
  eval_date    DATE
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT n.id, n.evaluation_id, n.score, n.absent, n.commentaire,
         e.titre::TEXT, e.date_evaluation
  FROM public.notes n
  JOIN public.evaluations e ON e.id = n.evaluation_id
  WHERE n.eleve_id = p_eleve_id
  ORDER BY e.date_evaluation DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_notes_for_parent(TEXT, UUID) TO anon, authenticated;

-- ─── 12. fetch_observations_for_parent ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fetch_observations_for_parent(p_token TEXT, p_eleve_id UUID)
RETURNS TABLE (
  id             UUID,
  type           TEXT,
  contenu        TEXT,
  created_at     TIMESTAMPTZ,
  enseignant_id  UUID,
  enseignant_nom TEXT,
  enseignant_prenom TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT o.id, o.type::TEXT, o.contenu, o.created_at,
         o.enseignant_id, t.nom::TEXT, t.prenom::TEXT
  FROM public.observations o
  LEFT JOIN public.enseignants t ON t.id = o.enseignant_id
  WHERE o.eleve_id = p_eleve_id
  ORDER BY o.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_observations_for_parent(TEXT, UUID) TO anon, authenticated;

-- ─── 13. fetch_devoirs_for_parent ────────────────────────────────────────────
-- Récupère les devoirs de la classe de l'élève. La classe est déduite de
-- profils_eleves côté SQL, donc non falsifiable côté client.
-- devoirs.id est BIGINT (auto-incrément) — pas UUID comme les autres tables.
CREATE OR REPLACE FUNCTION public.fetch_devoirs_for_parent(p_token TEXT, p_eleve_id UUID)
RETURNS TABLE (
  id             BIGINT,
  titre          TEXT,
  description    TEXT,
  date_limite    DATE,
  created_at     TIMESTAMPTZ,
  enseignant_id  UUID,
  enseignant_nom TEXT,
  enseignant_prenom TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_classe_id UUID;
BEGIN
  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  SELECT classe_id INTO v_classe_id FROM public.profils_eleves WHERE id = p_eleve_id;
  IF v_classe_id IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT d.id, d.titre::TEXT, d.description, d.date_limite, d.created_at,
         d.enseignant_id, t.nom::TEXT, t.prenom::TEXT
  FROM public.devoirs d
  LEFT JOIN public.enseignants t ON t.id = d.enseignant_id
  WHERE d.classe_id = v_classe_id
  ORDER BY d.date_limite ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_devoirs_for_parent(TEXT, UUID) TO anon, authenticated;

-- ─── 14. fetch_absences_for_parent ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fetch_absences_for_parent(p_token TEXT, p_eleve_id UUID)
RETURNS TABLE (
  id           UUID,
  type         TEXT,
  date         DATE,
  commentaire  TEXT,
  created_at   TIMESTAMPTZ,
  enseignant_id UUID
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT public._parent_owns_eleve(p_token, p_eleve_id) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT r.id, r.type::TEXT, r.date, r.commentaire, r.created_at, r.enseignant_id
  FROM public.retards_absences r
  WHERE r.eleve_id = p_eleve_id
  ORDER BY r.date DESC, r.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_absences_for_parent(TEXT, UUID) TO anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- Fin de migration. Tester avec :
--   SELECT * FROM admin_create_parent('TestP001','Prov!abc','Dupont','Jean',NULL,NULL,'jean@test.fr','0612345678','<UUID_ELEVE>','parents');
--   SELECT * FROM login_parent('TestP001','Prov!abc');
--   SELECT * FROM admin_find_parent_by_contact('jean@test.fr', NULL);
-- ══════════════════════════════════════════════════════════════════════════════
