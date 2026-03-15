# مدرسة النور — École Al-Nour

## 🚀 Lancer en local

```bash
# 1. Dans le terminal VS Code (Ctrl+ù)
npm install       # une seule fois

# 2. Lancer le site
npm start         # → http://localhost:3000
```

## 🗂 Structure

```
src/
├── index.js      point d'entrée React
├── App.jsx       composant principal + rendu HTML
├── styles.js     tout le CSS
├── data.js       contenu (textes, cours, contacts…)
└── hooks.js      logique réutilisable (scroll, compteur…)
```

## 🔧 Connecter Supabase

Dans `src/App.jsx`, remplacez les deux lignes :

```js
const SUPABASE_URL  = 'https://VOTRE_URL.supabase.co';
const SUPABASE_ANON = 'VOTRE_ANON_KEY';
```

Clés disponibles sur **supabase.com → Settings → API**.

## 📦 Build production

```bash
npm run build
# → dossier build/ à déployer sur Netlify / Vercel
```
