# CLAUDE.md — Raqib (رقيب)

## Présentation du projet

Site vitrine one-page pour une école d'arabe **"Raqib" (رقيب)**.
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
    ├── index.js           # Point d'entrée React + React Router (routes publiques, admin, portail, enseignant)
    ├── admin/
    │   ├── AdminApp.jsx      # Layout admin — sidebar, topbar, Outlet (route protégée)
    │   ├── AdminLogin.jsx    # Page de connexion admin
    │   ├── Dashboard.jsx     # Tableau de bord — 4 stats + 2 tableaux résumés
    │   ├── Inscriptions.jsx  # Pré-inscriptions — liste + panneau détail + statut
    │   ├── Messages.jsx      # Messages — liste + panneau de lecture + recherche + stats + badges colorés par cours
    │   ├── Eleves.jsx        # Gestion élèves — liste, création, fiche détail, progression (vue tableau par module + panneau détail par niveau)
    │   ├── Classes.jsx       # Gestion classes — niveaux scolaires → classes → élèves
    │   ├── Enseignants.jsx   # Gestion enseignants — CRUD, assignation classes, génération identifiants
    │   ├── Cours.jsx         # Gestion cours — modules → thématiques → leçons → niveaux → contenus + QCM
    │   ├── adminUtils.js     # Fonctions utilitaires partagées — generateIdentifiant, generateTempPassword
    │   ├── supabaseAdmin.js  # Fonctions API Supabase (auth, CRUD, storage, progression)
    │   ├── mockData.js       # Données fictives (backup)
    │   └── adminStyles.js    # CSS complet interface admin (thème sombre + clair)
    ├── portail/
    │   ├── portailStyles.js        # CSS du portail élève
    │   ├── supabasePortail.js      # API Supabase côté élève (auth custom, progression, devoirs)
    │   ├── PortailLogin.jsx        # /portail/login — connexion + changement mot de passe 1ère connexion
    │   ├── PortailApp.jsx          # Layout portail : sidebar + topbar + Outlet + badges non-lus (messages + devoirs)
    │   ├── PortailDashboard.jsx    # Grille de modules filtrés par niveau scolaire
    │   ├── PortailModule.jsx       # Vue module : thématiques → leçons (chaîne) → niveaux + contenu + QCM
    │   ├── PortailDevoirs.jsx      # /portail/devoirs — devoirs groupés par semaine, badges urgence, section passés repliable
    │   ├── PortailResultats.jsx    # /portail/resultats — page résultats (vide, à alimenter)
    │   ├── PortailObservations.jsx # /portail/observations — page observations (vide, à alimenter)
    │   └── PortailMessages.jsx     # /portail/messages — chat élève ↔ enseignant (polling 5s, badges non-lus, séparateurs de date)
    └── enseignant/
        ├── supabaseEnseignant.js   # API Supabase côté enseignant (auth custom, classes, élèves, chat, devoirs CRUD)
        ├── EnseignantLogin.jsx     # /enseignant/login — connexion + changement mot de passe 1ère connexion
        ├── EnseignantApp.jsx       # Layout portail enseignant (style admin, sidebar, topbar, badge non-lus messages)
        ├── EnseignantMesClasses.jsx# /enseignant/classes — liste complète des classes
        ├── EnseignantClasse.jsx    # /enseignant/classe/:id — liste des élèves d'une classe
        ├── EnseignantDevoirs.jsx   # /enseignant/devoirs — calendrier mensuel + CRUD devoirs (créer, modifier, supprimer)
        └── EnseignantMessages.jsx  # /enseignant/messages — chat enseignant ↔ élèves (recherche, badges, suppression conv.)
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
| `/admin/login` | AdminLogin | Connexion identifiant + mot de passe |
| `/admin` | Dashboard | Vue d'ensemble — stats + dernières inscriptions/messages |
| `/admin/inscriptions` | Inscriptions | Liste + panneau détail — stats, progression, changement de statut |
| `/admin/messages` | Messages | Liste + panneau de lecture — onglets filtres, marquer lu/non lu |
| `/admin/eleves` | Eleves | Liste élèves + création + fiche détail + progression par module |
| `/admin/enseignants` | Enseignants | CRUD enseignants + assignation classes + génération identifiant/MDP |
| `/admin/cours` | Cours | CRUD drill-down : Modules → Thématiques → Leçons → Niveaux → Contenus + QCM |

### Identifiants admin

- **Identifiant :** `admin`
- **Mot de passe :** `Admin123!`
- **Accès :** `http://localhost:3000/admin/login`

### Authentification admin (auth custom bcrypt — PAS Supabase Auth)

- `AdminLogin.jsx` appelle `loginAdmin(identifiant, password)` → RPC `login_admin_custom` (bcrypt)
- Session stockée dans `sessionStorage.admin_session` = `{ id, identifiant, display_name }`
- `supabaseAdmin.js` : `authFetch()` utilise la **clé anon** directement — RLS ouvert pour `anon` sur toutes les tables de contenu admin
- Table `profils_admins` : `id`, `identifiant`, `password_hash` (bcrypt), `display_name`
- Créer un nouvel admin : `INSERT INTO profils_admins (identifiant, password_hash, display_name) VALUES ('prof', extensions.crypt('MDP!', extensions.gen_salt('bf')), 'Nom Affiché');`

---

## Portail Enseignant ✅ COMPLET

### Routes

| URL | Page | Description |
|-----|------|-------------|
| `/enseignant/login` | EnseignantLogin | Connexion identifiant + mot de passe (+ changement MDP 1ère connexion) |
| `/enseignant` | — | Redirige vers `/enseignant/classes` |
| `/enseignant/classes` | EnseignantMesClasses | Liste complète des classes assignées |
| `/enseignant/classe/:id` | EnseignantClasse | Tableau des élèves de la classe (nom, identifiant, statut, date) |
| `/enseignant/devoirs` | EnseignantDevoirs | Calendrier mensuel des devoirs + CRUD (créer, modifier, supprimer) |
| `/enseignant/messages` | EnseignantMessages | Chat avec les élèves — liste élèves searchable + bulles + suppression conversation |

### Authentification enseignant (auth custom bcrypt — même pattern que élèves)

- Session stockée dans `sessionStorage.enseignant_user` = `{ id, nom, prenom, identifiant, must_change_password }`
- Identifiant enseignant = même formule que les élèves : `{1ère lettre prénom}{2e lettre nom}{1ère lettre nom}{4 chiffres}` ex: `SoD1234`
- 1ère connexion → changement de mot de passe forcé
- Style visuel = identique à l'interface admin (`adminStyles.js`, thème dark/light)
- `supabaseEnseignant.js` : `loginEnseignant`, `logoutEnseignant`, `getEnseignantUser`, `changeEnseignantPassword`, `fetchMesClasses`, `fetchElevesDeClasse`, `fetchTousLesElevesEnseignant`, `fetchChatMessages`, `sendChatMessage`, `markMessagesReadEnseignant`, `fetchUnreadCountEnseignant`, `fetchUnreadCountParEleve`, `deleteConversation`

### Création d'un compte enseignant (côté admin)

1. Admin → Gestion des enseignants → Ajouter un enseignant
2. Après création : identifiant généré automatiquement + mot de passe provisoire affiché (modal avec boutons Copier + WhatsApp)
3. Bouton "Reset MDP" sur chaque carte enseignant pour régénérer un mot de passe provisoire

---

## Portail Élève (LMS) ✅ COMPLET

### Routes

| URL | Page | Description |
|-----|------|-------------|
| `/portail/login` | PortailLogin | Connexion identifiant + mot de passe |
| `/portail` | PortailDashboard | Grille des modules avec barre de progression |
| `/portail/module/:id` | PortailModule | Smart router : si thématiques → grille thématiques ; sinon → niveaux |
| `/portail/module/:moduleId/thematique/:thId` | PortailModule | Leçons d'une thématique (si existantes) ou niveaux directement |
| `/portail/module/:moduleId/thematique/:thId/lecon/:leconId` | PortailModule | Niveaux d'une leçon + contenu + QCM |
| `/portail/devoirs` | PortailDevoirs | Devoirs assignés par le professeur (page prête, contenu à venir) |
| `/portail/resultats` | PortailResultats | Notes et résultats d'évaluations (page prête, contenu à venir) |
| `/portail/observations` | PortailObservations | Observations et commentaires du professeur (page prête, contenu à venir) |

### Sidebar portail — Ressources externes
- **Voir mon livre interactif** → `https://www.mon-kitabi.fr/kitabis/` (nouvel onglet)
- **Al - Muqri** → `https://fr.muqri.com/` (nouvel onglet)

### Authentification élève (auth custom — PAS Supabase Auth)

- Pas de JWT, pas de Supabase Auth (incompatible ES256 sur plan gratuit)
- `login_eleve(p_identifiant, p_password)` → fonction SQL SECURITY DEFINER avec bcrypt
- Session stockée dans `sessionStorage.eleve_user` = `{ id, nom, prenom, identifiant, must_change_password }`
- Identifiant élève = `{1ère lettre prénom}{2e lettre nom}{1ère lettre nom}{4 chiffres}` ex: `SoJ7577`
- 1ère connexion → forcé à changer le mot de passe provisoire (min 8 car. + 1 chiffre + 1 spécial)

### Flux QCM (progression)

1. Élève sélectionne un module → voit les niveaux (Niveau 1 débloqué, reste verrouillé)
2. Élève consulte le contenu du niveau (vidéos YouTube, PDF, texte, Word, PowerPoint)
3. Élève clique "Passer le QCM" → questions à choix multiples (checkboxes, plusieurs bonnes réponses possibles)
4. Score ≥ score_requis (défaut 80%) → `reussi = true` → niveau suivant débloqué
5. Score < score_requis → possibilité de réessayer (tentatives comptées)

**Règle de déblocage des niveaux :**
- Niveau précédent **sans QCM** → niveau suivant débloqué automatiquement (accès libre)
- Niveau précédent **avec QCM** → niveau suivant débloqué uniquement si score ≥ score_requis

---

## Supabase — Configuration

### Projet

- **URL :** `https://nsdnzqdbpdncrksgxtar.supabase.co`
- **Clé anon :** `sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL`
- **Plan :** Gratuit (Nano) — région Irlande

### Tables

| Table | Usage | Accès anon | Accès service_role |
|-------|-------|------------|---------------------|
| `inscriptions` | Pré-inscriptions (modal S'inscrire) | INSERT | ALL |
| `messages` | Formulaire contact | INSERT | ALL |
| `profils_eleves` | Comptes élèves (auth custom, bcrypt) | — | ALL |
| `profils_admins` | Comptes admins (auth custom, bcrypt) | — | ALL |
| `enseignants` | Comptes enseignants (auth custom, bcrypt) | ALL (anon_all) | ALL |
| `enseignant_classes` | Jointure enseignant ↔ classes (many-to-many) | ALL (anon_all) | ALL |
| `modules` | Catégories de cours — `niveaux_scolaires_ids UUID[]` | SELECT (actif=true) | ALL |
| `thematiques` | Sous-modules — `niveaux_scolaires_ids UUID[]` | SELECT | ALL |
| `lecons` | Leçons intermédiaires (thématique → leçon → niveau) | ALL (anon_all) | ALL |
| `niveaux` | Niveaux dans chaque thématique (thematique_id FK) | SELECT | ALL |
| `contenus` | Contenu par niveau (video/pdf/texte/word/ppt) | SELECT | ALL |
| `qcm_questions` | Questions QCM (choix JSONB, reponse_correcte JSONB array) | SELECT | ALL |
| `eleve_progression` | Suivi progression élève | — | ALL |
| `niveaux_scolaires` | Niveaux scolaires (N1, N2…) | ALL (anon_all) | ALL |
| `classes` | Classes (ex: N1-1, N1-2) liées à un niveau scolaire | ALL (anon_all) | ALL |
| `devoirs` | Devoirs assignés par enseignant à une classe | ALL (anon_all) | ALL |

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
| `login_admin_custom(p_identifiant, p_password)` | Vérifie identifiant+bcrypt admin, retourne JSON | Admin (anon) |
| `admin_create_user(p_identifiant, p_password, p_nom, p_prenom)` | Crée un élève avec bcrypt | Admin (anon) |
| `admin_reset_eleve_password(p_id, p_new_password)` | Réinitialise le mot de passe élève | Admin (anon) |
| `login_eleve(p_identifiant, p_password)` | Vérifie les identifiants, retourne JSON user | Portail élève (anon) |
| `change_eleve_password(p_id, p_old, p_new)` | Change le mot de passe élève | Portail élève (anon) |
| `save_progression(p_eleve_id, p_niveau_id, p_score, p_reussi)` | Upsert progression | Portail élève (anon) |
| `get_progression(p_eleve_id)` | Retourne progression élève | Portail élève (anon) |
| `login_enseignant(p_identifiant, p_password)` | Vérifie identifiant+bcrypt enseignant, retourne JSON | Portail enseignant (anon) |
| `change_enseignant_password(p_id, p_old, p_new)` | Change le mot de passe enseignant | Portail enseignant (anon) |
| `admin_create_enseignant(p_id, p_identifiant, p_password)` | Crée le compte auth d'un enseignant existant | Admin (anon) |
| `admin_reset_enseignant_password(p_id, p_new_password)` | Réinitialise le mot de passe enseignant | Admin (anon) |

### Storage Supabase

| Bucket | Visibilité | Usage |
|--------|-----------|-------|
| `cours` | Public | Tous les nouveaux fichiers — structure `[module]/cover.jpg`, `[module]/[niveau]/cover.jpg`, `[module]/[niveau]/[contenu].[ext]` |
| `Cours de coran` | Public | Anciens PDFs (URLs existantes toujours valides) |
| `Images` | Public | Anciennes images de couverture (URLs existantes toujours valides) |

**Fonctions Storage dans `supabaseAdmin.js` :**
- `toSlug(str)` — convertit un titre en slug URL-safe
- `uploadFile(file, path)` — upload dans le bucket `cours` au chemin donné
- `deleteStorageFolder(prefix)` — supprime récursivement tous les fichiers sous un préfixe

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
| D6 | Upload image de couverture pour modules ET niveaux | ✅ |
| S1 | Réorganisation Storage — 1 bucket `cours` avec arborescence automatique | ✅ |
| S2 | Suppression automatique des fichiers Storage à la suppression module/niveau | ✅ |
| D5 | Aperçu miniature YouTube dans la modal contenu | ⬜ |

### Responsivité portail élève — ✅ Terminé
| # | Tâche | Statut |
|---|-------|--------|
| R1 | Hamburger ☰ + sidebar overlay (masquée sur ≤1024px) | ✅ |
| R2 | Layout module responsive (stepper horizontal scroll sur mobile) | ✅ |
| R3 | Breakpoints 1024px + 600px (padding, topbar, login card) | ✅ |
| R4 | Grid dashboard `minmax(260px)` adaptatif | ✅ |

### Système Enseignants + Classes — ✅ Implémenté (02/04/2026)

- **Gestion des enseignants** (`/admin/enseignants`) : CRUD, assignation classes (many-to-many via `enseignant_classes`), génération identifiant automatique, mot de passe provisoire, reset MDP, modal résultat avec Copier + WhatsApp
- **Portail enseignant** (`/enseignant/login`, `/enseignant`, `/enseignant/classes`, `/enseignant/classe/:id`) : auth bcrypt custom, style admin, tableau de bord avec classes, liste élèves par classe
- **Restriction modules par niveau scolaire** : `modules.niveaux_scolaires_ids UUID[]` — module invisible si tableau vide ou si l'élève n'est pas dans un des niveaux assignés
- **Cadenas leçons en chaîne** : leçon N verrouillée jusqu'à ce que leçon N-1 ait un QCM ET que l'élève l'ait réussi. Modules et thématiques restent toujours accessibles.
- **Barre de progression** : conservée uniquement sur les thématiques, ne compte que les niveaux qui ont un QCM

### Audit sécurité & qualité — batch 1 ✅ Corrigé (03/04/2026)

**Critiques (3/3 corrigés) :**
- Clés API Supabase déplacées vers `.env.local` (variables `process.env.REACT_APP_*`) dans les 3 fichiers supabase
- Injection HTML corrigée dans la fenêtre d'impression (`Eleves.jsx`) — `escapeHtml()` sur toutes les valeurs interpolées
- Masquage automatique des mots de passe provisoires après 30s dans `Eleves.jsx` et `Enseignants.jsx` (réaffichage au clic)

**Importants (3/3 corrigés) :**
- Memory leak corrigé dans `PortailDashboard.jsx` — flag `cancelled` dans useEffect pour éviter setState sur composant démonté
- 26 `console.error` supprimés dans 12 fichiers (évite l'exposition de messages Supabase dans les DevTools en prod)
- Accessibilité ARIA ajoutée : `htmlFor`/`id` sur labels+inputs des modals (`Eleves.jsx`, `Enseignants.jsx`, `Cours.jsx`), `aria-label` sur boutons icônes

### Audit sécurité & qualité — batch 2 ✅ Corrigé (03/04/2026)

- `App.jsx` : clé anon déplacée vers `process.env.REACT_APP_SUPABASE_ANON` (était encore en dur)
- `App.jsx` : formulaire contact — validation email (regex) + message (min 10 car.) + cooldown 30s anti-spam + données tronquées avant envoi Supabase
- `AdminLogin.jsx`, `PortailLogin.jsx`, `EnseignantLogin.jsx` : icône œil pour afficher/masquer le mot de passe (tous les champs, y compris changement de MDP)
- `Messages.jsx` : suppression de messages avec ConfirmModal (bouton sur chaque ligne + bouton dans le panneau de lecture)
- `Cours.jsx` : suppression individuelle et globale des questions QCM directement dans la liste
- `PortailModule.jsx` (4 bugs) : barre de progression, chips et bandeau succès prennent uniquement en compte les niveaux qui ont un QCM actif

### Améliorations futures (non planifiées)
- D5 — Aperçu miniature YouTube dans la modal contenu
- D3 — Mini-barre de progression dans la carte élève
- D4 — Drag & drop pour réordonner modules/niveaux/contenus
- F5 — Dupliquer un module

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

- **Section Devoirs — portail enseignant + portail élève (04/04/2026)** : nouvelle table `devoirs` (UUID `enseignant_id`, UUID `classe_id`, `titre`, `description`, `date_limite DATE`). `EnseignantDevoirs.jsx` créé : calendrier mensuel avec navigation mois, sélecteur de classes en tabs, cases cliquables, pills dorées sur les jours avec devoirs, panneau latéral droit sur clic d'un jour, modal création/édition (titre, description, classe, date), confirmation suppression. Portail élève `PortailDevoirs.jsx` : fetch `classe_id` depuis `profils_eleves` si absent de la session (`login_eleve` ne le retourne pas), devoirs groupés par semaine avec badges urgence colorés (rouge ≤2j, orange ≤6j, vert sinon), section "devoirs passés" repliable. Badge notification or sur "Mes devoirs" dans la sidebar élève : poll 30s via `fetchNewDevoirsCount` (compte devoirs créés après `devoirs_seen_at_{userId}` en localStorage), remis à 0 au clic.

- **Audit qualité — corrections critiques batch 3 (04/04/2026)** : 14 bugs critiques corrigés sur les 3 portails suite à audit complet. **Admin** : `Messages.jsx` sujet mailto "Al-Nour" → "Raqib" ; `mockData.js` suppression `ADMIN_CREDENTIALS` (identifiants en clair de l'ancien système) ; `Classes.jsx` suppression de `nbElevesNiveau` (ignorait son paramètre, jamais appelée) ; `Cours.jsx` remplacement de la création silencieuse de niveau par un `alert()` explicite ; `generateIdentifiant` + `generateTempPassword` extraites dans `adminUtils.js` (supprime la duplication entre `Eleves.jsx` et `Enseignants.jsx`). **Portail élève** : `supabasePortail.js` — `await` manquant sur `r3.json()` dans `fetchEnseignantsDeLEleve` (chat cassé), `res.ok` ajouté dans `fetchQCMExistenceForNiveaux` et `fetchChatMessages` ; `PortailModule.jsx` — flag `cancelled` ajouté dans les `useEffect` de `ModuleEntryView` et `LeconsEntryView` (setState après unmount). **Portail enseignant** : `supabaseEnseignant.js` — `res.ok` + `await` ajoutés dans `fetchChatMessages` et `markMessagesReadEnseignant` ; `EnseignantLogin.jsx` — double `setLoading(false)` supprimé (finally suffit) ; `EnseignantDashboard.jsx` supprimé (fichier mort, jamais importé).

- **Admin Messages — UI/UX redesign (04/04/2026)** : stats bar (Total / Non lus / Aujourd'hui) avec pills colorées contextuelles. Champ de recherche par nom/email intégré dans la barre de filtres. Cours affichés en badges colorés (vert débutant, bleu intermédiaire, or avancé, violet coran, gris renseignement). Panneau de lecture scrollable (`maxHeight: calc(100vh - 220px)`). Corps du message avec bordure gauche dorée (style citation). Badge lu/non-lu en pill verte/rouge. Tooltip date complète au survol des dates relatives.

- **Portail Messages — Chat élève ↔ enseignant (04/04/2026)** : `PortailMessages.jsx` créé — colonne gauche avec liste des enseignants de la classe (avatars colorés hash, badges non-lus or), zone chat avec séparateurs de date, bulles (or gradient = élève, blanc/gris = prof), avatars par message, indicateur "En ligne", zone de saisie intégrée avec bouton send circulaire gradient. Hauteur corrigée : `calc(100vh - 160px)` (topbar 80px + padding-top 40px + padding-bottom 40px). Polling 5s. Badges non-lus par enseignant chargés à l'init.

- **Portail enseignant — Chat + améliorations (04/04/2026)** : suppression section "Tableau de bord" (redirect `/enseignant` → `/enseignant/classes`). `EnseignantMessages.jsx` créé — liste élèves searchable (tous élèves de toutes les classes), chat bulles (or = enseignant, gris = élève), badge non-lus rouge par élève, suppression conversation avec confirm inline. `EnseignantApp.jsx` : badge non-lus messages dans sidebar, poll 30s. Table Supabase `chat_messages` : `eleve_id`, `enseignant_id`, `sender_role` ('eleve'|'enseignant'), `contenu`, `lu`, `created_at`.

- **Admin — Progression élèves : vue tableau (04/04/2026)** : remplacement des cartes module par un tableau récapitulatif (Module | Niveaux QCM | Réussis | Moy. score | Statut) + panneau latéral détail par niveau (barres de progression, scores, tentatives, statuts). 3 stat cards globales en haut (modules, niveaux réussis, progression globale %).

- **Login — icône œil / fix overflow (04/04/2026)** : ajout `box-sizing: border-box` sur `.admin-field input` et `overflow: hidden` sur les cartes de connexion (`AdminLogin`, `PortailLogin`, `EnseignantLogin`) pour corriger l'icône œil qui débordait des bordures.

- **Portail + Admin — Couche "Mes Leçons"** : nouvelle couche intermédiaire entre Thématiques et Mon Cours. Hiérarchie finale : Modules → Thématiques → **Leçons** → Niveaux. Table `lecons` (`id BIGINT`, `thematique_id BIGINT`, `titre`, `description`, `image_url`, `ordre`). Colonne `lecon_id BIGINT` ajoutée sur `niveaux` (FK nullable). Portail : `LeconsEntryView` dans `PortailModule.jsx` (grille de cartes identique aux thématiques, progression, smart router : si 0 leçons → NiveauxView directement). Route `/portail/module/:moduleId/thematique/:thId/lecon/:leconId`. Admin : `Cours.jsx` — drill-down Modules → Thématiques → **Leçons** (vue cartes, CRUD, `LeconModal`) → Niveaux → Contenus+QCM. `supabaseAdmin.js` : `fetchLecons`, `createLecon`, `updateLecon`, `deleteLecon`, `fetchNiveauxByLecon`. `supabasePortail.js` : `fetchLeconsEleve`, `fetchNiveauxByLeconEleve`. SQL requis dans Supabase : `CREATE TABLE lecons (...)` + `ALTER TABLE niveaux ADD COLUMN lecon_id ...` + RLS.

- **Portail — Titres animés en topbar** : suppression des titres noirs (`portail-topbar-title`) et des composants `FunTitle`/`FunModuleTitle` dans le contenu. Nouveau composant `TopbarFunTitle` dans `PortailApp.jsx` : lettres colorées lettre par lettre (palette `#7EC8E3/#7DCFA0/#F4A896/#F7D070`), animation bounce en entrée (`topbarLetterIn`) + flottement infini décalé (`topbarLetterFloat`), emoji gauche par page (`PAGE_EMOJIS`), étoile ⭐ et étincelle ✨ animées à droite. Taille 40px. Topbar hauteur 60px → 80px. Padding `.portail-content` ajusté à 40px.

- **Portail — Logo élève dans la sidebar** : `public/logo-eleve.png` ajouté à gauche de "رقيب — RAQIB" dans `.portail-sidebar-brand`, hauteur 50px.

- **Portail — Lettres arabes de fond refonte** : `BG_LETTERS` (14 lettres) et `MODULE_BG_LETTERS` (12 lettres) redistribués en 4 zones non-chevauchantes (gauche/droite/haut/bas), tailles 60–90px. Nouvelles keyframes `bgFloat1-4` avec opacité 0.10–0.23 (contre 0.04–0.085 avant). Animation module : `moduleBgFloat` flottement doux (remplace `moduleFade` pulse clignotant 0→0.18→0).

- **Portail — Mes devoirs / Mes résultats / Mes observations** : 3 nouvelles pages portail ajoutées à la sidebar (section Navigation). Chaque page affiche un état vide élégant, prêt à être alimenté. Routes : `/portail/devoirs`, `/portail/resultats`, `/portail/observations`. Composants : `PortailDevoirs.jsx`, `PortailResultats.jsx`, `PortailObservations.jsx`. `PAGE_TITLES` mis à jour pour le titre dynamique de la topbar. Icônes SVG dédiées pour chaque lien.

- **Portail — Ressources sidebar** : "Voir le site" remplacé par "Voir mon livre interactif" (`mon-kitabi.fr/kitabis/`) + ajout lien "Al - Muqri" (`fr.muqri.com`). Section renommée "Site" → "Ressources".

- **Rebranding RAQIB** : renommage complet "GUZUR"/"جذور" → **"RAQIB"/"رقيب"** dans tous les fichiers. Logo agrandi : 42px → 58px → 72px.

- **Palette Couleurs n°3** (`#CE8F8A` · `#FBF0E9` · `#805050` · `#D4C2A1` · `#AD9C92`) : rose terracotta, crème, bordeaux, beige chaud, taupe. Bloc `html.theme-3` complet dans `styles.js`.

- **Rebranding GUZUR + logo** : changement du nom de l'école de "Al-Nour"/"مدرسة النور" vers **"GUZUR"/"جذور"** dans tous les fichiers (`App.jsx`, `data.js`, `AdminLogin.jsx`, `AdminApp.jsx`, `PortailApp.jsx`, `PortailLogin.jsx`, `Eleves.jsx`, `public/index.html`, `CLAUDE.md`). Ajout du logo `public/Logo.png` dans la navbar : bouton `.logo` restructuré en `flex-row` avec `<img class="logo-img">` + `<div class="logo-text">` (`.logo-ar` + `.logo-fr`). CSS `styles.js` mis à jour (`.logo { flex-direction: row; gap: 10px; }`, `.logo-img { height:42px; }`).

- **Sélecteur de palettes de couleurs (ThemeSwitcher)** : bouton flottant 🎨 (bas-droite) sur le site public permettant de basculer entre des palettes visuelles. Chaque thème définit des variables CSS (`--gold`, `--gold-light`, `--gold-soft`, `--bg`, `--bg-alt`, `--bg-card`, `--fg`, `--fg-mid`, `--fg-light`, `--border`) appliquées via `document.documentElement.style.setProperty()` + une classe CSS (`theme-1`, `theme-2`) sur `<html>` pour les couleurs hardcodées (orbs, calligraphie, nav glassmorphisme). Thème sauvegardé dans `localStorage.site_palette`. Palettes définies dans le tableau `THEMES` de `App.jsx`. **"Couleurs de base"** (palette or/blanc Apple-style) et **"Couleurs n°2"** (`#FFC4A5`, `#FFAA95`, `#E38F97`, `#B27D8B`, `#696571` — fond blanc, fonds alternatifs corail, accents rosés). Le bloc `html.theme-2` dans `styles.js` couvre toutes les sections (hero, orbs, nav, boutons, présentation, tarifs, témoignages, footer).

- **Déblocage niveaux intelligent** : les niveaux sans QCM ne bloquent plus les suivants. Au chargement d'une thématique, `PortailModule.jsx` récupère en parallèle la présence de QCM pour tous les niveaux (`niveauxWithQCM` = Set d'IDs). `isUnlocked` : si niveau précédent sans QCM → débloqué automatiquement ; si avec QCM → doit être réussi. La sélection automatique du niveau courant respecte également cette logique.

- **Intégration Word (.docx) et PowerPoint (.pptx)** : nouveaux types de contenus dans la modal admin (`Cours.jsx`). Upload drag & drop vers Supabase Storage (bucket `cours`) avec validation MIME stricte par type (10 Mo Word, 20 Mo PPT). Rendu portail via **Microsoft Office Online Viewer** (`https://view.officeapps.live.com/op/embed.aspx?src=URL`) en iframe — PPT en ratio 16/9 avec navigation slides, Word en hauteur fixe 600px. Aucune installation requise côté élève, fonctionne sur tous navigateurs/appareils. Contrainte SQL à ajouter : `ALTER TABLE contenus ADD CONSTRAINT contenus_type_check CHECK (type IN ('video', 'pdf', 'texte', 'word', 'ppt'));`

- **Restriction thématiques par niveau scolaire** : colonne `niveaux_scolaires_ids UUID[]` sur `thematiques` (tableau des UUIDs autorisés), colonne `niveau_scolaire_id UUID` sur `profils_eleves` (dérivé automatiquement de `classe.niveau_id` à chaque modification de classe). Admin `Cours.jsx` : checkboxes niveaux scolaires dans `ThematiqueModal`. Admin `Eleves.jsx` : `updateEleveNiveauScolaire()` appelé en `Promise.all` avec `updateEleve()` lors de la sauvegarde. Portail : filtrage client-side (`Array.includes`) dans `fetchThematiquesEleve`. `PortailModule.jsx` : toujours rafraîchit `niveau_scolaire_id` depuis la DB au chargement du module (détecte les changements admin en temps réel). Fonctions SQL SECURITY DEFINER : `admin_update_eleve_niveau_scolaire`, `get_eleve_niveau_scolaire`.

- **ConfirmModal partagé** : composant `src/admin/ConfirmModal.jsx` — modale animée (scale+fade, backdrop blur) avec icône SVG, titre, message JSX, boutons pill. Remplace les 3 `window.confirm()` dans `Cours.jsx` (suppr. module/niveau/contenu) et les 2 modales emoji dans `Eleves.jsx` (suppr. élève + reset MDP). Prop `danger` (rouge) ou `icon="warn"` (or). Fermeture avec Échap ou clic backdrop.

- **Suppression étoile ornementale Hero** : suppression du SVG `.hero-star` (cercles + rayons, rotation 30s) dans `App.jsx` et de son CSS (`.hero-star`, `spinSlow`) dans `styles.js`.

- **Responsivité portail élève** : sidebar masquée + hamburger ☰ sur ≤1024px, overlay cliquable, stepper horizontal scroll sur mobile, breakpoints 600px/1024px (padding, topbar, login card), grid dashboard adaptatif `minmax(260px)`.

- **D6 upload image couverture** : drag & drop image dans modal module ET modal niveau, bucket Supabase `Images` (public, séparé des PDFs), colonnes `image_url` ajoutées sur `modules` et `niveaux`.

- **Pack élèves admin** : F1 reset mot de passe (SQL `admin_reset_eleve_password` + modale confirmation + affichage identifiants + bouton WhatsApp), F2 modifier nom/prénom/téléphone/email contact, F3 supprimer élève avec confirmation, D1 recherche temps réel + filtres actif/inactif + tri, F4 export CSV avec BOM UTF-8.

- **Import QCM CSV** : bouton "⬆ Importer CSV" dans le tab QCM, modal avec guide visuel du format, téléchargement modèle pré-rempli, parsing robuste (guillemets, BOM, lignes vides), aperçu avant chargement, mode Remplacer/Ajouter, intégration directe dans le carrousel existant.

- **Éditeur de texte riche (RTE)** : composant `src/admin/RichTextEditor.jsx` — éditeur WYSIWYG zéro dépendance (`contentEditable` + `execCommand`). Toolbar complète : Bold/Italic/Underline/Barré, H1/H2/H3/¶, listes, alignement, 10 couleurs prédéfinies + picker, LTR/RTL/police arabe (Scheherazade New), insertion image (upload Supabase Storage `contenu-images/` ou URL). Onglets Éditeur / Aperçu. Plein écran. Sélection image au clic : bordure dorée + poignée redimensionnement (coin bas-droit, drag) + mini-toolbar (float gauche/centré/droite/inline, largeur px, supprimer) + **drag & drop** de l'image avec ghost et zones visuelles (gauche/centré/droite). CSS : `.rte-editor` dans `adminStyles.js`, rendu portail `.portail-rich-text` dans `portailStyles.js` (avec `overflow:auto` pour clearfix float). `ContenuModal` utilise `<RichTextEditor>` pour le type texte, modal élargie à 680px. Portail : `dangerouslySetInnerHTML` avec détection `startsWith('<')` pour rétrocompatibilité texte brut.

- **Thématiques (sous-modules)** : nouvelle couche intermédiaire entre Modules et Niveaux. Table `thematiques` (`id BIGINT`, `module_id BIGINT`, `titre`, `description`, `image_url`, `ordre`). `niveaux.thematique_id` (FK nullable). Admin : drill-down Modules → Thématiques (grille de cartes identique aux modules) → Niveaux. Portail : `PortailModule` détecte si le module a des thématiques (smart router) → affiche grille de cartes thématiques ou niveaux directement. Routes portail : `/portail/module/:id` et `/portail/module/:moduleId/thematique/:thId`.

- **Auth custom élèves** : abandon de Supabase Auth pour les élèves (rate limit email + incompatibilité JWT ES256). Nouveau système : `password_hash` bcrypt dans `profils_eleves`, fonctions SQL SECURITY DEFINER, session dans `sessionStorage.eleve_user`.

- **LMS complet** : portail élève avec modules, niveaux, contenus (vidéo/PDF/texte), QCM multi-réponses, progression par niveau. Admin : gestion cours (drill-down Modules→Niveaux→Contenus+QCM) et gestion élèves (création, fiche, progression).

- **Upload PDF** : drag & drop dans la modal de contenu admin, stockage dans Supabase Storage (bucket "Cours de coran"), URL publique auto-remplie.

- **QCM carrousel** : éditeur carrousel dans l'admin (navigation entre questions, checkboxes pour plusieurs bonnes réponses). Colonne `reponse_correcte` migrée de INT à JSONB array.

- **Auth admin custom (bcrypt + service_role)** : abandon de Supabase Auth pour l'admin. Nouvelle table `profils_admins` + fonction SQL `login_admin_custom` (bcrypt). `AdminLogin.jsx` passe à un champ identifiant. `authFetch()` dans `supabaseAdmin.js` utilise la service_role key (`.env.local` → `REACT_APP_SUPABASE_SERVICE_KEY`) — plus de JWT, plus de refresh. Sidebar admin lit `display_name`/`identifiant` depuis `sessionStorage.admin_session`. Fiche élève : email remplacé par `ID : IDENTIFIANT`.

- **JWT auto-refresh** : `authFetch()` dans `supabaseAdmin.js` relance automatiquement avec `refresh_token` en cas de 401. *(remplacé par service_role key)*

- **Portail layout** : correction du layout (sidebar fixed + `display:block` au lieu de grid cassé). Topbar hauteur fixe 60px, `white-space:nowrap` sur la date.

- **Dark mode nav** : ajout de `html.dark .nav-btn { color: var(--fg-mid); }` dans `styles.js`.

- **Section Témoignages** : ajout entre Tarifs et Contact.

- **Interface Admin** : dashboard, inscriptions, messages avec design dark/light, sidebar navigation, Supabase Auth JWT.

- **Intégration Supabase** : formulaire contact → `messages`, modal pré-inscription → `inscriptions`, RLS configuré.

- **Refonte visuelle Apple + Oriental** : Inter + Scheherazade New + Cormorant Garamond, palette Apple, boutons pilules, glassmorphisme navbar.
