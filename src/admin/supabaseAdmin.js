// ─── Configuration Supabase pour l'admin ────────────────────────────────────
const SUPABASE_URL  = 'https://nsdnzqdbpdncrksgxtar.supabase.co';
const SUPABASE_ANON = 'sb_publishable_gy6LoTbs3JCS4v77W2Oomg_weoSRhWL';

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
  sessionStorage.setItem('admin_auth', 'true');
  return admin;
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

/** Activer / désactiver un élève */
export async function updateEleveActif(id, actif) {
  const res = await authFetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${id}`, {
    method: 'PATCH', headers: { 'Prefer': 'return=minimal' }, body: JSON.stringify({ actif }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
