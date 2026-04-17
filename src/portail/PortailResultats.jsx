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
  page:       'py-8',
  header:     'mb-8',
  sub:        'text-sm text-p-fg-mid mt-1.5',
  empty:      'text-center py-20 px-5',
  emptyIcon:  'text-5xl mb-4 opacity-35',
  emptyTitle: 'font-p-display text-lg font-semibold text-p-fg mb-2',
  emptyText:  'text-sm text-p-fg-mid leading-relaxed',
  loading:    'text-center py-20 px-5 text-p-fg-mid text-sm',
  tableWrap:  'overflow-x-auto rounded-xl border border-p-border',
  table:      'border-collapse w-full',
  th:         'py-2.5 px-4 bg-p-bg-card text-p-fg-mid text-[11px] font-bold uppercase tracking-wide text-left border-b border-p-border',
  thRight:    'py-2.5 px-4 bg-p-bg-card text-p-fg-mid text-[11px] font-bold uppercase tracking-wide text-center border-b border-p-border',
  td:         'py-3 px-4 text-[13px] text-p-fg border-b border-p-border',
  tdCenter:   'py-3 px-4 text-[13px] text-center border-b border-p-border',
};

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function GradeBadge({ score }) {
  const grade = gradeFromScore(score);
  if (!grade) return <span className="text-p-fg-mid">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-0.5 rounded-lg text-[13px] font-extrabold tracking-wide"
        style={{ background: grade.color + '22', color: grade.color }}
      >
        {grade.label}
      </span>
      <span className="text-xs text-p-fg-mid">{grade.libelle}</span>
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

  // Cas spécial : un seul segment à 100% → cercle plein (un arc SVG ne peut pas
  // décrire un cercle complet en une seule commande, start == end).
  const singleFull = segments.length === 1;

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
    // Label au centre pour un segment plein, sinon au milieu du secteur
    const midAngle = startAngle + angle / 2;
    const lx = singleFull ? CX : CX + (R * 0.62) * Math.cos(midAngle);
    const ly = singleFull ? CY : CY + (R * 0.62) * Math.sin(midAngle);
    startAngle = endAngle;
    return { ...seg, d, lx, ly, pct: Math.round((seg.count / total) * 100) };
  });

  return (
    <div className="mt-9 bg-p-bg-card border border-p-border rounded-2xl py-7 px-8 flex flex-wrap items-center gap-8">
      {/* Titre */}
      <div className="w-full mb-1">
        <span className="text-xs font-bold uppercase tracking-wide text-p-fg-mid">
          Récapitulatif des appréciations
        </span>
      </div>

      {/* SVG camembert */}
      <svg width="200" height="200" viewBox="0 0 200 200" className="shrink-0">
        {/* Ombre douce */}
        <filter id="pie-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.12" />
        </filter>
        <g filter="url(#pie-shadow)">
          {singleFull ? (
            <circle cx={CX} cy={CY} r={R} fill={paths[0].color} stroke="var(--p-bg-card)" strokeWidth="2" />
          ) : (
            paths.map((seg, i) => (
              <path key={i} d={seg.d} fill={seg.color} stroke="var(--p-bg-card)" strokeWidth="2" />
            ))
          )}
        </g>
        {/* Labels % dans les secteurs (uniquement si segment assez grand) */}
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text
            key={i}
            x={seg.lx} y={seg.ly}
            textAnchor="middle" dominantBaseline="central"
            fill="#fff" fontSize="12" fontWeight="800"
            className="pointer-events-none"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,.4)' }}
          >
            {seg.pct}%
          </text>
        ))}
      </svg>

      {/* Légende */}
      <div className="flex flex-col gap-3 flex-1 min-w-[160px]">
        {paths.map((seg, i) => (
          <div key={i} className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-[13px] text-p-fg font-bold min-w-[36px]">
              {seg.label}
            </span>
            <span className="text-[13px] text-p-fg-mid flex-1">
              {seg.libelle}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: seg.color + '22', color: seg.color }}
            >
              {seg.count} fois · {seg.pct}%
            </span>
          </div>
        ))}
        <div className="mt-1 text-xs text-p-fg-mid border-t border-p-border pt-2.5">
          Total : <strong className="text-p-fg">{total}</strong> évaluation{total > 1 ? 's' : ''}
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
    return <div className={S.page}><div className={S.loading}>Chargement…</div></div>;
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
    <div className={S.page}>
      <div className={S.header}>
        <p className={S.sub}>Consultez vos appréciations et votre progression dans les évaluations.</p>
      </div>

      {notes.length === 0 ? (
        <div className={S.empty}>
          <div className={S.emptyIcon}>📊</div>
          <div className={S.emptyTitle}>Aucun résultat disponible</div>
          <p className={S.emptyText}>
            Vos résultats d'évaluations seront affichés ici par votre professeur.
          </p>
        </div>
      ) : (
        <>
          <div className={S.tableWrap}>
            <table className={S.table}>
              <thead>
                <tr>
                  <th className={S.th}>Évaluation</th>
                  <th className={S.thRight}>Appréciation</th>
                  <th className={S.thRight}>Date</th>
                </tr>
              </thead>
              <tbody>
                {withEval.map((n, i) => {
                  const ev = n.evaluation;
                  const score = n.score !== null && n.score !== undefined ? parseInt(n.score, 10) : null;
                  return (
                    <tr key={i}>
                      <td className={S.td}>{ev?.titre || '—'}</td>
                      <td className={S.tdCenter}>
                        <GradeBadge score={score} />
                      </td>
                      <td className={`${S.tdCenter} text-p-fg-mid`}>{formatDate(ev?.date_evaluation)}</td>
                    </tr>
                  );
                })}
                {absents.map((n, i) => (
                  <tr key={`abs-${i}`}>
                    <td className={S.td}>{n.evaluation?.titre || '—'}</td>
                    <td className={S.tdCenter}>
                      <span
                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(255,69,58,.12)', color: '#ff453a' }}
                      >
                        Absent
                      </span>
                    </td>
                    <td className={`${S.tdCenter} text-p-fg-mid`}>{formatDate(n.evaluation?.date_evaluation)}</td>
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
