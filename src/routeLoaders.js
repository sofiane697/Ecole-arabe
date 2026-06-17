// Map de chargeurs dynamiques pour le preload au hover des liens de navigation.
//
// Quand l'utilisateur survole un NavLink, on appelle preloadRoute(name) qui
// déclenche le téléchargement du chunk JS en arrière-plan. Au moment du clic,
// React.lazy() trouve le chunk déjà en cache → navigation quasi-instantanée
// (INP < 50ms au lieu de 200-300ms).
//
// Webpack/CRACO déduplique automatiquement les import() : appeler la même
// factory deux fois renvoie la même promesse / le même chunk.

const LOADERS = {
  // ─── Admin ──────────────────────────────────────────────────────────────
  'admin-inscriptions':    () => import('./admin/Inscriptions'),
  'admin-messages':        () => import('./admin/Messages'),
  'admin-cours':           () => import('./admin/Cours'),
  'admin-classes':         () => import('./admin/Classes'),
  'admin-eleves':          () => import('./admin/Eleves'),
  'admin-parents':         () => import('./admin/Parents'),
  'admin-enseignants':     () => import('./admin/Enseignants'),
  'admin-surveillance':    () => import('./admin/AdminSurveillance'),
  'admin-declarations':    () => import('./admin/AdminDeclarations'),

  // ─── Enseignant ─────────────────────────────────────────────────────────
  'ens-classes':           () => import('./enseignant/EnseignantMesClasses'),
  'ens-absences':          () => import('./enseignant/EnseignantAbsences'),
  'ens-devoirs':           () => import('./enseignant/EnseignantDevoirs'),
  'ens-notes':             () => import('./enseignant/EnseignantNotes'),
  'ens-observations':      () => import('./enseignant/EnseignantObservations'),
  'ens-messages':          () => import('./enseignant/EnseignantMessages'),

  // ─── Portail élève ──────────────────────────────────────────────────────
  'portail-dashboard':     () => import('./portail/PortailDashboard'),
  'portail-devoirs':       () => import('./portail/PortailDevoirs'),
  'portail-resultats':     () => import('./portail/PortailResultats'),
  'portail-observations':  () => import('./portail/PortailObservations'),
  'portail-messages':      () => import('./portail/PortailMessages'),

  // ─── Portail parent ─────────────────────────────────────────────────────
  'parent-dashboard':      () => import('./parent/ParentDashboard'),
  'parent-notes':          () => import('./parent/ParentNotes'),
  'parent-observations':   () => import('./parent/ParentObservations'),
  'parent-devoirs':        () => import('./parent/ParentDevoirs'),
  'parent-absences':       () => import('./parent/ParentAbsences'),
};

// Préchargement silencieux : on swallow les erreurs pour ne pas casser le hover
// si le chunk n'est pas disponible (offline, 404, etc.). React.lazy gérera la
// vraie erreur si l'utilisateur clique malgré tout.
export function preloadRoute(name) {
  const loader = LOADERS[name];
  if (loader) loader().catch(() => {});
}
