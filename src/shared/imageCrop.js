// Helpers partagés pour appliquer le cadrage non-destructif d'une image
// (scale + position X/Y) stocké en DB. Miroir du pattern utilisé pour les
// photos élèves, réutilisé pour les couvertures de modules / thématiques /
// leçons / niveaux.

import { SCALE_MIN, SCALE_MAX, clamp } from './PhotoEditor';

const DEFAULT_SCALE = 1;
const DEFAULT_POS   = 50;

// Préfixe attendu pour une URL de couverture "sûre". RLS ouvert sur les tables
// de cours → n'importe quel anon peut écrire `image_url = "javascript:..."` ou
// `data:text/html;base64,...`. Sans validation, un admin qui ouvre l'image dans
// un nouvel onglet (ou un moteur qui suit l'URL) déclenche l'exploit. On n'accepte
// qu'une URL pointant vers notre bucket public `cours`.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const COVER_URL_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/cours/`
  : '';

/**
 * Vérifie qu'une URL d'illustration pointe bien vers notre bucket storage.
 * Utilisée avant tout `<img src={url}>` pour rejeter `javascript:`, `data:`,
 * et les URLs tierces injectées par un attaquant.
 */
export function isSafeCoverUrl(url) {
  if (!url || typeof url !== 'string' || !COVER_URL_PREFIX) return false;
  // Autorise aussi les paramètres de cache-busting (`?v=`) qu'on ajoute après
  // un upload de remplacement.
  return url.startsWith(COVER_URL_PREFIX);
}

// Coerce proprement une valeur numeric venant de PostgREST (qui renvoie les
// NUMERIC en string), d'un state React (number) ou d'un champ non défini.
// Retourne `fallback` pour null, undefined, NaN, chaîne vide.
function toNum(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Construit le style CSS qui applique le cadrage d'une image de couverture
 * à une <img> dans un conteneur à `object-fit: cover`.
 *
 * @param {{image_scale?: number|string, image_pos_x?: number|string, image_pos_y?: number|string}} item
 * @returns {{objectPosition: string, transform: string, transformOrigin: string}}
 */
export function coverImgStyle(item) {
  // Re-clamp au rendu : RLS ouvert → un attaquant peut PATCH image_scale=9999
  // en DB même si le CHECK contraint l'empêche côté SQL (si la contrainte était
  // un jour relâchée). Ceinture + bretelles, coût nul.
  const scale = clamp(toNum(item?.image_scale, DEFAULT_SCALE), SCALE_MIN, SCALE_MAX);
  const posX  = clamp(toNum(item?.image_pos_x, DEFAULT_POS), 0, 100);
  const posY  = clamp(toNum(item?.image_pos_y, DEFAULT_POS), 0, 100);
  return {
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${scale})`,
    transformOrigin: 'center',
  };
}
