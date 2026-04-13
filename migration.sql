-- =============================================================================
-- MIGRATION MULTI-TENANT — Institut As-Safaa ENT → SaaS
-- =============================================================================
-- ⚠️  LIRE AVANT D'EXÉCUTER :
--   1. Faire un backup complet de la base avant tout (voir plan.md Phase 2)
--   2. Exécuter les sections dans l'ordre strict (1 → 2 → 3 → 4 → 5)
--   3. Remplacer <UUID_ASSAFAA> par l'UUID généré à la section 1
--   4. Tester en staging avant production
-- =============================================================================


-- =============================================================================
-- SECTION 1 — NOUVELLES TABLES (schools + subscriptions)
-- =============================================================================

-- Table maîtresse des écoles
CREATE TABLE IF NOT EXISTS schools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom             TEXT NOT NULL,
  slug            TEXT UNIQUE,                    -- ex: "institut-as-safaa"
  logo_url        TEXT,
  email_contact   TEXT,
  adresse         TEXT,
  telephone       TEXT,
  actif           BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des abonnements
CREATE TABLE IF NOT EXISTS subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  plan                    TEXT CHECK (plan IN ('starter', 'standard', 'premium', 'pilot')),
  status                  TEXT CHECK (status IN ('active', 'trial', 'past_due', 'cancelled', 'manual')),
  current_period_end      DATE,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer l'école pilote (Institut As-Safaa)
-- ⚠️ Après exécution, noter l'UUID généré et remplacer <UUID_ASSAFAA> partout dans ce script
INSERT INTO schools (nom, slug, email_contact, actif)
VALUES ('Institut As-Safaa', 'institut-as-safaa', '', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subscriptions (school_id, plan, status)
SELECT id, 'pilot', 'active' FROM schools WHERE slug = 'institut-as-safaa'
ON CONFLICT DO NOTHING;

-- Récupérer l'UUID de l'école pilote (copier-coller dans les sections suivantes)
SELECT id AS "UUID_ASSAFAA_A_COPIER" FROM schools WHERE slug = 'institut-as-safaa';


-- =============================================================================
-- SECTION 2 — AJOUT school_id AUX TABLES EXISTANTES
-- =============================================================================
-- ⚠️ Remplacer '<UUID_ASSAFAA>' par l'UUID réel de l'étape ci-dessus.
-- La variable SQL ci-dessous évite les répétitions.

-- Déclarer l'UUID de l'école pilote (remplacer ici)
-- Si votre client SQL ne supporte pas \set, utiliser CTRL+H pour remplacer
-- '<UUID_ASSAFAA>' par le vrai UUID dans tout ce fichier.
DO $$
DECLARE
  school_uuid UUID;
BEGIN
  SELECT id INTO school_uuid FROM schools WHERE slug = 'institut-as-safaa';
  IF school_uuid IS NULL THEN
    RAISE EXCEPTION 'École pilote introuvable — exécuter la Section 1 d''abord';
  END IF;

  -- 2.1 inscriptions
  ALTER TABLE inscriptions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE inscriptions SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.2 messages
  ALTER TABLE messages ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE messages SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.3 modules
  ALTER TABLE modules ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE modules SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.4 thematiques
  ALTER TABLE thematiques ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE thematiques SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.5 lecons
  ALTER TABLE lecons ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE lecons SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.6 niveaux
  ALTER TABLE niveaux ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE niveaux SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.7 contenus
  ALTER TABLE contenus ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE contenus SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.8 qcm_questions
  ALTER TABLE qcm_questions ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE qcm_questions SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.9 niveaux_scolaires
  ALTER TABLE niveaux_scolaires ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE niveaux_scolaires SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.10 classes
  ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE classes SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.11 eleve_progression
  ALTER TABLE eleve_progression ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE eleve_progression SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.12 chat_messages
  ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE chat_messages SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.13 devoirs
  ALTER TABLE devoirs ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE devoirs SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.14 evaluations
  ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE evaluations SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.15 notes
  ALTER TABLE notes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE notes SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.16 observations
  ALTER TABLE observations ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE observations SET school_id = school_uuid WHERE school_id IS NULL;

  -- 2.17 retards_absences
  ALTER TABLE retards_absences ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  UPDATE retards_absences SET school_id = school_uuid WHERE school_id IS NULL;

  RAISE NOTICE 'Section 2 terminée — school_id rempli sur toutes les tables avec UUID: %', school_uuid;
END $$;

-- Passer school_id en NOT NULL sur les tables principales
-- (exécuter après avoir vérifié que toutes les lignes sont bien remplies)
-- ALTER TABLE inscriptions     ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE messages         ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE modules          ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE thematiques      ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE lecons           ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE niveaux          ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE contenus         ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE qcm_questions    ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE niveaux_scolaires ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE classes          ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE eleve_progression ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE chat_messages    ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE devoirs          ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE evaluations      ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE notes            ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE observations     ALTER COLUMN school_id SET NOT NULL;
-- ALTER TABLE retards_absences ALTER COLUMN school_id SET NOT NULL;


-- =============================================================================
-- SECTION 3 — ENRICHISSEMENT DES TABLES UTILISATEURS
-- =============================================================================

DO $$
DECLARE
  school_uuid UUID;
BEGIN
  SELECT id INTO school_uuid FROM schools WHERE slug = 'institut-as-safaa';

  -- profils_admins
  ALTER TABLE profils_admins ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  ALTER TABLE profils_admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
  UPDATE profils_admins SET school_id = school_uuid, role = 'admin' WHERE school_id IS NULL;

  -- profils_eleves
  ALTER TABLE profils_eleves ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  ALTER TABLE profils_eleves ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'eleve';
  UPDATE profils_eleves SET school_id = school_uuid, role = 'eleve' WHERE school_id IS NULL;

  -- enseignants
  ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id);
  ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'enseignant';
  UPDATE enseignants SET school_id = school_uuid, role = 'enseignant' WHERE school_id IS NULL;

  -- Table super-admin (propriétaire du produit SaaS — séparée des admins d'école)
  CREATE TABLE IF NOT EXISTS super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifiant     TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
  );

  RAISE NOTICE 'Section 3 terminée';
END $$;


-- =============================================================================
-- SECTION 4 — ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Stratégie : chaque requête passe school_id via un paramètre de session
-- (app.current_school_id) défini par les fonctions RPC de login.
-- Alternative simple pour démarrer : les fonctions login retournent school_id
-- stocké en session côté frontend, et les requêtes PostgREST filtrent via
-- ?school_id=eq.<uuid> — plus simple à maintenir sans Supabase Auth JWT.
-- La RLS ci-dessous est la version robuste pour une vraie isolation serveur.

-- Helper : lire school_id depuis les paramètres de session
CREATE OR REPLACE FUNCTION current_school_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_school_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

-- ── Activer RLS sur toutes les tables ──────────────────────────────────────

ALTER TABLE schools           ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profils_admins    ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules           ENABLE ROW LEVEL SECURITY;
ALTER TABLE thematiques       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecons            ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveaux           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contenus          ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveaux_scolaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE profils_eleves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enseignants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE enseignant_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleve_progression ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoirs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE retards_absences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admins      ENABLE ROW LEVEL SECURITY;

-- ── Macro de création de politique (réutilisée par table) ──────────────────
-- Politique standard : isolation par school_id via paramètre de session

-- inscriptions
DROP POLICY IF EXISTS "isolation_school" ON inscriptions;
CREATE POLICY "isolation_school" ON inscriptions
  USING (school_id = current_school_id());

-- messages
DROP POLICY IF EXISTS "isolation_school" ON messages;
CREATE POLICY "isolation_school" ON messages
  USING (school_id = current_school_id());

-- profils_admins
DROP POLICY IF EXISTS "isolation_school" ON profils_admins;
CREATE POLICY "isolation_school" ON profils_admins
  USING (school_id = current_school_id());

-- modules
DROP POLICY IF EXISTS "isolation_school" ON modules;
CREATE POLICY "isolation_school" ON modules
  USING (school_id = current_school_id());

-- thematiques
DROP POLICY IF EXISTS "isolation_school" ON thematiques;
CREATE POLICY "isolation_school" ON thematiques
  USING (school_id = current_school_id());

-- lecons
DROP POLICY IF EXISTS "isolation_school" ON lecons;
CREATE POLICY "isolation_school" ON lecons
  USING (school_id = current_school_id());

-- niveaux
DROP POLICY IF EXISTS "isolation_school" ON niveaux;
CREATE POLICY "isolation_school" ON niveaux
  USING (school_id = current_school_id());

-- contenus
DROP POLICY IF EXISTS "isolation_school" ON contenus;
CREATE POLICY "isolation_school" ON contenus
  USING (school_id = current_school_id());

-- qcm_questions
DROP POLICY IF EXISTS "isolation_school" ON qcm_questions;
CREATE POLICY "isolation_school" ON qcm_questions
  USING (school_id = current_school_id());

-- niveaux_scolaires
DROP POLICY IF EXISTS "isolation_school" ON niveaux_scolaires;
CREATE POLICY "isolation_school" ON niveaux_scolaires
  USING (school_id = current_school_id());

-- classes
DROP POLICY IF EXISTS "isolation_school" ON classes;
CREATE POLICY "isolation_school" ON classes
  USING (school_id = current_school_id());

-- profils_eleves
DROP POLICY IF EXISTS "isolation_school" ON profils_eleves;
CREATE POLICY "isolation_school" ON profils_eleves
  USING (school_id = current_school_id());

-- enseignants
DROP POLICY IF EXISTS "isolation_school" ON enseignants;
CREATE POLICY "isolation_school" ON enseignants
  USING (school_id = current_school_id());

-- enseignant_classes (pas de school_id direct — isolation via enseignant_id)
DROP POLICY IF EXISTS "isolation_school" ON enseignant_classes;
CREATE POLICY "isolation_school" ON enseignant_classes
  USING (
    enseignant_id IN (
      SELECT id FROM enseignants WHERE school_id = current_school_id()
    )
  );

-- eleve_progression
DROP POLICY IF EXISTS "isolation_school" ON eleve_progression;
CREATE POLICY "isolation_school" ON eleve_progression
  USING (school_id = current_school_id());

-- chat_messages
DROP POLICY IF EXISTS "isolation_school" ON chat_messages;
CREATE POLICY "isolation_school" ON chat_messages
  USING (school_id = current_school_id());

-- devoirs
DROP POLICY IF EXISTS "isolation_school" ON devoirs;
CREATE POLICY "isolation_school" ON devoirs
  USING (school_id = current_school_id());

-- evaluations
DROP POLICY IF EXISTS "isolation_school" ON evaluations;
CREATE POLICY "isolation_school" ON evaluations
  USING (school_id = current_school_id());

-- notes
DROP POLICY IF EXISTS "isolation_school" ON notes;
CREATE POLICY "isolation_school" ON notes
  USING (school_id = current_school_id());

-- observations
DROP POLICY IF EXISTS "isolation_school" ON observations;
CREATE POLICY "isolation_school" ON observations
  USING (school_id = current_school_id());

-- retards_absences
DROP POLICY IF EXISTS "isolation_school" ON retards_absences;
CREATE POLICY "isolation_school" ON retards_absences
  USING (school_id = current_school_id());

-- schools : chaque admin voit uniquement son école
DROP POLICY IF EXISTS "isolation_school" ON schools;
CREATE POLICY "isolation_school" ON schools
  USING (id = current_school_id());

-- subscriptions
DROP POLICY IF EXISTS "isolation_school" ON subscriptions;
CREATE POLICY "isolation_school" ON subscriptions
  USING (school_id = current_school_id());

-- super_admins : aucune politique anon (accès uniquement via service_role)
-- Les super-admins s'authentifient séparément avec service_role key côté serveur.


-- =============================================================================
-- SECTION 5 — MISE À JOUR DES FONCTIONS RPC
-- =============================================================================

-- 5.1 login_admin_custom — retourne school_id dans le résultat
CREATE OR REPLACE FUNCTION login_admin_custom(p_identifiant TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin profils_admins%ROWTYPE;
BEGIN
  SELECT * INTO v_admin
  FROM profils_admins
  WHERE identifiant = p_identifiant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  IF NOT crypt(p_password, v_admin.password_hash) = v_admin.password_hash THEN
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  -- Définir le school_id dans les paramètres de session pour ce contexte
  PERFORM set_config('app.current_school_id', v_admin.school_id::TEXT, true);

  RETURN json_build_object(
    'id',         v_admin.id,
    'identifiant',v_admin.identifiant,
    'school_id',  v_admin.school_id,
    'role',       COALESCE(v_admin.role, 'admin')
  );
END;
$$;

-- 5.2 login_eleve — retourne school_id
CREATE OR REPLACE FUNCTION login_eleve(p_identifiant TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eleve profils_eleves%ROWTYPE;
BEGIN
  SELECT * INTO v_eleve
  FROM profils_eleves
  WHERE identifiant = p_identifiant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identifiants incorrects';
  END IF;

  IF NOT crypt(p_password, v_eleve.password_hash) = v_eleve.password_hash THEN
    RAISE EXCEPTION 'Identifiants incorrects';
  END IF;

  PERFORM set_config('app.current_school_id', v_eleve.school_id::TEXT, true);

  RETURN json_build_object(
    'id',                  v_eleve.id,
    'nom',                 v_eleve.nom,
    'prenom',              v_eleve.prenom,
    'identifiant',         v_eleve.identifiant,
    'classe_id',           v_eleve.classe_id,
    'niveau_scolaire_id',  v_eleve.niveau_scolaire_id,
    'must_change_password',v_eleve.must_change_password,
    'school_id',           v_eleve.school_id,
    'role',                'eleve'
  );
END;
$$;

-- 5.3 login_enseignant — retourne school_id
CREATE OR REPLACE FUNCTION login_enseignant(p_identifiant TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ens enseignants%ROWTYPE;
BEGIN
  SELECT * INTO v_ens
  FROM enseignants
  WHERE identifiant = p_identifiant;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  IF NOT crypt(p_password, v_ens.password_hash) = v_ens.password_hash THEN
    RAISE EXCEPTION 'Identifiant ou mot de passe incorrect';
  END IF;

  PERFORM set_config('app.current_school_id', v_ens.school_id::TEXT, true);

  RETURN json_build_object(
    'id',                  v_ens.id,
    'nom',                 v_ens.nom,
    'prenom',              v_ens.prenom,
    'identifiant',         v_ens.identifiant,
    'must_change_password',v_ens.must_change_password,
    'school_id',           v_ens.school_id,
    'role',                'enseignant'
  );
END;
$$;

-- 5.4 admin_create_user — prend p_school_id en paramètre
CREATE OR REPLACE FUNCTION admin_create_user(
  p_identifiant TEXT,
  p_password    TEXT,
  p_nom         TEXT,
  p_prenom      TEXT,
  p_school_id   UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      UUID := gen_random_uuid();
  v_school  UUID;
BEGIN
  -- Utiliser school_id passé ou celui de la session
  v_school := COALESCE(p_school_id, current_school_id());
  IF v_school IS NULL THEN
    RAISE EXCEPTION 'school_id manquant';
  END IF;

  INSERT INTO profils_eleves (id, identifiant, password_hash, nom, prenom, school_id, role, actif, must_change_password)
  VALUES (
    v_id,
    LOWER(TRIM(p_identifiant)),
    crypt(p_password, gen_salt('bf')),
    p_nom, p_prenom, v_school, 'eleve', true, true
  );

  RETURN v_id;
END;
$$;

-- 5.5 admin_create_enseignant — prend p_school_id en paramètre
CREATE OR REPLACE FUNCTION admin_create_enseignant(
  p_id          UUID,
  p_identifiant TEXT,
  p_password    TEXT,
  p_school_id   UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_school UUID;
BEGIN
  v_school := COALESCE(p_school_id, current_school_id());
  IF v_school IS NULL THEN
    RAISE EXCEPTION 'school_id manquant';
  END IF;

  UPDATE enseignants
  SET
    identifiant           = LOWER(TRIM(p_identifiant)),
    password_hash         = crypt(p_password, gen_salt('bf')),
    must_change_password  = true,
    school_id             = v_school
  WHERE id = p_id;
END;
$$;


-- =============================================================================
-- SECTION 6 — VÉRIFICATION POST-MIGRATION
-- =============================================================================

-- Vérifier qu'aucune ligne n'a school_id NULL dans les tables principales
SELECT 'inscriptions'      AS table_name, COUNT(*) AS lignes_sans_school FROM inscriptions     WHERE school_id IS NULL
UNION ALL
SELECT 'modules',           COUNT(*) FROM modules           WHERE school_id IS NULL
UNION ALL
SELECT 'classes',           COUNT(*) FROM classes           WHERE school_id IS NULL
UNION ALL
SELECT 'profils_eleves',    COUNT(*) FROM profils_eleves    WHERE school_id IS NULL
UNION ALL
SELECT 'enseignants',       COUNT(*) FROM enseignants       WHERE school_id IS NULL
UNION ALL
SELECT 'evaluations',       COUNT(*) FROM evaluations       WHERE school_id IS NULL
UNION ALL
SELECT 'notes',             COUNT(*) FROM notes             WHERE school_id IS NULL
UNION ALL
SELECT 'devoirs',           COUNT(*) FROM devoirs           WHERE school_id IS NULL
UNION ALL
SELECT 'chat_messages',     COUNT(*) FROM chat_messages     WHERE school_id IS NULL
UNION ALL
SELECT 'observations',      COUNT(*) FROM observations      WHERE school_id IS NULL
UNION ALL
SELECT 'retards_absences',  COUNT(*) FROM retards_absences  WHERE school_id IS NULL;
-- ✅ Toutes les valeurs doivent être 0

-- Vérifier que l'école pilote a bien ses données
SELECT s.nom, s.slug, COUNT(pe.id) AS nb_eleves, COUNT(DISTINCT e.id) AS nb_enseignants
FROM schools s
LEFT JOIN profils_eleves pe ON pe.school_id = s.id
LEFT JOIN enseignants e ON e.school_id = s.id
GROUP BY s.id, s.nom, s.slug;
