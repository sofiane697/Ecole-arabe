// ─── Configuration Supabase pour le portail élève ─────────────────────────────
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

const ANON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

// ─── AUTH CUSTOM (sans Supabase Auth) ────────────────────────────────────────
// Le serveur (login_eleve) renvoie un session_token opaque (32 bytes hex). On ne stocke
// JAMAIS le password ni le hash côté client. Toutes les RPCs de données personnelles
// résolvent ce token en eleve_id côté serveur via _resolve_eleve_session — un attaquant
// qui falsifie le sessionStorage avec un token bidon verra ses requêtes rejetées.

const SESSION_KEY = 'eleve_user';

// Helper interne : extrait le session_token de la session locale.
// Renvoie null si la session est absente ou corrompue.
function getEleveSessionToken() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY))?.session_token || null; } catch { return null; }
}

// Wrapper RPC unifié (cohérence avec supabaseParent.js).
// Utilisé par toutes les fonctions sécurisées par token.
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

/** Connexion élève via fonction SQL — retourne désormais un session_token opaque */
export async function loginEleve(identifiant, password) {
  const data = await rpc('login_eleve', { p_identifiant: identifiant, p_password: password });
  if (!data?.session_token) throw new Error('Identifiants incorrects');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  return data;
}

/** Vérifie côté serveur que la session_token courante est valide et non expirée.
 *  Ancienne version : `verify_eleve_session(p_id)` se contentait de vérifier l'existence
 *  d'un élève actif → un attaquant pouvait passer n'importe quel UUID valide d'élève
 *  pour falsifier le check. La nouvelle version résout le token en eleve_id côté serveur. */
export async function verifyEleveSession(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return false;
  try {
    const resolvedId = await rpc('_resolve_eleve_session', { p_token: token });
    return Boolean(resolvedId);
  } catch { return false; }
}

/** Déconnexion élève : purge le sessionStorage local IMMÉDIATEMENT (synchrone)
 *  puis révoque le token côté serveur en best-effort.
 *  Le purge est en premier pour éviter qu'un caller qui n'await pas et navigue
 *  vers /login ne voie une session encore valide. */
export async function logoutEleve() {
  const token = getEleveSessionToken();
  sessionStorage.removeItem(SESSION_KEY);
  if (token) {
    try { await rpc('logout_eleve', { p_token: token }); } catch {} // best-effort
  }
}

/** Récupérer les infos de l'élève connecté */
export function getEleveUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

/** Récupère les infos à jour de l'élève (photo_url, niveau, classe, etc.) via RPC sécurisée.
 *  Le paramètre `eleveId` est conservé pour compat ascendante mais ignoré : l'élève est
 *  identifié par son session_token côté serveur. */
export async function fetchEleveSelf(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return null;
  try {
    const rows = await rpc('fetch_eleve_self_secure', { p_token: token });
    return Array.isArray(rows) ? rows[0] || null : rows || null;
  } catch { return null; }
}

/** Changer le mot de passe (1ère connexion) — version sécurisée par token */
export async function changePassword(_eleveId, oldPassword, newPassword) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  const data = await rpc('change_eleve_password_secure', {
    p_token: token, p_old: oldPassword, p_new: newPassword,
  });
  if (data === false) throw new Error('Ancien mot de passe incorrect');
  // Mettre à jour la session locale (must_change_password = false)
  const user = getEleveUser();
  if (user) {
    user.must_change_password = false;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return true;
}

// ─── MODULES & NIVEAUX ────────────────────────────────────────────────────────

export async function fetchModulesEleve() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/modules?actif=eq.true&order=ordre`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Contenus d'un niveau — via RPC token-gated. La table `contenus` est fermée
 *  à anon depuis l'audit 2026-07-03 (S3) : les cours (vidéos, PDF, textes) ne
 *  sont plus lisibles sans compte élève connecté. */
export async function fetchContenusEleve(niveauId) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('fetch_contenus_for_eleve_secure', { p_token: token, p_niveau_id: niveauId });
}

/** QCM du niveau pour l'élève authentifié.
 *  Anti-triche : la RPC ne renvoie JAMAIS `reponse_correcte`. À la place, un
 *  booléen `multi_reponses` permet à l'UI de savoir si plusieurs réponses
 *  sont attendues. Le score est calculé serveur-side dans `submitQCM`. */
export async function fetchQCMEleve(niveauId) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  const data = await rpc('fetch_qcm_for_eleve_secure', {
    p_token: token,
    p_niveau_id: niveauId,
  });
  return Array.isArray(data) ? data : [];
}

/** Retourne un Set des niveau_ids qui ont au moins une question QCM — 1 seul appel batch */
export async function fetchQCMExistenceForNiveaux(niveauIds) {
  if (!niveauIds.length) return new Set();
  const token = getEleveSessionToken();
  if (!token) return new Set();
  try {
    const data = await rpc('fetch_qcm_existence_for_eleve_secure', {
      p_token: token,
      p_niveau_ids: niveauIds,
    });
    // La RPC retourne SETOF BIGINT → tableau de nombres
    return new Set(Array.isArray(data) ? data : []);
  } catch {
    return new Set();
  }
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

/** Récupérer le niveau scolaire de l'élève connecté depuis la DB (fallback session locale) */
export async function fetchEleveNiveauScolaireId(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return null;
  try {
    const data = await rpc('fetch_eleve_niveau_scolaire_secure', { p_token: token });
    return data ?? null;
  } catch { return null; }
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
// Toutes les RPCs *_for_eleve_secure résolvent l'eleve_id depuis le session_token
// côté serveur. Le helper _eleve_owns_chat_with(token, ens_id) vérifie en plus
// que l'enseignant cible est bien rattaché à la classe de l'élève — un élève ne
// peut donc pas envoyer de message à un prof qui ne lui enseigne pas.

/** Récupère les enseignants de la classe de l'élève (avec leur statut de présence) */
export async function fetchEnseignantsDeLEleve(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_enseignants_de_eleve_secure', { p_token: token });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Récupère tous les messages d'une conversation élève↔enseignant */
export async function fetchChatMessages(_eleveId, enseignantId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_chat_messages_for_eleve_secure', { p_token: token, p_enseignant_id: enseignantId });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Récupère toutes les annonces de classe (broadcasts) pour cet élève, tous enseignants confondus.
 *  Conserve le shape historique : `enseignants: { id, nom, prenom }`. */
export async function fetchBroadcastsEleve(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_broadcasts_eleve_secure', { p_token: token });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      broadcast_id: r.broadcast_id,
      contenu: r.contenu,
      created_at: r.created_at,
      lu: r.lu,
      enseignant_id: r.enseignant_id,
      enseignants: r.enseignant_id
        ? { id: r.enseignant_id, nom: r.enseignant_nom, prenom: r.enseignant_prenom }
        : null,
    }));
  } catch { return []; }
}

/** Marque toutes les annonces non lues comme lues pour cet élève */
export async function markBroadcastsReadEleve(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return;
  try { await rpc('mark_broadcasts_read_eleve_secure', { p_token: token }); } catch {}
}

/** Compte les annonces non lues pour cet élève */
export async function fetchUnreadBroadcastsCount(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_unread_broadcasts_eleve_secure', { p_token: token });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

/** Envoie un message — sender_role est imposé à 'eleve' côté serveur */
export async function sendChatMessage(_eleveId, enseignantId, contenu, _senderRole) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  await rpc('send_chat_message_for_eleve_secure', {
    p_token: token, p_enseignant_id: enseignantId, p_contenu: contenu,
  });
}

/** Marque comme lus les messages reçus par l'élève (privés, hors broadcasts) */
export async function markMessagesReadEleve(_eleveId, enseignantId) {
  const token = getEleveSessionToken();
  if (!token) return;
  try { await rpc('mark_messages_read_for_eleve_secure', { p_token: token, p_enseignant_id: enseignantId }); } catch {}
}

/** Compte les messages non lus reçus par l'élève (tous enseignants, privés uniquement) */
export async function fetchUnreadCountEleve(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_unread_for_eleve_secure', { p_token: token });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

/** Compte les messages non lus d'un enseignant précis pour l'élève */
export async function fetchUnreadCountParEnseignant(_eleveId, enseignantId) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_unread_par_enseignant_for_eleve_secure', { p_token: token, p_enseignant_id: enseignantId });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

/** Traverse la vraie hiérarchie Module→Thématiques→(Leçons→)Niveaux. */
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
// Les RPCs *_secure résolvent le session_token côté serveur — un élève ne peut
// donc pas lire/modifier la progression d'un autre en falsifiant son eleveId.

export async function fetchProgression(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  return await rpc('get_progression_secure', { p_token: token });
}

/** Soumet les réponses d'un QCM. Le score et le réussi/raté sont calculés
 *  EXCLUSIVEMENT côté serveur — le client ne peut plus envoyer un score
 *  arbitraire (cf. anti-triche RPC `submit_qcm_secure`).
 *  @param niveauId  BIGINT id du niveau
 *  @param answers   {[questionId: string]: number[]} indices choisis par question
 *  @returns {{score: number, reussi: boolean}}
 */
export async function submitQCM(niveauId, answers) {
  const token = getEleveSessionToken();
  if (!token) throw new Error('Session expirée');
  const data = await rpc('submit_qcm_secure', {
    p_token: token,
    p_niveau_id: niveauId,
    p_answers: answers || {},
  });
  // RPC retourne RETURNS TABLE(score INT, reussi BOOL) → premier élément
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
  if (!row) throw new Error('Réponse serveur invalide');
  return { score: Number(row.score) || 0, reussi: Boolean(row.reussi) };
}

// ─── DEVOIRS ─────────────────────────────────────────────────────────────────

/** Récupère le classe_id de l'élève connecté via la RPC sécurisée fetch_eleve_self_secure */
export async function fetchClasseIdEleve(_eleveId) {
  const self = await fetchEleveSelf();
  return self?.classe_id || null;
}

/** Devoirs de la classe de l'élève à venir.
 *  La classe est résolue côté serveur depuis le token (paramètre classeId ignoré
 *  pour compat ascendante — un attaquant ne peut plus passer un classeId arbitraire). */
export async function fetchDevoirsEleve(_classeId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_devoirs_for_eleve', { p_token: token });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      titre: r.titre,
      description: r.description,
      date_limite: r.date_limite,
      created_at: r.created_at,
      enseignant_id: r.enseignant_id,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}

/** Retards et absences de l'élève connecté */
export async function fetchAbsencesEleve() {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_absences_for_eleve', { p_token: token });
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Nombre de devoirs créés après seenAt (pour badge non-vus).
 *  Sécurisée par session_token : la classe est résolue côté serveur. */
export async function fetchNewDevoirsCount(_classeId, seenAt) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_new_devoirs_for_eleve', { p_token: token, p_seen_at: seenAt });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

/** Nombre de nouvelles notes ajoutées pour l'élève après seenAt */
export async function fetchNewNotesCount(_eleveId, seenAt) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_new_notes_for_eleve', { p_token: token, p_seen_at: seenAt });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

/** Nombre de nouvelles observations ajoutées pour l'élève après seenAt */
export async function fetchNewObsCount(_eleveId, seenAt) {
  const token = getEleveSessionToken();
  if (!token) return 0;
  try {
    const n = await rpc('count_new_observations_for_eleve', { p_token: token, p_seen_at: seenAt });
    return typeof n === 'number' ? n : 0;
  } catch { return 0; }
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

/** Récupère les notes de l'élève connecté avec les détails de chaque évaluation.
 *  Une seule RPC sécurisée remplace les 2 fetchs PostgREST + jointure manuelle. */
export async function fetchMesNotes(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_notes_for_eleve', { p_token: token });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      evaluation_id: r.evaluation_id,
      score: r.score,
      absent: r.absent,
      commentaire: r.commentaire,
      evaluation: r.evaluation_id
        ? { id: r.evaluation_id, titre: r.eval_titre, date_evaluation: r.eval_date, score_max: r.eval_score_max }
        : null,
    }));
  } catch { return []; }
}

// ─── PRÉSENCE ENSEIGNANTS ────────────────────────────────────────────────────

/** Récupère le statut de présence de plusieurs enseignants — retourne { [id]: statut }.
 *  Réutilise fetch_enseignants_de_eleve_secure (qui retourne tous les profs de la classe
 *  avec leur statut). Le filtre par `ids` est appliqué côté client mais le serveur ne
 *  retourne que les profs effectivement rattachés à la classe de l'élève — pas de fuite. */
export async function fetchEnseignantsPresence(ids) {
  if (!ids?.length) return {};
  const token = getEleveSessionToken();
  if (!token) return {};
  try {
    const rows = await rpc('fetch_enseignants_de_eleve_secure', { p_token: token });
    if (!Array.isArray(rows)) return {};
    const idsSet = new Set(ids);
    return Object.fromEntries(rows.filter(e => idsSet.has(e.id)).map(e => [e.id, e.statut_presence]));
  } catch { return {}; }
}

// ─── TRACKING SESSIONS ───────────────────────────────────────────────────────

/** Démarre une session de suivi (appelé à la connexion) — retourne l'UUID de session.
 *  La version sécurisée résout l'eleve_id depuis le session_token côté serveur :
 *  un attaquant ne peut plus créer une session de tracking pour un autre élève. */
export async function startSession(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return null;
  try {
    return await rpc('start_eleve_session_secure', { p_token: token });
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

  const [unreadPrivate, unreadBroadcasts, devoirs, notes, obs] = await Promise.all([
    fetchUnreadCountEleve(eleveId).catch(() => 0),
    fetchUnreadBroadcastsCount(eleveId).catch(() => 0),
    cid ? fetchNewDevoirsCount(cid, seenDates.devoirs).catch(() => 0) : 0,
    fetchNewNotesCount(eleveId, seenDates.notes).catch(() => 0),
    fetchNewObsCount(eleveId, seenDates.obs).catch(() => 0),
  ]);

  return { unread: unreadPrivate + unreadBroadcasts, devoirs, notes, obs, classeId: cid };
}

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────────

/** Récupère les observations (appréciations) de l'élève connecté.
 *  Format identique à l'API legacy : `enseignants: { nom, prenom }` est reconstitué
 *  côté client à partir des colonnes plates de la RPC. */
export async function fetchMesObservations(_eleveId) {
  const token = getEleveSessionToken();
  if (!token) return [];
  try {
    const rows = await rpc('fetch_observations_for_eleve', { p_token: token });
    if (!Array.isArray(rows)) return [];
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      contenu: r.contenu,
      created_at: r.created_at,
      enseignant_id: r.enseignant_id,
      enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
    }));
  } catch { return []; }
}
