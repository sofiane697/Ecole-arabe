# Audit — Portail Parent

**Date** : 2026-05-08
**Scorecard** : Sécurité 3/10 · Robustesse 6/10 · Cohérence DB 5/10 · **Isolation parent↔enfant 2/10**

## Résumé exécutif

Le design serveur du portail parent est **solide en intention** (token de session opaque, RPC SECURITY DEFINER avec vérification d'ownership via `_parent_owns_eleve`, `parent_sessions` verrouillée avec `USING(false)`, rate-limit déclarations, escape HTML dans les emails). Le frontend est cohérent avec les autres portails et ne stocke pas l'`id` parent. Cependant, **plusieurs failles critiques RGPD subsistent**, principalement dues au pattern « RLS ouvert anon » du projet appliqué tel quel à des tables qui contiennent des PII de mineurs et de parents :

1. **Fuite PII massive** : `parents` lisible par anon (nom, email, téléphone, **hash bcrypt**, `must_change_password`, `actif`).
2. **Self-link arbitraire enfant↔parent** : n'importe qui peut INSERT une ligne `parent_eleves` arbitraire et accéder ensuite via login parent à tous les enfants de l'école.
3. **Conflit de signature `_parent_owns_eleve`** entre les deux migrations (RETURNS UUID dans `parents_migration.sql`, RETURNS BOOLEAN dans `declarations_parents_migration.sql`).
4. **Bypass `must_change_password`** : `login_parent` retourne un `session_token` même si `must_change_password=true`.
5. **Photos d'élèves servies en URL publique non signée** (donnée biométrique de mineur).

---

## CRITIQUE

### C1. Table `parents` lisible/modifiable par `anon` — fuite PII massive
- [supabase/sql/parents_migration.sql:92](../supabase/sql/parents_migration.sql#L92)
- Policy `parents_all_anon` : `FOR ALL TO anon USING (true) WITH CHECK (true)`. Clé anon dans le bundle JS.
- **Impact** : violation RGPD massive (liste nominative de parents), exposition des hashes bcrypt (offline cracking), désactivation arbitraire d'un compte, takeover.
- **Correction** : `USING (false) WITH CHECK (false)` + RPCs SECURITY DEFINER existantes.

### C2. `parent_eleves` lisible/écrivable par `anon` — self-link enfant arbitraire
- [supabase/sql/parents_migration.sql:97](../supabase/sql/parents_migration.sql#L97)
- Un attaquant qui crée un compte parent (ou via C1) peut faire `POST /rest/v1/parent_eleves` avec son `parent_id` et un `eleve_id` quelconque.
- **Impact** : accès aux notes/appréciations/devoirs/absences/déclarations de **n'importe quel élève**. RGPD critique sur mineurs.
- **Correction** : `USING (false) WITH CHECK (false)` ; tout passage par les RPC admin existantes.

### C3. Conflit de signatures `_parent_owns_eleve` — RPC parent cassées après exécution combinée
- [supabase/sql/parents_migration.sql:471](../supabase/sql/parents_migration.sql#L471) (RETURNS UUID), [supabase/sql/declarations_parents_migration.sql:63](../supabase/sql/declarations_parents_migration.sql#L63) (RETURNS BOOLEAN)
- `CREATE OR REPLACE FUNCTION` ne peut pas changer le type de retour → le bloc `DROP FUNCTION CASCADE` (lignes 12-30 de la 2ᵉ migration) supprime accidentellement les RPC dépendantes.
- **Impact** : RPC critiques disparaissent silencieusement, idempotence cassée.
- **Correction** : une seule définition canonique de `_parent_owns_eleve` dans une migration partagée.

### C4. `must_change_password` non appliqué côté serveur
- [supabase/sql/parents_migration.sql:135](../supabase/sql/parents_migration.sql#L135), [src/parent/ParentLogin.jsx:171](../src/parent/ParentLogin.jsx#L171)
- `login_parent` crée un `session_token` quel que soit `must_change_password`. Aucune RPC `fetch_*_for_parent` ne vérifie ce flag.
- **Correction** : `_resolve_parent_session` ou chaque fetch RPC doit `RAISE EXCEPTION` si `parents.must_change_password = true`.

### C5. Données nominatives mineurs accessibles via clé anon (transversal)
- [src/parent/supabaseParent.js:5](../src/parent/supabaseParent.js#L5)
- Tant que `notes`, `evaluations`, `observations`, `retards_absences`, `devoirs`, `classes` sont en RLS ouvert, le contenu RGPD est accessible HORS portail parent.

---

## MAJEUR

### M1. Photos d'élèves servies via URL publique non signée
- [supabase/functions/eleve-photo/index.ts:164](../supabase/functions/eleve-photo/index.ts#L164)
- Bucket public, donnée biométrique de mineur.
- **Correction** : bucket privé + URLs signées de courte durée.

### M2. `parent_user` (sessionStorage) contient des PII non strictement nécessaires
- [src/parent/supabaseParent.js:58](../src/parent/supabaseParent.js#L58)
- `pere_nom`, `pere_prenom`, `mere_nom`, `mere_prenom`, `email`, `telephone`.
- **Correction** : stocker uniquement le `session_token`, relire via RPC `fetch_parent_self()`.

### M3. `session_token` valide 7 jours sans rotation, sans renouvellement
- [supabase/sql/parents_migration.sql:79](../supabase/sql/parents_migration.sql#L79)
- Pas d'invalidation au changement de mot de passe ni au reset admin.

### M4. Aucune limite de tentatives de login (brute force `login_parent`)
- [supabase/sql/parents_migration.sql:135](../supabase/sql/parents_migration.sql#L135)

### M5. `parent_eleves.lien` libre, écrit côté admin sans whitelist serveur
- [supabase/sql/parents_migration.sql:63](../supabase/sql/parents_migration.sql#L63), [src/admin/EleveParentsSection.jsx:19](../src/admin/EleveParentsSection.jsx#L19)
- `CHECK (lien IN ('parents','tuteur','grand-parent','autre'))`.

### M6. `fetch_devoirs_for_parent` n'a pas de fenêtre temporelle
- [supabase/sql/parents_migration.sql:562](../supabase/sql/parents_migration.sql#L562)

### M7. `fetch_notes_for_parent` retourne aussi les notes d'évaluations désactivées
- [supabase/sql/parents_migration.sql:497](../supabase/sql/parents_migration.sql#L497)

### M8. `localStorage parent_theme` partagé entre parents sur poste partagé
- [src/parent/ParentApp.jsx:142](../src/parent/ParentApp.jsx#L142)

### M9. Pas de purge de `parent_selected_eleve_id` au changement d'enfants
- [src/parent/ParentContext.jsx:33](../src/parent/ParentContext.jsx#L33)

### M10. `must_change_password` mis à `false` côté client avant confirmation serveur
- [src/parent/supabaseParent.js:80-85](../src/parent/supabaseParent.js#L80)

### M11. `loginParent` lowercase l'identifiant côté client mais pas côté serveur
- [src/parent/ParentLogin.jsx:170](../src/parent/ParentLogin.jsx#L170), [parents_migration.sql:159](../supabase/sql/parents_migration.sql#L159)

### M12. Pas de vérification de l'`actif` du parent à chaque RPC data
- [supabase/sql/parents_migration.sql:198](../supabase/sql/parents_migration.sql#L198)
- Désactivation lente jusqu'à 7j (durée du token).

---

## MINEUR

### m1. `todayISO()` utilise UTC, mismatch avec `CURRENT_DATE` serveur
- [src/shared/dateUtils.js:2](../src/shared/dateUtils.js#L2), [src/parent/ParentAbsences.jsx:94](../src/parent/ParentAbsences.jsx#L94)

### m2. Tri `enfants` sur `prenom, nom` au lieu de `nom, prenom`
- [supabase/sql/parents_migration.sql:460](../supabase/sql/parents_migration.sql#L460)

### m3. `EnfantSelector` ne réagit pas aux changements de la liste pendant que le dropdown est ouvert
- [src/parent/ParentApp.jsx:23](../src/parent/ParentApp.jsx#L23)

### m4. Pagination absente sur les pages parent
- [src/parent/ParentNotes.jsx:13](../src/parent/ParentNotes.jsx#L13), [ParentObservations.jsx:19](../src/parent/ParentObservations.jsx#L19), [ParentDevoirs.jsx:34](../src/parent/ParentDevoirs.jsx#L34), [ParentAbsences.jsx:194](../src/parent/ParentAbsences.jsx#L194)

### m5. Code dupliqué entre portail élève et portail parent
- [src/parent/ParentDevoirs.jsx](../src/parent/ParentDevoirs.jsx), [ParentNotes.jsx](../src/parent/ParentNotes.jsx), [ParentObservations.jsx](../src/parent/ParentObservations.jsx)
- Composants partagés `<DevoirCard>`, `<NoteCard>`, `<ObsCard>` recommandés.

### m6. Pas de cache + revalidation (4 RPCs en parallèle au montage)
- [src/parent/ParentDashboard.jsx:53](../src/parent/ParentDashboard.jsx#L53)

### m7. Message d'erreur réseau exposé en UI
- [src/parent/supabaseParent.js:57](../src/parent/supabaseParent.js#L57)

### m8. `feedback` après création de déclaration n'est pas annulé si l'utilisateur quitte
- [src/parent/ParentAbsences.jsx:215](../src/parent/ParentAbsences.jsx#L215)

### m9. RPC admin référencées mais SQL absent du dépôt
- [src/admin/supabaseAdmin.js:941](../src/admin/supabaseAdmin.js#L941)
- `admin_fetch_parents_paginated`, `admin_create_parent_standalone`, `admin_update_parent`, `admin_delete_parent`, `admin_fetch_eleves_of_parent`, `admin_fetch_parents_of_eleve`, `admin_unlink_parent_eleve`.

### m10. `getParentInitials` à auditer pour cohérence (pas de bug réel)
- [src/admin/Parents.jsx:221](../src/admin/Parents.jsx#L221)

### m11. `parent_user` non validé/parsé strictement à la lecture
- [src/parent/supabaseParent.js:39](../src/parent/supabaseParent.js#L39)

### m12. Tests manquants pour les RPC data autres que `declarations`
- [src/parent/supabaseParent.declarations.test.js](../src/parent/supabaseParent.declarations.test.js)

### m13. `fetch_parent_enfants` expose des champs non utilisés (`niveau_scolaire_id`, `date_naissance`)
- [supabase/sql/parents_migration.sql:434](../supabase/sql/parents_migration.sql#L434), [parents_migration.sql:439](../supabase/sql/parents_migration.sql#L439)

### m14. `change_parent_password` ne vérifie pas la complexité côté serveur
- [supabase/sql/parents_migration.sql:219](../supabase/sql/parents_migration.sql#L219)

### m15. Mode strict React 18 : `useEffect` deux passes peut envoyer 2× certaines RPC
- [src/parent/ParentContext.jsx:42](../src/parent/ParentContext.jsx#L42)

### m16. Le bouton "Déclarer" déjà bien protégé (early-return + masquage UI)
- [src/parent/ParentAbsences.jsx:238](../src/parent/ParentAbsences.jsx#L238) — RAS.

### m17. `lien` du parent affiché brut dans portail parent (sans `formatLien`)
- [src/parent/ParentApp.jsx](../src/parent/ParentApp.jsx)

### m18. `ParentDevoirs` `aVenir` filter cohérent
- [src/parent/ParentDevoirs.jsx:21](../src/parent/ParentDevoirs.jsx#L21) — RAS.

### m19. Aucun mécanisme de "se souvenir de moi"
- [src/parent/supabaseParent.js:37](../src/parent/supabaseParent.js#L37)

---

## Verdict

Le portail parent a été conçu avec une posture de sécurité plus mature que le reste du projet (token opaque, RPC SECURITY DEFINER, rate-limit déclarations) mais **hérite du pattern « anon=ALL »** qui détruit ces garanties dès la 1ʳᵉ table. Avant mise en production, **fermer C1, C2, C3 et C4 est non-négociable** pour la conformité RGPD vis-à-vis des données de mineurs et de leurs parents.
