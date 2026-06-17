-- Migration — Suppression de classe/niveau bloquée par des FK NO ACTION
-- retards_absences, observations, evaluations référençaient classes(id) sans
-- cascade → la suppression d'une classe (et donc d'un niveau) échouait.
-- On passe ces 3 FK en ON DELETE CASCADE. La chaîne evaluations → notes →
-- note_accusations_reception est déjà en cascade.
-- Appliquée en production le 2026-06-17.

ALTER TABLE public.retards_absences DROP CONSTRAINT fk_retards_absences_classe;
ALTER TABLE public.retards_absences
  ADD CONSTRAINT fk_retards_absences_classe FOREIGN KEY (classe_id)
  REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.observations DROP CONSTRAINT fk_observations_classe;
ALTER TABLE public.observations
  ADD CONSTRAINT fk_observations_classe FOREIGN KEY (classe_id)
  REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.evaluations DROP CONSTRAINT fk_evaluations_classe;
ALTER TABLE public.evaluations
  ADD CONSTRAINT fk_evaluations_classe FOREIGN KEY (classe_id)
  REFERENCES public.classes(id) ON DELETE CASCADE;
