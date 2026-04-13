# plan.md — Migration Multi-École & Commercialisation
# Institut As-Safaa ENT → SaaS

> Généré à partir de `BRIEF_ENT_MULTI_ECOLE.md`
> Date : 2026-04-10

---

## AUDIT — Structure actuelle de la base de données

### Tables identifiées (21 tables + fonctions RPC)

| Table | Colonnes clés | Besoin school_id |
|---|---|---|
| `inscriptions` | id, statut, email, created_at | ✅ Oui |
| `messages` | id, lu, contenu, created_at | ✅ Oui |
| `profils_admins` | id, identifiant, password_hash | ✅ Oui |
| `modules` | id, titre, actif, ordre | ✅ Oui |
| `thematiques` | id, module_id, titre, ordre, niveaux_scolaires_ids | ✅ Oui |
| `lecons` | id, thematique_id, titre, ordre | ✅ Oui (cascade via thematiques) |
| `niveaux` | id, module_id, thematique_id, lecon_id, ordre | ✅ Oui |
| `contenus` | id, niveau_id, titre, ordre | ✅ Oui (cascade via niveaux) |
| `qcm_questions` | id, niveau_id, question, ordre | ✅ Oui (cascade via niveaux) |
| `niveaux_scolaires` | id, nom, ordre | ✅ Oui |
| `classes` | id, niveau_id, nom | ✅ Oui |
| `profils_eleves` | id, nom, prenom, identifiant, classe_id, niveau_scolaire_id, actif | ✅ Oui |
| `enseignants` | id, nom, prenom, identifiant, password_hash | ✅ Oui |
| `enseignant_classes` | enseignant_id, classe_id | ✅ Oui |
| `eleve_progression` | eleve_id, niveau_id, score, reussi | ✅ Oui |
| `chat_messages` | eleve_id, enseignant_id, contenu, sender_role, lu | ✅ Oui |
| `devoirs` | enseignant_id, classe_id, titre, date_limite | ✅ Oui |
| `evaluations` | classe_id, titre, date_evaluation, score_max | ✅ Oui |
| `notes` | evaluation_id, eleve_id, score, absent | ✅ Oui |
| `observations` | classe_id, enseignant_id, eleve_id, type, contenu | ✅ Oui |
| `retards_absences` | classe_id, eleve_id, type, date | ✅ Oui |

### Fonctions RPC à mettre à jour (Phase 3)

| Fonction | Action requise |
|---|---|
| `login_admin_custom` | Ajouter school_id dans le retour |
| `login_eleve` | Ajouter school_id dans le retour |
| `login_enseignant` | Ajouter school_id dans le retour |
| `admin_create_user` | Prendre p_school_id en paramètre |
| `admin_create_enseignant` | Prendre p_school_id en paramètre |
| `admin_reset_eleve_password` | Inchangée (filtre par id) |
| `admin_reset_enseignant_password` | Inchangée (filtre par id) |
| `get_progression` | Inchangée (filtre par eleve_id, RLS suffira) |
| `save_progression` | Inchangée |
| `get_eleve_niveau_scolaire` | Inchangée |
| `change_eleve_password` | Inchangée |
| `change_enseignant_password` | Inchangée |

### Fichiers frontend à adapter (Phase 3)

| Fichier | Modification |
|---|---|
| `src/admin/supabaseAdmin.js` | Passer school_id dans createEleve, createEnseignant, fetchEleves, fetchEnseignants, etc. |
| `src/enseignant/supabaseEnseignant.js` | Filtrer par school_id dans fetchMesClasses, fetchEvaluationsClasse, etc. |
| `src/portail/supabasePortail.js` | school_id transmis via session élève |
| `src/admin/AdminApp.jsx` | Lire school_id depuis la session admin |
| `src/enseignant/EnseignantApp.jsx` | Lire school_id depuis la session enseignant |
| `src/portail/PortailApp.jsx` | Lire school_id depuis la session élève |

---

## PHASE 1 — Stabilisation (en cours)

> Objectif : Corriger tous les bugs et finaliser les fonctionnalités existantes avant toute migration.
> État actuel : Portails admin, enseignant, élève opérationnels. Système de notes par lettres implémenté.

### Tâches Phase 1

- [ ] **1.1** Tests complets des 4 portails avec l'école pilote (Institut As-Safaa)
- [ ] **1.2** Vérifier que l'email de bienvenue (Edge Function Resend) fonctionne
- [ ] **1.3** Vérifier les cas limites : élève sans classe, enseignant sans classe assignée
- [ ] **1.4** Valider le système de notes par lettres (A+/A/ECA/NA) côté enseignant ET élève
- [ ] **1.5** Documenter les identifiants de test dans un fichier sécurisé (hors git)

---

## PHASE 2 — Sauvegarde (AVANT toute migration DB)

> ⚠️ CRITIQUE — Ne jamais commencer la Phase 3 sans cette sauvegarde.

### Tâches Phase 2

- [ ] **2.1** Exporter la base Supabase via Dashboard → Settings → Database → Backups
  - Fichier cible : `backup_avant_migration_YYYYMMDD.sql`
  - Stocker dans Google Drive + local
- [ ] **2.2** Snapshot Git : créer un tag `v1.0-mono-ecole` avant les changements multi-tenant
  ```bash
  git tag v1.0-mono-ecole
  git push origin v1.0-mono-ecole
  ```
- [ ] **2.3** Noter l'UUID de l'école pilote après création de la table `schools`
  - Stocker dans `.env.local` (jamais commité) : `REACT_APP_PILOT_SCHOOL_ID=<uuid>`

---

## PHASE 3 — Migration Multi-Tenant

> Ordre strict à respecter pour éviter toute perte de données.

### Étape 3.1 — Créer les nouvelles tables

Fichier : `migration.sql` (section 1)

- [ ] Créer table `schools`
- [ ] Créer table `subscriptions`
- [ ] Insérer l'école pilote Institut As-Safaa dans `schools`

### Étape 3.2 — Ajouter school_id à toutes les tables

Fichier : `migration.sql` (section 2)

- [ ] ALTER TABLE sur les 21 tables (colonne nullable dans un premier temps)
- [ ] UPDATE pour remplir school_id sur toutes les lignes existantes
- [ ] ALTER TABLE pour passer school_id NOT NULL après le remplissage

### Étape 3.3 — Enrichir la table users / profils

Fichier : `migration.sql` (section 3)

- [ ] Ajouter `school_id` + `role` à `profils_admins`, `profils_eleves`, `enseignants`
- [ ] Remplir school_id sur les utilisateurs existants

### Étape 3.4 — Configurer le RLS

Fichier : `migration.sql` (section 4)

- [ ] Activer RLS sur chaque table
- [ ] Créer les politiques `SELECT`, `INSERT`, `UPDATE`, `DELETE` pour chaque table
- [ ] Tester que l'école A ne voit pas les données de l'école B

### Étape 3.5 — Adapter les fonctions RPC

Fichier : `migration.sql` (section 5) + Supabase SQL Editor

- [ ] Modifier `login_admin_custom` → retourne `school_id`
- [ ] Modifier `login_eleve` → retourne `school_id`
- [ ] Modifier `login_enseignant` → retourne `school_id`
- [ ] Modifier `admin_create_user` → prend `p_school_id`
- [ ] Modifier `admin_create_enseignant` → prend `p_school_id`

### Étape 3.6 — Adapter le code frontend

Fichiers : `supabaseAdmin.js`, `supabaseEnseignant.js`, `supabasePortail.js`

- [ ] **3.6.1** `supabaseAdmin.js` : passer `school_id` dans toutes les requêtes INSERT
- [ ] **3.6.2** `supabaseEnseignant.js` : idem
- [ ] **3.6.3** `supabasePortail.js` : idem
- [ ] **3.6.4** Les sessions (`sessionStorage`) stockent déjà le profil utilisateur → ajouter `school_id` dans le retour des fonctions login

### Étape 3.7 — Tests d'isolation multi-école

- [ ] Créer une 2ème école de test dans Supabase
- [ ] Créer un admin, un enseignant, un élève pour cette 2ème école
- [ ] Vérifier que chaque utilisateur ne voit QUE les données de son école
- [ ] Vérifier que les requêtes sans `school_id` sont bien bloquées par le RLS

---

## PHASE 4 — Commercialisation

> À démarrer une fois la Phase 3 validée et testée.

### Étape 4.1 — Page de vente B2B

Fichiers à créer : `src/landing/LandingB2B.jsx`, route `/pro`

- [ ] Hero section : "L'ENT pour les écoles indépendantes"
- [ ] Tableau comparatif : Starter / Standard / Premium
- [ ] Section témoignages (école pilote)
- [ ] CTA → formulaire de contact ou Stripe Checkout
- [ ] Page légale : CGV, Politique de confidentialité, DPA (RGPD)

### Étape 4.2 — Intégration Stripe

Fichiers à créer : `supabase/functions/stripe-webhook/index.ts`

- [ ] Créer les produits dans le dashboard Stripe (Starter/Standard/Premium, annuel)
- [ ] Edge Function `stripe-webhook` :
  - Événement `checkout.session.completed` → créer l'entrée dans `schools` + `subscriptions`
  - Événement `invoice.paid` → renouveler l'abonnement
  - Événement `customer.subscription.deleted` → désactiver l'accès
- [ ] Page Stripe Checkout intégrée dans la landing B2B
- [ ] Email de bienvenue déclenché par le webhook

### Étape 4.3 — Tableau de bord Super-Admin

Fichiers à créer : `src/superadmin/SuperAdminApp.jsx`, route `/superadmin`

- [ ] Auth super-admin (identifiant dédié, table séparée)
- [ ] Liste des écoles : nom, plan, statut, nb élèves, renouvellement
- [ ] Création manuelle d'une école (onboarding école pilote / test)
- [ ] Statistiques : MRR, nb écoles actives, taux churn
- [ ] Impersonation : accès en tant qu'admin d'une école

### Étape 4.4 — Système d'onboarding automatisé

- [ ] Formulaire d'inscription école : nom, contact, adresse
- [ ] Page de configuration initiale post-paiement :
  - Créer les classes
  - Importer les élèves (CSV)
  - Ajouter les enseignants
- [ ] Guide de démarrage interactif (checklist dans l'interface admin)

### Étape 4.5 — Sous-domaines (optionnel, phase avancée)

- [ ] Configuration DNS wildcard : `*.assafaa-ent.fr`
- [ ] Middleware Next.js ou Vercel rewrites pour router `ecole-x.assafaa-ent.fr`
- [ ] Stocker `slug` dans la table `schools` et l'utiliser pour identifier l'école

---

## Contraintes RGPD

- [ ] Rédiger la Politique de confidentialité (traitement données mineurs)
- [ ] Convention DPA (Data Processing Agreement) à faire signer à chaque école
- [ ] Implémenter la suppression complète d'une école (cascade sur toutes les tables)
- [ ] Vérifier hébergement Supabase EU (région `eu-central-1` — Frankfurt ✅)
- [ ] Log des accès aux données sensibles

---

## Dépendances entre phases

```
Phase 1 → Phase 2 → Phase 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6 → 3.7 → Phase 4
                                  ↑
                        (ne jamais sauter 2 → 3)
```

---

## Fichiers à créer / modifier par phase

### Phase 3
| Action | Fichier |
|---|---|
| CRÉER | `migration.sql` |
| MODIFIER | `src/admin/supabaseAdmin.js` |
| MODIFIER | `src/enseignant/supabaseEnseignant.js` |
| MODIFIER | `src/portail/supabasePortail.js` |
| MODIFIER | `src/admin/AdminApp.jsx` (lecture school_id session) |
| MODIFIER | `src/enseignant/EnseignantApp.jsx` |
| MODIFIER | `src/portail/PortailApp.jsx` |

### Phase 4
| Action | Fichier |
|---|---|
| CRÉER | `src/landing/LandingB2B.jsx` |
| CRÉER | `src/superadmin/SuperAdminApp.jsx` |
| CRÉER | `supabase/functions/stripe-webhook/index.ts` |
| MODIFIER | `src/App.jsx` (nouvelles routes) |
| MODIFIER | `src/admin/AdminApp.jsx` (checklist onboarding) |
