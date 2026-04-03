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
