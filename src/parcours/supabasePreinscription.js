// ─── Envoi d'une préinscription depuis le parcours public ────────────────────
// Le visiteur n'écrit pas directement la table `preinscriptions` (RLS fermé) :
// on passe par la RPC SECURITY DEFINER `submit_preinscription`, qui valide les
// entrées côté serveur et force les colonnes de suivi (statut/viewed_at/eleve_id).
const SUPABASE_URL  = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON = process.env.REACT_APP_SUPABASE_ANON;

/**
 * Déduit les méta-données du parcours à partir du chemin traversé.
 * @param {Array} path Nœuds [pôle → public → (format) → matière]
 * @returns {{ pole, public_cible, format, matiere, est_enfant }}
 */
export function derivePathMeta(path = []) {
  const estEnfant = path.some(
    (n) => n.id === 'enfant' || /^enfant-/.test(n.id || '') || n.label === 'Enfant'
  );
  // Format = niveau Autonomie / Visioconférence / Cours particulier (enfant only)
  const formatNode = path.find((n) => /^enfant-(autonomie|visio|particulier)$/.test(n.id || ''));
  const formatMap = { 'enfant-autonomie': 'autonomie', 'enfant-visio': 'visioconference', 'enfant-particulier': 'particulier' };

  return {
    pole:         path[0]?.label || null,
    public_cible: estEnfant ? 'enfant' : 'adulte',
    format:       formatNode ? formatMap[formatNode.id] : null,
    matiere:      path[path.length - 1]?.label || null,
    est_enfant:   estEnfant,
  };
}

/**
 * Envoie une préinscription. `pack` est neutre vis-à-vis de tarif/devis :
 *   { type:'tarif'|'devis', path, formule?, devis?, eleve, contact, estEnfant }
 * @returns {Promise<number>} l'id de la préinscription créée
 */
export async function submitPreinscription(pack) {
  const meta = derivePathMeta(pack.path);
  const body = {
    p_type:                 pack.type,
    p_pole:                 meta.pole,
    p_public_cible:         meta.public_cible,
    p_format:               meta.format,
    p_matiere:              meta.matiere,
    p_parcours:             (pack.path || []).map((n) => n.label),
    p_formule_nom:          pack.formule?.nom ?? null,
    p_formule_prix:         pack.formule?.prix ?? null,
    p_formule_rythme:       pack.formule?.rythme ?? null,
    p_devis_sujet:          pack.devis?.sujet ?? null,
    p_devis_besoin:         pack.devis?.besoin ?? null,
    p_eleve_prenom:         pack.eleve.prenom,
    p_eleve_nom:            pack.eleve.nom,
    p_eleve_date_naissance: pack.eleve.dateNaissance || null,
    p_est_enfant:           pack.estEnfant,
    p_contact_prenom:       pack.contact.prenom || null,
    p_contact_nom:          pack.contact.nom || null,
    p_contact_telephone:    pack.contact.telephone,
    p_contact_email:        pack.contact.email,
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_preinscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON,
      'Authorization': `Bearer ${SUPABASE_ANON}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.hint || `Envoi impossible (${res.status})`);
  }
  return res.json().catch(() => null);
}
