# CLAUDE.md — Institut As-Safaa (الصفاء)

## Projet

ENT (Espace Numérique de Travail) pour une école d'arabe. Site vitrine + 3 portails (admin, enseignant, élève).
Stack : **React 18** (CRA), **React Router v6**, CSS-in-JS, **Supabase** (REST + Storage), **DOMPurify**.

Transformation SaaS multi-école en cours — voir `BRIEF_ENT_MULTI_ECOLE.md`, `plan.md`, `migration.sql`.

## Structure

```
src/
├── App.jsx / data.js / hooks.js / styles.js / index.js   # Site public
├── admin/
│   ├── AdminApp.jsx        # Layout (sidebar, topbar, Outlet)
│   ├── Dashboard.jsx       # Stats + résumés
│   ├── Inscriptions.jsx    # Pré-inscriptions + conversion → compte élève
│   ├── Messages.jsx        # Messages contact (pagination, filtres, stats)
│   ├── Eleves.jsx          # CRUD élèves + fiche détail + progression + activité
│   ├── Classes.jsx         # Niveaux scolaires → classes → élèves
│   ├── Enseignants.jsx     # CRUD enseignants + assignation classes
│   ├── Cours.jsx           # Modules → Thématiques → Leçons → Niveaux → Contenus + QCM
│   ├── AdminSurveillance.jsx # Surveillance chat élève↔enseignant (read-only)
│   ├── supabaseAdmin.js    # API Supabase admin (authFetch, CRUD, storage)
│   ├── adminStyles.js      # CSS admin (dark/light)
│   └── adminUtils.js       # generateIdentifiant, generateTempPassword
├── enseignant/
│   ├── EnseignantApp.jsx   # Layout (sidebar, topbar, présence Teams-like)
│   ├── EnseignantDevoirs.jsx      # Calendrier mensuel + CRUD devoirs
│   ├── EnseignantNotes.jsx        # Évaluations + saisie notes (A+/A/ECA/NA)
│   ├── EnseignantObservations.jsx # Appréciations par élève (3 types)
│   ├── EnseignantAbsences.jsx     # Retards et absences
│   ├── EnseignantMessages.jsx     # Chat avec élèves
│   └── supabaseEnseignant.js      # API Supabase enseignant
├── portail/
│   ├── PortailApp.jsx      # Layout élève (sidebar, topbar animée, badges)
│   ├── PortailDashboard.jsx       # Grille modules filtrés par niveau scolaire
│   ├── PortailModule.jsx          # Thématiques → Leçons → Niveaux → Contenus + QCM
│   ├── PortailDevoirs/Resultats/Observations/Messages.jsx
│   └── supabasePortail.js         # API Supabase élève
└── supabase/functions/send-welcome-email/index.ts  # Edge Function Resend
```

## Authentification (commune aux 3 portails)

**Auth custom bcrypt** — PAS Supabase Auth (incompatible ES256 plan gratuit).

| Portail | Session | Fonction SQL login |
|---------|---------|-------------------|
| Admin | `sessionStorage.admin_session` `{id, identifiant, display_name}` | `login_admin_custom` |
| Enseignant | `sessionStorage.enseignant_user` `{id, nom, prenom, identifiant, must_change_password}` | `login_enseignant` |
| Élève | `sessionStorage.eleve_user` `{id, nom, prenom, identifiant, must_change_password}` | `login_eleve` |

- Identifiant généré : `{1ère lettre prénom}{2e lettre nom}{1ère lettre nom}{4 chiffres}` (ex: `SoD1234`)
- 1ère connexion → changement MDP forcé (min 8 car. + 1 chiffre + 1 spécial)
- Admin par défaut : `admin` / `Admin123!` → `http://localhost:3000/admin/login`
- `authFetch()` utilise la **clé anon** — RLS ouvert pour `anon` sur toutes les tables

## Ownership enseignant

Deux profs peuvent partager une classe. Chacun **voit** tout mais ne **modifie/supprime que son propre contenu**.

```jsx
const isOwn = item.enseignant_id === user.id;
```

- UI : boutons edit/delete masqués si `!isOwn`, nom du créateur affiché via `enseignants(nom,prenom)` join
- API : filtre `&enseignant_id=eq.${enseignantId}` sur tous les PATCH/DELETE (devoirs, évaluations, observations, absences)

## Supabase

- **URL :** `https://nsdnzqdbpdncrksgxtar.supabase.co`
- **Clé anon :** `sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL`
- **Plan :** Gratuit (Nano) — région Irlande

### Tables principales

| Table | Usage |
|-------|-------|
| `profils_admins` | Comptes admin (bcrypt) |
| `profils_eleves` | Comptes élèves (bcrypt) — `nom, prenom, email, password_hash, must_change_password, actif, telephone, email_contact` |
| `enseignants` | Comptes enseignants (bcrypt) — `statut_presence, presence_updated_at` |
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
| `chat_messages` | Chat élève↔enseignant (`sender_role`, `lu`) |
| `eleve_sessions` | Tracking visites élèves (heartbeat 2min) |
| `inscriptions` | Pré-inscriptions (+ `eleve_id` après conversion) |
| `messages` | Formulaire de contact |

### Fonctions SQL (SECURITY DEFINER)

`login_admin_custom`, `admin_create_user`, `admin_reset_eleve_password`, `login_eleve`, `change_eleve_password`, `save_progression`, `get_progression`, `login_enseignant`, `change_enseignant_password`, `admin_create_enseignant`, `admin_reset_enseignant_password`, `start_eleve_session`, `heartbeat_eleve_session`, `end_eleve_session`, `admin_update_eleve_niveau_scolaire`, `get_eleve_niveau_scolaire`

### Storage

| Bucket | Usage |
|--------|-------|
| `cours` | Fichiers de cours (structure `[module]/[niveau]/[contenu].[ext]`) |
| `Cours de coran` | Anciens PDFs (legacy) |
| `Images` | Anciennes images de couverture (legacy) |

## Flux QCM

1. Module → Thématiques → Leçons → Niveaux (Niveau 1 débloqué, reste verrouillé)
2. Contenu du niveau : vidéos YouTube, PDF, texte riche, Word (.docx), PowerPoint (.pptx)
3. QCM multi-réponses → score ≥ 80% → niveau suivant débloqué
4. Niveau sans QCM = progression bloquée (ne peut pas être validé)

## Notes (système lettres)

Scores stockés comme entiers : **A+**=4, **A**=3, **ECA**=2, **NA**=1. Pas de notes numériques /20.
Composants : `NoteLetterInput` (saisie enseignant), `GradeBadge` (affichage), camembert SVG (portail élève).

## Variables CSS

- Admin/Enseignant : préfixe `--a-` (ex: `--a-bg`, `--a-gold #bf8a30`, `--a-green #30d158`)
- Portail élève : préfixe `--p-` (ex: `--p-bg`, `--p-gold`, `--p-sidebar-w 260px`)
- Site public : sans préfixe (`--bg`, `--fg`, `--gold`), 6 palettes via ThemeSwitcher

## Commandes

```bash
npm install   # Installer les dépendances
npm start     # Dev → http://localhost:3000
npm run build # Build production
```

## Créer un admin

```sql
INSERT INTO profils_admins (identifiant, password_hash, display_name)
VALUES ('admin2', extensions.crypt('MonMDP!', extensions.gen_salt('bf')), 'Admin 2');
```
