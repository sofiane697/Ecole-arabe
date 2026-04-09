import React, { useEffect, useState } from 'react';
import { getEleveUser } from './supabasePortail';
import { fetchMesNotes } from './supabasePortail';

const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: '#30d158' },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: '#0a84ff' },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: '#f7963a' },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: '#ff453a' },
];

function gradeFromScore(score) {
  return GRADES.find(g => g.value === score) || null;
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

function GradeBadge({ score }) {
  const grade = gradeFromScore(score);
  if (!grade) return <span style={{ color: 'var(--p-fg-mid)' }}>—</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 40, padding: '3px 10px', borderRadius: 8,
        background: grade.color + '22', color: grade.color,
        fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
      }}>
        {grade.label}
      </span>
      <span style={{ fontSize: 12, color: 'var(--p-fg-mid)' }}>{grade.libelle}</span>
    </span>
  );
}

/* ── Camembert SVG ── */
function PieChart({ dist, total }) {
  const R = 80;
  const CX = 100;
  const CY = 100;

  // Filtre les segments non nuls
  const segments = GRADES.map(g => ({ ...g, count: dist[g.value] || 0 }))
                         .filter(g => g.count > 0);

  if (segments.length === 0) return null;

  // Calcule les arcs SVG
  let startAngle = -Math.PI / 2; // commence à 12h
  const paths = segments.map(seg => {
    const angle = (seg.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY + R * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    // Label au milieu du secteur
    const midAngle = startAngle + angle / 2;
    const lx = CX + (R * 0.62) * Math.cos(midAngle);
    const ly = CY + (R * 0.62) * Math.sin(midAngle);
    startAngle = endAngle;
    return { ...seg, d, lx, ly, pct: Math.round((seg.count / total) * 100) };
  });

  return (
    <div style={{
      marginTop: 36,
      background: 'var(--p-bg-card)',
      border: '1px solid var(--p-border)',
      borderRadius: 16,
      padding: '28px 32px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 32,
    }}>
      {/* Titre */}
      <div style={{ width: '100%', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--p-fg-mid)' }}>
          Récapitulatif des appréciations
        </span>
      </div>

      {/* SVG camembert */}
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ flexShrink: 0 }}>
        {/* Ombre douce */}
        <filter id="pie-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
        </filter>
        <g filter="url(#pie-shadow)">
          {paths.map((seg, i) => (
            <path key={i} d={seg.d} fill={seg.color} stroke="var(--p-bg-card)" strokeWidth="2" />
          ))}
        </g>
        {/* Labels % dans les secteurs (uniquement si segment assez grand) */}
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text
            key={i}
            x={seg.lx} y={seg.ly}
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize="12" fontWeight="800"
            style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,.4)' }}
          >
            {seg.pct}%
          </text>
        ))}
      </svg>

      {/* Légende */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minWidth: 160 }}>
        {paths.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              width: 14, height: 14, borderRadius: 4,
              background: seg.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 13, color: 'var(--p-fg)', fontWeight: 700, minWidth: 36 }}>
              {seg.label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--p-fg-mid)', flex: 1 }}>
              {seg.libelle}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              background: seg.color + '22', color: seg.color,
              padding: '2px 8px', borderRadius: 6,
            }}>
              {seg.count} fois · {seg.pct}%
            </span>
          </div>
        ))}
        <div style={{ marginTop: 4, fontSize: 12, color: 'var(--p-fg-mid)', borderTop: '1px solid var(--p-border)', paddingTop: 10 }}>
          Total : <strong style={{ color: 'var(--p-fg)' }}>{total}</strong> évaluation{total > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
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

  // Distribution des notes pour le camembert
  const dist = {};
  withEval.forEach(n => {
    const score = n.score !== null && n.score !== undefined ? parseInt(n.score, 10) : null;
    if (score !== null) dist[score] = (dist[score] || 0) + 1;
  });
  const pieTotal = Object.values(dist).reduce((s, v) => s + v, 0);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <p style={S.sub}>Consultez vos appréciations et votre progression dans les évaluations.</p>
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
        <>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Évaluation</th>
                  <th style={S.thRight}>Appréciation</th>
                  <th style={S.thRight}>Date</th>
                </tr>
              </thead>
              <tbody>
                {withEval.map((n, i) => {
                  const ev = n.evaluation;
                  const score = n.score !== null && n.score !== undefined ? parseInt(n.score, 10) : null;
                  return (
                    <tr key={i}>
                      <td style={S.td}>{ev?.titre || '—'}</td>
                      <td style={S.tdCenter}>
                        <GradeBadge score={score} />
                      </td>
                      <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>{formatDate(ev?.date_evaluation)}</td>
                    </tr>
                  );
                })}
                {absents.map((n, i) => (
                  <tr key={`abs-${i}`}>
                    <td style={S.td}>{n.evaluation?.titre || '—'}</td>
                    <td style={S.tdCenter}>
                      <span style={{ padding: '3px 10px', borderRadius: 8, background: 'rgba(255,69,58,.12)', color: '#ff453a', fontSize: 12, fontWeight: 700 }}>
                        Absent
                      </span>
                    </td>
                    <td style={{ ...S.tdCenter, color: 'var(--p-fg-mid)' }}>{formatDate(n.evaluation?.date_evaluation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pieTotal > 0 && <PieChart dist={dist} total={pieTotal} />}
        </>
      )}
    </div>
  );
}
