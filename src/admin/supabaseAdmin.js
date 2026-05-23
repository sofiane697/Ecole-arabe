// ─── Configuration Supabase pour l'admin ────────────────────────────────────
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

/** Requête avec la clé anon (RLS ouvert pour anon sur les tables admin) */
async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      ...(options.headers || {}),
    },
  });
}

// Phase RLS #2.E : `inscriptions` et `messages` ont l'INSERT public ouvert
// (formulaires site App.jsx) mais SELECT/UPDATE/DELETE admin-only via RPCs.

/** Récupérer toutes les inscriptions */
export async function fetchInscriptions() {
  return rpcAdminWrite('admin_fetch_inscriptions',
    { p_admin_token: requireAdminToken() },
    'Erreur chargement inscriptions');
}

/** Récupérer tous les messages */
export async function fetchMessages() {
  return rpcAdminWrite('admin_fetch_messages',
    { p_admin_token: requireAdminToken() },
    'Erreur chargement messages');
}

/** Mettre à jour le statut d'une inscription */
export async function updateInscriptionStatut(id, statut) {
  await rpcAdminWrite('admin_update_inscription_statut',
    { p_admin_token: requireAdminToken(), p_id: id, p_statut: statut },
    'Erreur modification inscription');
}

/** Marquer un message comme lu / non lu */
export async function updateMessageLu(id, lu) {
  await rpcAdminWrite('admin_update_message_lu',
    { p_admin_token: requireAdminToken(), p_id: id, p_lu: lu },
    'Erreur modification message');
}

/** Supprimer un message */
export async function deleteMessage(id) {
  await rpcAdminWrite('admin_delete_message',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression message');
}

/** Connexion admin — phase 3 : login_admin_custom retourne désormais un token
 *  opaque (32 bytes hex) en plus de l'admin_id. Le token est stocké en
 *  sessionStorage et passé à toutes les RPCs admin_*. Le simple lookup d'UUID
 *  ne suffit plus (faille fermée par migration `admin_sessions_phase3`). */
export async function loginAdmin(identifiant, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_admin_custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
    body: JSON.stringify({ p_identifiant: identifiant.trim(), p_password: password }),
  });
  if (!res.ok) throw new Error('Identifiant ou mot de passe incorrect');
  const admin = await res.json();
  if (!admin || !admin.id || !admin.token) throw new Error('Identifiant ou mot de passe incorrect');
  sessionStorage.setItem('admin_session', JSON.stringify(admin));
  return admin;
}

/** Vérifie qu'une session admin est encore valide via son token.
 *  Migration phase 3 : on utilise verify_admin_session_token(token) qui résout
 *  côté SQL et n'expose plus l'UUID à un attaquant. L'argument `adminId` est
 *  conservé pour compat ascendante avec les anciens callers (ignoré). */
export async function verifyAdminSession(_adminId) {
  const session = (() => {
    try { return JSON.parse(sessionStorage.getItem('admin_session')); } catch { return null; }
  })();
  if (!session?.token) return false;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_admin_session_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify({ p_admin_token: session.token }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data && data.id ? true : false;
}

/** Déconnexion — phase 3 : invalide le token côté serveur en plus de purger
 *  sessionStorage. L'invalidation est best-effort (fire-and-forget) ; même si
 *  la RPC échoue, le sessionStorage est purgé localement. */
export function logoutAdmin() {
  const token = getAdminToken();
  if (token) {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/logout_admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON, 'Authorization': `Bearer ${SUPABASE_ANON}` },
      body: JSON.stringify({ p_admin_token: token }),
    }).catch(() => {});
  }
  sessionStorage.removeItem('admin_session');
  sessionStorage.removeItem('admin_auth');
}

// ─── MODULES / NIVEAUX / CONTENUS ───────────────────────────────────────────
// Phase RLS #2.B (2026-05-08) : les écritures sur modules/niveaux/contenus/
// thematiques/lecons sont fermées à anon. Les SELECT restent ouverts (élève,
// enseignant, admin lisent massivement ces tables — pas de bénéfice à tout
// passer en RPC). Les CRUD passent par les RPCs admin_* SECURITY DEFINER.

// Helper local : appel RPC + gestion d'erreur uniformisée. Évite la duplication
// du try/catch sur les 15 wrappers ci-dessous.
async function rpcAdminWrite(fn, body, errLabel) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `${errLabel} ${res.status}`);
  }
  return res.json().catch(() => null);
}

export async function fetchModules() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/modules?order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createModule(data) {
  return rpcAdminWrite('admin_create_module',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création module');
}

export async function updateModule(id, data) {
  await rpcAdminWrite('admin_update_module',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification module');
}

export async function deleteModule(id) {
  await rpcAdminWrite('admin_delete_module',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression module');
}

export async function fetchNiveaux(moduleId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?module_id=eq.${moduleId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createNiveau(data) {
  return rpcAdminWrite('admin_create_niveau',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création niveau');
}

export async function updateNiveau(id, data) {
  await rpcAdminWrite('admin_update_niveau',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification niveau');
}

export async function deleteNiveau(id) {
  await rpcAdminWrite('admin_delete_niveau',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression niveau');
}

export async function fetchContenus(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/contenus?niveau_id=eq.${niveauId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createContenu(data) {
  return rpcAdminWrite('admin_create_contenu',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création contenu');
}

export async function updateContenu(id, data) {
  await rpcAdminWrite('admin_update_contenu',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification contenu');
}

export async function deleteContenu(id) {
  await rpcAdminWrite('admin_delete_contenu',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression contenu');
}

// ─── QCM QUESTIONS ───────────────────────────────────────────────────────────

/** Récupère tous les niveaux d'un module en traversant la hiérarchie réelle :
 *  Module → Thématiques → (Leçons →) Niveaux
 *  Remplace fetchNiveaux(moduleId) qui utilisait l'ancienne colonne module_id. */
export async function fetchAllNiveauxForModule(moduleId) {
  const thematiques = await fetchThematiques(moduleId).catch(() => []);
  const niveaux = [];
  await Promise.all(thematiques.map(async (th) => {
    const lecons = await fetchLecons(th.id).catch(() => []);
    if (lecons.length > 0) {
      await Promise.all(lecons.map(async (l) => {
        const nivs = await fetchNiveauxByLecon(l.id).catch(() => []);
        niveaux.push(...nivs);
      }));
    } else {
      const nivs = await fetchNiveauxByThematique(th.id).catch(() => []);
      niveaux.push(...nivs);
    }
  }));
  return niveaux;
}

// QCM côté admin : depuis la phase RLS #2.A (anti-triche), `qcm_questions` est
// fermée à anon. Toutes les opérations passent désormais par les RPCs admin_*
// SECURITY DEFINER qui vérifient la session admin via _is_admin.

export async function fetchQCMNiveauxIds(niveauIds) {
  if (!niveauIds.length) return new Set();
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_qcm_existence`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_niveau_ids: niveauIds }),
  });
  if (!res.ok) return new Set();
  const data = await res.json();
  // RPC retourne SETOF BIGINT → tableau de nombres
  return new Set(Array.isArray(data) ? data : []);
}

export async function fetchQCM(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_qcm_questions`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_niveau_id: niveauId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

export async function createQuestion(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_question`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_niveau_id:       data.niveau_id,
      p_question:        data.question,
      p_choix:           data.choix,
      p_reponse_correcte: data.reponse_correcte,
      p_ordre:           data.ordre ?? 0,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  // RPC retourne le BIGINT id de la question créée
  return res.json();
}

export async function updateQuestion(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_question`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_id:              id,
      p_question:        data.question        ?? null,
      p_choix:           data.choix           ?? null,
      p_reponse_correcte: data.reponse_correcte ?? null,
      p_ordre:           data.ordre           ?? null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
}

export async function deleteQuestion(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_delete_question`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_id: id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
}

// ─── ÉLÈVES ──────────────────────────────────────────────────────────────────

/** Créer un compte élève via fonction SQL */
export async function createEleve(nom, prenom, identifiant, password) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_user`, {
    method: 'POST',
    body: JSON.stringify({ p_identifiant: identifiant, p_password: password, p_nom: nom, p_prenom: prenom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Erreur création élève ${res.status}`);
  }
  const userId = await res.json();
  return { id: userId, nom, prenom, identifiant };
}

/** Récupérer tous les élèves — phase RLS #2.D.2 : passe par RPC.
 *  La table `profils_eleves` est fermée à anon (hashes bcrypt + PII mineurs). */
export async function fetchEleves() {
  return rpcAdminWrite('admin_fetch_eleves',
    { p_admin_token: requireAdminToken() },
    'Erreur chargement élèves');
}

/** Récupérer la progression d'un élève (via RPC SECURITY DEFINER depuis la
 *  phase RLS #2.A). La table `eleve_progression` est fermée à anon. */
export async function fetchEleveProgression(eleveId) {
  if (!safeEleveId(eleveId)) return [];
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_eleve_progression`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_eleve_id: eleveId }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// Defense-in-depth : valide le format UUID avant interpolation dans une URL
// PostgREST. Sans ça, un `eleveId` malformé pourrait injecter des paramètres
// (ex: "x&select=*"). Les UUIDs DB sont sûrs, c'est une garantie pour les
// futurs appelants qui passeraient une string non-validée.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function safeEleveId(eleveId) {
  if (typeof eleveId !== 'string' || !UUID_RE.test(eleveId)) {
    throw new Error('eleveId invalide');
  }
  return encodeURIComponent(eleveId);
}

// Borne défensive contre un élève corrompu avec des milliers de lignes
// (DoS UI + quota Supabase). 500 couvre largement une scolarité complète.
const ELEVE_FETCH_LIMIT = 500;

/** Notes d'un élève (lecture admin) — phase RLS #2.C : passe par RPC.
 *  La table `notes` est désormais fermée à anon (RGPD scolaire mineurs). */
export async function fetchNotesEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_notes_eleve`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_eleve_id: id }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const rows = await res.json();
  // Réformat de la jointure pour rester compatible avec le caller existant
  // (Eleves.jsx attend `r.evaluation = { id, titre, date }`).
  return rows.map(r => ({
    id: r.id,
    score: r.score,
    absent: r.absent,
    commentaire: r.commentaire,
    created_at: r.created_at,
    evaluation: r.evaluation_id
      ? { id: r.evaluation_id, titre: r.eval_titre, date: r.eval_date }
      : null,
  }));
}

/** Retards & absences d'un élève (lecture admin) — phase RLS #2.C : passe par RPC. */
export async function fetchRetardsAbsencesEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_retards_absences_eleve`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_eleve_id: id }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Appréciations d'un élève (lecture admin) — phase RLS #2.C : passe par RPC. */
export async function fetchObservationsEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_observations_eleve`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_eleve_id: id }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Ajouter une appréciation sur un élève (créée par l'admin). */
export async function adminCreateObservation({ eleve_id, classe_id, type, contenu }) {
  return rpcAdminWrite('admin_create_observation', {
    p_admin_token: requireAdminToken(),
    p_eleve_id: eleve_id,
    p_classe_id: classe_id ?? null,
    p_type: type,
    p_contenu: contenu,
  }, 'Erreur ajout appréciation');
}

/** Ajouter un retard ou une absence sur un élève (créé par l'admin). */
export async function adminCreateRetardAbsence({ eleve_id, classe_id, type, date, commentaire }) {
  return rpcAdminWrite('admin_create_retard_absence', {
    p_admin_token: requireAdminToken(),
    p_eleve_id: eleve_id,
    p_classe_id: classe_id ?? null,
    p_type: type,
    p_date: date,
    p_commentaire: commentaire ?? null,
  }, 'Erreur ajout retard/absence');
}

/** Réinitialiser la progression de TOUS les élèves pour un niveau donné.
 *  À appeler quand les questions QCM d'un niveau sont supprimées / remplacées,
 *  pour éviter que d'anciens records reussi=true ressurgissent.
 *  Migré phase RLS #2.A vers `admin_reset_progression_niveau` (vérification
 *  admin côté SQL — l'ancienne `reset_progression_niveau` était ouverte à anon). */
export async function resetProgressionNiveau(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_reset_progression_niveau`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_niveau_id: niveauId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────

/** Convertit un titre en chemin URL-safe (ex: "Les 5 piliers" → "Les-5-piliers") */
export function toSlug(str) {
  if (!str) return 'sans-titre';
  return (
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s\-]/g, '').trim().replace(/\s+/g, '-') || 'sans-titre'
  );
}

/** Supprimer récursivement tous les fichiers sous un préfixe dans le bucket "cours" */
export async function deleteStorageFolder(prefix) {
  const BUCKET = 'cours';
  const listRes = await authFetch(
    `${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(BUCKET)}`,
    { method: 'POST', body: JSON.stringify({ prefix, limit: 1000, offset: 0 }) }
  );
  if (!listRes.ok) return;
  const items = await listRes.json().catch(() => []);
  if (!Array.isArray(items)) return;

  const files   = items.filter(i => i.id).map(i => `${prefix}/${i.name}`);
  const folders = items.filter(i => !i.id && i.name).map(i => `${prefix}/${i.name}`);

  for (const folder of folders) await deleteStorageFolder(folder);

  if (files.length > 0) {
    await authFetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}`,
      { method: 'DELETE', body: JSON.stringify({ prefixes: files }) }
    );
  }
}

/** Supprimer l'ancienne image de couverture (cover.*) d'un dossier avant un nouvel upload */
export async function deleteOldCover(folderPath) {
  const BUCKET = 'cours';
  const listRes = await authFetch(
    `${SUPABASE_URL}/storage/v1/object/list/${encodeURIComponent(BUCKET)}`,
    { method: 'POST', body: JSON.stringify({ prefix: folderPath, limit: 20, offset: 0 }) }
  );
  if (!listRes.ok) return;
  const items = await listRes.json().catch(() => []);
  if (!Array.isArray(items)) return;
  const covers = items
    .filter(i => i.id && i.name.startsWith('cover.'))
    .map(i => `${folderPath}/${i.name}`);
  if (covers.length === 0) return;
  await authFetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}`,
    { method: 'DELETE', body: JSON.stringify({ prefixes: covers }) }
  );
}

/** Uploader un fichier dans le bucket "cours" au chemin spécifié */
export async function uploadFile(file, path) {
  const BUCKET = 'cours';
  const res = await authFetch(
    `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${path}`,
    {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur upload ${res.status}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${path}`;
}

// ─── PHOTOS ÉLÈVES ────────────────────────────────────────────────────────────
// Upload et suppression transitent par l'Edge Function "eleve-photo" qui :
//   - vérifie l'admin_session via RPC SQL,
//   - utilise la service_role key pour écrire dans le bucket eleves-photos
//     (les INSERT/UPDATE/DELETE sont bloqués pour anon/authenticated au niveau policy),
//   - met à jour profils_eleves.photo_url / photo_path dans la foulée.

const PHOTO_MAX_BYTES = 3 * 1024 * 1024;
const PHOTO_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
const ELEVE_PHOTO_FN = `${SUPABASE_URL}/functions/v1/eleve-photo`;

function getAdminId() {
  try {
    const s = JSON.parse(sessionStorage.getItem('admin_session'));
    return s?.id || null;
  } catch { return null; }
}

/** Récupère le token de session admin (phase 3). NULL si pas connecté ou
 *  ancienne session sans token (admin doit alors se reloguer). */
function getAdminToken() {
  try {
    const s = JSON.parse(sessionStorage.getItem('admin_session'));
    return s?.token || null;
  } catch { return null; }
}

/** Upload une photo de profil élève via l'Edge Function.
 *  Retourne { photo_url, photo_path } — la DB est déjà mise à jour par la fonction. */
export async function uploadElevePhoto(eleveId, file) {
  if (!file) throw new Error('Aucun fichier sélectionné.');
  if (!file.type || !file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image (JPG, PNG ou WebP).');
  }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!PHOTO_ALLOWED_EXT.includes(ext)) {
    throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.');
  }
  if (file.size > PHOTO_MAX_BYTES) {
    throw new Error('Image trop lourde (3 Mo maximum).');
  }
  const adminId = getAdminId();
  if (!adminId) throw new Error('Session admin invalide. Reconnectez-vous.');

  const res = await fetch(ELEVE_PHOTO_FN, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': file.type,
      'x-admin-id': adminId,
      'x-op': 'upload',
      'x-eleve-id': eleveId,
      'x-ext': ext,
    },
    body: file,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur upload photo ${res.status}`);
  }
  return res.json(); // { photo_url, photo_path }
}

/** Supprime la photo d'un élève via l'Edge Function (storage + DB). */
export async function deleteElevePhoto(eleveId) {
  const adminId = getAdminId();
  if (!adminId) throw new Error('Session admin invalide. Reconnectez-vous.');

  const res = await fetch(ELEVE_PHOTO_FN, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'Content-Type': 'application/json',
      'x-admin-id': adminId,
      'x-op': 'delete',
      'x-eleve-id': eleveId,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erreur suppression photo ${res.status}`);
  }
}

/** Réinitialiser le mot de passe d'un élève (génère un provisoire + force changement à la prochaine connexion) */
export async function resetElevePassword(id, newPassword) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_reset_eleve_password`, {
    method: 'POST',
    body: JSON.stringify({ p_id: id, p_new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
}

/** Supprimer un élève (messages + photo + profil).
 *  Le DELETE explicite sur `eleve_progression` a été retiré phase RLS #2.A :
 *  la FK `eleve_progression.eleve_id → profils_eleves.id` a `ON DELETE CASCADE`,
 *  donc Postgres nettoie automatiquement. (`eleve_progression` est désormais
 *  fermé à anon — un DELETE explicite planterait.) */
export async function deleteEleve(id) {
  // 0. Purger les photos via l'Edge Function (best-effort).
  await deleteElevePhoto(id).catch(() => {});
  // 1. Suppression atomique chat_messages + profils_eleves via RPC (phase 2.D.2).
  //    La cascade FK purge eleve_progression, parent_eleves, eleve_sessions, etc.
  await rpcAdminWrite('admin_delete_eleve_full',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression élève');
}

/** Modifier les infos d'un élève (nom, prénom, téléphone, email_contact, classe_id…) */
export async function updateEleve(id, data) {
  await rpcAdminWrite('admin_update_eleve',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification élève');
}

/** Modifier le niveau scolaire d'un élève (via fonction SECURITY DEFINER — contourne le RLS) */
export async function updateEleveNiveauScolaire(eleveId, niveauScolaireId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_eleve_niveau_scolaire`, {
    method: 'POST',
    body: JSON.stringify({ p_id: eleveId, p_niveau_scolaire_id: niveauScolaireId || null }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── THÉMATIQUES (lecture REST direct, écriture via RPCs phase RLS #2.B) ───

export async function fetchThematiques(moduleId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/thematiques?module_id=eq.${moduleId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createThematique(data) {
  return rpcAdminWrite('admin_create_thematique',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création thématique');
}

export async function updateThematique(id, data) {
  await rpcAdminWrite('admin_update_thematique',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification thématique');
}

export async function deleteThematique(id) {
  await rpcAdminWrite('admin_delete_thematique',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression thématique');
}

export async function fetchNiveauxByThematique(thId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?thematique_id=eq.${thId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── LEÇONS (lecture REST direct, écriture via RPCs phase RLS #2.B) ────────

export async function fetchLecons(thId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/lecons?thematique_id=eq.${thId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createLecon(data) {
  return rpcAdminWrite('admin_create_lecon',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création leçon');
}

export async function updateLecon(id, data) {
  await rpcAdminWrite('admin_update_lecon',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification leçon');
}

export async function deleteLecon(id) {
  await rpcAdminWrite('admin_delete_lecon',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression leçon');
}

export async function fetchNiveauxByLecon(leconId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?lecon_id=eq.${leconId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── Niveaux scolaires — phase RLS #2.F : SELECT REST direct, écritures via RPCs
export async function fetchNiveauxScolaires() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux_scolaires?order=ordre.asc,nom.asc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}
export async function createNiveauScolaire(nom, ordre) {
  const id = await rpcAdminWrite('admin_create_niveau_scolaire',
    { p_admin_token: requireAdminToken(), p_nom: nom, p_ordre: ordre ?? 0 },
    'Erreur création niveau scolaire');
  return { id, nom, ordre: ordre ?? 0 };
}
export async function updateNiveauScolaire(id, data) {
  await rpcAdminWrite('admin_update_niveau_scolaire',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification niveau scolaire');
}
export async function deleteNiveauScolaire(id) {
  await rpcAdminWrite('admin_delete_niveau_scolaire',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression niveau scolaire');
}

// ─── Classes — phase RLS #2.F : SELECT REST direct, écritures via RPCs
export async function fetchClasses(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/classes?niveau_id=eq.${niveauId}&order=nom.asc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}
export async function fetchAllClasses() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/classes?order=nom.asc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}
export async function createClasse(niveauId, nom) {
  const id = await rpcAdminWrite('admin_create_classe',
    { p_admin_token: requireAdminToken(), p_niveau_id: niveauId, p_nom: nom },
    'Erreur création classe');
  return { id, niveau_id: niveauId, nom };
}
export async function updateClasse(id, nom) {
  await rpcAdminWrite('admin_update_classe',
    { p_admin_token: requireAdminToken(), p_id: id, p_nom: nom },
    'Erreur modification classe');
}
export async function deleteClasse(id) {
  await rpcAdminWrite('admin_delete_classe',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression classe');
}

// ─── Enseignants — phase RLS #2.D.1 : tables `enseignants` + `enseignant_classes`
//     verrouillées (USING(false)). Tous les CRUD passent par RPCs admin_*.

export async function fetchEnseignants() {
  return rpcAdminWrite('admin_fetch_enseignants',
    { p_admin_token: requireAdminToken() },
    'Erreur chargement enseignants');
}

export async function createEnseignant(data) {
  // La RPC retourne juste l'UUID — on construit un objet compatible avec
  // les anciens callers qui s'attendaient à recevoir la ligne complète.
  const id = await rpcAdminWrite('admin_insert_enseignant',
    { p_admin_token: requireAdminToken(), p_data: data },
    'Erreur création enseignant');
  return { id, ...data };
}

export async function updateEnseignant(id, data) {
  await rpcAdminWrite('admin_update_enseignant',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: data },
    'Erreur modification enseignant');
}

export async function deleteEnseignant(id) {
  await rpcAdminWrite('admin_delete_enseignant',
    { p_admin_token: requireAdminToken(), p_id: id },
    'Erreur suppression enseignant');
}

export async function fetchEnseignantClasses(enseignantId) {
  const data = await rpcAdminWrite('admin_fetch_enseignant_classes',
    { p_admin_token: requireAdminToken(), p_enseignant_id: enseignantId },
    'Erreur chargement classes enseignant');
  return Array.isArray(data) ? data : [];
}

export async function setEnseignantClasses(enseignantId, classeIds) {
  // Une seule RPC transactionnelle — résout le bug d'incohérence DELETE+INSERT
  // séquentiel signalé en phase 1 (enseignant sans classe pendant la fenêtre).
  await rpcAdminWrite('admin_set_enseignant_classes',
    { p_admin_token: requireAdminToken(), p_enseignant_id: enseignantId, p_classe_ids: classeIds || [] },
    'Erreur assignation classes enseignant');
}

/** Créer le compte auth d'un enseignant (identifiant + mot de passe bcrypt) */
export async function adminCreateEnseignantAccount(id, identifiant, password) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_enseignant`, {
    method: 'POST',
    body: JSON.stringify({ p_id: id, p_identifiant: identifiant, p_password: password }),
  });
  if (!res.ok) throw new Error(`Erreur création compte enseignant ${res.status}`);
}

/** Réinitialiser le mot de passe d'un enseignant */
export async function adminResetEnseignantPassword(id, newPassword) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_reset_enseignant_password`, {
    method: 'POST',
    body: JSON.stringify({ p_id: id, p_new_password: newPassword }),
  });
  if (!res.ok) throw new Error(`Erreur reset mot de passe enseignant ${res.status}`);
}

/** Récupérer l'ID d'un élève par son identifiant (fallback si createEleve ne retourne pas l'UUID).
 *  Phase RLS #2.D.2 : passe par RPC. */
export async function fetchEleveIdParIdentifiant(identifiant) {
  try {
    return await rpcAdminWrite('admin_fetch_eleve_id_par_identifiant',
      { p_admin_token: requireAdminToken(), p_identifiant: identifiant },
      'Erreur lookup identifiant') || null;
  } catch {
    return null;
  }
}

/** Lier une inscription à un élève et passer le statut à 'converti' */
export async function updateInscriptionEleveId(inscriptionId, eleveId) {
  try {
    await rpcAdminWrite('admin_update_inscription_eleve_id',
      { p_admin_token: requireAdminToken(), p_id: inscriptionId, p_eleve_id: eleveId },
      'Erreur conversion inscription');
    return true;
  } catch {
    return false;
  }
}

/** Marquer une inscription comme consultée (viewed_at = NOW()). Utilisé pour
 *  que le badge ne compte que les inscriptions "Nouveau" non encore vues. */
export async function markInscriptionViewed(inscriptionId) {
  await rpcAdminWrite('admin_mark_inscription_viewed',
    { p_admin_token: requireAdminToken(), p_inscription_id: inscriptionId },
    'Erreur marquage consultation');
}

/** Récupérer un élève par son id — phase RLS #2.D.2 : passe par RPC. */
export async function fetchEleveById(eleveId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_eleve_by_id`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_eleve_id: eleveId }),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

/** Activer / désactiver un élève — passe par admin_update_eleve (table verrouillée phase 2.D.2) */
export async function updateEleveActif(id, actif) {
  await rpcAdminWrite('admin_update_eleve',
    { p_admin_token: requireAdminToken(), p_id: id, p_data: { actif } },
    'Erreur modification statut élève');
}

// ─── EMAIL ───────────────────────────────────────────────────────────────────

/** Envoie l'email de bienvenue via Supabase Edge Function (Resend) */
/** Récupère les sessions de connexion d'un élève sur une période donnée
 *  (phase RLS #2.E : passe par RPC, eleve_sessions verrouillée). */
export async function fetchEleveActivite(eleveId, from, to) {
  return rpcAdminWrite('admin_fetch_eleve_sessions',
    { p_admin_token: requireAdminToken(), p_eleve_id: eleveId, p_from: from, p_to: to },
    'Erreur chargement activité');
}

// ─── SURVEILLANCE DISCUSSIONS (phase RLS #2.E : RPCs) ───────────────────────

/** Toutes les conversations dédupliquées (déduplication faite côté SQL via DISTINCT ON). */
export async function fetchAllConversations() {
  try {
    const rows = await rpcAdminWrite('admin_fetch_all_conversations',
      { p_admin_token: requireAdminToken() },
      'Erreur chargement conversations');
    // Reformat pour compat ascendante avec les composants existants
    return (Array.isArray(rows) ? rows : []).map(r => ({
      eleve_id: r.eleve_id,
      enseignant_id: r.enseignant_id,
      contenu: r.contenu,
      created_at: r.created_at,
      sender_role: r.sender_role,
      profils_eleves: r.eleve_id ? {
        id: r.eleve_id,
        nom: r.eleve_nom,
        prenom: r.eleve_prenom,
        classe_id: r.eleve_classe_id,
        photo_url: r.eleve_photo_url,
        photo_scale: r.eleve_photo_scale,
        photo_pos_x: r.eleve_photo_pos_x,
        photo_pos_y: r.eleve_photo_pos_y,
      } : null,
      enseignants: r.enseignant_id ? {
        id: r.enseignant_id,
        nom: r.enseignant_nom,
        prenom: r.enseignant_prenom,
      } : null,
    }));
  } catch {
    return [];
  }
}

/** Tous les messages d'une conversation élève ↔ enseignant */
export async function fetchConversationMessages(eleveId, enseignantId) {
  try {
    return await rpcAdminWrite('admin_fetch_conversation_messages',
      { p_admin_token: requireAdminToken(), p_eleve_id: eleveId, p_enseignant_id: enseignantId },
      'Erreur chargement messages') || [];
  } catch {
    return [];
  }
}

/** POST authentifié vers la Edge function d'envoi mail. Ajoute le header
 *  `x-admin-id` que l'Edge vérifie via _is_admin avant d'appeler Resend. */
async function postEdgeMail(payload, errorLabel) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON}`,
      'x-admin-id': requireAdminId(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${errorLabel} ${res.status}`);
  return res.json();
}

/** Mail de bienvenue envoyé à l'email de contact de l'élève.
 *  `parents` : liste des comptes parents **nouvellement créés** à inclure dans
 *  le mail ({label, identifiant, password}[]). Les parents rattachés à un
 *  compte existant ne sont PAS dans ce tableau — ils reçoivent un mail dédié
 *  via sendParentAttachEmail (pas de mdp à transmettre, le compte existe déjà). */
export function sendWelcomeEmail({ email, prenom, nom, identifiant, tempPassword, classeNom, parents }) {
  return postEdgeMail({
    kind: 'welcome',
    email, prenom, nom, identifiant, tempPassword, classeNom,
    parents: Array.isArray(parents) ? parents : [],
  }, 'Erreur envoi email');
}

/** Mail de notification envoyé à un parent **existant** rattaché à un nouvel
 *  enfant. Pas d'identifiant/mdp provisoire : le parent utilise le compte qu'il a déjà. */
export function sendParentAttachEmail({ email, foyerLabel, identifiant, elevePrenom, eleveNom, classeNom }) {
  return postEdgeMail({
    kind: 'attach',
    email, foyerLabel, identifiant, elevePrenom, eleveNom, classeNom,
  }, 'Erreur envoi email (attach)');
}

// ─── PARENTS ─────────────────────────────────────────────────────────────────
// Toutes les fonctions admin_* côté SQL exigent un p_admin_id valide (vérifié
// via _is_admin). On le lit depuis admin_session juste avant l'appel — si la
// session a expiré localement, on remonte une erreur claire plutôt que de laisser
// la RPC échouer avec un message générique.

function requireAdminId() {
  const id = getAdminId();
  if (!id) throw new Error('Session admin invalide. Reconnecte-toi.');
  return id;
}

/** Phase 3 : retourne le token admin. Toutes les RPCs admin_* l'attendent
 *  comme p_admin_token. Si l'admin est connecté avec une ancienne session
 *  (sans token), on jette une erreur explicite pour forcer le re-login. */
function requireAdminToken() {
  const token = getAdminToken();
  if (!token) throw new Error('Session admin invalide. Reconnecte-toi.');
  return token;
}

/** Créer un compte parent + lier à l'élève en une transaction (fonction SQL). */
export async function adminCreateParent({
  identifiant, password,
  pere_nom = null, pere_prenom = null,
  mere_nom = null, mere_prenom = null,
  email, telephone, eleve_id, lien = 'parents',
}) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_parent`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_identifiant: identifiant,
      p_password:    password,
      p_pere_nom:    pere_nom,
      p_pere_prenom: pere_prenom,
      p_mere_nom:    mere_nom,
      p_mere_prenom: mere_prenom,
      p_email:       email,
      p_telephone:   telephone,
      p_eleve_id:    eleve_id,
      p_lien:        lien,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Erreur création parent ${res.status}`);
  }
  return res.json(); // UUID du parent
}

/** Rechercher un parent existant par email OU téléphone.
 *  Retourne un tableau (0, 1 ou N matchs). Chaque ligne inclut `enfants` (JSONB). */
export async function adminFindParentByContact(email, telephone) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_find_parent_by_contact`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_email:    email || null,
      p_tel:      telephone || null,
    }),
  });
  if (!res.ok) return [];
  return res.json();
}

/** Rattacher un parent existant à un élève (nouvelle ligne parent_eleves). */
export async function adminLinkParentEleve(parentId, eleveId, lien = 'parents') {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_link_parent_eleve`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_parent_id: parentId,
      p_eleve_id:  eleveId,
      p_lien:      lien,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur rattachement parent ${res.status}`);
  }
}

/** Réinitialiser le mot de passe d'un parent. */
export async function adminResetParentPassword(parentId, newPassword) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_reset_parent_password`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_id:           parentId,
      p_new_password: newPassword,
    }),
  });
  if (!res.ok) throw new Error(`Erreur reset mdp parent ${res.status}`);
}

/** Créer un parent SANS rattachement à un élève (gestion autonome). */
export async function adminCreateParentStandalone({
  identifiant, password,
  pere_nom = null, pere_prenom = null,
  mere_nom = null, mere_prenom = null,
  email, telephone,
}) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_parent_standalone`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_identifiant: identifiant,
      p_password:    password,
      p_pere_nom:    pere_nom,
      p_pere_prenom: pere_prenom,
      p_mere_nom:    mere_nom,
      p_mere_prenom: mere_prenom,
      p_email:       email,
      p_telephone:   telephone,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Erreur création parent ${res.status}`);
  }
  return res.json(); // UUID du parent
}

/** Liste paginée des parents avec recherche nom/email/tel/identifiant.
 *  Chaque ligne contient un `total_count` (bigint) pour la pagination. */
export async function adminFetchParentsPaginated({ search = '', limit = 25, offset = 0 } = {}) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_parents_paginated`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_search:   search || null,
      p_limit:    limit,
      p_offset:   offset,
    }),
  });
  if (!res.ok) throw new Error(`Erreur liste parents ${res.status}`);
  return res.json();
}

/** Parents rattachés à un élève donné (pour fiche élève). */
export async function adminFetchParentsOfEleve(eleveId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_parents_of_eleve`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_eleve_id: eleveId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur chargement parents de l'élève ${res.status}`);
  }
  return res.json();
}

/** Enfants rattachés à un parent (pour fiche parent). */
export async function adminFetchElevesOfParent(parentId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_eleves_of_parent`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_parent_id: parentId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur chargement enfants du parent ${res.status}`);
  }
  return res.json();
}

/** Patch partiel des coordonnées d'un parent (NULL = ne change pas). */
export async function adminUpdateParent(parentId, patch = {}) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_parent`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_id:          parentId,
      p_pere_nom:    patch.pere_nom    ?? null,
      p_pere_prenom: patch.pere_prenom ?? null,
      p_mere_nom:    patch.mere_nom    ?? null,
      p_mere_prenom: patch.mere_prenom ?? null,
      p_email:       patch.email       ?? null,
      p_telephone:   patch.telephone   ?? null,
      p_actif:       typeof patch.actif === 'boolean' ? patch.actif : null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur modification parent ${res.status}`);
  }
}

/** Supprimer un parent (refusé si des enfants lui sont encore rattachés). */
export async function adminDeleteParent(parentId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_delete_parent`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_id: parentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur suppression parent ${res.status}`);
  }
}

/** Détacher un parent d'un élève (supprime la ligne pivot). */
export async function adminUnlinkParentEleve(parentId, eleveId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_unlink_parent_eleve`, {
    method: 'POST',
    body: JSON.stringify({
      p_admin_token: requireAdminToken(),
      p_parent_id: parentId,
      p_eleve_id:  eleveId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur détachement parent ${res.status}`);
  }
}

// ─── DÉCLARATIONS PARENTS ─────────────────────────────────────────────────────

/** Liste paginée de toutes les déclarations parents. */
export async function adminFetchDeclarations({ limit = 25, offset = 0 } = {}) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_fetch_declarations`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken(), p_limit: limit, p_offset: offset }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erreur ${res.status}`);
  }
  return res.json();
}

/** Nombre de déclarations non vues (badge sidebar). */
export async function adminCountNouvellesDeclarations() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_count_nouvelles_declarations`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken() }),
  });
  if (!res.ok) return 0;
  const n = await res.json();
  return typeof n === 'number' ? n : 0;
}

/** Marque toutes les déclarations comme vues (appelé à l'ouverture de la page). */
export async function adminMarkDeclarationsVues() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_mark_declarations_vues`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_token: requireAdminToken() }),
  });
  await res.text().catch(() => {});
}

// ─── ACCUSÉS DE RÉCEPTION DES NOTES ──────────────────────────────────────────

/** Accusés de réception des notes pour un élève (fiche élève admin). */
export async function adminFetchNoteAcks(eleveId) {
  return rpcAdminWrite('admin_fetch_note_acks',
    { p_admin_token: requireAdminToken(), p_eleve_id: eleveId },
    'Erreur chargement accusés de réception');
}
