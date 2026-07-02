// ─── Évènements custom du portail admin ─────────────────────────────────────
// Permet aux pages (Inscriptions, Messages, Déclarations) de notifier le
// sidebar (`AdminApp`) qu'un compteur de badge peut avoir changé, sans avoir
// à remonter de prop ni utiliser de context. Le sidebar écoute ces évènements
// et rafraîchit ses compteurs.

export const ADMIN_EVENT_INSCRIPTIONS_CHANGED = 'inscriptions:changed';
export const ADMIN_EVENT_MESSAGES_CHANGED     = 'messages:changed';
export const ADMIN_EVENT_DECLARATIONS_CHANGED = 'declarations:changed';
export const ADMIN_EVENT_PAGE_TITLE           = 'admin:page-title';

/** Surcharge le titre de la topbar pour la page courante (ex: Classes.jsx
 *  affiche « Gestion des niveaux » ou « Gestion des classes » selon sa vue
 *  interne). Remis à zéro par AdminApp à chaque changement de route. */
export function emitPageTitle(title) {
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_PAGE_TITLE, { detail: title || null }));
}

export function emitInscriptionsChanged() {
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_INSCRIPTIONS_CHANGED));
}

export function emitMessagesChanged() {
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_MESSAGES_CHANGED));
}

export function emitDeclarationsChanged() {
  window.dispatchEvent(new CustomEvent(ADMIN_EVENT_DECLARATIONS_CHANGED));
}
