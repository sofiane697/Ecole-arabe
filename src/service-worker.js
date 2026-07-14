/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

clientsClaim();

// Précache uniquement les fichiers statiques générés par le build (JS/CSS/HTML/
// images) → écran d'accueil de l'app disponible hors-ligne. Les appels réseau
// vers Supabase (données des 4 portails) ne passent jamais par ce service
// worker : aucune route runtime n'est enregistrée pour eux, donc toujours
// des données fraîches, jamais de cache sur du contenu sensible.
precacheAndRoute(self.__WB_MANIFEST);

// Navigation SPA hors-ligne : sert l'app shell pour toute route non précachée
// (ex. /admin, /portail/module/12) au lieu d'un échec réseau.
const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  if (event.request.url.match(fileExtensionRegexp)) return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(process.env.PUBLIC_URL + '/index.html'))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
