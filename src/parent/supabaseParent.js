// ─── Configuration Supabase pour le portail parent ──────────────────────────
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

const ANON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

// Helper : POST sur une RPC Supabase + gestion d'erreur unifiée.
// Retourne { data, error } pour que les pages distinguent "tableau vide" d'une
// vraie erreur réseau / serveur.
async function rpc(fn, body) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: ANON_HEADERS,
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { data: null, error: data?.message || data?.hint || `Erreur ${res.status}` };
    }
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e.message || 'Erreur réseau' };
  }
}

// ─── Session parent : jeton opaque stocké côté client ───────────────────────
// Le serveur renvoie un `session_token` aléatoire à la connexion. On ne stocke
// JAMAIS `parents.id` côté client : toutes les RPC data utilisent ce jeton,
// résolu en parent_id par `_resolve_parent_session` côté SQL. Un attaquant qui
// modifie sessionStorage avec un jeton falsifié verra ses requêtes rejetées.

const SESSION_KEY = 'parent_user';

export function getParentUser() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

function getSessionToken() {
  const u = getParentUser();
  return u?.session_token || null;
}

// ─── AUTH ───────────────────────────────────────────────────────────────────

/** Connexion parent. Stocke un jeton de session opaque (pas l'id parent). */
export async function loginParent(identifiant, password) {
  const { data, error } = await rpc('login_parent', {
    p_identifiant: identifiant, p_password: password,
  });
  if (error) throw new Error(error);
  const user = Array.isArray(data) ? data[0] : data;
  if (!user?.session_token) throw new Error('Identifiants incorrects');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

/** Déconnexion : révoque le jeton côté serveur puis purge le sessionStorage. */
export async function logoutParent() {
  const token = getSessionToken();
  if (token) {
    await rpc('logout_parent', { p_token: token }); // best-effort
  }
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem('parent_selected_eleve_id');
}

/** Changement de mot de passe (1ère connexion ou volontaire). */
export async function changeParentPassword(oldPassword, newPassword) {
  const token = getSessionToken();
  if (!token) throw new Error('Session expirée');
  const { data, error } = await rpc('change_parent_password', {
    p_token: token, p_old: oldPassword, p_new: newPassword,
  });
  if (error) throw new Error(error);
  if (data === false) throw new Error('Ancien mot de passe incorrect');
  const user = getParentUser();
  if (user) {
    user.must_change_password = false;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  }
  return true;
}

// ─── ENFANTS DU PARENT ──────────────────────────────────────────────────────

/** Liste complète des enfants rattachés au parent identifié par le jeton. */
export async function fetchParentEnfants() {
  const token = getSessionToken();
  if (!token) return [];
  const { data } = await rpc('fetch_parent_enfants', { p_token: token });
  return data || [];
}

// ─── DONNÉES SCOLARITÉ ──────────────────────────────────────────────────────
// Toutes ces fonctions passent par des RPC SECURITY DEFINER qui :
//   1. résolvent le jeton en parent_id côté serveur
//   2. vérifient le lien parent↔élève
//   3. retournent les données
// Un parent ne peut donc PAS lire les données d'un enfant qui ne lui est pas
// rattaché, même en falsifiant le jeton ou l'eleveId côté client.

function needSession() {
  const token = getSessionToken();
  if (!token) return { token: null, error: { data: [], error: 'Session parent expirée' } };
  return { token, error: null };
}

/** Notes de l'élève (après vérif token + parent_eleves). */
export async function fetchNotesEleve(eleveId) {
  const s = needSession(); if (s.error) return s.error;
  const { data, error } = await rpc('fetch_notes_for_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  if (error) return { data: [], error };
  const rows = (data || []).map(r => ({
    id: r.id, evaluation_id: r.evaluation_id, score: r.score,
    absent: r.absent, commentaire: r.commentaire,
    evaluation: {
      id: r.evaluation_id, titre: r.eval_titre, date: r.eval_date,
    },
  }));
  return { data: rows, error: null };
}

/** Appréciations de l'élève. */
export async function fetchObservationsEleve(eleveId) {
  const s = needSession(); if (s.error) return s.error;
  const { data, error } = await rpc('fetch_observations_for_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  if (error) return { data: [], error };
  const rows = (data || []).map(r => ({
    id: r.id, type: r.type, contenu: r.contenu, created_at: r.created_at,
    enseignant_id: r.enseignant_id,
    enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
  }));
  return { data: rows, error: null };
}

/** Devoirs de la classe de l'élève (classe déduite côté SQL, non falsifiable). */
export async function fetchDevoirsClasse(eleveId) {
  const s = needSession(); if (s.error) return s.error;
  const { data, error } = await rpc('fetch_devoirs_for_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  if (error) return { data: [], error };
  const rows = (data || []).map(r => ({
    id: r.id, titre: r.titre, description: r.description,
    date_limite: r.date_limite, created_at: r.created_at,
    enseignant_id: r.enseignant_id,
    enseignants: r.enseignant_id ? { nom: r.enseignant_nom, prenom: r.enseignant_prenom } : null,
  }));
  return { data: rows, error: null };
}

/** Retards et absences de l'élève. */
export async function fetchAbsencesEleve(eleveId) {
  const s = needSession(); if (s.error) return s.error;
  const { data, error } = await rpc('fetch_absences_for_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

// ─── DÉCLARATIONS PARENT ─────────────────────────────────────────────────────

/** Soumet un préavis de retard ou d'absence pour un enfant. */
export async function createDeclarationParent({ eleveId, type, date, heurePrevue, motif }) {
  const s = needSession(); if (s.error) throw new Error(s.error.error);
  const { data, error } = await rpc('create_declaration_parent', {
    p_token:        s.token,
    p_eleve_id:     eleveId,
    p_type:         type,
    p_date:         date,
    p_heure_prevue: heurePrevue || null,
    p_motif:        motif || null,
  });
  if (error) throw new Error(error);
  return data;
}

/** Historique des déclarations soumises par le parent pour un enfant (90 derniers jours). */
export async function fetchDeclarationsParent(eleveId) {
  const s = needSession(); if (s.error) return s.error;
  const { data, error } = await rpc('fetch_declarations_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  if (error) return { data: [], error };
  return { data: data || [], error: null };
}

// ─── ACCUSÉS DE RÉCEPTION DES NOTES ──────────────────────────────────────────

/** Enregistre la signature du parent pour une note (idempotent). */
export async function acknowledgeNote(noteId) {
  const s = needSession(); if (s.error) throw new Error(s.error.error);
  const { data, error } = await rpc('parent_acknowledge_note', {
    p_token: s.token, p_note_id: noteId,
  });
  if (error) throw new Error(error);
  return data;
}

/** Retourne les note_id déjà signés par CE parent pour un élève donné. */
export async function fetchNoteAcks(eleveId) {
  const s = needSession(); if (s.error) return { data: [], error: s.error.error };
  const { data, error } = await rpc('fetch_note_acks_for_parent', {
    p_token: s.token, p_eleve_id: eleveId,
  });
  return { data: data || [], error: error || null };
}
