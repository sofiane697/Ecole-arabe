# CLAUDE.md — École Al-Nour

## Présentation du projet

Site vitrine one-page pour une école d'arabe fictive **"Al-Nour" (مدرسة النور)**.
Stack : **React 18** (Create React App), **React Router v6**, CSS-in-JS, aucune librairie UI externe.

## Structure des fichiers

```
Ecole-arabe/
├── public/
│   └── index.html
└── src/
    ├── App.jsx       # Composant principal — tout le rendu HTML (site public)
    ├── data.js       # Données statiques (nav, cours, valeurs, contact)
    ├── hooks.js      # 3 hooks custom React
    ├── styles.js     # CSS complet injecté dynamiquement dans <head>
    ├── index.js      # Point d'entrée React + React Router (routes publiques et admin)
    └── admin/
        ├── AdminApp.jsx      # Layout admin — sidebar, topbar, Outlet (route protégée)
        ├── AdminLogin.jsx    # Page de connexion admin (Supabase Auth)
        ├── Dashboard.jsx     # Tableau de bord — 4 stats + 2 tableaux résumés (Supabase)
        ├── Inscriptions.jsx  # Liste des pré-inscriptions — filtres, changement de statut (Supabase)
        ├── Messages.jsx      # Liste des messages — panneau de lecture, marquer lu/non lu (Supabase)
        ├── supabaseAdmin.js  # Fonctions API Supabase (fetch, update, login, logout)
        ├── mockData.js       # Données fictives (conservées comme backup)
        └── adminStyles.js    # CSS complet de l'interface admin (thème sombre)
```

## Sections du site public (dans l'ordre)

1. **Nav** — logo, liens desktop, toggle dark/light, hamburger mobile
2. **Hero** (`#accueil`) — titre arabe + description + CTA + motif SVG islamique
3. **Présentation** (`#presentation`) — texte + compteurs animés + valeurs
4. **Tarifs** (`#tarifs`) — 3 cartes de niveaux + 1 carte Coran + carrousel mobile
5. **Témoignages** — section avis d'élèves (crédibilité / confiance)
6. **Contact** (`#contact`) — infos + formulaire connecté à Supabase
7. **Footer**

## Interface Administrateur

### Routes

| URL | Page | Description |
|-----|------|-------------|
| `/admin/login` | AdminLogin | Connexion email + mot de passe |
| `/admin` | Dashboard | Vue d'ensemble — stats + dernières inscriptions/messages |
| `/admin/inscriptions` | Inscriptions | Tableau filtrable — statut : Nouveau → Contacté → Inscrit |
| `/admin/messages` | Messages | Tableau + panneau de lecture — marquer lu/non lu, répondre par email |

### Identifiants admin (Supabase Auth)

- **Email :** `admin@alnour.fr`
- **Mot de passe :** `Admin123!`
- **Accès :** `http://localhost:3000/admin/login` (à mettre en favori, aucun lien visible sur le site public)

### Authentification

Basée sur **Supabase Auth** (email + mot de passe).
- `AdminLogin.jsx` appelle `loginAdmin()` → Supabase Auth → token JWT stocké en `sessionStorage`
- `AdminApp.jsx` redirige vers `/admin/login` si non authentifié (clé `admin_auth` en sessionStorage)
- `supabaseAdmin.js` utilise le token JWT pour les requêtes authentifiées (lecture/modification)
- Les tables sont protégées par **Row Level Security** (RLS) :
  - `anon` → INSERT uniquement (formulaires publics)
  - `authenticated` → SELECT + UPDATE (admin connecté)

### Variables CSS admin

Définies dans `adminStyles.js`, préfixées `--a-` pour éviter les conflits :

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--a-bg` | `#0f0d0a` | Fond principal |
| `--a-bg-card` | `#1a1610` | Fond des cartes |
| `--a-gold` | `#b8862e` | Accent principal |
| `--a-green` | `#4caf7d` | Statut inscrit / lu |
| `--a-blue` | `#5b9bd5` | Statut contacté |
| `--a-red` | `#e05c5c` | Badges non lu / alertes |

## Fonctionnalités clés

- **Dark mode** — toggle ☀/☾, persisté en `localStorage`, transition CSS globale
- **Scroll reveal** — éléments `.sr` s'animent à l'entrée viewport (IntersectionObserver)
- **Section active** — lien nav surligné selon position de scroll (`useActiveSection`)
- **Compteurs animés** — décompte 0 → target quand visible (`useCounter`)
- **Carrousel mobile** — swipe tactile sur les cartes de tarifs (`CarouselCards`)
- **Modal pré-inscription** — formulaire nom/prénom/âge déclenché par bouton "S'inscrire"
- **Formulaire contact** — POST vers Supabase REST API
- **Interface admin** — dashboard, gestion inscriptions et messages (React Router `/admin/*`)

## Variables CSS (thème)

Définies dans `styles.js` :

| Variable     | Light       | Dark        |
|--------------|-------------|-------------|
| `--bg`       | `#f9f5ee`   | `#13100d`   |
| `--fg`       | `#2a2520`   | `#ede5d8`   |
| `--fg-mid`   | `#6b5d4f`   | `#a08870`   |
| `--fg-light` | `#9c8c7c`   | `#6b5d4f`   |
| `--gold`     | `#b8862e`   | *(inchangé)*|

## Supabase — Configuration

### Projet Supabase

- **URL :** `https://nsdnzqdbpdncrksgxtar.supabase.co`
- **ID projet :** `nsdnzqdbpdncrksgxtar`
- **Région :** UE occidentale (Irlande) — eu-ouest-1
- **Plan :** Gratuit (Nano)

### Tables

| Table | Usage | Accès anon | Accès authenticated |
|-------|-------|------------|---------------------|
| `inscriptions` | Pré-inscriptions (modal S'inscrire) | INSERT | SELECT, UPDATE |
| `messages` | Formulaire contact | INSERT | SELECT, UPDATE |

### Schéma `inscriptions`

| Colonne | Type | Défaut |
|---------|------|--------|
| `id` | BIGINT (auto) | Identity |
| `created_at` | TIMESTAMPTZ | NOW() |
| `nom` | TEXT | NOT NULL |
| `prenom` | TEXT | NOT NULL |
| `age` | INT | — |
| `annees_pratique` | INT | 0 |
| `cours` | TEXT | — |
| `statut` | TEXT | 'nouveau' |

### Schéma `messages`

| Colonne | Type | Défaut |
|---------|------|--------|
| `id` | BIGINT (auto) | Identity |
| `created_at` | TIMESTAMPTZ | NOW() |
| `nom` | TEXT | NOT NULL |
| `prenom` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL |
| `cours` | TEXT | — |
| `message` | TEXT | — |
| `lu` | BOOLEAN | FALSE |

### Flux de données

```
Site public (visiteur)
  ├── Formulaire contact  → POST /rest/v1/messages     (clé anon)
  └── Modal pré-inscription → POST /rest/v1/inscriptions (clé anon)

Admin (/admin)
  ├── Login → POST /auth/v1/token → JWT
  ├── Dashboard → GET inscriptions + messages (JWT)
  ├── Inscriptions → GET + PATCH statut (JWT)
  └── Messages → GET + PATCH lu (JWT)
```

## Cours proposés (data.js)

| Niveau | Nom                          | Prix      | Fréquence              |
|--------|------------------------------|-----------|------------------------|
| 1      | Débutant — Alphabet          | 35 €/mois | 1 séance/sem · 1h      |
| 2      | Intermédiaire — Lecture      | 55 €/mois | 2 séances/sem · 1h     |
| 3      | Avancé — Expression          | 75 €/mois | 2 séances/sem · 1h30   |
| Spé    | Lecture & Mémorisation Coran | 60 €/mois | 2 séances/sem · 1h     |

## Commandes

```bash
npm install   # installer les dépendances (à faire une fois)
npm start     # lancer en développement → http://localhost:3000
npm run build # build de production
```

## Prochaines étapes

1. ~~**Connecter Supabase**~~ ✅ Tables créées, formulaires branchés
2. ~~**Supabase Auth**~~ ✅ Login admin via Supabase Auth + JWT
3. ~~**Row Level Security**~~ ✅ RLS activé (anon=INSERT, authenticated=SELECT+UPDATE)
4. **Déploiement** — héberger le site (Vercel, Netlify…) avec les variables d'environnement
5. **Améliorations** — notifications email, export CSV inscriptions, stats par période

## Historique des modifications

- **Dark mode nav** : ajout de `html.dark .nav-btn { color: var(--fg-mid); }` dans `styles.js`
  pour améliorer la visibilité des liens du menu en mode sombre.

- **Icônes de contact** : remplacement des caractères Unicode abstraits (`◈ ◉ ◎ ◇ ♿`) dans `CONTACT_INFO`
  par des icônes SVG inline dans `App.jsx` (pin, téléphone, enveloppe, horloge, fauteuil roulant).
  Le champ `icon` de `data.js` n'est plus utilisé — les SVG sont injectés directement dans le `.map()`
  de la section Contact via l'index `i`. CSS `.info-icon` mis à jour dans `styles.js` (flex au lieu de font-size).

- **Section Témoignages** : ajout d'une section avis d'élèves entre les tarifs et le contact.

- **Interface Admin** : ajout d'un espace admin complet accessible via `/admin` avec :
  - Page de connexion (`/admin/login`)
  - Dashboard avec statistiques et résumés
  - Gestion des pré-inscriptions avec filtres et changement de statut
  - Gestion des messages avec panneau de lecture et réponse par email
  - Design dark theme cohérent avec le site, sidebar navigation
  - Routing via `react-router-dom` v6

- **Intégration Supabase** :
  - Clés API branchées dans `App.jsx` (site public) et `supabaseAdmin.js` (admin)
  - Formulaire contact → table `messages` (avant : allait dans `inscriptions`)
  - Modal pré-inscription → table `inscriptions` (avant : pas connectée)
  - Admin connecté à Supabase : lecture temps réel des inscriptions et messages
  - Authentification admin via Supabase Auth (email + mot de passe → JWT)
  - Row Level Security configuré sur les deux tables
