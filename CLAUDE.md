# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Règle de développement

> **Toute nouvelle fonctionnalité, feature ou ajout de module DOIT passer par le skill `nouvelles-fonctionnalites`.**
> Cela inclut les mots-clés : "ajoute", "crée", "intègre", "implémente", "je veux que", "nouvelle feature", "nouveau module", "mets en place".
> Le workflow complet (planifier → coder → tester → débugger → sécuriser → simplifier) doit être respecté sans sauter d'étape.

## Projet

ENT (Espace Numérique de Travail) pour l'Institut As-Safaa (école d'arabe). Site vitrine + **4 portails** (admin, enseignant, élève, parent).
Stack : **React 18** (CRACO + CRA), **React Router v6**, **Tailwind CSS 3** + CSS variables, **Supabase** (REST + Storage), **DOMPurify**, **Framer Motion**.

## Commandes

```bash
npm install        # Installer les dépendances
npm start          # Dev → http://localhost:3000
npm run build      # Build production
npm test           # Tests Jest (watchAll=false)
```

Tests unitaires : `*.test.js` colocalisés dans `src/admin/`, `src/shared/`, `src/parent/`.
Test d'intégration : `test/notes-commentaire.test.mjs`.

## Structure

```
src/
├── App.jsx / data.js / hooks.js / animations.js / index.css / index.js
├── styles/                      # CSS architecture (voir section dédiée)
├── admin/                       # Portail admin
│   ├── AdminApp.jsx             # Layout (sidebar, topbar, Outlet)
│   ├── Dashboard.jsx            # Stats + résumés
│   ├── Inscriptions.jsx         # Pré-inscriptions + conversion → compte élève
│   ├── Messages.jsx             # Messages contact (pagination, filtres, stats)
│   ├── Eleves.jsx               # CRUD élèves + fiche détail + progression + activité
│   ├── Classes.jsx              # Niveaux scolaires → classes → élèves
│   ├── Enseignants.jsx          # CRUD enseignants + assignation classes
│   ├── Cours.jsx                # Modules → Thématiques → Leçons → Niveaux → Contenus + QCM
│   ├── Parents.jsx / ParentsSection.jsx / EleveParentsSection.jsx  # Gestion parents
│   ├── AdminDeclarations.jsx    # Validation déclarations retards/absences
│   ├── AdminSurveillance.jsx    # Surveillance chat élève↔enseignant (read-only)
│   ├── RichTextEditor.jsx       # Éditeur de texte riche (contenus de cours)
│   ├── supabaseAdmin.js         # API Supabase admin (authFetch, CRUD, storage)
│   └── adminUtils.js            # generateIdentifiant, generateTempPassword
├── enseignant/                  # Portail enseignant
│   ├── EnseignantApp.jsx        # Layout (sidebar, topbar, présence Teams-like)
│   ├── EnseignantDevoirs.jsx    # Calendrier mensuel + CRUD devoirs
│   ├── EnseignantNotes.jsx      # Évaluations + saisie notes (A+/A/ECA/NA)
│   ├── EnseignantObservations.jsx
│   ├── EnseignantAbsences.jsx
│   ├── EnseignantMessages.jsx   # Chat avec élèves
│   └── supabaseEnseignant.js
├── portail/                     # Portail élève
│   ├── PortailApp.jsx           # Layout élève (sidebar, topbar animée, badges)
│   ├── PortailDashboard.jsx     # Grille modules filtrés par niveau scolaire
│   ├── PortailModule.jsx        # Thématiques → Leçons → Niveaux → Contenus + QCM
│   └── supabasePortail.js
├── parent/                      # Portail parent
│   ├── ParentApp.jsx            # Layout parent
│   ├── ParentDashboard.jsx / ParentNotes.jsx / ParentObservations.jsx
│   ├── ParentDevoirs.jsx / ParentAbsences.jsx
│   ├── parentConstants.js       # SCORE_LABEL/COLOR/SUB partagés
│   └── supabaseParent.js        # Auth par token opaque (voir section Auth)
└── shared/                      # Composants et utilitaires transverses
    ├── EleveAvatar.jsx / PhotoEditor.jsx  # Photo de profil
    ├── imageCrop.js             # Recadrage image côté client
    ├── dateUtils.js             # Formatage dates
    ├── declarationTypes.js      # DECLARATION_TYPE_CFG (retard/absence)
    └── nameUtils.js
```

Migrations SQL : `supabase/sql/` (voir section RLS).
Edge Functions : `supabase/functions/send-welcome-email/` et `supabase/functions/eleve-photo/`.
Rapports d'audit : `audit/` (4 portails, 2026-05-08).

## Authentification (4 portails)

**Auth custom bcrypt** — PAS Supabase Auth (incompatible ES256 plan gratuit).

| Portail | Session | Fonction SQL login |
|---------|---------|-------------------|
| Admin | `sessionStorage.admin_session` `{id, identifiant, display_name}` | `login_admin_custom` |
| Enseignant | `sessionStorage.enseignant_user` `{id, nom, prenom, identifiant, must_change_password}` | `login_enseignant` |
| Élève | `sessionStorage.eleve_user` `{id, nom, prenom, identifiant, must_change_password}` | `login_eleve` |
| Parent | `sessionStorage.parent_user` `{session_token, ...}` — **jeton opaque, jamais `parent.id`** | `login_parent` |

- Identifiant généré : `{1ère lettre prénom}{2e lettre nom}{1ère lettre nom}{4 chiffres}` (ex: `SoD1234`)
- 1ère connexion → changement MDP forcé (min 8 car. + 1 chiffre + 1 spécial)
- Admin par défaut : `admin` / `Admin123!` → `http://localhost:3000/admin/login`
- Portail parent : toutes les RPC data passent le `session_token`, résolu en `parent_id` par `_resolve_parent_session` côté SQL

## Ownership enseignant

Deux profs peuvent partager une classe. Chacun **voit** tout mais ne **modifie/suppresse que son propre contenu**.

```jsx
const isOwn = item.enseignant_id === user.id;
```

- UI : boutons edit/delete masqués si `!isOwn`, nom du créateur affiché via `enseignants(nom,prenom)` join
- API : filtre `&enseignant_id=eq.${enseignantId}` sur tous les PATCH/DELETE

## Supabase

Credentials via `.env.local` (copier `.env.example`) :
```
REACT_APP_SUPABASE_URL=https://<project-id>.supabase.co
REACT_APP_SUPABASE_ANON=<anon-key>
```

### Tables principales

| Table | Usage |
|-------|-------|
| `profils_admins` | Comptes admin (bcrypt) |
| `profils_eleves` | Comptes élèves (bcrypt) — `must_change_password, actif, telephone, email_contact` |
| `enseignants` | Comptes enseignants — `statut_presence, presence_updated_at` |
| `parents` | Comptes parents — liés à `profils_eleves` |
| `enseignant_classes` | Jointure many-to-many enseignant ↔ classes |
| `classes` | Classes liées à un `niveau_scolaire_id` |
| `niveaux_scolaires` | Niveaux (N1, N2…) |
| `modules` | Cours — `niveaux_scolaires_ids UUID[]` pour filtrage |
| `thematiques` | Sous-modules — `niveaux_scolaires_ids UUID[]` |
| `lecons` | Leçons (thématique → leçon → niveau) |
| `niveaux` | Niveaux de contenu (`thematique_id`, `lecon_id`) |
| `contenus` | Contenu par niveau (video/pdf/texte/word/ppt) |
| `qcm_questions` | Questions QCM (choix JSONB, `reponse_correcte` JSONB array) |
| `eleve_progression` | Suivi progression QCM |
| `devoirs` | Devoirs (`enseignant_id`, `classe_id`, `titre`, `date_limite`) |
| `evaluations` | Évaluations créées par enseignant |
| `notes` | Notes par élève (UNIQUE `evaluation_id+eleve_id`, score: A+=4, A=3, ECA=2, NA=1) |
| `observations` | Appréciations (type: general/comportement/progression) |
| `retards_absences` | Retards et absences par élève |
| `declarations` | Déclarations retard/absence soumises par parents |
| `chat_messages` | Chat élève↔enseignant (`sender_role`, `lu`) |
| `eleve_sessions` | Tracking visites élèves (heartbeat 2min) |
| `inscriptions` | Pré-inscriptions (+ `eleve_id` après conversion) |
| `messages` | Formulaire de contact |

### Fonctions SQL (SECURITY DEFINER)

`login_admin_custom`, `admin_create_user`, `admin_reset_eleve_password`, `login_eleve`, `change_eleve_password`, `save_progression`, `get_progression`, `login_enseignant`, `change_enseignant_password`, `admin_create_enseignant`, `admin_reset_enseignant_password`, `start_eleve_session`, `heartbeat_eleve_session`, `end_eleve_session`, `admin_update_eleve_niveau_scolaire`, `get_eleve_niveau_scolaire`, `login_parent`, `_resolve_parent_session`

### RLS Lockdown (en cours)

Les migrations SQL dans `supabase/sql/` implémentent un verrouillage progressif des RLS (Row Level Security). Avant ce travail, la clé `anon` publique avait accès libre à toutes les tables. Fichiers :

- `profils_eleves_lockdown.sql`, `enseignants_lockdown.sql`, `cours_rls_lockdown.sql`
- `eleve_qcm_lockdown.sql`, `notes_obs_evals_lockdown.sql`
- `inscriptions_messages_chat_lockdown.sql`, `classes_niveaux_scolaires_lockdown.sql`
- `parents_rls_lockdown.sql`, `declarations_parents_migration.sql`
- `admin_sessions_phase3.sql` — Phase 3 : token de session admin (à appliquer)

### Storage

| Bucket | Usage |
|--------|-------|
| `cours` | Fichiers de cours (structure `[module]/[niveau]/[contenu].[ext]`) |
| `Cours de coran` | Anciens PDFs (legacy) |
| `Images` | Anciennes images de couverture (legacy) |

## Flux QCM

1. Module → Thématiques → Leçons → Niveaux (Niveau 1 débloqué, reste verrouillé)
2. Contenu : vidéos YouTube, PDF, texte riche, Word (.docx), PowerPoint (.pptx)
3. QCM multi-réponses → score ≥ 80% → niveau suivant débloqué
4. Niveau sans QCM = ne peut pas être validé

## Notes (système lettres)

Scores entiers : **A+**=4, **A**=3, **ECA**=2, **NA**=1. Pas de notes /20.
`SCORE_LABEL` / `SCORE_COLOR` / `SCORE_SUB` définis dans `src/parent/parentConstants.js`.

## CSS Architecture

**Tailwind CSS 3** (via CRACO) + CSS variables comme pont de thème.

| Fichier | Contenu |
|---------|---------|
| `src/styles/admin-overrides.css` | Variables `--a-*`, dark/light admin+enseignant, composants `.admin-*` |
| `src/styles/portail-overrides.css` | Variables `--p-*`, dark/light portail élève, composants `.portail-*` |
| `src/styles/site-base.css` | Variables `:root`, dark mode, reset (site public) |
| `src/styles/site-keyframes.css` | 20 `@keyframes` du site public |
| `src/styles/site-components.css` | Composants `.nav`, `.hero`, cartes, footer, modal… |
| `src/styles/site-themes.css` | Surcharges `html.theme-2` → `html.theme-6` (6 palettes) |

Classes Tailwind mappées sur CSS variables :
- Admin/Enseignant : `bg-a-bg`, `text-a-fg`, `text-a-gold`, `border-a-border`, `shadow-a-sm`…
- Portail élève : `bg-p-bg`, `text-p-fg`, `text-p-gold`, `border-p-border`…
- Site public : `bg-site-bg`, `text-site-fg`, `text-site-gold`…

**Ne jamais modifier les `className="admin-*"` ou `className="portail-*"`** — ces classes sont ciblées par les overrides CSS. Les ~204 `style={{}}` restants dans les portails admin/enseignant sont dynamiques (légitimes).

## Créer un admin

```sql
INSERT INTO profils_admins (identifiant, password_hash, display_name)
VALUES ('admin2', extensions.crypt('MonMDP!', extensions.gen_salt('bf')), 'Admin 2');
```

## Bugs connus (audit 2026-05-08)

- **B1** — `sendWelcomeEmail` non importé dans `Eleves.jsx:230`
- **B2** — `updateDevoir` ignore silencieusement `classe_id`
- **B3** — Conflit signature `_parent_owns_eleve` dans les 2 migrations parents
- **B4** — Présence enseignant écrasée à `en_ligne` à chaque reload
- **B7** — `Classes.jsx:456` ferme la modale même si la suppression échoue
