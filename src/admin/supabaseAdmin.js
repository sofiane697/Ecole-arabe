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

/** Récupérer toutes les inscriptions */
export async function fetchInscriptions() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/inscriptions?order=created_at.desc`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Récupérer tous les messages */
export async function fetchMessages() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/messages?order=created_at.desc`,
    { headers: getHeaders() }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return res.json();
}

/** Mettre à jour le statut d'une inscription */
export async function updateInscriptionStatut(id, statut) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/inscriptions?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...getHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({ statut }),
    }
  );
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
}

/** Marquer un message comme lu / non lu */
export async function updateMessageLu(id, lu) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/messages?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...getHeaders(), 'Prefer': 'return=minimal' },
      body: JSON.stringify({ lu }),
    }
  );
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
  // Stocker le token pour les requêtes authentifiées
  sessionStorage.setItem('admin_token', data.access_token);
  sessionStorage.setItem('admin_auth', 'true');
  return data;
}

/** Déconnexion */
export function logoutAdmin() {
  sessionStorage.removeItem('admin_token');
  sessionStorage.removeItem('admin_auth');
}
