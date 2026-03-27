// ─── Configuration Supabase pour l'admin ────────────────────────────────────
const SUPABASE_URL  = 'https://nsdnzqdbpdncrksgxtar.supabase.co';
const SUPABASE_ANON = 'sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL';

/**
 * Headers pour les requêtes authentifiées (admin).
 * Utilise le token de session si disponible, sinon la clé anon.
 */
function getHeaders() {
  const token = sessionStorage.getItem('admin_token') || SUPABASE_ANON;
  return {
    'Content-Type':  'application/json',
    'apikey':         SUPABASE_ANON,
    'Authorization': `Bearer ${token}`,
  };
}

/** Rafraîchir le token admin automatiquement */
async function refreshAdminToken() {
  const refreshToken = sessionStorage.getItem('admin_refresh_token');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    sessionStorage.setItem('admin_token', data.access_token);
    sessionStorage.setItem('admin_refresh_token', data.refresh_token);
    return true;
  } catch { return false; }
}

/** Requête authentifiée avec retry automatique si JWT expiré */
async function authFetch(url, options = {}) {
  let res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
  if (res.status === 401) {
    const refreshed = await refreshAdminToken();
    if (refreshed) {
      res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
    } else {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_auth');
      window.location.href = '/admin/login';
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
  }
  return res;
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

/** Connexion admin via Supabase Auth */
export async function loginAdmin(email, password) {
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ email, password }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || err.msg || 'Erreur de connexion');
  }
  const data = await res.json();
  // Stocker le token + refresh token pour les requêtes authentifiées
  sessionStorage.setItem('admin_token', data.access_token);
  sessionStorage.setItem('admin_refresh_token', data.refresh_token);
  sessionStorage.setItem('admin_auth', 'true');
  return data;
}

/** Déconnexion */
export function logoutAdmin() {
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_refresh_token');
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

/** Créer un compte élève via fonction SQL (sans email, sans rate limit) */
export async function createEleve(nom, prenom, email, password) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/rpc/admin_create_user`, {
    method: 'POST',
    body: JSON.stringify({ p_email: email, p_password: password, p_nom: nom, p_prenom: prenom }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Erreur création élève ${res.status}`);
  }
  const userId = await res.json();
  return { id: userId, nom, prenom, email };
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

/** Supprimer un élève (progression + profil) */
export async function deleteEleve(id) {
  // 1. Supprimer la progression de l'élève
  await authFetch(`${SUPABASE_URL}/rest/v1/eleve_progression?eleve_id=eq.${id}`, { method: 'DELETE' });
  // 2. Supprimer le profil
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Modifier les infos d'un élève (nom, prénom) */
export async function updateEleve(id, data) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Activer / désactiver un élève */
export async function updateEleveActif(id, actif) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ actif }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
