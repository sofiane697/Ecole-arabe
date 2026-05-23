-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Durcir observations.enseignant_id en NOT NULL
--
-- Contexte : une observation orpheline (« test », enseignant_id NULL) avait été
-- créée hors de la RPC `create_observation_secure` (probablement avant le
-- lockdown RLS), ce qui empêchait son propriétaire de la modifier/supprimer
-- depuis le portail enseignant (le bouton "Modifier →" est conditionné par
-- `obs.enseignant_id === user.id`).
--
-- Cette migration :
--   1. Supprime les éventuelles observations orphelines restantes (filet de
--      sécurité — le DELETE explicite côté admin a déjà été fait avant la
--      migration, mais on garde cette étape pour rendre l'ALTER possible
--      si la migration est rejouée sur une autre base).
--   2. Pose la contrainte NOT NULL sur `enseignant_id`.
--
-- La RPC `create_observation_secure` insère déjà toujours `v_ens` (résolu
-- depuis le token), donc le code applicatif est cohérent avec cette contrainte.
--
-- Idempotente.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Nettoyage des éventuelles orphelines
DELETE FROM public.observations WHERE enseignant_id IS NULL;

-- 2. Contrainte NOT NULL (idempotent : ALTER ne lève pas d'erreur si déjà NOT NULL)
ALTER TABLE public.observations
  ALTER COLUMN enseignant_id SET NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications :
--   SELECT is_nullable FROM information_schema.columns
--     WHERE table_schema='public' AND table_name='observations'
--       AND column_name='enseignant_id';  -- doit retourner 'NO'
-- ══════════════════════════════════════════════════════════════════════════════
