import React from 'react';

const S = {
  page:    { padding: '32px 0' },
  header:  { marginBottom: 32 },
  title:   { fontSize: 24, fontWeight: 700, color: 'var(--p-fg)', margin: 0 },
  sub:     { fontSize: 14, color: 'var(--p-fg-mid)', marginTop: 6 },
  empty:   { textAlign: 'center', padding: '80px 20px' },
  emptyIcon: { fontSize: 48, marginBottom: 16, opacity: 0.4 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--p-fg)', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: 'var(--p-fg-mid)', lineHeight: 1.6 },
};

export default function PortailDevoirs() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Mes devoirs</h1>
        <p style={S.sub}>Retrouvez ici les devoirs assignés par votre professeur.</p>
      </div>

      <div style={S.empty}>
        <div style={S.emptyIcon}>📋</div>
        <div style={S.emptyTitle}>Aucun devoir pour le moment</div>
        <p style={S.emptyText}>
          Vos devoirs apparaîtront ici dès que votre professeur en aura assigné.
        </p>
      </div>
    </div>
  );
}
