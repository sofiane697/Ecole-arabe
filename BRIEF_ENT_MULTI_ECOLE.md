# BRIEF ENT — MIGRATION MULTI-ÉCOLE & COMMERCIALISATION

> 📌 Ce document est destiné à Claude Code.
> Il résume l'état actuel du projet, les objectifs, les modifications à apporter
> et les décisions d'architecture déjà prises. Utilise-le pour générer un plan.md
> complet et structuré directement dans le projet.

---

## 1. ÉTAT ACTUEL DU PROJET

### Ce qui existe déjà (NE PAS TOUCHER)
- ✅ Landing page — terminée
- ✅ Portail administrateur — terminé
- ✅ Portail enseignant — terminé
- ✅ Portail élève — terminé
- ✅ Base de données Supabase — opérationnelle avec authentification fonctionnelle
- ✅ Connexions entre les portails et la base de données — fonctionnelles

### Stack technique
- Frontend : React (projet dans le sous-dossier "Ecole-arabe")
- Base de données : Supabase (PostgreSQL) — plan gratuit actuel
- Auth : Supabase Auth

### Problème actuel de la base de données
La base de données a été conçue pour **une seule école**.
Toutes les tables (élèves, enseignants, devoirs, classes, etc.)
n'ont **aucune notion d'école** — tout est implicitement rattaché
à l'École Arabe de Lyon.

Structure actuelle (exemple) :
```
Projet Supabase : "ENT-ecole-arabe"
├── eleves        (id, nom, prenom, classe, ...)
├── enseignants   (id, nom, matiere, ...)
├── devoirs       (id, titre, date, ...)
├── classes       (id, nom, ...)
└── ... (toutes sans school_id)
```

---

## 2. OBJECTIF PRINCIPAL

Transformer cet ENT mono-école en **produit SaaS multi-école**
commercialisable à d'autres établissements scolaires,
en priorité les **écoles privées hors contrat** (écoles religieuses,
Montessori, associatives) qui n'ont pas les moyens de payer
des solutions comme Pronote ou Skolengo.

### Modèle commercial cible
- Abonnement annuel par école
- 3 offres : Starter / Standard / Premium
- Paiement via Stripe (récurrent, factures automatiques)
- Onboarding en self-service (sans intervention manuelle)

---

## 3. DÉCISION D'ARCHITECTURE — MULTI-TENANT

### Option retenue : Row Level Security (RLS) avec school_id

**Principe :** Ajouter une colonne `school_id` à toutes les tables existantes
+ créer une table `schools` maîtresse + configurer les politiques RLS Supabase
pour que chaque école ne voie que ses propres données.

**Pourquoi cette option :**
- Standard SaaS moderne
- Supabase est nativement fait pour ça
- Une seule base de données pour toutes les écoles
- Scalable et maintenable

### Tables à créer

```sql
-- Table maîtresse des écoles
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE,           -- ex: "ecole-arabe-lyon"
  logo_url TEXT,
  email_contact TEXT,
  adresse TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Table des abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  stripe_subscription_id TEXT,
  plan TEXT,                  -- 'starter' | 'standard' | 'premium'
  status TEXT,                -- 'active' | 'trial' | 'past_due' | 'cancelled'
  current_period_end DATE,
  created_at TIMESTAMP DEFAULT now()
);
```

### Migration des tables existantes

Ajouter `school_id` à TOUTES les tables existantes :

```sql
ALTER TABLE eleves      ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE enseignants ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE devoirs      ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE classes      ADD COLUMN school_id UUID REFERENCES schools(id);
-- Répéter pour toutes les tables du projet
```

**⚠️ IMPORTANT — Zéro perte de données :**
Après avoir créé la table `schools` et inséré l'école actuelle,
remplir `school_id` sur toutes les lignes existantes avec l'UUID
de l'École Arabe de Lyon.

### Row Level Security (RLS)

Configurer les politiques RLS sur chaque table pour que
les utilisateurs ne voient que les données de leur école :

```sql
-- Exemple sur la table eleves
ALTER TABLE eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Isolation par école" ON eleves
  USING (school_id = (
    SELECT school_id FROM users WHERE id = auth.uid()
  ));
```

---

## 4. GESTION DES ACCÈS PAR ÉCOLE

### Approche retenue : même URL, isolation par school_id

Pas de sous-domaines au démarrage — une seule URL, l'application
détecte l'école de l'utilisateur via son `school_id` dans la table `users`.

### Flow de connexion
```
Utilisateur entre email + mot de passe
        ↓
Supabase Auth vérifie les credentials
        ↓
L'app lit school_id dans la table users
        ↓
Toutes les requêtes filtrent automatiquement par school_id (RLS)
        ↓
L'utilisateur voit uniquement les données de son école
```

### Table users enrichie
```sql
ALTER TABLE users ADD COLUMN school_id UUID REFERENCES schools(id);
ALTER TABLE users ADD COLUMN role TEXT; -- 'admin' | 'enseignant' | 'eleve' | 'parent'
```

---

## 5. ONBOARDING D'UNE NOUVELLE ÉCOLE

### Flow automatisé cible
```
1. École intéressée → visite la page de vente B2B
2. Choisit une offre
3. Paye via Stripe
4. Stripe webhook → création automatique dans table schools
5. Email envoyé à l'admin de l'école avec ses accès
6. L'admin configure lui-même : enseignants, classes, élèves
7. Renouvellement automatique chaque année
```

### Cas de la 2ème école (gratuite / école pilote)
```
1. Créer manuellement une ligne dans schools
2. Créer les comptes utilisateurs avec leur school_id
3. Envoyer les identifiants par email
4. L'admin configure son école
```

---

## 6. TABLEAU DE BORD SUPER-ADMIN (à créer)

Interface accessible uniquement par le propriétaire du produit (Sofiane)
pour gérer toutes les écoles clientes :

| Fonctionnalité | Description |
|---|---|
| Liste des écoles | Nom, plan, statut, date renouvellement, nb élèves |
| Statut abonnement | Actif / Impayé / Résilié |
| Création manuelle | Onboarder une école sans passer par Stripe |
| Statistiques | Revenus, taux de rétention, croissance |
| Accès école | Pouvoir se connecter en tant qu'admin d'une école |

---

## 7. INTÉGRATION STRIPE (phase ultérieure)

- Abonnements récurrents annuels ou mensuels
- Webhook Stripe → active/désactive l'accès selon le statut
- Factures automatiques envoyées aux écoles
- Période d'essai configurable (ex: 30 jours gratuits)
- Portail self-service pour que les écoles gèrent leur abonnement

---

## 8. ROADMAP PAR PHASES

### PHASE 1 — Stabilisation (en cours)
- [ ] Corriger les bugs existants sur les 4 portails
- [ ] Ajouter les nouvelles fonctionnalités prévues
- [ ] Tests complets avec l'école pilote (École Arabe de Lyon)

### PHASE 2 — Sauvegarde (avant toute migration)
- [ ] Export complet de la base de données (`backup_avant_migration.sql`)
- [ ] Sauvegarde en local + Google Drive
- [ ] Export après Phase 1 (`backup_apres_phase1.sql`)

### PHASE 3 — Migration multi-tenant
- [ ] Créer la table `schools`
- [ ] Créer la table `subscriptions`
- [ ] Ajouter `school_id` à toutes les tables
- [ ] Remplir `school_id` sur les données existantes
- [ ] Configurer le RLS sur toutes les tables
- [ ] Enrichir la table `users` avec `school_id` et `role`
- [ ] Adapter le code des portails pour filtrer par `school_id`

### PHASE 4 — Commercialisation
- [ ] Créer la page de vente B2B (différente de la landing page élèves)
- [ ] Intégrer Stripe
- [ ] Créer le tableau de bord super-admin
- [ ] Système d'onboarding automatisé
- [ ] Sous-domaines personnalisés (optionnel, phase avancée)

---

## 9. CONTRAINTES IMPORTANTES

### RGPD
- Données de mineurs → obligations strictes
- Chaque école doit signer une convention de traitement des données
- Hébergement en Europe obligatoire (Supabase EU ✅)
- Droit à l'effacement : prévoir la suppression complète d'une école

### Sécurité
- RLS activé sur toutes les tables sans exception
- Clés API Supabase jamais exposées côté client
- Service Role Key uniquement côté serveur
- Validation des données côté serveur

---

## 10. CE QUE CLAUDE CODE DOIT PRODUIRE

À partir de ce brief, générer :

1. **`plan.md`** — Plan de développement complet et structuré avec :
   - Toutes les tâches par phase
   - Ordre d'implémentation et dépendances
   - Fichiers à créer / modifier pour chaque tâche
   - Scripts SQL de migration complets

2. **`migration.sql`** — Script SQL complet pour :
   - Créer les nouvelles tables (`schools`, `subscriptions`)
   - Ajouter `school_id` à toutes les tables existantes
   - Remplir `school_id` sur les données existantes
   - Configurer toutes les politiques RLS

3. **Audit de la structure actuelle** — Identifier :
   - Toutes les tables qui nécessitent `school_id`
   - Les relations à mettre à jour
   - Les requêtes dans le code à adapter
