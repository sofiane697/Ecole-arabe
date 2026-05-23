-- ══════════════════════════════════════════════════════════════════════════════
-- Migration — Nettoyage complet : orphelines + sessions expirées + durcissement
--
-- Contexte : audit complet de la base réalisé après le fix de l'observation
-- orpheline (cf. observations_enseignant_id_not_null.sql). L'audit a révélé :
--   • 1 retard sans enseignant_id dans `retards_absences` (orpheline)
--   • Des sessions expirées qui s'accumulent dans les 4 tables auth
--   • La colonne `retards_absences.enseignant_id` autorise toujours NULL
--
-- Cette migration nettoie tout ça et empêche que ça se reproduise.
--
-- Idempotente.
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Suppression des retards/absences orphelines (enseignant_id NULL ou cassé)
DELETE FROM public.retards_absences ra
WHERE ra.enseignant_id IS NULL
   OR NOT EXISTS (SELECT 1 FROM public.enseignants e WHERE e.id = ra.enseignant_id);

-- 2. Durcissement : enseignant_id ne peut plus être NULL
ALTER TABLE public.retards_absences
  ALTER COLUMN enseignant_id SET NOT NULL;

-- 3. Nettoyage des sessions expirées (les 4 tables auth)
DELETE FROM public.enseignant_auth_sessions WHERE expires_at < NOW();
DELETE FROM public.eleve_auth_sessions      WHERE expires_at < NOW();
DELETE FROM public.parent_sessions          WHERE expires_at < NOW();
DELETE FROM public.admin_sessions           WHERE expires_at < NOW();

-- ══════════════════════════════════════════════════════════════════════════════
-- Vérifications post-migration :
--   1. SELECT count(*) FROM retards_absences WHERE enseignant_id IS NULL; -- 0
--   2. SELECT is_nullable FROM information_schema.columns
--        WHERE table_schema='public' AND table_name='retards_absences'
--          AND column_name='enseignant_id';  -- 'NO'
--   3. SELECT count(*) FROM parent_sessions WHERE expires_at < NOW(); -- 0
-- ══════════════════════════════════════════════════════════════════════════════
