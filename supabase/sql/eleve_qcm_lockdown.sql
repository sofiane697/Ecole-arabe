-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — RLS Phase 2.A : Anti-triche QCM
--
-- Contexte : audit du 2026-05-08 a identifié que le portail élève notait 0/10
-- sur l'anti-triche QCM. Causes :
--   • `fetchQCMEleve` retournait `reponse_correcte` au navigateur (les bonnes
--     réponses sont visibles dans Network avant même de cliquer).
--   • `save_progression_secure` acceptait `p_score` et `p_reussi` envoyés par
--     le client (un élève pouvait poster `score=100, reussi=true` direct).
--
-- Cette migration :
--   1. Crée 4 RPCs élève/enseignant qui ne livrent jamais `reponse_correcte` :
--        fetch_qcm_for_eleve_secure, fetch_qcm_existence_for_eleve_secure,
--        fetch_qcm_existence_for_ens_secure, submit_qcm_secure.
--   2. Crée 5 RPCs admin pour le CRUD QCM + lecture progression
--      (les voies REST directes étant bloquées par le verrou RLS) :
--        admin_fetch_qcm_questions, admin_create_question, admin_update_question,
--        admin_delete_question, admin_fetch_eleve_progression.
--   3. Sécurise `reset_progression_niveau` qui acceptait n'importe quel anon
--      (transformée en `admin_reset_progression_niveau` avec vérif admin).
--   4. Déprécie `save_progression_secure` (RAISE EXCEPTION explicite) pour
--      éviter qu'un client cache puisse encore l'utiliser après déploiement.
--   5. Verrouille le RLS sur `qcm_questions` et `eleve_progression`.
--
-- À exécuter APRÈS `parents_rls_lockdown.sql`. Idempotent.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 0. Nettoyage des signatures existantes ──────────────────────────────────
DO $$
DECLARE sig TEXT;
BEGIN
  FOR sig IN
    SELECT oid::regprocedure::text FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname IN (
        'fetch_qcm_for_eleve_secure',
        'fetch_qcm_existence_for_eleve_secure',
        'fetch_qcm_existence_for_ens_secure',
        'submit_qcm_secure',
        'admin_fetch_qcm_questions',
        'admin_create_question',
        'admin_update_question',
        'admin_delete_question',
        'admin_fetch_eleve_progression',
        'admin_reset_progression_niveau',
        'admin_fetch_qcm_existence'
      )
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || sig || ' CASCADE';
  END LOOP;
END $$;

-- ─── 1. fetch_qcm_for_eleve_secure ───────────────────────────────────────────
-- Retourne les questions QCM du niveau pour l'élève authentifié.
-- IMPORTANT : ne renvoie JAMAIS la colonne `reponse_correcte`. À la place, expose
-- juste un booléen `multi_reponses` pour que l'UI affiche le bon hint
-- (« tu peux choisir plusieurs réponses »).
-- Le niveau scolaire de l'élève n'est PAS vérifié ici (un élève peut accéder
-- aux QCM de niveaux verrouillés ne lui appartenant pas s'il devine l'ID, mais
-- sans les bonnes réponses : aucune utilité). À durcir en Phase 2.B avec une
-- vérif d'appartenance niveau scolaire si besoin.
CREATE OR REPLACE FUNCTION public.fetch_qcm_for_eleve_secure(
  p_token     TEXT,
  p_niveau_id BIGINT
)
RETURNS TABLE (
  id              BIGINT,
  question        TEXT,
  choix           JSONB,
  ordre           INTEGER,
  multi_reponses  BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_eleve_id UUID;
BEGIN
  v_eleve_id := public._resolve_eleve_session(p_token);
  IF v_eleve_id IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;

  RETURN QUERY
  SELECT q.id, q.question, q.choix, q.ordre,
         (jsonb_typeof(q.reponse_correcte) = 'array'
          AND jsonb_array_length(q.reponse_correcte) > 1) AS multi_reponses
  FROM public.qcm_questions q
  WHERE q.niveau_id = p_niveau_id
  ORDER BY q.ordre, q.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_qcm_for_eleve_secure(TEXT, BIGINT)
  TO anon, authenticated;

-- ─── 2. fetch_qcm_existence_for_eleve_secure ─────────────────────────────────
-- Remplace l'ancien fetch REST direct utilisé pour savoir quels niveaux ont
-- au moins une question QCM (badge UI).
-- Ne nécessite que la liste des niveau_id (TEXT array converti en BIGINT).
CREATE OR REPLACE FUNCTION public.fetch_qcm_existence_for_eleve_secure(
  p_token      TEXT,
  p_niveau_ids BIGINT[]
)
RETURNS SETOF BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_eleve_id UUID;
BEGIN
  v_eleve_id := public._resolve_eleve_session(p_token);
  IF v_eleve_id IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;
  IF p_niveau_ids IS NULL OR array_length(p_niveau_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT q.niveau_id
  FROM public.qcm_questions q
  WHERE q.niveau_id = ANY(p_niveau_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_qcm_existence_for_eleve_secure(TEXT, BIGINT[])
  TO anon, authenticated;

-- ─── 3. fetch_qcm_existence_for_ens_secure ───────────────────────────────────
-- Pendant pour l'enseignant (utilisé sur la fiche élève pour afficher les
-- niveaux QCM-validables).
CREATE OR REPLACE FUNCTION public.fetch_qcm_existence_for_ens_secure(
  p_token      TEXT,
  p_niveau_ids BIGINT[]
)
RETURNS SETOF BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ens_id UUID;
BEGIN
  v_ens_id := public._resolve_enseignant_session(p_token);
  IF v_ens_id IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;
  IF p_niveau_ids IS NULL OR array_length(p_niveau_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT q.niveau_id
  FROM public.qcm_questions q
  WHERE q.niveau_id = ANY(p_niveau_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_qcm_existence_for_ens_secure(TEXT, BIGINT[])
  TO anon, authenticated;

-- ─── 4. submit_qcm_secure ────────────────────────────────────────────────────
-- COEUR DE L'ANTI-TRICHE. Reçoit les réponses brutes de l'élève, charge les
-- bonnes réponses côté SQL, calcule le pourcentage, écrit la progression et
-- retourne {score, reussi}. Le client n'a JAMAIS accès aux bonnes réponses ni
-- au seuil de réussite.
--
-- Format de p_answers : JSONB objet {qid_str: [int_choisis]}, ex:
--   {"42": [0, 2], "43": [1], "44": []}
-- (qid_str est l'ID de la question converti en TEXT car JSONB n'accepte que
-- des clés string.)
--
-- Les questions absentes de p_answers comptent comme non répondues (= fausses).
-- L'égalité des indices choisis vs corrects est faite après tri pour ignorer
-- l'ordre. Les indices hors plage sont automatiquement faux (ne sont jamais
-- égaux à un correct_set valide).
--
-- Si toutes les questions sont absentes (objet vide), score = 0.
-- Si aucune question dans le niveau, exception (UI doit garder isPassed=false).
CREATE OR REPLACE FUNCTION public.submit_qcm_secure(
  p_token     TEXT,
  p_niveau_id BIGINT,
  p_answers   JSONB
)
RETURNS TABLE (
  score   INTEGER,
  reussi  BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_eleve_id     UUID;
  v_total        INT := 0;
  v_correct      INT := 0;
  v_pct          INT;
  v_reussi       BOOLEAN;
  v_score_requis INT;
  q              RECORD;
  v_selected     INT[];
  v_correct_arr  INT[];
BEGIN
  v_eleve_id := public._resolve_eleve_session(p_token);
  IF v_eleve_id IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RAISE EXCEPTION 'p_answers doit être un objet JSON';
  END IF;

  -- Lire le seuil de réussite côté serveur (jamais côté client).
  -- BORNE MINIMUM à 50 : la table `niveaux` reste writable par anon jusqu'à
  -- la phase RLS 2.B. Sans ce GREATEST, un attaquant qui PATCH `score_requis=0`
  -- via REST direct neutraliserait toute l'anti-triche. Compromis : un admin
  -- légitime peut configurer score_requis entre 50 et 100, en dessous c'est
  -- forcé à 50 (protection minimale).
  SELECT GREATEST(COALESCE(score_requis, 80), 50) INTO v_score_requis
  FROM public.niveaux WHERE id = p_niveau_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Niveau introuvable (id=%)', p_niveau_id;
  END IF;

  -- Comparer chaque question.
  FOR q IN
    SELECT id, reponse_correcte
    FROM public.qcm_questions
    WHERE niveau_id = p_niveau_id
  LOOP
    v_total := v_total + 1;

    -- Indices choisis par l'élève pour cette question (NULL = vide ou invalide).
    -- Cast protégé : un payload {qid: ["abc"]} retournerait
    -- invalid_text_representation non capturée → 500 brut au client. On
    -- traite la question comme non répondue dans ce cas.
    BEGIN
      v_selected := ARRAY(
        SELECT (e.value)::INT
        FROM jsonb_array_elements_text(
          COALESCE(p_answers -> q.id::TEXT, '[]'::JSONB)
        ) AS e(value)
        ORDER BY 1
      );
    EXCEPTION WHEN invalid_text_representation THEN
      v_selected := NULL;
    END;

    -- Indices corrects pour cette question.
    v_correct_arr := ARRAY(
      SELECT (e.value)::INT
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(q.reponse_correcte) = 'array'
             THEN q.reponse_correcte
             ELSE '[]'::JSONB END
      ) AS e(value)
      ORDER BY 1
    );

    IF v_selected IS NOT NULL
       AND array_length(v_selected, 1) IS NOT NULL
       AND array_length(v_correct_arr, 1) IS NOT NULL
       AND v_selected = v_correct_arr THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Aucune question pour ce niveau';
  END IF;

  v_pct := ROUND(v_correct::NUMERIC * 100 / v_total);
  v_reussi := v_pct >= v_score_requis;

  -- Écrit via la fonction métier existante (vérifie ordre niveaux,
  -- existence QCM, anti-régression reussi avec GREATEST).
  PERFORM public.save_progression(v_eleve_id, p_niveau_id, v_pct, v_reussi);

  score  := v_pct;
  reussi := v_reussi;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_qcm_secure(TEXT, BIGINT, JSONB)
  TO anon, authenticated;

-- ─── 5. save_progression_secure : déprécier ──────────────────────────────────
-- L'ancienne RPC acceptait p_score / p_reussi du client → faille critique.
-- On la conserve (un cache JS pourrait encore l'appeler après déploiement),
-- mais on la rend inopérante avec une exception explicite. Les callers JS
-- migrés vers submit_qcm_secure ne la touchent plus.
CREATE OR REPLACE FUNCTION public.save_progression_secure(
  p_token     TEXT,
  p_niveau_id BIGINT,
  p_score     INTEGER,
  p_reussi    BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifie quand même le token pour ne pas leaker un signal d'auth.
  IF public._resolve_eleve_session(p_token) IS NULL THEN
    RAISE EXCEPTION 'Session invalide';
  END IF;
  RAISE EXCEPTION 'save_progression_secure est dépréciée. Utilise submit_qcm_secure.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_progression_secure(TEXT, BIGINT, INTEGER, BOOLEAN)
  TO anon, authenticated;

-- ─── 6. admin_fetch_qcm_questions ────────────────────────────────────────────
-- L'admin a besoin de TOUTES les colonnes (incluant reponse_correcte) pour
-- éditer les questions dans Cours.jsx. Vérifié par _is_admin.
CREATE OR REPLACE FUNCTION public.admin_fetch_qcm_questions(
  p_admin_id  UUID,
  p_niveau_id BIGINT
)
RETURNS TABLE (
  id               BIGINT,
  niveau_id        BIGINT,
  question         TEXT,
  choix            JSONB,
  reponse_correcte JSONB,
  ordre            INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;

  RETURN QUERY
  SELECT q.id, q.niveau_id, q.question, q.choix, q.reponse_correcte, q.ordre
  FROM public.qcm_questions q
  WHERE q.niveau_id = p_niveau_id
  ORDER BY q.ordre, q.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_qcm_questions(UUID, BIGINT)
  TO anon, authenticated;

-- ─── 7. admin_create_question ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_create_question(
  p_admin_id        UUID,
  p_niveau_id       BIGINT,
  p_question        TEXT,
  p_choix           JSONB,
  p_reponse_correcte JSONB,
  p_ordre           INTEGER DEFAULT 0
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id        BIGINT;
  v_choix_len INT;
  v_max_idx   INT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF jsonb_typeof(p_choix) <> 'array' OR jsonb_array_length(p_choix) < 2 THEN
    RAISE EXCEPTION 'p_choix doit être un tableau d''au moins 2 éléments';
  END IF;
  IF jsonb_typeof(p_reponse_correcte) <> 'array' OR jsonb_array_length(p_reponse_correcte) < 1 THEN
    RAISE EXCEPTION 'p_reponse_correcte doit être un tableau non vide';
  END IF;

  -- Cohérence indices/choix : empêche de créer une question impossible
  -- (ex: correct=[5] avec 3 choix → submit_qcm_secure ne pourrait jamais
  -- la valider, blocage pédagogique silencieux).
  v_choix_len := jsonb_array_length(p_choix);
  SELECT MAX((e.value)::INT) INTO v_max_idx
  FROM jsonb_array_elements_text(p_reponse_correcte) AS e(value);
  IF v_max_idx >= v_choix_len OR v_max_idx < 0 THEN
    RAISE EXCEPTION 'p_reponse_correcte contient un indice hors plage (max %, choix length %)', v_max_idx, v_choix_len;
  END IF;

  INSERT INTO public.qcm_questions (niveau_id, question, choix, reponse_correcte, ordre)
  VALUES (p_niveau_id, p_question, p_choix, p_reponse_correcte, COALESCE(p_ordre, 0))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_question(UUID, BIGINT, TEXT, JSONB, JSONB, INTEGER)
  TO anon, authenticated;

-- ─── 8. admin_update_question ────────────────────────────────────────────────
-- Patch partiel : NULL = inchangé. Pour `choix` et `reponse_correcte`, NULL
-- aussi (on ne peut pas mettre un array vide volontairement, on en met un
-- nouveau).
CREATE OR REPLACE FUNCTION public.admin_update_question(
  p_admin_id        UUID,
  p_id              BIGINT,
  p_question        TEXT    DEFAULT NULL,
  p_choix           JSONB   DEFAULT NULL,
  p_reponse_correcte JSONB  DEFAULT NULL,
  p_ordre           INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_choix_final   JSONB;
  v_reponse_final JSONB;
  v_choix_len     INT;
  v_max_idx       INT;
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF p_choix IS NOT NULL
     AND (jsonb_typeof(p_choix) <> 'array' OR jsonb_array_length(p_choix) < 2) THEN
    RAISE EXCEPTION 'p_choix doit être un tableau d''au moins 2 éléments';
  END IF;
  IF p_reponse_correcte IS NOT NULL
     AND (jsonb_typeof(p_reponse_correcte) <> 'array' OR jsonb_array_length(p_reponse_correcte) < 1) THEN
    RAISE EXCEPTION 'p_reponse_correcte doit être un tableau non vide';
  END IF;

  -- Si on change `choix` sans renvoyer `reponse_correcte`, les indices
  -- stockés peuvent pointer hors plage → on refuse explicitement pour
  -- forcer l'admin à expliciter les deux ensemble.
  IF p_choix IS NOT NULL AND p_reponse_correcte IS NULL THEN
    RAISE EXCEPTION 'p_reponse_correcte doit être fourni quand p_choix change (cohérence indices/choix)';
  END IF;

  -- Vérification finale de cohérence indices vs choix résultants après merge.
  IF p_choix IS NOT NULL OR p_reponse_correcte IS NOT NULL THEN
    SELECT COALESCE(p_choix, choix), COALESCE(p_reponse_correcte, reponse_correcte)
      INTO v_choix_final, v_reponse_final
      FROM public.qcm_questions WHERE id = p_id;
    IF v_choix_final IS NULL THEN
      RAISE EXCEPTION 'Question introuvable (id=%)', p_id;
    END IF;
    v_choix_len := jsonb_array_length(v_choix_final);
    SELECT MAX((e.value)::INT) INTO v_max_idx
    FROM jsonb_array_elements_text(v_reponse_final) AS e(value);
    IF v_max_idx >= v_choix_len OR v_max_idx < 0 THEN
      RAISE EXCEPTION 'reponse_correcte contient un indice hors plage (max %, choix length %)', v_max_idx, v_choix_len;
    END IF;
  END IF;

  UPDATE public.qcm_questions
     SET question         = COALESCE(p_question, question),
         choix            = COALESCE(p_choix, choix),
         reponse_correcte = COALESCE(p_reponse_correcte, reponse_correcte),
         ordre            = COALESCE(p_ordre, ordre)
   WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_question(UUID, BIGINT, TEXT, JSONB, JSONB, INTEGER)
  TO anon, authenticated;

-- ─── 9. admin_delete_question ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_delete_question(
  p_admin_id UUID,
  p_id       BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.qcm_questions WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_question(UUID, BIGINT)
  TO anon, authenticated;

-- ─── 10. admin_fetch_eleve_progression ───────────────────────────────────────
-- L'admin lit la progression d'un élève (fiche élève). Auparavant en REST
-- direct sur eleve_progression.
CREATE OR REPLACE FUNCTION public.admin_fetch_eleve_progression(
  p_admin_id UUID,
  p_eleve_id UUID
)
RETURNS SETOF eleve_progression
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  RETURN QUERY
  SELECT * FROM public.eleve_progression WHERE eleve_id = p_eleve_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_eleve_progression(UUID, UUID)
  TO anon, authenticated;

-- ─── 11. admin_reset_progression_niveau ──────────────────────────────────────
-- Sécurise l'ancienne `reset_progression_niveau` qui acceptait n'importe quel
-- anon (elle n'avait aucun check d'admin → trou de sécurité existant).
-- L'ancienne reste en place pour compat ascendante, mais le caller JS migrera
-- vers cette version.
CREATE OR REPLACE FUNCTION public.admin_reset_progression_niveau(
  p_admin_id  UUID,
  p_niveau_id BIGINT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  DELETE FROM public.eleve_progression WHERE niveau_id = p_niveau_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_progression_niveau(UUID, BIGINT)
  TO anon, authenticated;

-- ─── 11.b admin_fetch_qcm_existence ──────────────────────────────────────────
-- Pendant batch admin de fetch_qcm_existence_for_eleve_secure : utilisé par la
-- fiche élève admin pour savoir quels niveaux ont au moins un QCM.
CREATE OR REPLACE FUNCTION public.admin_fetch_qcm_existence(
  p_admin_id   UUID,
  p_niveau_ids BIGINT[]
)
RETURNS SETOF BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Accès refusé : session admin requise';
  END IF;
  IF p_niveau_ids IS NULL OR array_length(p_niveau_ids, 1) IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT DISTINCT q.niveau_id
  FROM public.qcm_questions q
  WHERE q.niveau_id = ANY(p_niveau_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_fetch_qcm_existence(UUID, BIGINT[])
  TO anon, authenticated;

-- ─── 12. Verrouillage RLS ────────────────────────────────────────────────────
-- Une fois les RPCs ci-dessus en place, plus aucun client n'a besoin d'accès
-- direct. On ferme `qcm_questions` et `eleve_progression` à anon/authenticated.

-- ATTENTION : Postgres applique l'OR sur les policies multiples — une seule
-- policy permissive (USING(true)) suffit à neutraliser le verrou. La migration
-- initiale a oublié les policies pré-existantes nommées `anon_all`,
-- `admin_all_qcm`, `admin_all_progression`. On drop tous les noms connus.
DROP POLICY IF EXISTS "qcm_questions_all_anon"           ON public.qcm_questions;
DROP POLICY IF EXISTS "qcm_questions_no_direct_anon"     ON public.qcm_questions;
DROP POLICY IF EXISTS "anon_all"                         ON public.qcm_questions;
DROP POLICY IF EXISTS "admin_all_qcm"                    ON public.qcm_questions;
DROP POLICY IF EXISTS "eleve_progression_all_anon"        ON public.eleve_progression;
DROP POLICY IF EXISTS "eleve_progression_no_direct_anon"  ON public.eleve_progression;
DROP POLICY IF EXISTS "admin_all_progression"             ON public.eleve_progression;

CREATE POLICY "qcm_questions_no_direct_anon"
  ON public.qcm_questions FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "eleve_progression_no_direct_anon"
  ON public.eleve_progression FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

-- ─── 13. Révocation des fonctions legacy (HOTFIX post-audit 2026-05-08) ──────
-- Sans ces REVOKE, deux trous neutralisaient toute la migration :
--   • `save_progression(uuid, bigint, int, bool)` : la fonction interne acceptait
--     un score arbitraire pour n'importe quel eleve_id → bypass complet de
--     l'anti-triche via /rest/v1/rpc/save_progression.
--   • `reset_progression_niveau(bigint)` : aucune vérif admin → DoS pédagogique
--     (un anon pouvait wipe la progression de toute l'école pour un niveau).
-- Les RPCs SECURITY DEFINER qui s'en servent (submit_qcm_secure) continuent
-- de fonctionner car elles tournent avec les droits du propriétaire postgres.
REVOKE EXECUTE ON FUNCTION public.save_progression(UUID, BIGINT, INTEGER, BOOLEAN)
  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reset_progression_niveau(BIGINT)
  FROM anon, authenticated, PUBLIC;

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. Anon en SELECT direct doit retourner 0 ligne :
--        SELECT * FROM qcm_questions LIMIT 1;
--        SELECT * FROM eleve_progression LIMIT 1;
--   2. fetch_qcm_for_eleve_secure avec un token valide → questions sans
--      `reponse_correcte`, `multi_reponses` boolean.
--   3. submit_qcm_secure avec p_answers vide → score=0, reussi=false.
--   4. save_progression_secure avec n'importe quels params → exception.
-- ══════════════════════════════════════════════════════════════════════════════
