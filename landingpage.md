# Refonte de la Landing Page — Educamoov

> Document de travail. On le remplit ensemble avant de planifier et de coder.
> Statut : 🟢 Branche Adulte complète + structure Enfant en cours (2026-06-10) — tarifs Enfant à remplir

---

## 1. Principe directeur

Refonte **complète** de la landing page publique.

- ✅ **On garde** : la section **Contact** (infos + formulaire) telle quelle.
- 🔄 **On refait** : tout le reste (hero, présentation, tarifs, témoignages…).

La page d'accueil devient un **point d'entrée vers 3 univers** (pôles d'activité de l'institut).

---

## 2. Page d'accueil (Home)

À l'arrivée sur la page : **3 stickers cliquables**, un par pôle.

| # | Sticker | Description |
|---|---------|-------------|
| 1 | **Enseignement religieux** | _(à détailler)_ |
| 2 | **Soutien scolaire académique** | _(à détailler)_ |
| 3 | **Social** | Petites annonces — garde d'enfants, aide aux personnes âgées |

➡️ **Comportement au clic** : redirige vers une **nouvelle page dédiée** (route URL), pas une modale.

---

## 2 bis. Modèle de navigation (arborescence par stickers)

La navigation se fait par **niveaux successifs de stickers** (drill-down). Chaque clic descend d'un cran et mène à une nouvelle page.

```
Accueil
└── 3 stickers (pôles)
     └── Page dédiée du pôle
          • Titre = nom du pôle (ex: « Enseignement religieux »)
          • Sous-stickers (ex: Adulte / Enfant) + d'autres à ajouter plus tard
               └── clic → niveau suivant → … → destination finale
```

> Principe : système **extensible** — on pourra ajouter des stickers à chaque niveau au fil du temps.

**Transitions animées** : à chaque clic, une animation fait évoluer les stickers pour amener l'utilisateur au niveau suivant (parcours fluide de bout en bout). Animations réalisées en **GSAP** (règle du projet).

---

## 2 ter. Destination finale du parcours (le « pack »)

Au bout de chaque parcours, l'utilisateur arrive sur un **récapitulatif** de tous ses choix (le « pack »).

Contenu de l'écran récapitulatif :
- **Résumé des choix** du parcours (ex: Enseignement religieux → Adulte → Arabe → formule/prix choisis).
- **Formulaire de coordonnées** : nom, prénom, téléphone, email.
- Bouton **« Envoyer une demande »**.

À l'envoi → la demande (pack + coordonnées) est **réceptionnée côté portail administrateur**.

➡️ À détailler plus tard (parké) : stockage Supabase + emplacement de consultation côté admin (nouvelle section dédiée ou réutilisation de `inscriptions` / `messages`).

---

## 3. Pôle « Enseignement religieux »

Page dédiée. Titre : « Enseignement religieux ».

Sous-stickers (niveau 2) :
- **Adulte**
- **Enfant**
- _(autres à venir)_

### Arborescence

```
Enseignement religieux
├── Adulte
│    ├── Arabe                → écran Tarifs (différentes tarifications) → choix ajouté au pack
│    ├── Coran                → écran Tarifs (différentes tarifications) → choix ajouté au pack
│    └── Éducation islamique  → écran Tarifs (différentes tarifications) → choix ajouté au pack
└── Enfant                          ← débloqué le 2026-06-10
     ├── Autonomie
     │    ├── Coran                       → … (tarifs à dérouler)
     │    ├── Éducation islamique         → … (tarifs à dérouler)
     │    ├── Arabe                        → … (tarifs à dérouler)
     │    └── Coran + Éducation islamique  → … (tarifs à dérouler)
     ├── Visioconférence            → … (à dérouler)
     └── Cours particulier          → … (à dérouler)
```

**Écran Tarifs** : après avoir choisi une matière (Arabe / Coran / Éducation islamique), l'utilisateur voit les **tarifications** correspondantes et en sélectionne une. Ce choix (matière + formule + prix) s'ajoute au « pack ».

### Tarifs Adulte (d'après la maquette du 2026-06-09)

**Langue arabe** — _2 à 3 sessions / an · max 10 / groupe · + 25 € d'adhésion_
| Persona | Niveau | Prix | Rythme |
|---|---|---|---|
| Je pars de zéro | Débutant — Alphabet (مبتدئ) | 149 € | 20 séances · 40 min |
| Je connais l'alphabet, je déchiffre des mots | Intermédiaire — Lecture (متوسط) | 149 € | 20 séances · 40 min |
| Je sais lire sans bégayer | Avancé — Expression (متقدم) | 149 € | 20 séances · 40 min |

**Coran** — _prérequis sur certaines formules_
| Persona | Prix | Rythme |
|---|---|---|
| Je ne sais pas lire — j'apprends à lire le Coran | 149 € | 20 séances · 40 min |
| Je sais lire, je veux apprendre les règles | 149 € | 15 séances · 40 min |
| J'apprends des sourates (Juzz 'Amma, Yâsîn) | **Sur demande** _(décision : pas de prix affiché)_ | — |
| Je veux qu'on me corrige mes sourates _(prérequis : savoir lire + tajwid)_ | 49 € | Cours particuliers · 5 séances |

**Éducation islamique (EDI)** — _différents modules · + 25 € d'adhésion_
| Module | Prix | Rythme |
|---|---|---|
| Sira | 99 € | 15 séances · 40 min |
| Fiqh — Prière | 99 € | 15 séances · 40 min |
| Les rites du pèlerinage | 99 € | 15 séances · 40 min |
| Lavage mortuaire | 99 € | 15 séances · 40 min |
| Zakat | 99 € | 15 séances · 40 min |

➡️ Destination finale de chaque branche : récapitulatif du « pack » (voir §2 ter).

## 4. Pôle « Soutien scolaire académique »

_(à remplir)_

## 5. Pôle « Social »

_(à remplir)_

---

## 6. Section Contact (conservée)

Inchangée : infos (adresse, téléphone/WhatsApp, email, horaires, accessibilité) + formulaire Supabase.

---

## 6 bis. Décisions de prototypage (2026-06-09)

- **Emplacement** : on **remplace directement la home `/`** par le parcours (ancienne landing conservée dans git).
- **Style** : on **garde l'ADN visuel actuel** (couleurs or/doré, typo serif, lettres arabes, dark mode, sélecteur de palettes).
- **Périmètre du 1er proto** : seulement la branche `Enseignement religieux → Adulte → {Arabe / Coran / Éducation islamique} → Tarifs → Récap`. Les autres stickers (Enfant, Soutien scolaire, Social) sont **affichés mais inactifs**.
- **Pas de base de données** : le bouton « Envoyer une demande » affiche juste un écran de confirmation factice (pas d'écriture Supabase). Branchement admin/Supabase = étape ultérieure.
- **Tarifs** : valeurs **placeholder** en attendant les vrais tarifs de Sofiane.

### Architecture technique retenue

Parcours animé en **une seule vue React** (state machine interne), pas 5 pages séparées → transitions GSAP fluides entre niveaux de stickers.

| Fichier | Rôle |
|---|---|
| `src/parcours/parcoursData.js` | Arborescence déclarative (extensible : 1 sticker = 1 entrée) |
| `src/parcours/ParcoursApp.jsx` | Orchestrateur : étape courante + pile de choix + animations GSAP |
| `src/parcours/StickerGrid.jsx` | Grille de stickers d'un niveau |
| `src/parcours/RecapStep.jsx` | Récap + formulaire coordonnées + envoi factice |
| `src/parcours/parcours.css` | Styles (réutilise les CSS variables existantes) |
| `src/App.jsx` (réécrit) | Nav + Parcours + section Contact conservée + footer + thème |

---

## 7. Questions ouvertes / à trancher

- Les stickers mènent-ils vers des sections de la même page, des pages dédiées, ou des modales ?
- Que devient le système de pré-inscription / tarifs actuel ?
- Garde-t-on les 6 palettes de couleurs + dark mode ?
- Garde-t-on l'identité visuelle actuelle (serif élégant, lettres arabes animées) ?

---

## 8. État d'avancement — implémenté le 2026-06-09

### ✅ Fait
- **Parcours par stickers** (nouveau dossier `src/parcours/`) :
  - `parcoursData.js` — arborescence déclarative et extensible.
  - `ParcoursApp.jsx` — orchestrateur (state machine + transitions GSAP).
  - `StickerGrid.jsx`, `TarifCard.jsx`, `RecapStep.jsx`, `hoverLift.js`, `parcours.css`.
- **Branche complète Enseignement religieux → Adulte** : Arabe / Coran / Éducation islamique → écran Tarifs (vrais tarifs de la maquette) → Récap + formulaire → envoi **factice** (pas de DB).
- **Branche Enfant débloquée (2026-06-10)** : Enfant → Autonomie / Visioconférence / Cours particulier. Autonomie → Coran / Éducation islamique / Arabe / Coran + Éducation islamique. Tarifs encore à dérouler (grilles vides en attendant le contenu de Sofiane).
- Stickers inactifs (« Bientôt ») : Soutien scolaire, Social.
- **Design des cartes tarifs** refait en « luxe éditorial épuré » (serif, filet doré). **Cartes uniformisées** : badge « Recommandé » et style mis en avant supprimés (toutes identiques).
- **Alignement carte tarif corrigé** : niveau (doré) et titre (noir) empilés verticalement (`.tarif-top` en colonne), plus de chevauchement.
- **Accueil** = 3 stickers + section Contact en dessous ; **parcours** = plein écran `100vh` (Contact/footer masqués), corrigé pour tenir compte de la navbar.
- **Responsive** retravaillé (paliers 1024 / 768 / 480, grilles fluides, `100svh`).
- **Menu « Me connecter »** (`LoginMenu.jsx`) : dropdown animé GSAP vers les 4 portails (élève, enseignant, parent, admin), + version menu mobile.
- **App.jsx réécrit** : nav simplifiée → parcours → Contact conservé → footer.

### 🧹 Nettoyage effectué
- `data.js` réduit à `CONTACT_INFO` ; `hooks.js` réduit à `useScrollReveal`.
- `site-components.css` : 1444 → ~470 lignes (suppression hero, ancien tarifs, témoignages, carrousel, modal pré-inscription…).
- Keyframes orphelins supprimés.
- **Palettes de couleurs supprimées** (les 6 thèmes + `site-themes.css`) → palette de base uniquement.
- **Mode sombre supprimé** de la landing (CSS `html.dark` laissé intact car partagé par les 4 portails).

### ⏳ Reste à faire
- Brancher l'envoi du « pack » côté Supabase + portail admin (aujourd'hui factice).
- **Remplir les tarifs de la branche Enfant** : Autonomie (Coran / Éducation islamique / Arabe / combinée) + dérouler Visioconférence et Cours particulier.
- Dérouler les pôles **Soutien scolaire** et **Social**.
- Nettoyages différés (transverses) : exports morts d'`animations.js`, règles `html.dark` publiques, classe `.theme-toggle`.

---

_Dernière mise à jour : 2026-06-10_
