// Enregistrement du service worker (app installable + écran d'accueil
// disponible hors-ligne). Basé sur le boilerplate officiel Create React App.
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Mise à jour automatique : dès qu'une nouvelle version est détectée, on la
// fait passer en contrôle immédiatement (skipWaiting) et on recharge la page
// une seule fois — sans ça, le nouveau service worker reste "en attente"
// indéfiniment tant que l'utilisateur n'a pas complètement fermé l'app (ou
// retiré/réinstallé l'icône), ce qui donnait l'impression que le déploiement
// ne s'appliquait jamais.
let refreshingApresMiseAJour = false;

export function register(config) {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  if (publicUrl.origin !== window.location.origin) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingApresMiseAJour) return;
    refreshingApresMiseAJour = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Vérifie s'il existe déjà une mise à jour en attente (ex. onglet resté
      // ouvert depuis avant un déploiement) et la déclenche tout de suite.
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
              config?.onUpdate?.(registration);
            } else {
              config?.onSuccess?.(registration);
            }
          }
        };
      };

      // Re-vérifie une nouvelle version périodiquement et quand l'app repasse
      // au premier plan, pour appliquer les mises à jour rapidement plutôt
      // que d'attendre le prochain rechargement complet du navigateur.
      const verifierMiseAJour = () => registration.update().catch(() => {});
      setInterval(verifierMiseAJour, 60 * 60 * 1000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verifierMiseAJour();
      });
    })
    .catch((error) => {
      console.error("Erreur d'enregistrement du service worker :", error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('Aucune connexion internet — application en mode hors-ligne.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}
