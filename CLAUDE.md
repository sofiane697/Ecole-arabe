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
    ├── App.jsx            # Composant principal — site public (Hero, Tarifs, Témoignages, Contact…)
    ├── data.js            # Données statiques (nav, cours, valeurs, contact)
    ├── hooks.js           # 3 hooks custom React
    ├── styles.js          # CSS complet injecté dynamiquement dans <head>
    ├── index.js           # Point d'entrée React + React Router (routes publiques, admin, portail)
    ├── admin/
    │   ├── AdminApp.jsx      # Layout admin — sidebar, topbar, Outlet (route protégée)
    │   ├── AdminLogin.jsx    # Page de connexion admin (Supabase Auth)
    │   ├── Dashboard.jsx     # Tableau de bord — 4 stats + 2 tableaux résumés
    │   ├── Inscriptions.jsx  # Pré-inscriptions — liste + panneau détail + statut
    │   ├── Messages.jsx      # Messages — liste + panneau de lecture
    │   ├── Eleves.jsx        # Gestion élèves — liste, création, fiche détail, progression
    │   ├── Cours.jsx         # Gestion cours — modules → niveaux → contenus + QCM
    │   ├── supabaseAdmin.js  # Fonctions API Supabase (auth, CRUD, storage, progression)
    │   ├── mockData.js       # Données fictives (backup)
    │   └── adminStyles.js    # CSS complet interface admin (thème sombre + clair)
    └── portail/
        ├── portailStyles.js     # CSS du portail élève
        ├── supabasePortail.js   # API Supabase côté élève (auth custom, progression)
        ├── PortailLogin.jsx     # /portail/login — connexion + changement mot de passe 1ère connexion
        ├── PortailApp.jsx       # Layout portail : sidebar + topbar + Outlet
        ├── PortailDashboard.jsx # Grille de modules avec barres de progression
        └── PortailModule.jsx    # Vue module : stepper niveaux + contenu + QCM
```

## Sections du site public (dans l'ordre)

1. **Nav** — logo, liens desktop, toggle dark/light, hamburger mobile
2. **Hero** (`#accueil`) — titre arabe + description + CTA + bouton "Mon portail"
3. **Présentation** (`#presentation`) — texte + compteurs animés + valeurs
4. **Tarifs** (`#tarifs`) — 3 cartes de niveaux + 1 carte Coran + carrousel mobile
5. **Témoignages** — section avis d'élèves (crédibilité / confiance)
6. **Contact** (`#contact`) — infos + formulaire connecté à Supabase
7. **Footer**

---

## Interface Administrateur

### Routes

| URL | Page | Description |
|-----|------|-------------|
| `/admin/login` | AdminLogin | Connexion email + mot de passe |
| `/admin` | Dashboard | Vue d'ensemble — stats + dernières inscriptions/messages |
| `/admin/inscriptions` | Inscriptions | Liste + panneau détail — stats, progression, changement de statut |
| `/admin/messages` | Messages | Liste + panneau de lecture — onglets filtres, marquer lu/non lu |
| `/admin/eleves` | Eleves | Liste élèves + création + fiche détail + progression par module |
| `/admin/cours` | Cours | CRUD drill-down : Modules → Niveaux → Contenus + QCM |

### Identifiants admin (Supabase Auth)

- **Email :** `admin@alnour.fr`
- **Mot de passe :** `Admin123!`
- **Accès :** `http://localhost:3000/admin/login`

### Authentification admin

Basée sur **Supabase Auth** (email + mot de passe).
- `AdminLogin.jsx` appelle `loginAdmin()` → Supabase Auth → token JWT stocké en `sessionStorage`
- `supabaseAdmin.js` : `authFetch()` wrapper avec auto-refresh du token (401 → refresh_token)
- Redirection automatique vers `/admin/login` si token expiré et refresh échoué

---

## Portail Élève (LMS) ✅ COMPLET

### Routes

| URL | Page | Description |
|-----|------|-------------|
| `/portail/login` | PortailLogin | Connexion identifiant + mot de passe |
| `/portail` | PortailDashboard | Grille des modules avec barre de progression |
| `/portail/module/:id` | PortailModule | Stepper niveaux + contenu (vidéo/PDF/texte) + QCM |

### Authentification élève (auth custom — PAS Supabase Auth)

- Pas de JWT, pas de Supabase Auth (incompatible ES256 sur plan gratuit)
- `login_eleve(p_email, p_password)` → fonction SQL SECURITY DEFINER avec bcrypt
- Session stockée dans `sessionStorage.eleve_user` = `{ id, nom, prenom, email, must_change_password }`
- Identifiant élève = `{1ère lettre prénom}{2e lettre nom}{1ère lettre nom}{4 chiffres}` ex: `SoJ7577`
- Email interne = `identifiant@eleve.alnour.fr` (jamais envoyé, juste clé unique en base)
- 1ère connexion → forcé à changer le mot de passe provisoire (min 8 car. + 1 chiffre + 1 spécial)

### Flux QCM (progression)

1. Élève sélectionne un module → voit les niveaux (Niveau 1 débloqué, reste verrouillé)
2. Élève consulte le contenu du niveau (vidéos YouTube, PDF, texte)
3. Élève clique "Passer le QCM" → questions à choix multiples (checkboxes, plusieurs bonnes réponses possibles)
4. Score ≥ score_requis (défaut 80%) → `reussi = true` → niveau suivant débloqué
5. Score < score_requis → possibilité de réessayer (tentatives comptées)

---

## Supabase — Configuration

### Projet

- **URL :** `https://nsdnzqdbpdncrksgxtar.supabase.co`
- **Clé anon :** `sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL`
- **Plan :** Gratuit (Nano) — région Irlande

### Tables

| Table | Usage | Accès anon | Accès authenticated |
|-------|-------|------------|---------------------|
| `inscriptions` | Pré-inscriptions (modal S'inscrire) | INSERT | SELECT, UPDATE |
| `messages` | Formulaire contact | INSERT | SELECT, UPDATE |
| `profils_eleves` | Comptes élèves (auth custom, bcrypt) | — | ALL |
| `modules` | Catégories de cours | SELECT (actif=true) | ALL |
| `niveaux` | Niveaux dans chaque module | SELECT | ALL |
| `contenus` | Contenu par niveau (video/pdf/texte) | SELECT | ALL |
| `qcm_questions` | Questions QCM (choix JSONB, reponse_correcte JSONB array) | SELECT | ALL |
| `eleve_progression` | Suivi progression élève | — | ALL |

### Schéma `profils_eleves`

| Colonne | Type | Défaut |
|---------|------|--------|
| `id` | UUID | gen_random_uuid() |
| `created_at` | TIMESTAMPTZ | NOW() |
| `nom` | TEXT | NOT NULL |
| `prenom` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL UNIQUE (= identifiant@eleve.alnour.fr) |
| `password_hash` | TEXT | NOT NULL (bcrypt) |
| `must_change_password` | BOOLEAN | TRUE |
| `actif` | BOOLEAN | TRUE |

### Fonctions SQL (SECURITY DEFINER)

| Fonction | Rôle | Appelée par |
|----------|------|-------------|
| `admin_create_user(p_email, p_password, p_nom, p_prenom)` | Crée un élève avec bcrypt | Admin (authenticated) |
| `login_eleve(p_email, p_password)` | Vérifie les identifiants, retourne JSON user | Portail (anon) |
| `change_eleve_password(p_id, p_old, p_new)` | Change le mot de passe | Portail (anon) |
| `save_progression(p_eleve_id, p_niveau_id, p_score, p_reussi)` | Upsert progression | Portail (anon) |
| `get_progression(p_eleve_id)` | Retourne progression élève | Portail (anon) |

### Storage Supabase

- **Bucket :** `Cours de coran` (public)
- **Usage :** Upload des fichiers PDF depuis l'admin → URL publique stockée dans `contenus.contenu`
- **Fonction :** `uploadPDF(file)` dans `supabaseAdmin.js`

---

## Variables CSS

### Admin (`adminStyles.js`, préfixe `--a-`)

| Variable | Dark | Light | Usage |
|----------|------|-------|-------|
| `--a-bg` | `#000000` | `#f5f5f7` | Fond principal |
| `--a-bg-card` | `#1c1c1e` | `#ffffff` | Fond des cartes |
| `--a-gold` | `#bf8a30` | *(inchangé)* | Accent principal |
| `--a-green` | `#30d158` | `#248a3d` | Succès / actif |
| `--a-blue` | `#0a84ff` | `#0071e3` | Info / contacté |
| `--a-red` | `#ff453a` | `#d70015` | Erreur / inactif |

### Portail (`portailStyles.js`, préfixe `--p-`)

| Variable | Dark | Light |
|----------|------|-------|
| `--p-bg` | `#000000` | `#f5f5f7` |
| `--p-bg-card` | `#1c1c1e` | `#ffffff` |
| `--p-gold` | `#bf8a30` | *(inchangé)* |
| `--p-green` | `#30d158` | `#248a3d` |
| `--p-sidebar-w` | `260px` | *(inchangé)* |

### Site public (`styles.js`)

| Variable | Light | Dark |
|----------|-------|------|
| `--bg` | `#ffffff` | `#000000` |
| `--fg` | `#1d1d1f` | `#f5f5f7` |
| `--gold` | `#bf8a30` | *(inchangé)* |

---

## Commandes

```bash
npm install   # installer les dépendances (à faire une fois)
npm start     # lancer en développement → http://localhost:3000
npm run build # build de production
```

---

## Plan d'amélioration admin

### Pack Élèves — ✅ Terminé
| # | Tâche | Statut |
|---|-------|--------|
| F1 | Réinitialiser le mot de passe d'un élève | ✅ |
| F2 | Modifier nom/prénom + téléphone + email de contact | ✅ |
| F3 | Supprimer un élève (avec confirmation) | ✅ |
| D1 | Recherche + filtres (actif/inactif) + tri dans la liste | ✅ |
| F4 | Export liste élèves en CSV (respecte les filtres actifs) | ✅ |
| D2 | Compteurs stats en haut de la page élèves | ⏭ Ignoré |

### Pack Cours — ⏳ En cours
| # | Tâche | Statut |
|---|-------|--------|
| F6 | Import questions QCM depuis CSV (avec modèle téléchargeable + aperçu) | ✅ |
| D5 | Aperçu miniature YouTube dans la modal contenu | ⬜ |
| D6 | Upload image de couverture pour les modules | ⬜ |

### Améliorations futures (non planifiées)
- D3 — Mini-barre de progression dans la carte élève
- D4 — Drag & drop pour réordonner modules/niveaux/contenus
- F5 — Dupliquer un module
- F7 — Tableau de bord de classe (vue croisée élèves × modules)

---

## Schéma `profils_eleves` (mis à jour)

| Colonne | Type | Défaut |
|---------|------|--------|
| `id` | UUID | gen_random_uuid() |
| `created_at` | TIMESTAMPTZ | NOW() |
| `nom` | TEXT | NOT NULL |
| `prenom` | TEXT | NOT NULL |
| `email` | TEXT | NOT NULL UNIQUE |
| `password_hash` | TEXT | NOT NULL (bcrypt) |
| `must_change_password` | BOOLEAN | TRUE |
| `actif` | BOOLEAN | TRUE |
| `telephone` | TEXT | NULL (optionnel) |
| `email_contact` | TEXT | NULL (optionnel, ex: parent) |

---

## Historique des modifications

- **Pack élèves admin** : F1 reset mot de passe (SQL `admin_reset_eleve_password` + modale confirmation + affichage identifiants + bouton WhatsApp), F2 modifier nom/prénom/téléphone/email contact, F3 supprimer élève avec confirmation, D1 recherche temps réel + filtres actif/inactif + tri, F4 export CSV avec BOM UTF-8.

- **Import QCM CSV** : bouton "⬆ Importer CSV" dans le tab QCM, modal avec guide visuel du format, téléchargement modèle pré-rempli, parsing robuste (guillemets, BOM, lignes vides), aperçu avant chargement, mode Remplacer/Ajouter, intégration directe dans le carrousel existant.

- **Auth custom élèves** : abandon de Supabase Auth pour les élèves (rate limit email + incompatibilité JWT ES256). Nouveau système : `password_hash` bcrypt dans `profils_eleves`, fonctions SQL SECURITY DEFINER, session dans `sessionStorage.eleve_user`.

- **LMS complet** : portail élève avec modules, niveaux, contenus (vidéo/PDF/texte), QCM multi-réponses, progression par niveau. Admin : gestion cours (drill-down Modules→Niveaux→Contenus+QCM) et gestion élèves (création, fiche, progression).

- **Upload PDF** : drag & drop dans la modal de contenu admin, stockage dans Supabase Storage (bucket "Cours de coran"), URL publique auto-remplie.

- **QCM carrousel** : éditeur carrousel dans l'admin (navigation entre questions, checkboxes pour plusieurs bonnes réponses). Colonne `reponse_correcte` migrée de INT à JSONB array.

- **JWT auto-refresh** : `authFetch()` dans `supabaseAdmin.js` relance automatiquement avec `refresh_token` en cas de 401.

- **Portail layout** : correction du layout (sidebar fixed + `display:block` au lieu de grid cassé). Topbar hauteur fixe 60px, `white-space:nowrap` sur la date.

- **Dark mode nav** : ajout de `html.dark .nav-btn { color: var(--fg-mid); }` dans `styles.js`.

- **Section Témoignages** : ajout entre Tarifs et Contact.

- **Interface Admin** : dashboard, inscriptions, messages avec design dark/light, sidebar navigation, Supabase Auth JWT.

- **Intégration Supabase** : formulaire contact → `messages`, modal pré-inscription → `inscriptions`, RLS configuré.

- **Refonte visuelle Apple + Oriental** : Inter + Scheherazade New + Cormorant Garamond, palette Apple, boutons pilules, glassmorphisme navbar.
