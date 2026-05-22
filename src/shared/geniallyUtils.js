// Vérifie qu'une chaîne est une URL Genially directe (https uniquement).
function isDirectGeniallyUrl(s) {
  return /^https:\/\/view\.genially\.com\/[a-zA-Z0-9]+/.test(s);
}

export function normalizeGeniallyUrl(input) {
  if (!input) return null;
  const s = input.trim();

  if (s.startsWith('<')) {
    // Code iframe : extraire la valeur de l'attribut src (guillemets simples ou doubles)
    const m = s.match(/src=["']([^"']*view\.genially\.com[^"']*)["']/);
    const url = m ? m[1] : null;
    return url && isDirectGeniallyUrl(url) ? url : null;
  }

  // URL directe : https uniquement
  return isDirectGeniallyUrl(s) ? s : null;
}

/**
 * Retourne true si l'URL est une URL Genially directe valide (déjà normalisée en base).
 * Refuse les codes iframe bruts — les URLs stockées en base sont toujours normalisées.
 */
export function isValidGeniallyUrl(url) {
  if (!url) return false;
  const s = url.trim();
  return !s.startsWith('<') && isDirectGeniallyUrl(s);
}
