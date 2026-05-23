# Design System — Institut As-Safaa
## Coupole v1 — référence d'implémentation

**Configuration** : palette Fresh olive · display Newsreader · corps Manrope
**Principe** : identité culturelle par la structure (arches, grille, étoiles à 8 branches), pas par l'ornement.

Ce document reflète l'implémentation réelle du **portail enseignant** (validée 05/2026). À utiliser comme référence pour bâtir les autres portails (admin, parent, élève redesign, site public).

---

## 01 Principes directeurs

### À FAIRE
- L'identité culturelle passe par la **structure** (arches, grille, étoiles à 8 branches), pas par des motifs décoratifs plaqués.
- **Hiérarchie typographique forte** : un grand serif italique en accent, le reste très sobre.
- **Une seule couleur d'accent (l'or)** — utilisée parcimonieusement pour les éléments actifs et les ornements.
- **Avatars élève cohérents partout** : composant `EleveAvatar` avec fallback dark ink + gold-light (affiche la photo si dispo).

### À ÉVITER
- Pas de chips multicolores (rouge/vert/orange) sauf pour statuts de présence.
- Pas de drop shadows lourdes. Préférer des bordures fines à 18 % d'opacité (`--c-rule`).
- Pas d'emoji, pas d'icônes décoratives non fonctionnelles. SVG géométriques propres uniquement.
- Pas de gradient. Couleurs solides.

---

## 02 Palette — Fresh Olive

| Variable CSS | Hex | Usage |
|---|---|---|
| `--c-bg` | `#F2EEDF` | **Fond principal de l'app** (hors cards/sidebar). Crème saturé. |
| `--c-paper` | `#FBFAF1` | **Sidebar + surface des cards**. Crème clair, légèrement plus clair que `--c-bg` pour le détachement subtil sans bordure. |
| `--c-ink` | `#1E2317` | Texte principal, **logo en arche de la sidebar**, boutons sombres, bulles de chat envoyées. |
| `--c-ink-2` | `#3F4A33` | Texte secondaire, descriptions, nav inactif. |
| `--c-ink-3` | `#7A876A` | Labels, métadonnées, texte discret, placeholder italic. |
| `--c-gold` | `#8A6B1F` | **Accent principal**, CTAs `+ Nouveau X`, italic en titre, badges unread, bordure active. |
| `--c-gold-light` | `#C09844` | **Initiales avatars sur fond ink**, logo arabe, bullets nav actif. |
| `--c-gold-soft` | `#DCBC6E` | Bordures dorées atténuées, ornements watermark, diamants séparateurs. |
| `--c-rule` | `rgba(138, 107, 31, 0.18)` | **Bordures standard** (cards, inputs, dividers verticaux). |
| `--c-rule-soft` | `rgba(138, 107, 31, 0.10)` | Séparateurs très discrets entre rangées de liste. |

### Couleurs de statut (présence enseignant uniquement)

| Statut | Hex | Usage |
|---|---|---|
| Vert (en ligne) | `#22A06B` | Statut "En ligne" |
| Orange (réunion) | `#C97800` | Statut "En réunion" |
| Rouge (indisponible) | `#C0392B` | Statut "Indisponible" |

### Couleur d'erreur / critique
- `#8B3A1F` (rouge brique sourd) — pour erreurs douces, boutons de suppression. **Rare.**

### Règles d'or sur la couleur
- **L'or n'est jamais sur l'or.** Toujours gold sur paper/bg, ou gold-light sur ink.
- **Bordures dorées = 18 % d'opacité** : `rgba(138, 107, 31, 0.18)`.
- **Pas de gradient.** Couleurs solides uniquement.
- **Sidebar plus claire que la page** (`paper` vs `bg`) — détachement par contraste de saturation, pas par ombre/border.

---

## 03 Typographie

### Import Google Fonts (dans `<head>`)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..700;1,6..72,300..700&family=Manrope:wght@300..800&family=JetBrains+Mono:wght@300..700&family=Amiri:wght@400;700&display=swap" rel="stylesheet">
```

### Hiérarchie typographique implémentée

| Style | Police | Taille | Poids | Usage |
|---|---|---|---|---|
| **Titre page principal** | Newsreader | 38px | 500 | `<em>Mot</em> & reste`, italique gold sur ink. `line-height: 1.05`, `letter-spacing: -0.015em`. |
| Titre modal | Newsreader | 22-24px | 500 | Avec `<em>` doré sur le 1er mot. |
| Titre card / item | Newsreader | 16-17px | 500 | Nom élève, titre devoir, quote observation. |
| Body 1 | Manrope | 13.5-14px | 400 | Texte principal, descriptions cards. |
| Body 2 | Manrope | 12-13px | 500-600 | Boutons, items liste, nav. |
| **Kicker / Eyebrow** | Manrope | 10.5px | 600 | UPPERCASE, `letter-spacing: 0.22em`, color `ink-3`. Au-dessus des titres après un `<Flourish>`. |
| **Italic accent** | Newsreader italic | — | 500 | Couleur gold. Status, "Modifier →", "Envoyer →", date meta. |
| Mono / chiffres | JetBrains Mono | 11-13px | 600-700 | tabular-nums, identifiants, dates compactes. |
| Arabic display | Amiri | 34px | 700 | Gold-light sur sombre (logo). |

### Règle clé — signature visuelle
> **Chaque titre principal contient un mot en italique et coloré en or.**
>
> Pattern : `<em style="color: var(--c-gold); font-weight: 500;">Mot</em> & reste`
>
> Exemples : *Notes* & appréciations · *Mes* classes · *Retards* & absences · *Messages* & correspondance · *Observations* & remarques · *Devoirs* à rendre · *Appel* de ce matin

---

## 04 Formes & Rayons — L'Arche

| Style | Border-radius | Usage |
|---|---|---|
| Pill | `999px` | Boutons, tags, filtres, inputs, avatars. |
| Card | `16-20px` | Cards standards (obs, devoir, message). |
| Arch | `60px 60px 12px 12px` | **CTAs principaux** (`+ Nouveau X`), tabs filtres principaux actifs. |
| Arch Strong | `120px 120px 14px 14px` | Logo sidebar, cards héros. |

### Quand utiliser arche vs pill (règle pragmatique)
- **Arche** : éléments actifs **uniques et structurants** — onglets de filtre principal actif, CTAs primaires.
- **Pill** : tout le reste — boutons secondaires, segmented controls, tags, inputs, items de liste.
- **JAMAIS d'arche sur les filtres mineurs** (segmented control de temps, filtres tertiaires) — ça devient lourd.

### Bulles de chat (corners asymétriques)
- Reçue : `14px 14px 14px 4px` (coin bas-gauche carré)
- Envoyée : `14px 14px 4px 14px` (coin bas-droit carré)
- Reçue = fond `bg` + border `rule`
- Envoyée = fond `ink` + texte `paper`, **pas de border**

---

## 05 Espacement & Rythme

| Token | Valeur | Usage |
|---|---|---|
| `--c-space-1` | 4px | Hairline |
| `--c-space-2` | 8px | Tight (gap entre tags, padding bouton compact) |
| `--c-space-3` | 14px | Inline (gap entre éléments d'une row) |
| `--c-space-4` | 22px | Card padding interne |
| `--c-space-5` | 32px | Bloc gap, padding horizontal de page |
| `--c-space-6` | 40px | Padding bottom de page |
| `--c-space-7` | 56px | Section |
| `--c-space-8` | 72px | Hero |

### Padding standard des pages enseignant
```jsx
padding: '24px 32px 40px'   // top right/left bottom
```

---

## 06 Vocabulaire Géométrique

4 ornements primitifs SVG + 1 diamant. Tous en SVG inline. Composant : `src/shared/Ornaments.jsx`.

### Star8 — Étoile à 8 branches (carré + carré tourné 45°)
**Usage** : marqueur ornement coin de card (semi-transparent gold à 12 %), séparateurs.

### Star5 — Étoile à 5 branches (échelle de notation)
**États** : `filled` = acquis (gold solide) ; vide = à acquérir (stroke gold-soft).

### Flourish — Vague calligraphique
**Usage** : **préfixe systématique des kickers de section**. Toujours avant un label uppercase 10.5px.
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
  <Flourish size={28} />
  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
    Nom de la section
  </span>
</div>
```

### Rosette — Watermark décoratif (10-15 % opacité)
**Usage** : fond du logo en arche dans la sidebar uniquement.

### Diamond — Petit losange
**Usage** : marqueur top-right des cards d'observation (color gold-soft), séparateur dans les date headers de chat (`<Diamond /> HIER <Diamond />`).

---

## 07 Composants Clés

### Sidebar (240px, fond paper clair)

**Structure verticale** :
1. **Logo en arche** (top, dark `#1E2317`, border-radius arch-strong, watermark Rosette en filigrane)
2. **Navigation** (texte sombre sur fond clair)
3. **Footer utilisateur** (avatar dark + nom + statut cliquable + bouton logout)

**Spécifications CSS** :
```css
.ens-sidebar {
  width: 240px;
  background: #FBFAF1;   /* paper, plus clair que bg #F2EEDF */
}

.ens-logo {
  background: #1E2317;
  border-radius: 120px 120px 14px 14px;  /* arch-strong */
  margin: 14px 10px 0;
  padding: 22px 12px 18px;
}
.ens-logo-arabic { font-size: 34px; color: gold-light; }
.ens-logo-name   { font-size: 12px;  color: rgba(paper, 0.85); }
.ens-logo-role   { font-size: 10px;  color: gold-soft; letter-spacing: 0.22em; uppercase; }

.ens-nav-link {
  padding: 10px 14px;
  margin: 2px 10px;
  border-radius: 999px;
  font-size: 13px;
  color: ink-2;
}
.ens-nav-link.active {
  background: ink;       /* pill dark */
  color: paper;
  font-weight: 600;
}
```

### Footer utilisateur de la sidebar

- **Avatar** : 44px, fond `ink` + initiales `gold-light` 13px
- **Point statut** : 12px, en bas-droite de l'avatar, bordure `paper` 2px
- **Nom** : Manrope 14px, weight 600
- **Statut** : Newsreader italic 12.5px, couleur = celle du statut, avec chevron
- **Dropdown** : s'ouvre vers le haut au click du nom/statut, `position: absolute; bottom: calc(100% - 4px)`
- **Bouton logout** : pill outline, hover gold

### Avatars élève (cohérence absolue)

**Composant** : `src/shared/EleveAvatar.jsx` avec `variant="enseignant"`.

```jsx
<EleveAvatar
  eleve={e}
  size={40}                          // 34-44 selon contexte
  variant="enseignant"
  fallbackStyle={{
    background: '#1E2317',
    color: '#C09844',
    fontWeight: 700,
    letterSpacing: '0.5px',
  }}
/>
```

- Affiche la **photo** si `e.photo_url` est sur le bucket `eleves-photos` (whitelist sécurité).
- Sinon **initiales** : fond dark ink + texte gold-light.
- **Ce composant doit être utilisé partout** où on affiche un élève. Jamais de div custom.

### Boutons — variantes implémentées

| Variante | Fond | Texte | Radius | Usage |
|---|---|---|---|---|
| **CTA primary** | `gold` | `paper` | `60px 60px 12px 12px` | `+ Nouveau devoir`, `+ Nouvelle observation`, `+ Nouvelle évaluation` |
| Dark pill | `ink` | `paper` | `999px` | "Valider la série →", boutons d'action sombre |
| **Ghost pill** | transparent | `ink-2` | `999px` + border `rule` | Annuler, secondaire |
| Italic link | none | `gold` (italic Newsreader) | — | "Modifier →", "Envoyer →" |
| Danger | `#8B3A1F` | `paper` | `999px` | Confirmer suppression |
| Outline danger | none | `#8B3A1F` | `999px` + border 1px | Supprimer (initial) |

### Onglets de filtre — 2 patterns

**Pattern A — Filtres principaux** (catégorie active = arche dark) :
- Actif : `60px 60px 12px 12px`, fond `ink`, texte `paper`, font-weight 700
- Inactif : `999px` outline `rule`, texte `ink-2`
- Compteur italique gold à côté du label

**Pattern B — Filtres tertiaires / segmented control** (collés dans un bloc, actif = gold pill) :
```jsx
<div style={{
  display: 'inline-flex',
  background: paper,
  border: '1px solid rule',
  borderRadius: 999,
  padding: 3,
}}>
  {options.map(opt => (
    <button style={{
      padding: '6px 16px',
      borderRadius: 999,
      border: 'none',
      background: active ? gold : 'transparent',  // gold pour actif
      color: active ? paper : ink-3,
      fontWeight: active ? 700 : 600,
    }}>{opt.label}</button>
  ))}
</div>
```

### Onglets de classe (N11, N12, OG-1)
**Pattern pill simple** (pas d'arche) :
- Actif : pill `999px`, fond `ink`, texte `paper`
- Inactif : pill outline `rule`, texte `ink-3`

### Échelle d'appréciation — A+/A/ECA/NA

| Niveau | Étoiles | Label | Style étoiles |
|---|---|---|---|
| Excellent | ★★★★ | A+ | gold solid (4 pleines) |
| Acquis | ★★★☆ | A | 3 pleines + 1 outline |
| En cours | ★★☆☆ | ECA | 2 pleines + 2 outline |
| Non acquis | ★☆☆☆ | NA | 1 pleine + 3 outline |

### Inputs / Textarea

```jsx
{
  padding: '9px 14px',           // input simple
  // padding: 14,                // textarea
  borderRadius: 999,             // input pill
  // borderRadius: 14,           // textarea
  border: '1px solid rule',
  background: bg,
  color: ink,
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
}
```

### Cards (observation, devoir, conversation)

```jsx
{
  background: paper,
  borderRadius: 16-20,
  border: '1px solid rule',
  padding: '20px 22px 16px',     // adapter selon contenu
  position: 'relative',          // pour les ornements absolute
  overflow: 'hidden',
}
```

### Modal

```jsx
{
  position: 'fixed', inset: 0, zIndex: 60,
  background: 'rgba(30,35,23,0.55)',
  backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
// Inner card :
{
  background: paper,
  borderRadius: 20,
  border: '1px solid rule',
  padding: '28px 28px 24px',
  maxWidth: 500,
  boxShadow: '0 20px 60px rgba(30,35,23,0.2)',
}
```

---

## 08 Tokens CSS — Prêts à intégrer

```css
:root {
  /* Couleurs */
  --c-bg: #F2EEDF;
  --c-paper: #FBFAF1;
  --c-ink: #1E2317;
  --c-ink-2: #3F4A33;
  --c-ink-3: #7A876A;
  --c-gold: #8A6B1F;
  --c-gold-light: #C09844;
  --c-gold-soft: #DCBC6E;

  /* Règles / opacités */
  --c-rule: rgba(138, 107, 31, 0.18);
  --c-rule-soft: rgba(138, 107, 31, 0.10);

  /* Statuts présence */
  --c-status-online:  #22A06B;
  --c-status-meeting: #C97800;
  --c-status-busy:    #C0392B;

  /* Erreur douce */
  --c-danger: #8B3A1F;

  /* Typographie */
  --c-display: 'Newsreader', serif;
  --c-body: 'Manrope', sans-serif;
  --c-mono: 'JetBrains Mono', monospace;
  --c-arabic: 'Amiri', serif;

  /* Rayons */
  --c-radius-pill: 999px;
  --c-radius-card: 20px;
  --c-radius-arch: 60px 60px 12px 12px;
  --c-radius-arch-strong: 120px 120px 14px 14px;

  /* Espacement */
  --c-space-1: 4px;
  --c-space-2: 8px;
  --c-space-3: 14px;
  --c-space-4: 22px;
  --c-space-5: 32px;
  --c-space-6: 40px;
  --c-space-7: 56px;
  --c-space-8: 72px;
}
```

### ⚠️ Piège CSS — radius multi-valeur via variables
**Le `border-radius` multi-valeur (4 corners) ne fonctionne PAS via `var(--c-radius-arch)` dans tous les contextes** (problème CRACO/PostCSS). Toujours écrire **explicitement** dans les composants critiques :
```jsx
borderRadius: '60px 60px 12px 12px'   // ✅
// pas : borderRadius: 'var(--c-radius-arch)'  // ❌ peut casser
```

### ⚠️ Constantes locales C
Dans chaque vue, redéclarer un objet `C` avec les hex en dur :
```js
const C = {
  bg: '#F2EEDF', paper: '#FBFAF1',
  ink: '#1E2317', ink2: '#3F4A33', ink3: '#7A876A',
  gold: '#8A6B1F', goldLight: '#C09844', goldSoft: '#DCBC6E',
  rule: 'rgba(138,107,31,0.18)', ruleSoft: 'rgba(138,107,31,0.10)',
};
```
Plus robuste que `var(--c-*)` en inline style — pas de risque de cascade ou de fallback manquant.

---

## 09 Patterns de Page

### Pattern 01 — En-tête de page (standard sur toutes les vues enseignant)

```jsx
<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
  <div>
    {/* Flourish + kicker */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <Flourish size={28} />
      <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
        Carnet d'observations
      </span>
    </div>
    {/* Titre */}
    <h1 style={{
      fontFamily: "'Newsreader', Georgia, serif",
      fontSize: 38, fontWeight: 500, lineHeight: 1.05,
      color: C.ink, margin: 0, letterSpacing: '-0.015em',
    }}>
      <em style={{ color: C.gold, fontWeight: 500 }}>Observations</em> & remarques
    </h1>
  </div>
  {/* Meta droite */}
  <div style={{ textAlign: 'right', paddingTop: 6 }}>
    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: C.ink2 }}>
      samedi 23 mai 2026
    </div>
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase', marginTop: 4 }}>
      Semaine 21 · Trimestre 3
    </div>
  </div>
</div>
```

### Pattern 02 — Sidebar enseignant
- Largeur fixe **240px**
- Fond `paper`, logo en arche dark sticky en haut
- Nav pills inversées (active = ink pill)
- Footer user (44px avatar) + dropdown statut + logout

### Pattern 03 — Card héros (Mes classes)
- Border-radius `120px 120px 14px 14px` (arch-strong)
- Ornement Star8 centrée en haut (8px du bord), opacité 0.12
- Contenu centré, padding 26px

### Pattern 04 — Card de liste (observation, devoir, message)
- Border-radius `16-20px`, fond `paper`, border `rule`
- Header row : avatar + nom serif + meta italique gold
- Quote en `<em>` Newsreader 15-17px
- Footer : tags pills outline + "Modifier →" italique gold à droite

### Pattern 05 — Liste d'élèves (Mes classes, Notes, Retards)
- Grid `auto 1fr auto auto` avec gap 14-20px
- Bordure `rule-soft` entre rangées (1px)
- Avatar 40-44px + nom (`Prénom NOM` avec nom en uppercase) + état italic

### Pattern 06 — CTA primaire
- Toujours en **haut à droite** du contenu (ligne des filtres)
- Forme en arche gold + `+` display
- Texte Manrope 13px, weight 600

### Pattern 07 — Vue chat (Messages)
- 2 colonnes dans une grande card paper unique
- Gauche 280-320px : search + tabs + liste conv
- Droite : header + messages + input
- Date séparateur centré : `<Diamond /> HIER <Diamond />` en uppercase ink-3
- Input : trombone + textarea + bouton "Envoyer →" arche gold

### Pattern 08 — Segmented control (filtres temps, toggles)
- Bloc `inline-flex` avec border + padding 3px + radius pill
- Boutons internes sans border, actif = fond gold
- Pas de gap entre boutons (collés)

### Pattern 09 — Footer auto-save
- Texte italique Newsreader 11.5px à gauche : "Auto-sauvegardé · il y a 3 min"
- Bouton "Valider la série →" pill dark à droite
- Quand validé : texte devient gold + bouton désactivé

### Pattern 10 — Bas de page (futur)
- Ornement horizontal : rule + Star8 + Diamond + Star8 + rule
- Tout en gold-soft à 50 % d'opacité

---

## 10 Architecture des fichiers

```
src/
├── shared/
│   ├── Ornaments.jsx        ← Star8, Star5, Flourish, Rosette, Diamond
│   ├── EleveAvatar.jsx      ← Avatar avec photo + fallback initiales
│   └── nameUtils.js         ← fmtPrenom, fmtNom
├── styles/
│   └── enseignant-coupole.css  ← styles globaux sidebar + nav
└── enseignant/
    ├── EnseignantApp.jsx        ← layout sidebar + outlet
    ├── EnseignantMesClasses.jsx
    ├── EnseignantClasse.jsx
    ├── EnseignantAbsences.jsx
    ├── EnseignantDevoirs.jsx
    ├── EnseignantNotes.jsx
    ├── EnseignantObservations.jsx
    └── EnseignantMessages.jsx
```

Chaque vue redéclare son objet `C` local en haut du fichier. Les styles inline dominent. Les classes CSS ne servent que pour la sidebar / le layout fixe.

---

## 11 Checklist pour bâtir un nouveau portail

- [ ] Importer la même police Google Fonts dans `<head>`
- [ ] Réutiliser les variables CSS `--c-*` (palette + tokens)
- [ ] Réutiliser `Ornaments.jsx` et `EleveAvatar.jsx`
- [ ] Reproduire le pattern de header (Flourish + kicker + italic title + meta droite)
- [ ] Sidebar 240px fond paper avec logo arche dark
- [ ] Avatars élève partout via `EleveAvatar` (cohérence absolue, photo + fallback)
- [ ] CTA primary = gold arch, secondary = ink pill, ghost = outline pill
- [ ] Italic gold pour les actions linkifiées ("Modifier →", "Envoyer →")
- [ ] Cards paper + radius 16-20 + border rule + padding 20-22
- [ ] Bulles chat : asymétriques, reçue claire / envoyée ink

---

*Version 1.1 · Coupole — référence d'implémentation portail enseignant — 23/05/2026*
