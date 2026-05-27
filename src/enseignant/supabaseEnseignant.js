// ─── Configuration Supabase pour le portail enseignant ───────────────────────
// Architecture sécurisée par session_token (pattern parent/élève) :
//   - login_enseignant retourne un token aléatoire 32 bytes hex
//   - Toutes les RPCs *_secure résolvent le token côté serveur via _resolve_enseignant_session
//   - Les CRUD vérifient l'ownership de classe (_enseignant_owns_classe) ou d'élève
//     (_enseignant_owns_eleve), ou que la ressource modifiée appartient bien à l'enseignant.
//   - Les paramètres `enseignantId` historiques sont ignorés (compat ascendante) :
//     l'enseignant est identifié uniquement par son token côté serveur.

const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

const ANON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

const SESSION_KEY = 'enseignant_user';

function getEnseignantToken() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.session_token || null; } catch { return null; }
}

// Wrapper RPC unifié (cohérent avec supabaseParent.js / supabasePortail.js)
async function rpc(fn, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || data?.hint || `Erreur ${res.status}`);
  }
  return data;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginEnseignant(identifiant, password) {
  const data = await rpc('login_enseignant', { p_identifiant: identifiant, p_password: password });
  if (!data?.session_token) throw new Error('Identifiants incorrects');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  return data;
}

/** Vérifie côté serveur que la session_token courante est valide.
 *  La signature historique acceptait un enseignantId — désormais ignoré. */
export async function verifyEnseignantSession(_enseignantId) {
  const token = getEnseignantToken();
  if (!token) return false;
  try {
    const resolved = await rpc('_resolve_enseignant_session', { p_token: token });
    return Boolean(resolved);
  } catch { return false; }
}

/** Déconnexion — purge sessionStorage IMMÉDIATEMENT puis révoque côté serveur (best-effort). */
export async function logoutEnseignant() {
  const token = getEnseignantToken();
  sessionStorage.removeItem(SESSION_KEY);
  if (token) {
    try { await rpc('logout_enseignant', { p_token: token }); } catch {}
  }
}

export function getEnseignantUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

export async function changeEnseignantPassword(_enseignantId, oldPassword, newPassword) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  const data = await rpc('change_enseignant_password_secure', {
    p_token: token, p_old: oldPassword, p_new: newPassword,
  });
  if (data === false) throw new Error('Ancien mot de passe incorrect');
  const user = getEnseignantUser();
  if (user) {
    user.must_change_password = false;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return true;
}

// ─── CLASSES & ÉLÈVES ─────────────────────────────────────────────────────────

export async function fetchMesClasses(_enseignantId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_mes_classes_secure', { p_token: token });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function fetchElevesDeClasse(classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_eleves_de_classe_secure', { p_token: token, p_classe_id: classeId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Récupère tous les élèves de toutes les classes de l'enseignant (dédup) */
export async function fetchTousLesElevesEnseignant(_enseignantId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_tous_eleves_for_ens_secure', { p_token: token });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// ─── CHAT 1-1 ─────────────────────────────────────────────────────────────────

export async function fetchChatMessages(eleveId, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_chat_messages_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function sendChatMessage(eleveId, _enseignantId, contenu, _senderRole) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('send_chat_message_for_ens_secure', {
    p_token: token, p_eleve_id: eleveId, p_contenu: contenu,
  });
}

export async function markMessagesReadEnseignant(eleveId, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) return;
  try {
    await rpc('mark_messages_read_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
  } catch {}
}

export async function fetchUnreadCountEnseignant(_enseignantId) {
  const token = getEnseignantToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_unread_for_ens_secure', { p_token: token });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

export async function deleteConversation(eleveId, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_conversation_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
}

export async function fetchUnreadCountParEleve(eleveId, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_unread_par_eleve_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

// ─── BROADCASTS (annonces de classe) ─────────────────────────────────────────

export const BROADCAST_MAX_LENGTH = 2000;

export async function sendGroupMessage(_enseignantId, classeId, contenu) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  const clean = (contenu || '').trim();
  if (!clean) throw new Error('Message vide');
  if (clean.length > BROADCAST_MAX_LENGTH) throw new Error(`Annonce trop longue (max ${BROADCAST_MAX_LENGTH} caractères)`);
  const result = await rpc('send_broadcast_secure', {
    p_token: token, p_classe_id: classeId, p_contenu: clean,
  });
  return { broadcastId: result?.broadcast_id, count: result?.count || 0 };
}

export async function fetchBroadcastsClasse(_enseignantId, classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_broadcasts_classe_secure', { p_token: token, p_classe_id: classeId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function updateBroadcast(_enseignantId, broadcastId, contenu) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  const clean = (contenu || '').trim();
  if (!clean) throw new Error('Message vide');
  if (clean.length > BROADCAST_MAX_LENGTH) throw new Error(`Annonce trop longue (max ${BROADCAST_MAX_LENGTH} caractères)`);
  await rpc('update_broadcast_secure', {
    p_token: token, p_broadcast_id: broadcastId, p_contenu: clean,
  });
}

export async function deleteBroadcast(_enseignantId, broadcastId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_broadcast_secure', { p_token: token, p_broadcast_id: broadcastId });
}

// ─── DEVOIRS ─────────────────────────────────────────────────────────────────

export async function fetchDevoirsClasse(classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_devoirs_classe_secure', { p_token: token, p_classe_id: classeId });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      classe_id: r.classe_id,
      enseignant_id: r.enseignant_id,
      titre: r.titre,
      description: r.description,
      date_limite: r.date_limite,
      created_at: r.created_at,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}

export async function createDevoir(data) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('create_devoir_secure', {
    p_token: token,
    p_classe_id: data.classe_id,
    p_titre: data.titre,
    p_description: data.description ?? null,
    p_date_limite: data.date_limite,
  });
}

export async function updateDevoir(id, data, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('update_devoir_secure', {
    p_token: token,
    p_id: id,
    p_titre: data.titre,
    p_description: data.description ?? null,
    p_date_limite: data.date_limite,
    p_classe_id: data.classe_id,
  });
}

export async function deleteDevoir(id, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_devoir_secure', { p_token: token, p_id: id });
}

// ─── ÉVALUATIONS ──────────────────────────────────────────────────────────────

export async function fetchEvaluationsClasse(classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_evaluations_classe_secure', { p_token: token, p_classe_id: classeId });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      classe_id: r.classe_id,
      enseignant_id: r.enseignant_id,
      titre: r.titre,
      date_evaluation: r.date_evaluation,
      score_max: r.score_max,
      created_at: r.created_at,
      valide_le: r.valide_le,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}

/** Marque une série comme validée (p_valider=true) ou la dévalide (false).
 *  Retourne la nouvelle valeur de `valide_le` (TIMESTAMPTZ ISO ou null). */
export async function validerEvaluation(evaluationId, valider) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('valider_evaluation_secure', {
    p_token: token,
    p_evaluation_id: evaluationId,
    p_valider: valider,
  });
}

export async function createEvaluation(data) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('create_evaluation_secure', {
    p_token: token,
    p_classe_id: data.classe_id,
    p_titre: data.titre,
    p_date_evaluation: data.date_evaluation ?? null,
    p_score_max: data.score_max ?? 20,
  });
}

export async function updateEvaluation(id, data, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('update_evaluation_secure', {
    p_token: token,
    p_id: id,
    p_titre: data.titre,
    p_date_evaluation: data.date_evaluation ?? null,
    p_score_max: data.score_max ?? null,
  });
}

export async function deleteEvaluation(id, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_evaluation_secure', { p_token: token, p_id: id });
}

export async function fetchNotesEvaluation(evaluationId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_notes_evaluation_secure', { p_token: token, p_evaluation_id: evaluationId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Upsert d'une note avec contrainte UNIQUE (evaluation_id, eleve_id) côté DB */
export async function upsertNote(evaluationId, eleveId, score, absent, commentaire = null) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('upsert_note_secure', {
    p_token: token,
    p_evaluation_id: evaluationId,
    p_eleve_id: eleveId,
    p_score: score,
    p_absent: absent,
    p_commentaire: commentaire,
  });
}

/** Accusés de réception des parents pour toutes les notes d'une évaluation. */
export async function fetchNoteAcks(evaluationId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_note_acks_for_enseignant', {
      p_token: token, p_evaluation_id: evaluationId,
    });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Accusés de réception pour toutes les notes d'UN élève (fiche élève). */
export async function fetchNoteAcksEleve(eleveId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_note_acks_eleve_for_enseignant', {
      p_token: token, p_eleve_id: eleveId,
    });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────────

export async function fetchObservationsClasse(classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_observations_classe_secure', { p_token: token, p_classe_id: classeId });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      eleve_id: r.eleve_id,
      enseignant_id: r.enseignant_id,
      classe_id: r.classe_id,
      type: r.type,
      contenu: r.contenu,
      created_at: r.created_at,
      updated_at: r.updated_at,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}

export async function createObservation(data) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('create_observation_secure', {
    p_token: token,
    p_eleve_id: data.eleve_id,
    p_classe_id: data.classe_id,
    p_type: data.type || 'general',
    p_contenu: data.contenu,
  });
}

export async function deleteObservation(id, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_observation_secure', { p_token: token, p_id: id });
}

// ─── RETARDS / ABSENCES ───────────────────────────────────────────────────────

export async function fetchRetardsAbsences(classeId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_retards_absences_classe_secure', { p_token: token, p_classe_id: classeId });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      eleve_id: r.eleve_id,
      enseignant_id: r.enseignant_id,
      classe_id: r.classe_id,
      type: r.type,
      date: r.date,
      commentaire: r.commentaire,
      created_at: r.created_at,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}

export async function createRetardAbsence(data) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('create_retard_absence_secure', {
    p_token: token,
    p_eleve_id: data.eleve_id,
    p_classe_id: data.classe_id,
    p_type: data.type,
    p_date: data.date ?? null,
    p_commentaire: data.commentaire ?? null,
  });
}

export async function updateRetardAbsence(id, data, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('update_retard_absence_secure', {
    p_token: token,
    p_id: id,
    p_type: data.type ?? null,
    p_date: data.date ?? null,
    p_commentaire: data.commentaire ?? null,
  });
}

export async function deleteRetardAbsence(id, _enseignantId) {
  const token = getEnseignantToken();
  if (!token) throw new Error('Session expirée');
  await rpc('delete_retard_absence_secure', { p_token: token, p_id: id });
}

// ─── FICHE ÉLÈVE ─────────────────────────────────────────────────────────────

export async function fetchProgressionEleve(eleveId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_progression_eleve_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function fetchNotesEleve(eleveId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_notes_eleve_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function fetchObservationsEleve(eleveId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_observations_eleve_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

export async function fetchRetardsAbsencesEleve(eleveId) {
  const token = getEnseignantToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_retards_absences_eleve_for_ens_secure', { p_token: token, p_eleve_id: eleveId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

// ─── CATALOGUE DE COURS (lecture publique — données pédagogiques) ────────────
// Ces tables sont en SELECT public car elles ne contiennent pas de données personnelles.

export async function fetchModulesEnseignant() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/modules?actif=eq.true&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Hiérarchie complète Module → Thématiques → (Leçons →) Niveaux */
export async function fetchAllNiveauxForModuleEns(moduleId) {
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

export async function fetchQCMExistenceEns(niveauIds) {
  if (!niveauIds.length) return new Set();
  const token = getEnseignantToken();
  if (!token) return new Set();
  // Phase RLS #2.A : `qcm_questions` fermée à anon. Passe par une RPC
  // SECURITY DEFINER qui valide le token enseignant côté serveur.
  try {
    const data = await rpc('fetch_qcm_existence_for_ens_secure', {
      p_token: token,
      p_niveau_ids: niveauIds,
    });
    return new Set(Array.isArray(data) ? data : []);
  } catch {
    return new Set();
  }
}

// ─── PRÉSENCE ─────────────────────────────────────────────────────────────────

export async function updatePresence(_enseignantId, statut, opts = {}) {
  const token = getEnseignantToken();
  if (!token) return;
  // Mode keepalive : utilisé lors de la fermeture d'onglet (pagehide / beforeunload).
  // Fire-and-forget — on ne peut pas await pendant le déchargement de la page,
  // mais keepalive=true permet à la requête de survivre quelques secondes au déchargement.
  if (opts.keepalive) {
    try {
      fetch(`${SUPABASE_URL}/rest/v1/rpc/update_presence_secure`, {
        method: 'POST',
        headers: ANON_HEADERS,
        body: JSON.stringify({ p_token: token, p_statut: statut }),
        keepalive: true,
      });
    } catch {}
    return;
  }
  try { await rpc('update_presence_secure', { p_token: token, p_statut: statut }); } catch {}
}

// Lecture du statut de présence courant — utilisé au mount pour ne pas écraser
// un choix volontaire ('reunion', 'non_joignable') à chaque rechargement.
// Phase RLS #2.D.1 : la table `enseignants` est désormais fermée à anon, on
// passe par la RPC `fetch_my_presence_secure` qui résout le statut depuis le
// token enseignant côté serveur. L'argument `enseignantId` est conservé pour
// compatibilité ascendante mais ignoré.
export async function fetchMyPresence(_enseignantId) {
  const token = getEnseignantToken();
  if (!token) return null;
  try {
    const data = await rpc('fetch_my_presence_secure', { p_token: token });
    return typeof data === 'string' ? data : null;
  } catch {
    return null;
  }
}

// ─── DÉCLARATIONS PARENTS (RPCs déjà sécurisées par enseignant_id) ───────────
// Ces RPCs existent depuis avant — elles vérifient déjà que p_enseignant_id correspond
// à un enseignant rattaché à la classe. Elles seront migrées vers le pattern token au
// chantier 5 quand on fermera complètement le RLS.

export async function fetchDeclarationsClasse(enseignantId, classeId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/fetch_declarations_classe`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_enseignant_id: enseignantId, p_classe_id: classeId }),
  });
  if (!res.ok) return [];
  return res.json();
}

export async function markDeclarationVueEnseignant(enseignantId, declarationId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mark_declaration_vue_enseignant`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_enseignant_id: enseignantId, p_declaration_id: declarationId }),
  });
  return res.ok;
}

export async function countDeclarationsEnseignant(enseignantId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/count_declarations_enseignant`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_enseignant_id: enseignantId }),
  });
  if (!res.ok) return 0;
  const n = await res.json();
  return typeof n === 'number' ? n : 0;
}
