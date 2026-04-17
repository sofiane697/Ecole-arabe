import React, { useEffect, useState } from 'react';
import { getEleveUser, fetchMesObservations } from './supabasePortail';
import { motion, staggerContainer, fadeUp, cardHover } from '../animations';

const TYPES = {
  general:      { label: 'Général',      color: 'var(--p-gold)' },
  comportement: { label: 'Comportement', color: '#ff453a'        },
  progression:  { label: 'Progression',  color: 'var(--p-green)' },
};

function typeInfo(v) { return TYPES[v] || TYPES.general; }

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

const S = {
  page:       'py-8',
  header:     'mb-8',
  sub:        'text-sm text-p-fg-mid mt-1.5',
  empty:      'text-center py-20 px-5',
  emptyIcon:  'text-5xl mb-4 opacity-35',
  emptyTitle: 'font-[var(--p-font-display)] text-lg font-semibold text-p-fg mb-2',
  emptyText:  'text-sm text-p-fg-mid leading-relaxed',
  loading:    'text-center py-20 px-5 text-p-fg-mid text-sm',
  timeline:   'flex flex-col gap-3.5',
  card:       'bg-p-card rounded-xl border border-p-border py-[18px] px-5 relative',
  cardHeader: 'flex items-center gap-2.5 mb-3',
  typePill: (color) => ({
    padding: '3px 12px', borderRadius: 20,
    background: `${color}22`, color, fontSize: 12, fontWeight: 700,
  }),
  cardDate:   'text-xs text-p-fg-mid ml-auto',
  cardText:   'text-sm text-p-fg leading-[1.7]',
  accentBar: (color) => ({
    position: 'absolute', left: 0, top: 16, bottom: 16,
    width: 3, borderRadius: '0 2px 2px 0', background: color,
  }),
};

export default function PortailObservations() {
  const user = getEleveUser();
  const [observations, setObservations] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesObservations(user.id)
      .then(data => setObservations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) {
    return <div className={S.page}><div className={S.loading}>Chargement…</div></div>;
  }

  return (
    <div className={S.page}>
      <div className={S.header}>
        <p className={S.sub}>Les remarques et commentaires de votre professeur.</p>
      </div>

      {observations.length === 0 ? (
        <div className={S.empty}>
          <div className={S.emptyIcon}>✏️</div>
          <div className={S.emptyTitle}>Aucune observation pour le moment</div>
          <p className={S.emptyText}>
            Les observations de votre professeur apparaîtront ici.
          </p>
        </div>
      ) : (
        <motion.div className={S.timeline} variants={staggerContainer} initial="hidden" animate="visible">
          {observations.map(obs => {
            const ti = typeInfo(obs.type);
            return (
              <motion.div key={obs.id} className={S.card} variants={fadeUp} {...cardHover}>
                <div style={S.accentBar(ti.color)} />
                <div className={S.cardHeader}>
                  <span style={S.typePill(ti.color)}>{ti.label}</span>
                  <span className={S.cardDate}>{formatDate(obs.created_at)}</span>
                </div>
                <div className={S.cardText}>{obs.contenu}</div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
