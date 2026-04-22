import React, { useState, useEffect } from 'react';
import { fmtPrenom, fmtNom } from './nameUtils';
import { clamp } from './PhotoEditor';

export const getInitials = (eleve) => {
  const p = fmtPrenom(eleve?.prenom || '');
  const n = fmtNom(eleve?.nom || '');
  return (p[0] || '') + (n[0] || '');
};

// Classe CSS spécifique par variant (en plus de la base .avatar-circle).
// Le variant "enseignant" n'a pas de classe dédiée et reçoit ses dimensions en inline.
const VARIANTS = {
  admin:      { className: 'elv-avatar',             defaultSize: 42 },
  card:       { className: 'elv-avatar',             defaultSize: 42 },
  detail:     { className: 'elv-detail-avatar',      defaultSize: 60 },
  enseignant: { className: '',                       defaultSize: 60 },
  portail:    { className: 'portail-sidebar-avatar', defaultSize: 44 },
};

// Whitelist : n'accepter comme src <img> que les URLs pointant vers notre bucket
// public eleves-photos. Protège contre un photo_url malveillant stocké en DB
// (javascript:, data:, ou URL tierce) — RLS anon ouvert sur profils_eleves
// signifie que n'importe qui peut écrire dans la colonne photo_url.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
const PHOTO_URL_PREFIX = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/eleves-photos/profiles/`
  : '';

export function isSafePhotoUrl(url) {
  if (!url || typeof url !== 'string' || !PHOTO_URL_PREFIX) return false;
  return url.startsWith(PHOTO_URL_PREFIX);
}

/**
 * Avatar élève — affiche `eleve.photo_url` si valide, sinon les initiales (fallback).
 *
 * @param {object} props
 * @param {{prenom?: string, nom?: string, photo_url?: string}} props.eleve
 * @param {number} [props.size] - Taille en px ; prime sur `VARIANTS[variant].defaultSize`.
 * @param {'admin'|'card'|'detail'|'enseignant'|'portail'} [props.variant='admin'] - Classe CSS cible + taille par défaut.
 * @param {string} [props.className] - Classes additionnelles. **DOIT être une constante contrôlée** — ne jamais passer une valeur provenant de la DB ou de l'utilisateur (risque d'injection CSS).
 * @param {object} [props.style] - Override inline final (prime sur tout le reste).
 * @param {object} [props.fallbackStyle] - Style appliqué UNIQUEMENT sur le rendu initiales (ignoré quand une photo s'affiche).
 */
export default function EleveAvatar({ eleve, size, variant = 'admin', className = '', style = {}, fallbackStyle = {} }) {
  const [broken, setBroken] = useState(false);
  const cfg = VARIANTS[variant] || VARIANTS.admin;
  const px = size || cfg.defaultSize;
  const safePhoto = eleve?.photo_url && isSafePhotoUrl(eleve.photo_url) && !broken ? eleve.photo_url : null;
  const initials = getInitials(eleve);
  const displayName = `${eleve?.prenom || ''} ${eleve?.nom || ''}`.trim();

  useEffect(() => { setBroken(false); }, [eleve?.photo_url]);

  // Dimensions inline quand `size` est fourni OU quand le variant n'a pas de classe dédiée (enseignant).
  const needsInlineSize = !!size || !cfg.className;
  const inlineSize = needsInlineSize
    ? { width: px, height: px, minWidth: px, fontSize: Math.round(px * 0.38) }
    : {};

  // Ombre spécifique au variant enseignant (reproduit l'ancien look du header fiche élève).
  const enseignantBoxShadow = variant === 'enseignant'
    ? { boxShadow: '0 4px 16px rgba(212,151,43,.3)' }
    : {};

  const finalClassName = [
    'avatar-circle',
    cfg.className,
    safePhoto ? 'has-photo' : '',
    className,
  ].filter(Boolean).join(' ');

  // fallbackStyle s'applique UNIQUEMENT quand on affiche les initiales
  // (bordure/background spécifiques à un état, sans casser le rendu photo).
  const appliedFallback = !safePhoto ? fallbackStyle : {};

  return (
    <div
      className={finalClassName}
      style={{ ...inlineSize, ...enseignantBoxShadow, ...appliedFallback, ...style }}
      // Quand une photo s'affiche, l'<img alt> porte déjà le nom → éviter la double annonce.
      {...(safePhoto ? {} : { 'aria-label': displayName })}
    >
      {safePhoto ? (() => {
        // Coercion + clamp : PostgREST renvoie les `numeric` en string, et une valeur
        // corrompue pourrait injecter du CSS via l'interpolation template. La CHECK SQL
        // est la vraie ligne de défense ; ceci ferme la porte côté client par robustesse.
        const scale = clamp(Number(eleve?.photo_scale) || 1, 1, 3);
        const posX = clamp(Number(eleve?.photo_pos_x) || 50, 0, 100);
        const posY = clamp(Number(eleve?.photo_pos_y) || 50, 0, 100);
        return (
          <img
            src={safePhoto}
            alt={displayName || 'Photo élève'}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: 'inherit',
              display: 'block',
              objectPosition: `${posX}% ${posY}%`,
              transform: `scale(${scale})`,
              transformOrigin: 'center',
            }}
          />
        );
      })() : initials}
    </div>
  );
}
