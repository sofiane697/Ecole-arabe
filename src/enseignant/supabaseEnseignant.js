// ─── Configuration Supabase pour le portail enseignant ───────────────────────
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

const ANON_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function loginEnseignant(identifiant, password) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/login_enseignant`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_identifiant: identifiant, p_password: password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || data?.hint || 'Identifiant ou mot de passe incorrect');
  sessionStorage.setItem('enseignant_user', JSON.stringify(data));
  return data;
}

export function logoutEnseignant() {
  sessionStorage.removeItem('enseignant_user');
}

export function getEnseignantUser() {
  try { return JSON.parse(sessionStorage.getItem('enseignant_user')); } catch { return null; }
}

export async function changeEnseignantPassword(enseignantId, oldPassword, newPassword) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/change_enseignant_password`, {
    method: 'POST',
    headers: ANON_HEADERS,
    body: JSON.stringify({ p_id: enseignantId, p_old: oldPassword, p_new: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Erreur changement mot de passe');
  if (data === false) throw new Error('Ancien mot de passe incorrect');
  const user = getEnseignantUser();
  if (user) {
    user.must_change_password = false;
    sessionStorage.setItem('enseignant_user', JSON.stringify(user));
  }
  return true;
}

// ─── DONNÉES ──────────────────────────────────────────────────────────────────

export async function fetchMesClasses(enseignantId) {
  // 1. Récupérer les classe_ids assignées
  const r1 = await fetch(
    `${SUPABASE_URL}/rest/v1/enseignant_classes?enseignant_id=eq.${enseignantId}&select=classe_id`,
    { headers: ANON_HEADERS }
  );
  if (!r1.ok) throw new Error(`Erreur ${r1.status}`);
  const rows = await r1.json();
  const classeIds = rows.map(r => r.classe_id);
  if (classeIds.length === 0) return [];

  // 2. Récupérer les détails des classes
  const r2 = await fetch(
    `${SUPABASE_URL}/rest/v1/classes?id=in.(${classeIds.join(',')})&order=nom.asc`,
    { headers: ANON_HEADERS }
  );
  if (!r2.ok) throw new Error(`Erreur ${r2.status}`);
  return r2.json();
}

export async function fetchElevesDeClasse(classeId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profils_eleves?classe_id=eq.${classeId}&order=nom.asc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────

/** Récupère tous les élèves de toutes les classes de l'enseignant */
export async function fetchTousLesElevesEnseignant(enseignantId) {
  const classes = await fetchMesClasses(enseignantId);
  if (!classes.length) return [];
  const lists = await Promise.all(classes.map(c => fetchElevesDeClasse(c.id)));
  const seen = new Set();
  return lists.flat().filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });
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

/** Marque comme lus les messages reçus par l'enseignant */
export async function markMessagesReadEnseignant(eleveId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}&sender_role=eq.eleve&lu=eq.false`,
    { method: 'PATCH', headers: { ...ANON_HEADERS, 'Prefer': 'return=minimal' }, body: JSON.stringify({ lu: true }) }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Compte les messages non lus reçus par l'enseignant (tous élèves) */
export async function fetchUnreadCountEnseignant(enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?enseignant_id=eq.${enseignantId}&sender_role=eq.eleve&lu=eq.false&select=id`,
    { headers: ANON_HEADERS }
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

/** Supprime tous les messages d'une conversation élève↔enseignant */
export async function deleteConversation(eleveId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}`,
    { method: 'DELETE', headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Compte les non-lus pour un élève précis */
export async function fetchUnreadCountParEleve(eleveId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?eleve_id=eq.${eleveId}&enseignant_id=eq.${enseignantId}&sender_role=eq.eleve&lu=eq.false&select=id`,
    { headers: ANON_HEADERS }
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

// ─── DEVOIRS ─────────────────────────────────────────────────────────────────

/** Récupère tous les devoirs de l'enseignant */
export async function fetchDevoirsEnseignant(enseignantId) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/devoirs?enseignant_id=eq.${enseignantId}&order=date_limite.asc`, { headers: ANON_HEADERS });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Crée un devoir */
export async function createDevoir(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/devoirs`, {
    method: 'POST',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const arr = await res.json();
  return arr[0];
}

/** Modifie un devoir */
export async function updateDevoir(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/devoirs?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Supprime un devoir */
export async function deleteDevoir(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/devoirs?id=eq.${id}`, {
    method: 'DELETE',
    headers: ANON_HEADERS,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

// ─── NOTES ───────────────────────────────────────────────────────────────────

/** Récupère les évaluations d'une classe */
export async function fetchEvaluationsClasse(classeId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/evaluations?classe_id=eq.${classeId}&order=date_evaluation.asc,created_at.asc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Crée une évaluation */
export async function createEvaluation(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/evaluations`, {
    method: 'POST',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const arr = await res.json();
  return arr[0];
}

/** Modifie une évaluation */
export async function updateEvaluation(id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/evaluations?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Supprime une évaluation (cascade sur les notes) */
export async function deleteEvaluation(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/evaluations?id=eq.${id}`, {
    method: 'DELETE',
    headers: ANON_HEADERS,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Récupère toutes les notes d'une évaluation */
export async function fetchNotesEvaluation(evaluationId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?evaluation_id=eq.${evaluationId}`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Upsert note via contrainte UNIQUE (evaluation_id, eleve_id) */
export async function upsertNote(evaluationId, eleveId, score, absent) {
  // on_conflict= indique à PostgREST quelle contrainte utiliser pour le ON CONFLICT DO UPDATE.
  // Sans ce paramètre, il tente un INSERT sur la PK (id UUID auto) qui échoue
  // silencieusement dès qu'une ligne existe déjà → la note n'est jamais mise à jour.
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/notes?on_conflict=evaluation_id,eleve_id`,
    {
      method: 'POST',
      headers: {
        ...ANON_HEADERS,
        'Prefer': 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ evaluation_id: evaluationId, eleve_id: eleveId, score, absent }),
    }
  );
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Erreur ${res.status} — ${err}`);
  }
  const arr = await res.json();
  return arr[0] ?? { evaluation_id: evaluationId, eleve_id: eleveId, score, absent };
}

// ─── OBSERVATIONS ─────────────────────────────────────────────────────────────

/** Récupère toutes les observations d'une classe par un enseignant */
export async function fetchObservationsClasse(classeId, enseignantId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/observations?classe_id=eq.${classeId}&enseignant_id=eq.${enseignantId}&order=created_at.desc`,
    { headers: ANON_HEADERS }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Crée une observation */
export async function createObservation(data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/observations`, {
    method: 'POST',
    headers: { ...ANON_HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  const arr = await res.json();
  return arr[0];
}

/** Supprime une observation */
export async function deleteObservation(id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/observations?id=eq.${id}`, {
    method: 'DELETE',
    headers: ANON_HEADERS,
  });
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}
