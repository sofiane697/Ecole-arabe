import React, { useEffect, useState } from 'react';
import { getEleveUser, fetchMesNotes } from './supabasePortail';

const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: '#30d158', bg: 'rgba(48,209,88,0.1)'   },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: '#0a84ff', bg: 'rgba(10,132,255,0.1)'  },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: '#f7963a', bg: 'rgba(247,150,58,0.1)'  },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: '#ff453a', bg: 'rgba(255,69,58,0.1)'   },
];

function gradeFromScore(score) {
  return GRADES.find(g => g.value === score) || null;
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Donut SVG ── */
function DonutChart({ dist, total }) {
  const R = 54, STROKE = 13, CX = 70, CY = 70;
  const circ = 2 * Math.PI * R;
  const segments = GRADES.map(g => ({ ...g, count: dist[g.value] || 0 })).filter(g => g.count > 0);
  if (segments.length === 0) return null;

  let offset = 0;
  const arcs = segments.map(seg => {
    const pct = seg.count / total;
    const dash = pct * circ;
    const gap  = circ - dash;
    const arc  = { ...seg, dash, gap, offset, pct: Math.round(pct * 100) };
    offset += dash;
    return arc;
  });

  return (
    <div style={{ display:'flex', alignItems:'center', gap:28, flexWrap:'wrap' }}>
      {/* Donut */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--p-border)" strokeWidth={STROKE} />
          {arcs.map((seg, i) => (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={seg.color} strokeWidth={STROKE}
              strokeDasharray={`${seg.dash} ${seg.gap}`}
              strokeDashoffset={-seg.offset + circ / 4}
              strokeLinecap="round"
              style={{ transition:'stroke-dasharray .5s ease' }}
            />
          ))}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:24, fontWeight:800, color:'var(--p-fg)', lineHeight:1 }}>{total}</span>
          <span style={{ fontSize:10, color:'var(--p-fg-light)', fontWeight:600, marginTop:2 }}>NOTES</span>
        </div>
      </div>

      {/* Légende */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:160 }}>
        {arcs.map((seg, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:seg.color, flexShrink:0 }} />
            <span style={{ fontSize:13, fontWeight:700, color:seg.color, minWidth:36 }}>{seg.label}</span>
            <span style={{ fontSize:12, color:'var(--p-fg-mid)', flex:1 }}>{seg.libelle}</span>
            <span style={{ fontSize:11, fontWeight:700, color:seg.color, background:seg.bg, padding:'2px 8px', borderRadius:20 }}>
              {seg.count}× · {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Carte d'évaluation ── */
function EvalCard({ note, index }) {
  const ev = note.evaluation;
  const score = note.score !== null && note.score !== undefined ? parseInt(note.score, 10) : null;
  const grade = note.absent ? null : gradeFromScore(score);

  return (
    <div style={{
      background: 'var(--p-bg-card)',
      borderRadius: 14,
      border: '1px solid var(--p-border)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'stretch',
      transition: 'box-shadow .2s, transform .15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = ''; }}
    >
      {/* Bande colorée gauche */}
      <div style={{
        width: 5, flexShrink: 0,
        background: note.absent ? '#ff453a' : (grade ? grade.color : 'var(--p-border)'),
      }} />

      {/* Numéro */}
      <div style={{
        width: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--p-fg-light)', fontSize: 12, fontWeight: 700,
      }}>
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-fg)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev?.titre || '—'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--p-fg-light)' }}>
            {formatDate(ev?.date_evaluation)}
          </div>
          {note.commentaire && (
            <div style={{
              marginTop: 10,
              padding: '10px 12px',
              borderLeft: `3px solid ${grade ? grade.color : 'var(--p-border)'}`,
              background: 'var(--p-bg)',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--p-fg-mid)',
              lineHeight: 1.5,
              fontStyle: 'italic',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {note.commentaire}
            </div>
          )}
        </div>

        {/* Badge note */}
        {note.absent ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{ padding: '5px 14px', borderRadius: 8, background: 'rgba(255,69,58,.1)', color: '#ff453a', fontSize: 13, fontWeight: 800 }}>
              Absent
            </div>
          </div>
        ) : grade ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: grade.bg,
              border: `2px solid ${grade.color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 900, color: grade.color,
            }}>
              {grade.label}
            </div>
            <div style={{ fontSize: 10, color: grade.color, fontWeight: 600, textAlign: 'center', maxWidth: 70 }}>
              {grade.libelle}
            </div>
          </div>
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--p-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-fg-light)', fontSize: 18 }}>—</div>
        )}
      </div>
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      flex: 1, minWidth: 120,
      background: 'var(--p-bg-card)',
      borderRadius: 14, border: '1px solid var(--p-border)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: color || 'var(--p-fg)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--p-fg-mid)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function PortailResultats() {
  const user = getEleveUser();
  const [notes,      setNotes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesNotes(user.id)
      .then(data => setNotes(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) {
    if (!showLoader) return null;
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--p-fg-mid)', fontSize:14 }}>
        Chargement…
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:52, marginBottom:16, opacity:.3 }}>📊</div>
        <div style={{ fontFamily:'var(--p-font-display)', fontSize:18, fontWeight:700, color:'var(--p-fg)', marginBottom:8 }}>
          Aucun résultat disponible
        </div>
        <p style={{ fontSize:14, color:'var(--p-fg-mid)', maxWidth:320, margin:'0 auto', lineHeight:1.6 }}>
          Tes résultats d'évaluations seront affichés ici par ton professeur.
        </p>
      </div>
    );
  }

  const withEval = notes.filter(n => n.evaluation && !n.absent);
  const absents  = notes.filter(n => n.absent);
  const allNotes = [...withEval, ...absents];

  // Stats
  const scores = withEval.map(n => parseInt(n.score, 10)).filter(s => !isNaN(s));
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const bestGrade = bestScore !== null ? gradeFromScore(bestScore) : null;
  const dist = {};
  withEval.forEach(n => {
    const s = parseInt(n.score, 10);
    if (!isNaN(s)) dist[s] = (dist[s] || 0) + 1;
  });
  const pieTotal = Object.values(dist).reduce((a, v) => a + v, 0);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Sous-titre */}
      <p style={{ fontSize:14, color:'var(--p-fg-mid)', marginBottom:24 }}>
        Consulte tes appréciations et ta progression dans les évaluations.
      </p>

      {/* Stats */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:28 }}>
        <StatCard icon="📝" label="Évaluations" value={withEval.length} />
        {bestGrade && (
          <StatCard icon="🏆" label="Meilleure note" value={bestGrade.label} color={bestGrade.color} />
        )}
        {absents.length > 0 && (
          <StatCard icon="⚠️" label="Absence(s)" value={absents.length} color="#ff453a" />
        )}
      </div>

      {/* Liste des évaluations */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:32 }}>
        {allNotes.map((note, i) => (
          <EvalCard key={i} note={note} index={i} />
        ))}
      </div>

      {/* Récapitulatif donut */}
      {pieTotal > 0 && (
        <div style={{
          background:'var(--p-bg-card)',
          borderRadius:16, border:'1px solid var(--p-border)',
          padding:'24px 28px',
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--p-fg-light)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:20 }}>
            Récapitulatif des appréciations
          </div>
          <DonutChart dist={dist} total={pieTotal} />
        </div>
      )}
    </div>
  );
}
