// ─── Configuration Supabase pour le portail élève ─────────────────────────────
const SUPABASE_URL  = 'https://nsdnzqdbpdncrksgxtar.supabase.co';
const SUPABASE_ANON = 'sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL';

const ANON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

// ─── AUTH CUSTOM (sans Supabase Auth) ────────────────────────────────────────

/** Connexion élève via fonction SQL */
export async function loginEleve(identifiant, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_eleve`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_identifiant: identifiant, p_password: password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.hint || 'Identifiants incorrects');
  }
  // Stocker l'utilisateur en session
  sessionStorage.setItem('eleve_user', JSON.stringify(data));
  return data;
}

/** Déconnexion élève */
export function logoutEleve() {
  sessionStorage.removeItem('eleve_user');
}

/** Récupérer les infos de l'élève connecté */
export function getEleveUser() {
  try { return JSON.parse(sessionStorage.getItem('eleve_user')); } catch { return null; }
}

/** Changer le mot de passe (1ère connexion) */
export async function changePassword(eleveId, oldPassword, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/change_eleve_password`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_id: eleveId, p_old: oldPassword, p_new: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Erreur changement mot de passe');
  if (data === false) throw new Error('Ancien mot de passe incorrect');
  // Mettre à jour la session
  const user = getEleveUser();
  if (user) {
    user.must_change_password = false;
    sessionStorage.setItem('eleve_user', JSON.stringify(user));
  }
  return true;
}

// ─── MODULES & NIVEAUX ────────────────────────────────────────────────────────

export async function fetchModulesEleve() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/modules?actif=eq.true&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchNiveauxEleve(moduleId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?module_id=eq.${moduleId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchContenusEleve(niveauId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contenus?niveau_id=eq.${niveauId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchQCMEleve(niveauId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/qcm_questions?niveau_id=eq.${niveauId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Toutes les thématiques d'un module (sans filtre) — pour détecter si le module est structuré en thématiques */
export async function fetchAllThematiquesEleve(moduleId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/thematiques?module_id=eq.${moduleId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Thématiques filtrées par niveau scolaire de l'élève (filtrage côté client) */
export async function fetchThematiquesEleve(moduleId, niveauScolaireId) {
  if (!niveauScolaireId) return [];
  const all = await fetchAllThematiquesEleve(moduleId);
  // Filtrage client : garde les thématiques dont niveaux_scolaires_ids contient l'UUID de l'élève
  return all.filter(th =>
    Array.isArray(th.niveaux_scolaires_ids) &&
    th.niveaux_scolaires_ids.includes(niveauScolaireId)
  );
}

/** Récupérer le niveau scolaire d'un élève depuis la DB (fallback si absent de la session) */
export async function fetchEleveNiveauScolaireId(eleveId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_eleve_niveau_scolaire`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_id: eleveId }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data ?? null;
}

export async function fetchNiveauxByThematiqueEleve(thId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?thematique_id=eq.${thId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── PROGRESSION ──────────────────────────────────────────────────────────────

export async function fetchProgression(eleveId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_progression`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_eleve_id: eleveId }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function saveProgression(eleveId, niveauId, score, reussi) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/save_progression`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_eleve_id: eleveId, p_niveau_id: niveauId, p_score: score, p_reussi: reussi }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
