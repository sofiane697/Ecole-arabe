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

/** Récupérer toutes les inscriptions */
export async function fetchInscriptions() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/inscriptions?order=created_at.desc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Récupérer tous les messages */
export async function fetchMessages() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/messages?order=created_at.desc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Mettre à jour le statut d'une inscription */
export async function updateInscriptionStatut(id, statut) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/inscriptions?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ statut }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Marquer un message comme lu / non lu */
export async function updateMessageLu(id, lu) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ lu }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Supprimer un message */
export async function deleteMessage(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Connexion admin via identifiant + mot de passe (bcrypt, table profils_admins) */
export async function loginAdmin(identifiant, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_admin_custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
    body: JSON.stringify({ p_identifiant: identifiant.trim(), p_password: password }),
  });
  if (!res.ok) throw new Error('Identifiant ou mot de passe incorrect');
  const admin = await res.json();
  if (!admin || !admin.id) throw new Error('Identifiant ou mot de passe incorrect');
  sessionStorage.setItem('admin_session', JSON.stringify(admin));
  return admin;
}

export async function verifyAdminSession(adminId) {
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/rpc/verify_admin_session`,
    { method: 'POST', body: JSON.stringify({ p_id: adminId }) }
  );
  if (!res.ok) return false;
  return await res.json();
}

/** Déconnexion */
export function logoutAdmin() {
  sessionStorage.removeItem('admin_session');
  sessionStorage.removeItem('admin_auth');
}

// ─── MODULES ─────────────────────────────────────────────────────────────────

export async function fetchModules() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/modules?order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createModule(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/modules`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateModule(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/modules?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteModule(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/modules?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── NIVEAUX ─────────────────────────────────────────────────────────────────

export async function fetchNiveaux(moduleId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?module_id=eq.${moduleId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createNiveau(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateNiveau(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteNiveau(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── CONTENUS ────────────────────────────────────────────────────────────────

export async function fetchContenus(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/contenus?niveau_id=eq.${niveauId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createContenu(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/contenus`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateContenu(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/contenus?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteContenu(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/contenus?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
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

export async function fetchQCMNiveauxIds(niveauIds) {
  if (!niveauIds.length) return new Set();
  const ids = niveauIds.join(',');
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/qcm_questions?niveau_id=in.(${ids})&select=niveau_id`);
  const data = await res.json();
  return new Set((data || []).map(q => q.niveau_id));
}

export async function fetchQCM(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/qcm_questions?niveau_id=eq.${niveauId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createQuestion(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/qcm_questions`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateQuestion(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/qcm_questions?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteQuestion(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/qcm_questions?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
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

/** Récupérer tous les élèves */
export async function fetchEleves() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?order=created_at.desc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Récupérer la progression d'un élève */
export async function fetchEleveProgression(eleveId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/eleve_progression?eleve_id=eq.${eleveId}`);
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

/** Notes d'un élève (lecture admin) — jointure évaluations pour titre/date */
export async function fetchNotesEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/notes?eleve_id=eq.${id}` +
    `&select=id,score,absent,commentaire,created_at,evaluation:evaluations(id,titre,date_evaluation)` +
    `&order=created_at.desc&limit=${ELEVE_FETCH_LIMIT}`
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const rows = await res.json();
  return rows.map(r => ({
    ...r,
    evaluation: r.evaluation
      ? { id: r.evaluation.id, titre: r.evaluation.titre, date: r.evaluation.date_evaluation }
      : null,
  }));
}

/** Retards & absences d'un élève (lecture admin) */
export async function fetchRetardsAbsencesEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/retards_absences?eleve_id=eq.${id}` +
    `&select=id,type,date,commentaire&order=date.desc&limit=${ELEVE_FETCH_LIMIT}`
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Appréciations d'un élève (lecture admin) */
export async function fetchObservationsEleve(eleveId) {
  const id = safeEleveId(eleveId);
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/observations?eleve_id=eq.${id}` +
    `&select=id,type,contenu,created_at&order=created_at.desc&limit=${ELEVE_FETCH_LIMIT}`
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Réinitialiser la progression de TOUS les élèves pour un niveau donné.
 *  À appeler quand les questions QCM d'un niveau sont supprimées / remplacées,
 *  pour éviter que d'anciens records reussi=true ressurgissent. */
export async function resetProgressionNiveau(niveauId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/reset_progression_niveau`, {
    method: 'POST',
    body: JSON.stringify({ p_niveau_id: niveauId }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
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

/** Supprimer un élève (messages + progression + profil) */
export async function deleteEleve(id) {
  // 0. Purger les photos de profil via l'Edge Function (best-effort).
  //    Si elle échoue (session expirée, réseau…), la suppression DB continue ;
  //    les photos resteront alors dans le bucket jusqu'à nettoyage manuel.
  await deleteElevePhoto(id).catch(() => {});
  // 1. Supprimer les messages de l'élève
  await authFetch(`${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${id}`, { method: 'DELETE' });
  // 2. Supprimer la progression de l'élève
  await authFetch(`${SUPABASE_URL}/rest/v1/eleve_progression?eleve_id=eq.${id}`, { method: 'DELETE' });
  // 3. Supprimer le profil
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Modifier les infos d'un élève (nom, prénom, téléphone, email_contact, classe_id) */
export async function updateEleve(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Modifier le niveau scolaire d'un élève (via fonction SECURITY DEFINER — contourne le RLS) */
export async function updateEleveNiveauScolaire(eleveId, niveauScolaireId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_update_eleve_niveau_scolaire`, {
    method: 'POST',
    body: JSON.stringify({ p_id: eleveId, p_niveau_scolaire_id: niveauScolaireId || null }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── THÉMATIQUES ─────────────────────────────────────────────────────────────

export async function fetchThematiques(moduleId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/thematiques?module_id=eq.${moduleId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createThematique(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/thematiques`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateThematique(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/thematiques?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteThematique(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/thematiques?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function fetchNiveauxByThematique(thId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?thematique_id=eq.${thId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── LEÇONS ──────────────────────────────────────────────────────────────────

export async function fetchLecons(thId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/lecons?thematique_id=eq.${thId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function createLecon(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/lecons`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function updateLecon(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/lecons?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function deleteLecon(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/lecons?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

export async function fetchNiveauxByLecon(leconId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux?lecon_id=eq.${leconId}&order=ordre`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── Niveaux scolaires ────────────────────────────────────────────────────────
export async function fetchNiveauxScolaires() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux_scolaires?order=ordre.asc,nom.asc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}
export async function createNiveauScolaire(nom, ordre) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux_scolaires`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ nom, ordre }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return data[0];
}
export async function updateNiveauScolaire(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux_scolaires?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
export async function deleteNiveauScolaire(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/niveaux_scolaires?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── Classes ──────────────────────────────────────────────────────────────────
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
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({ niveau_id: niveauId, nom }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return data[0];
}
export async function updateClasse(id, nom) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ nom }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
export async function deleteClasse(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── Enseignants ──────────────────────────────────────────────────────────────
export async function fetchEnseignants() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/enseignants?order=nom.asc`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}
export async function createEnseignant(data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/enseignants`, {
    method: 'POST', headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const rows = await res.json();
  return rows[0];
}
export async function updateEnseignant(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/enseignants?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
export async function deleteEnseignant(id) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/enseignants?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── Enseignant ↔ Classes (jointure) ──────────────────────────────────────────
export async function fetchEnseignantClasses(enseignantId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/enseignant_classes?enseignant_id=eq.${enseignantId}&select=classe_id`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const rows = await res.json();
  return rows.map(r => r.classe_id);
}
export async function setEnseignantClasses(enseignantId, classeIds) {
  // Supprime toutes les assignations existantes puis réinsère
  const del = await authFetch(`${SUPABASE_URL}/rest/v1/enseignant_classes?enseignant_id=eq.${enseignantId}`, { method: 'DELETE' });
  if (!del.ok) throw new Error(`Erreur ${del.status}`);
  if (classeIds.length === 0) return;
  const rows = classeIds.map(cid => ({ enseignant_id: enseignantId, classe_id: cid }));
  const ins = await authFetch(`${SUPABASE_URL}/rest/v1/enseignant_classes`, {
    method: 'POST', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(rows),
  });
  if (!ins.ok) throw new Error(`Erreur ${ins.status}`);
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

/** Récupérer l'ID d'un élève par son identifiant (fallback si createEleve ne retourne pas l'UUID) */
export async function fetchEleveIdParIdentifiant(identifiant) {
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/profils_eleves?identifiant=eq.${encodeURIComponent(identifiant)}&select=id`
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0]?.id ?? null;
}

/** Lier une inscription à un élève et passer le statut à 'converti' */
export async function updateInscriptionEleveId(inscriptionId, eleveId) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/inscriptions?id=eq.${inscriptionId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ eleve_id: eleveId, statut: 'converti' }),
  });
  return res.ok;
}

/** Récupérer un élève par son id */
export async function fetchEleveById(eleveId) {
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${eleveId}&select=id,created_at,nom,prenom,email,must_change_password,actif,telephone,email_contact,classe_id,identifiant,niveau_scolaire_id,date_naissance`
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] ?? null;
}

/** Activer / désactiver un élève */
export async function updateEleveActif(id, actif) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ actif }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── EMAIL ───────────────────────────────────────────────────────────────────

/** Envoie l'email de bienvenue via Supabase Edge Function (Resend) */
/** Récupère les sessions de connexion d'un élève sur une période donnée */
export async function fetchEleveActivite(eleveId, from, to) {
  const fromEnc = encodeURIComponent(from);
  const toEnc   = encodeURIComponent(to);
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/eleve_sessions?eleve_id=eq.${eleveId}&started_at=gte.${fromEnc}&started_at=lte.${toEnc}&order=started_at.desc`
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── SURVEILLANCE DISCUSSIONS ────────────────────────────────────────────────

/** Toutes les conversations (dédupliquées, triées par dernier message) */
export async function fetchAllConversations() {
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/chat_messages` +
    `?select=eleve_id,enseignant_id,contenu,created_at,sender_role,` +
    `profils_eleves(id,nom,prenom,classe_id,photo_url,photo_scale,photo_pos_x,photo_pos_y),enseignants(id,nom,prenom)` +
    `&order=created_at.desc`
  );
  if (!res.ok) return [];
  const rows = await res.json();
  const seen = new Set();
  return rows.filter(r => {
    const key = `${r.eleve_id}|${r.enseignant_id}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

/** Tous les messages d'une conversation élève ↔ enseignant */
export async function fetchConversationMessages(eleveId, enseignantId) {
  const res = await authFetch(
    `${SUPABASE_URL}/rest/v1/chat_messages` +
    `?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}` +
    `&order=created_at.asc`
  );
  if (!res.ok) return [];
  return res.json();
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
      p_admin_id:    requireAdminId(),
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
      p_admin_id: requireAdminId(),
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
      p_admin_id:  requireAdminId(),
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
      p_admin_id:     requireAdminId(),
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
      p_admin_id:   requireAdminId(),
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
      p_admin_id: requireAdminId(),
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
      p_admin_id: requireAdminId(),
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
      p_admin_id:  requireAdminId(),
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
      p_admin_id:    requireAdminId(),
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
    body: JSON.stringify({ p_admin_id: requireAdminId(), p_id: parentId }),
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
      p_admin_id:  requireAdminId(),
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
    body: JSON.stringify({ p_admin_id: requireAdminId(), p_limit: limit, p_offset: offset }),
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
    body: JSON.stringify({ p_admin_id: requireAdminId() }),
  });
  if (!res.ok) return 0;
  const n = await res.json();
  return typeof n === 'number' ? n : 0;
}

/** Marque toutes les déclarations comme vues (appelé à l'ouverture de la page). */
export async function adminMarkDeclarationsVues() {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_mark_declarations_vues`, {
    method: 'POST',
    body: JSON.stringify({ p_admin_id: requireAdminId() }),
  });
  await res.text().catch(() => {});
}
