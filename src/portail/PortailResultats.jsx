import React, { useEffect, useState } from 'react';
import { getEleveUser } from './supabasePortail';
import { fetchMesNotes } from './supabasePortail';

const S = {
  page:    { padding: '32px 0' },
  header:  { marginBottom: 32 },
  sub:     { fontSize: 14, color: 'var(--p-fg-mid)', marginTop: 6 },
  empty:   { textAlign: 'center', padding: '80px 20px' },
  emptyIcon:  { fontSize: 48, marginBottom: 16, opacity: 0.35 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: 'var(--p-fg)', marginBottom: 8 },
  emptyText:  { fontSize: 14, color: 'var(--p-fg-mid)', lineHeight: 1.6 },
  loading:    { textAlign: 'center', padding: '80px 20px', color: 'var(--p-fg-mid)', fontSize: 14 },
  tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid var(--p-border)' },
  table: { borderCollapse: 'collapse', width: '100%' },
  th: {
    padding: '11px 16px', background: 'var(--p-bg-card)', color: 'var(--p-fg-mid)',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
    textAlign: 'left', borderBottom: '1px solid var(--p-border)',
  },
  thRight: {
    padding: '11px 16px', background: 'var(--p-bg-card)', color: 'var(--p-fg-mid)',
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
    textAlign: 'center', borderBottom: '1px solid var(--p-border)',
  },
  td: {
    padding: '12px 16px', fontSize: 13, color: 'var(--p-fg)',
    borderBottom: '1px solid var(--p-border)',
  },
  tdCenter: {
    padding: '12px 16px', fontSize: 13, textAlign: 'center',
    borderBottom: '1px solid var(--p-border)',
  },
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function scoreColor(score, max) {
  const sur20 = max > 0 ? (score / max) * 20 : 0;
  if (sur20 >= 14) return 'var(--p-green)';  // vert  : ≥ 14/20
  if (sur20 >= 10) return '#f7963a';          // orange: 10–13.5/20
  return '#ff453a';                           // rouge : < 10/20
}

export default function PortailResultats() {
  const user = getEleveUser();
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesNotes(user.id)
      .then(data => { setNotes(data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) {
    return <div style={S.page}><div style={S.loading}>Chargement…</div></div>;
  }

  const withEval = notes.filter(n => n.evaluation && !n.absent);
  const absents  = notes.filter(n => n.absent);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <p style={S.sub}>Consultez vos notes et votre progression dans les évaluations.</p>
      </div>

      {notes.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>📊</div>
          <div style={S.emptyTitle}>Aucun résultat disponible</div>
          <p style={S.emptyText}>
            Vos résultats d'évaluations seront affichés ici par votre professeur.
          </p>
        </div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Évaluation</th>
                <th style={S.thRight}>Note</th>
                <th style={S.thRight}>Barème</th>
                <th style={S.thRight}>Date</th>
              </tr>
            </thead>
            <tbody>
              {withEval.map((n, i) => {
                const ev = n.evaluation;
                const score = n.score !== null && n.score !== undefined ? parseFloat(n.score) : null;
                const max   = parseFloat(ev?.score_max || 20);
                return (
                  <tr key={i}>
                    <td style={S.td}>{ev?.titre || '—'}</td>
                    <td style={S.tdCenter}>
                      {score !== null
                        ? <strong style={{ color: scoreColor(score, max), fontSize: 15 }}>{score}</strong>
                        : <span style={{ color: 'var(--p-fg-mid)' }}>—</span>
                      }
                    </td>
                    <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>/{max}</td>
                    <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>{formatDate(ev?.date_evaluation)}</td>
                  </tr>
                );
              })}
              {absents.map((n, i) => (
                <tr key={`abs-${i}`}>
                  <td style={S.td}>{n.evaluation?.titre || '—'}</td>
                  <td style={S.tdCenter}>
                    <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(255,69,58,.12)', color: '#ff453a', fontSize: 12, fontWeight: 700 }}>
                      Absent
                    </span>
                  </td>
                  <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>/{n.evaluation?.score_max || 20}</td>
                  <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>{formatDate(n.evaluation?.date_evaluation)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
