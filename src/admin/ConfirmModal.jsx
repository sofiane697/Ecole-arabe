import React, { useEffect } from 'react';
import { motion, AnimatePresence, overlayVariants, modalVariants } from '../animations';

/* ─── Icône SVG poubelle ───────────────────────────────────────────────────── */
const IconTrash = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const IconWarn = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ─── Styles ────────────────────────────────────────────────────────────────── */
const S = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,.55)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  },
  card: {
    background: 'var(--a-bg-card)',
    borderRadius: 'var(--a-radius)',
    border: '1px solid var(--a-border)',
    padding: '32px 28px 24px',
    width: '100%', maxWidth: 400,
    textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,.4)',
  },
  iconWrap: (color) => ({
    width: 64, height: 64, borderRadius: '50%',
    background: `${color}18`,
    color,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 20px',
  }),
  title: {
    fontSize: 17, fontWeight: 700,
    color: 'var(--a-fg)',
    marginBottom: 10,
    lineHeight: 1.3,
  },
  message: {
    fontSize: 13.5, color: 'var(--a-fg-mid)',
    lineHeight: 1.65, marginBottom: 28,
  },
  warning: {
    fontSize: 12, fontWeight: 600,
    color: 'var(--a-red)',
    marginTop: 8,
  },
  row: {
    display: 'flex', gap: 10, justifyContent: 'center',
  },
  btnCancel: {
    padding: '10px 22px', borderRadius: 980,
    border: '1px solid var(--a-border)',
    background: 'transparent',
    color: 'var(--a-fg-mid)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all .15s',
    flex: 1, maxWidth: 160,
  },
  btnConfirm: (color) => ({
    padding: '10px 22px', borderRadius: 980,
    border: 'none',
    background: color,
    color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'opacity .15s',
    flex: 1, maxWidth: 200,
  }),
};

/**
 * ConfirmModal — modale de confirmation partagée
 *
 * Props :
 *  title        {string}   — titre affiché en gras
 *  message      {string|ReactNode} — corps du message
 *  confirmLabel {string}   — label bouton de confirmation (défaut : "Supprimer")
 *  cancelLabel  {string}   — label bouton annulation (défaut : "Annuler")
 *  danger       {boolean}  — rouge (défaut) ou or si false
 *  icon         {"trash"|"warn"} — icône (défaut : "trash")
 *  onConfirm    {Function} — appelée au clic confirmer
 *  onCancel     {Function} — appelée au clic annuler / backdrop
 */
export default function ConfirmModal({
  title       = 'Confirmer la suppression',
  message     = 'Cette action est irréversible.',
  confirmLabel = 'Supprimer',
  cancelLabel  = 'Annuler',
  danger       = true,
  icon         = 'trash',
  onConfirm,
  onCancel,
}) {
  /* Fermer avec Echap */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  const color = danger ? 'var(--a-red)' : 'var(--a-gold)';

  return (
    <AnimatePresence>
      <motion.div
        style={S.overlay}
        variants={overlayVariants}
        initial="hidden" animate="visible" exit="exit"
        onClick={onCancel}
      >
        <motion.div style={S.card} variants={modalVariants} onClick={e => e.stopPropagation()}>

          {/* Icône */}
          <div style={S.iconWrap(color)}>
            {icon === 'warn' ? <IconWarn /> : <IconTrash />}
          </div>

          {/* Texte */}
          <div style={S.title}>{title}</div>
          <div style={S.message}>{message}</div>

          {/* Boutons */}
          <div style={S.row}>
            <button style={S.btnCancel} onClick={onCancel}
              onMouseEnter={e => e.currentTarget.style.background='var(--a-bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              {cancelLabel}
            </button>
            <button style={S.btnConfirm(color)} onClick={onConfirm}
              onMouseEnter={e => e.currentTarget.style.opacity='.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              {confirmLabel}
            </button>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
