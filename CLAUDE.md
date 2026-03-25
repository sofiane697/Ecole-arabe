# CLAUDE.md — École Al-Nour

## Présentation du projet

Site vitrine one-page pour une école d'arabe fictive **"Al-Nour" (مدرسة النور)**.
Stack : **React 18** (Create React App), CSS-in-JS, aucune librairie UI externe.

## Structure des fichiers

```
Ecole-arabe/
├── public/
│   └── index.html
└── src/
    ├── App.jsx       # Composant principal — tout le rendu HTML
    ├── data.js       # Données statiques (nav, cours, valeurs, contact)
    ├── hooks.js      # 3 hooks custom React
    ├── styles.js     # CSS complet injecté dynamiquement dans <head>
    └── index.js      # Point d'entrée React
```

## Sections de la page (dans l'ordre)

1. **Nav** — logo, liens desktop, toggle dark/light, hamburger mobile
2. **Hero** (`#accueil`) — titre arabe + description + CTA + motif SVG islamique
3. **Présentation** (`#presentation`) — texte + compteurs animés + valeurs
4. **Tarifs** (`#tarifs`) — 3 cartes de niveaux + 1 carte Coran + carrousel mobile
5. **Contact** (`#contact`) — infos + formulaire connecté à Supabase
6. **Footer**

## Fonctionnalités clés

- **Dark mode** — toggle ☀/☾, persisté en `localStorage`, transition CSS globale
- **Scroll reveal** — éléments `.sr` s'animent à l'entrée viewport (IntersectionObserver)
- **Section active** — lien nav surligné selon position de scroll (`useActiveSection`)
- **Compteurs animés** — décompte 0 → target quand visible (`useCounter`)
- **Carrousel mobile** — swipe tactile sur les cartes de tarifs (`CarouselCards`)
- **Modal pré-inscription** — formulaire nom/prénom/âge déclenché par bouton "S'inscrire"
- **Formulaire contact** — POST vers Supabase REST API

## Variables CSS (thème)

Définies dans `styles.js` :

| Variable     | Light       | Dark        |
|--------------|-------------|-------------|
| `--bg`       | `#f9f5ee`   | `#13100d`   |
| `--fg`       | `#2a2520`   | `#ede5d8`   |
| `--fg-mid`   | `#6b5d4f`   | `#a08870`   |
| `--fg-light` | `#9c8c7c`   | `#6b5d4f`   |
| `--gold`     | `#b8862e`   | *(inchangé)*|

## Point non fonctionnel — Supabase

Dans `App.jsx` lignes 264-265, les clés sont en placeholder :

```js
const SUPABASE_URL  = 'https://VOTRE_URL.supabase.co';
const SUPABASE_ANON = 'VOTRE_ANON_KEY';
```

À remplacer avec les vraies clés depuis **supabase.com → Settings → API**.
**Ne pas commiter les vraies clés dans git.**

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

## Historique des modifications

- **Dark mode nav** : ajout de `html.dark .nav-btn { color: var(--fg-mid); }` dans `styles.js`
  pour améliorer la visibilité des liens du menu en mode sombre.
