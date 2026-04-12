// ─── Configuration Supabase pour le portail élève ─────────────────────────────
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

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

/** Retourne un Set des niveau_ids qui ont au moins une question QCM — 1 seul appel batch */
export async function fetchQCMExistenceForNiveaux(niveauIds) {
  if (!niveauIds.length) return new Set();
  const ids = niveauIds.join(',');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/qcm_questions?niveau_id=in.(${ids})&select=niveau_id`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const data = await res.json();
  return new Set((data || []).map(q => q.niveau_id));
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

/**
 * Retourne les niveaux d'une thématique EN RESPECTANT la hiérarchie leçons si elle existe.
 * - Thématique avec leçons → niveaux via lecon_id (ignore les niveaux orphelins thematique_id)
 * - Thématique sans leçons → niveaux via thematique_id (ancienne architecture)
 * Utilisé par ModuleEntryView pour le calcul de progression des cartes thématiques.
 */
export async function fetchNiveauxParThematiquePourProgression(thId) {
  const lecRes = await fetch(`${SUPABASE_URL}/rest/v1/lecons?thematique_id=eq.${thId}&select=id&order=ordre`, { headers: ANON_HEADERS });
  const lecons = lecRes.ok ? await lecRes.json() : [];

  if (lecons.length > 0) {
    // Nouvelle architecture : traverser via lecon_id
    const allNiveaux = [];
    await Promise.all(lecons.map(async (l) => {
      const nRes = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?lecon_id=eq.${l.id}&order=ordre`, { headers: ANON_HEADERS });
      const nivs = nRes.ok ? await nRes.json() : [];
      allNiveaux.push(...nivs);
    }));
    return allNiveaux;
  }

  // Ancienne architecture : niveaux directement par thematique_id
  const res = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?thematique_id=eq.${thId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchLeconsEleve(thId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/lecons?thematique_id=eq.${thId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

export async function fetchNiveauxByLeconEleve(leconId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?lecon_id=eq.${leconId}&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── CHAT ────────────────────────────────────────────────────────────────────

/** Récupère les enseignants de la classe de l'élève */
export async function fetchEnseignantsDeLEleve(eleveId) {
  const r1 = await fetch(`${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${eleveId}&select=classe_id`, { headers: ANON_HEADERS });
  if (!r1.ok) throw new Error(`Erreur ${r1.status}`);
  const [eleve] = await r1.json();
  if (!eleve?.classe_id) return [];
  const r2 = await fetch(`${SUPABASE_URL}/rest/v1/enseignant_classes?classe_id=eq.${eleve.classe_id}&select=enseignant_id`, { headers: ANON_HEADERS });
  if (!r2.ok) throw new Error(`Erreur ${r2.status}`);
  const rows = await r2.json();
  if (!rows.length) return [];
  const ids = rows.map(r => r.enseignant_id).join(',');
  const r3 = await fetch(`${SUPABASE_URL}/rest/v1/enseignants?id=in.(${ids})&select=id,nom,prenom,statut_presence`, { headers: ANON_HEADERS });
  if (!r3.ok) throw new Error(`Erreur ${r3.status}`);
  return await r3.json();
}

/** Récupère tous les messages d'une conversation élève↔enseignant */
export async function fetchChatMessages(eleveId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}&order=created_at.asc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return await res.json();
}

/** Envoie un message */
export async function sendChatMessage(eleveId, enseignantId, contenu, senderRole) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
    method: 'POST',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({ eleve_id: eleveId, enseignant_id: enseignantId, contenu, sender_role: senderRole }),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Marque comme lus les messages reçus par l'élève */
export async function markMessagesReadEleve(eleveId, enseignantId) {
  await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}&sender_role=eq.enseignant&lu=eq.false`,
    { method: 'PATCH', headers: { ...ANON_HEADERS, 'Prefer': 'return=minimal' }, body: JSON.stringify({ lu: true }) }
  );
}

/** Compte les messages non lus reçus par l'élève (tous enseignants) */
export async function fetchUnreadCountEleve(eleveId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&sender_role=eq.enseignant&lu=eq.false&select=id`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

/** Compte les messages non lus d'un enseignant précis pour l'élève */
export async function fetchUnreadCountParEnseignant(eleveId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}&sender_role=eq.enseignant&lu=eq.false&select=id`,
    { headers: ANON_HEADERS }
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

/** Traverse la vraie hiérarchie Module→Thématiques→(Leçons→)Niveaux.
 *  Remplace fetchNiveauxEleve(moduleId) qui utilisait l'ancienne colonne module_id. */
export async function fetchAllNiveauxForModuleEleve(moduleId) {
  const thRes = await fetch(`${SUPABASE_URL}/rest/v1/thematiques?module_id=eq.${moduleId}&order=ordre`, { headers: ANON_HEADERS });
  const thematiques = thRes.ok ? await thRes.json() : [];
  const niveaux = [];
  await Promise.all(thematiques.map(async (th) => {
    const lRes = await fetch(`${SUPABASE_URL}/rest/v1/lecons?thematique_id=eq.${th.id}&order=ordre`, { headers: ANON_HEADERS });
    const lecons = lRes.ok ? await lRes.json() : [];
    if (lecons.length > 0) {
      await Promise.all(lecons.map(async (l) => {
        const nRes = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?lecon_id=eq.${l.id}&order=ordre`, { headers: ANON_HEADERS });
        const nivs = nRes.ok ? await nRes.json() : [];
        niveaux.push(...nivs);
      }));
    } else {
      const nRes = await fetch(`${SUPABASE_URL}/rest/v1/niveaux?thematique_id=eq.${th.id}&order=ordre`, { headers: ANON_HEADERS });
      const nivs = nRes.ok ? await nRes.json() : [];
      niveaux.push(...nivs);
    }
  }));
  return niveaux;
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

// ─── DEVOIRS ─────────────────────────────────────────────────────────────────

/** Récupère classe_id de l'élève depuis la DB (quand absent de la session) */
export async function fetchClasseIdEleve(eleveId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profils_eleves?id=eq.${eleveId}&select=classe_id`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const rows = await res.json();
  return rows[0]?.classe_id || null;
}

/** Devoirs de la classe de l'élève à venir */
export async function fetchDevoirsEleve(classeId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/devoirs?classe_id=eq.${classeId}&order=date_limite.asc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Nombre de devoirs créés après seenAt (pour badge non-vus) */
export async function fetchNewDevoirsCount(classeId, seenAt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/devoirs?classe_id=eq.${classeId}&created_at=gt.${encodeURIComponent(seenAt)}&select=id`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.length;
}

/** Nombre de nouvelles notes ajoutées pour l'élève après seenAt */
export async function fetchNewNotesCount(eleveId, seenAt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?eleve_id=eq.${eleveId}&created_at=gt.${encodeURIComponent(seenAt)}&select=id`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.length;
}

/** Nombre de nouvelles observations ajoutées pour l'élève après seenAt */
export async function fetchNewObsCount(eleveId, seenAt) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/observations?eleve_id=eq.${eleveId}&created_at=gt.${encodeURIComponent(seenAt)}&select=id`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return 0;
  const data = await res.json();
  return data.length;
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

/** Récupère les notes de l'élève avec les détails de chaque évaluation */
export async function fetchMesNotes(eleveId) {
  // 1. Notes de l'élève
  const r1 = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?eleve_id=eq.${eleveId}&select=score,absent,evaluation_id`,
    { headers: ANON_HEADERS }
  );
  if (!r1.ok) return [];
  const notes = await r1.json();
  if (!notes.length) return [];

  // 2. Détails des évaluations correspondantes
  const evalIds = [...new Set(notes.map(n => n.evaluation_id))].join(',');
  const r2 = await fetch(
    `${SUPABASE_URL}/rest/v1/evaluations?id=in.(${evalIds})&select=id,titre,date_evaluation,score_max`,
    { headers: ANON_HEADERS }
  );
  if (!r2.ok) return notes;
  const evals = await r2.json();
  const evalMap = Object.fromEntries(evals.map(e => [e.id, e]));

  return notes.map(n => ({ ...n, evaluation: evalMap[n.evaluation_id] || null }));
}

// ─── PRÉSENCE ENSEIGNANTS ────────────────────────────────────────────────────

/** Récupère le statut de présence de plusieurs enseignants — retourne { [id]: statut } */
export async function fetchEnseignantsPresence(ids) {
  if (!ids.length) return {};
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/enseignants?id=in.(${ids.join(',')})&select=id,statut_presence`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return {};
  const data = await res.json();
  return Object.fromEntries((data || []).map(e => [e.id, e.statut_presence]));
}

// ─── TRACKING SESSIONS ───────────────────────────────────────────────────────

/** Démarre une session de suivi (appelé à la connexion) — retourne l'UUID de session */
export async function startSession(eleveId) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/start_eleve_session`, {
      method: 'POST',
      headers: ANON_HEADERS,
      body: JSON.stringify({ p_eleve_id: eleveId }),
    });
    if (!res.ok) return null;
    return await res.json(); // UUID string
  } catch { return null; }
}

/** Met à jour le heartbeat de la session (appelé toutes les 2 minutes) */
export async function heartbeatSession(sessionId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/heartbeat_eleve_session`, {
      method: 'POST',
      headers: ANON_HEADERS,
      body: JSON.stringify({ p_session_id: sessionId }),
    });
  } catch {}
}

/** Clôture la session (appelé à la déconnexion) */
export async function endSession(sessionId) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/end_eleve_session`, {
      method: 'POST',
      headers: ANON_HEADERS,
      body: JSON.stringify({ p_session_id: sessionId }),
    });
  } catch {}
}

// ─── BADGES CONSOLIDÉS (1 seul poll au lieu de 4) ────────────────────────────

/**
 * Récupère les 4 compteurs de badges en une seule salve (Promise.all).
 * @param {string} eleveId
 * @param {string|null} classeId — si null, sera résolu automatiquement
 * @param {{ devoirs: string, notes: string, obs: string }} seenDates — ISO timestamps
 * @returns {{ unread, devoirs, notes, obs }} compteurs
 */
export async function fetchAllBadgeCounts(eleveId, classeId, seenDates) {
  const cid = classeId || await fetchClasseIdEleve(eleveId).catch(() => null);

  const [unread, devoirs, notes, obs] = await Promise.all([
    fetchUnreadCountEleve(eleveId).catch(() => 0),
    cid ? fetchNewDevoirsCount(cid, seenDates.devoirs).catch(() => 0) : 0,
    fetchNewNotesCount(eleveId, seenDates.notes).catch(() => 0),
    fetchNewObsCount(eleveId, seenDates.obs).catch(() => 0),
  ]);

  return { unread, devoirs, notes, obs, classeId: cid };
}

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────────

/** Récupère les observations de l'élève */
export async function fetchMesObservations(eleveId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/observations?eleve_id=eq.${eleveId}&order=created_at.desc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) return [];
  return res.json();
}
