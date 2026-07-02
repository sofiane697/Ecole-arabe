-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Sécurisation des dernières RPCs admin sans token (audit P2)
--
-- Avant cette migration, 5 RPCs SECURITY DEFINER accessibles avec la clé anon
-- publique n'exigeaient AUCUNE authentification :
--   • admin_reset_eleve_password(uuid, text)      → prise de contrôle de compte élève
--   • admin_reset_enseignant_password(uuid, text) → prise de contrôle de compte enseignant
--   • admin_create_enseignant(uuid, text, text)   → détournement d'un enseignant existant
--   • admin_create_user(text, text, text, text)   → création illimitée de comptes élèves actifs
--   • admin_update_eleve_niveau_scolaire(uuid, uuid)
--
-- Toutes sont recréées avec `p_admin_token` en 1er paramètre + garde `_is_admin`,
-- conformément à la règle Phase 3 (admin_sessions_phase3.sql). Les anciennes
-- signatures sont supprimées (le trou est fermé, pas seulement doublé).
-- On supprime aussi l'overload legacy admin_create_contenu(uuid, jsonb) (phase 2),
-- la variante token étant déjà en production.
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Suppression des signatures non authentifiées ────────────────────────
DROP FUNCTION IF EXISTS public.admin_create_user(text, text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_eleve_niveau_scolaire(uuid, uuid);
DROP FUNCTION IF EXISTS public.admin_reset_eleve_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_reset_enseignant_password(uuid, text);
DROP FUNCTION IF EXISTS public.admin_create_enseignant(uuid, text, text);
DROP FUNCTION IF EXISTS public.admin_create_contenu(uuid, jsonb);

-- ─── 2. Recréation token-gated (comportement inchangé par ailleurs) ─────────

-- Création d'un compte élève (bcrypt, must_change_password, actif par défaut).
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_admin_token text, p_identifiant text, p_password text, p_nom text, p_prenom text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
DECLARE v_id UUID := gen_random_uuid();
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  INSERT INTO profils_eleves (id, identifiant, password_hash, nom, prenom, must_change_password, actif)
  VALUES (v_id, lower(trim(p_identifiant)), extensions.crypt(p_password, extensions.gen_salt('bf')), p_nom, p_prenom, true, true);
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_user(text, text, text, text, text) TO anon, authenticated;

-- Modification du niveau scolaire d'un élève.
CREATE OR REPLACE FUNCTION public.admin_update_eleve_niveau_scolaire(
  p_admin_token text, p_id uuid, p_niveau_scolaire_id uuid
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE public.profils_eleves SET niveau_scolaire_id = p_niveau_scolaire_id WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_update_eleve_niveau_scolaire(text, uuid, uuid) TO anon, authenticated;

-- Réinitialisation du mot de passe d'un élève.
CREATE OR REPLACE FUNCTION public.admin_reset_eleve_password(
  p_admin_token text, p_id uuid, p_new_password text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE profils_eleves
  SET password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      must_change_password = true
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reset_eleve_password(text, uuid, text) TO anon, authenticated;

-- Réinitialisation du mot de passe d'un enseignant.
CREATE OR REPLACE FUNCTION public.admin_reset_enseignant_password(
  p_admin_token text, p_id uuid, p_new_password text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE enseignants SET
    password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    must_change_password = TRUE
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_reset_enseignant_password(text, uuid, text) TO anon, authenticated;

-- Attribution des identifiants (compte auth) d'un enseignant existant.
CREATE OR REPLACE FUNCTION public.admin_create_enseignant(
  p_admin_token text, p_id uuid, p_identifiant text, p_password text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  IF NOT public._is_admin(p_admin_token) THEN RAISE EXCEPTION 'Accès refusé : session admin requise'; END IF;
  UPDATE enseignants SET
    identifiant = lower(p_identifiant),
    password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
    must_change_password = TRUE
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_enseignant(text, uuid, text, text) TO anon, authenticated;
