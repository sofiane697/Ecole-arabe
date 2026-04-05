import React, { useEffect, useState } from 'react';
import { getEleveUser, fetchMesObservations } from './supabasePortail';

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
  page:    { padding: '32px 0' },
  header:  { marginBottom: 32 },
  sub:     { fontSize: 14, color: 'var(--p-fg-mid)', marginTop: 6 },
  empty:   { textAlign: 'center', padding: '80px 20px' },
  emptyIcon:  { fontSize: 48, marginBottom: 16, opacity: 0.35 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--p-fg)', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: 'var(--p-fg-mid)', lineHeight: 1.6 },
  loading:    { textAlign: 'center', padding: '80px 20px', color: 'var(--p-fg-mid)', fontSize: 14 },
  timeline: { display: 'flex', flexDirection: 'column', gap: 14 },
  card: {
    background: 'var(--p-bg-card)', borderRadius: 12,
    border: '1px solid var(--p-border)', padding: '18px 20px',
    position: 'relative',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  typePill: (color) => ({
    padding: '3px 12px', borderRadius: 20,
    background: `${color}22`, color, fontSize: 12, fontWeight: 700,
  }),
  cardDate: { fontSize: 12, color: 'var(--p-fg-mid)', marginLeft: 'auto' },
  cardText: { fontSize: 14, color: 'var(--p-fg)', lineHeight: 1.7 },
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
    return <div style={S.page}><div style={S.loading}>Chargement…</div></div>;
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <p style={S.sub}>Les remarques et commentaires de votre professeur.</p>
      </div>

      {observations.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>✏️</div>
          <div style={S.emptyTitle}>Aucune observation pour le moment</div>
          <p style={S.emptyText}>
            Les observations de votre professeur apparaîtront ici.
          </p>
        </div>
      ) : (
        <div style={S.timeline}>
          {observations.map(obs => {
            const ti = typeInfo(obs.type);
            return (
              <div key={obs.id} style={S.card}>
                <div style={S.accentBar(ti.color)} />
                <div style={S.cardHeader}>
                  <span style={S.typePill(ti.color)}>{ti.label}</span>
                  <span style={S.cardDate}>{formatDate(obs.created_at)}</span>
                </div>
                <div style={S.cardText}>{obs.contenu}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
