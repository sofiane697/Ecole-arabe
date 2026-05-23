import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchProgressionEleve, fetchModulesEnseignant, fetchAllNiveauxForModuleEns,
  fetchQCMExistenceEns, fetchNotesEleve, fetchObservationsEleve,
  fetchRetardsAbsencesEleve, fetchEvaluationsClasse, fetchNoteAcksEleve,
} from './supabaseEnseignant';
import EleveAvatar from '../shared/EleveAvatar';
import { Flourish, Star5, Star8, Diamond } from '../shared/Ornaments';
import { calcAge } from '../shared/dateUtils';

// ─── Palette Coupole (cf. design.md) ──────────────────────────────────────────
const C = {
  bg:        '#F2EEDF',
  paper:     '#FBFAF1',
  ink:       '#1E2317',
  ink2:      '#3F4A33',
  ink3:      '#7A876A',
  gold:      '#8A6B1F',
  goldLight: '#C09844',
  goldSoft:  '#DCBC6E',
  rule:      'rgba(138,107,31,0.18)',
  ruleSoft:  'rgba(138,107,31,0.10)',
  danger:    '#8B3A1F',
};

// ─── Échelle d'appréciation A+/A/ECA/NA (cf. design.md §07) ──────────────────
const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: C.gold      },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: C.goldLight },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: C.ink3      },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: C.danger    },
];
const gradeFromScore = (s) => GRADES.find(g => g.value === s) || null;

const IconChevLeft = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);

// ─── Formatage ────────────────────────────────────────────────────────────────
function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function formatDateLong(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
}
function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function Kicker({ children, mb = 14 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:mb }}>
      <Flourish size={26} />
      <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:10.5, fontWeight:700, letterSpacing:'0.22em', color:C.ink3, textTransform:'uppercase' }}>
        {children}
      </span>
    </div>
  );
}

function GradeChip({ score }) {
  const g = gradeFromScore(score);
  if (!g) return <span style={{ color:C.ink3 }}>—</span>;
  const stars = g.value;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
      <span style={{ display:'inline-flex', gap:2 }}>
        {[1,2,3,4].map(i => <Star5 key={i} size={11} filled={i <= stars} />)}
      </span>
      <span style={{
        fontFamily:"'Manrope',sans-serif", fontSize:11.5, fontWeight:700,
        padding:'3px 11px', borderRadius:999,
        background:`${g.color}14`, color: g.color, border:`1px solid ${g.color}33`,
      }}>{g.label}</span>
      <span style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:13, color:C.ink2 }}>
        {g.libelle}
      </span>
    </span>
  );
}

function StatusPill({ status }) {
  const map = {
    'Terminé':      { bg:`${C.gold}14`,      text:C.gold, border:`${C.gold}33`  },
    'En cours':     { bg:`${C.goldLight}1c`, text:C.gold, border:`${C.goldLight}55` },
    'Non commencé': { bg:'transparent',      text:C.ink3, border:C.rule          },
    'Sans QCM':     { bg:C.ruleSoft,         text:C.ink3, border:'transparent'   },
  };
  const s = map[status] || map['Sans QCM'];
  return (
    <span style={{
      display:'inline-block', padding:'4px 12px', borderRadius:999,
      fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600, letterSpacing:'0.05em',
      background:s.bg, color:s.text, border:`1px solid ${s.border}`, whiteSpace:'nowrap',
    }}>{status}</span>
  );
}

function MetaItem({ icon, children, accent = false }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:7,
      padding:'5px 13px', borderRadius:999,
      background: accent ? `${C.gold}10` : 'transparent',
      border:`1px solid ${accent ? `${C.gold}33` : C.rule}`,
      fontFamily:"'Manrope',sans-serif", fontSize:12.5, fontWeight:500,
      color: accent ? C.gold : C.ink2,
    }}>
      <span style={{ fontSize:13, lineHeight:1 }}>{icon}</span>
      {children}
    </span>
  );
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background:C.paper, border:`1px solid ${C.rule}`, borderRadius:16,
      padding:'18px 22px', display:'flex', flexDirection:'column', gap:6,
    }}>
      <div style={{
        fontFamily:"'JetBrains Mono',monospace", fontSize:30, fontWeight:700,
        color: color || C.ink, lineHeight:1, letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums',
      }}>{value}</div>
      <div style={{
        fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
        textTransform:'uppercase', letterSpacing:'0.16em', color:C.ink3,
      }}>{label}</div>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div style={{
      background:C.paper, border:`1px dashed ${C.rule}`, borderRadius:20,
      padding:'56px 24px', textAlign:'center',
      display:'flex', flexDirection:'column', alignItems:'center', gap:14,
    }}>
      <span style={{ color: C.goldSoft }}><Star8 size={28} /></span>
      <span style={{
        fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic',
        fontSize:15, color:C.ink3,
      }}>{children}</span>
    </div>
  );
}

// ─── PieChart redesigné (palette Coupole) ─────────────────────────────────────
function PieChart({ dist, total }) {
  const R = 70, CX = 90, CY = 90;
  const segments = GRADES.map(g => ({ ...g, count: dist[g.value] || 0 })).filter(g => g.count > 0);
  if (segments.length === 0) return null;
  let startAngle = -Math.PI / 2;
  const paths = segments.map(seg => {
    const angle = (seg.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
    const midAngle = startAngle + angle / 2;
    const lx = CX + R * 0.6 * Math.cos(midAngle);
    const ly = CY + R * 0.6 * Math.sin(midAngle);
    const pct = Math.round((seg.count / total) * 100);
    const large = angle > Math.PI ? 1 : 0;
    const d = segments.length === 1
      ? `M ${CX} ${CY - R} A ${R} ${R} 0 1 1 ${CX - 0.001} ${CY - R} Z`
      : `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { ...seg, d, lx, ly, pct };
  });
  return (
    <div style={{
      background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20,
      padding:'24px 28px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:32,
    }}>
      <div style={{ width:'100%' }}>
        <Kicker mb={4}>Répartition des appréciations</Kicker>
      </div>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink:0 }} aria-label="Répartition">
        {paths.map((seg, i) => (
          <path key={i} d={seg.d} fill={seg.color} stroke={C.paper} strokeWidth="2"/>
        ))}
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text key={`l${i}`} x={seg.lx} y={seg.ly} textAnchor="middle" dominantBaseline="central"
            fill={C.paper} fontSize="12" fontWeight="700" fontFamily="'JetBrains Mono',monospace">
            {seg.pct}%
          </text>
        ))}
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:12, flex:1, minWidth:160 }}>
        {paths.map((seg, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ width:10, height:10, borderRadius:2, flexShrink:0, background:seg.color }}/>
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:700, color:C.ink, minWidth:32 }}>{seg.label}</span>
            <span style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:13, color:C.ink2, flex:1 }}>{seg.libelle}</span>
            <span style={{
              fontFamily:"'JetBrains Mono',monospace", fontSize:11.5, fontWeight:700,
              padding:'3px 9px', borderRadius:999,
              background:`${seg.color}14`, color:seg.color,
              fontVariantNumeric:'tabular-nums',
            }}>{seg.count} · {seg.pct}%</span>
          </div>
        ))}
        <div style={{
          marginTop:6, paddingTop:10, borderTop:`1px solid ${C.ruleSoft}`,
          fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:13, color:C.ink2,
        }}>
          Total : <strong style={{ color:C.ink, fontFamily:"'JetBrains Mono',monospace", fontStyle:'normal' }}>{total}</strong> évaluation{total > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key:'progression',  label:'Progression',  emoji:'📊' },
  { key:'notes',        label:'Notes',        emoji:'📝' },
  { key:'presence',     label:'Présence',     emoji:'🕐' },
  { key:'observations', label:'Observations', emoji:'💬' },
];

const PROG_COLS  = '2fr 90px 80px 130px 130px';
const NOTES_COLS = '100px 1fr 240px 220px';

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantEleveProfile() {
  const { eleveId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();

  const stateClasseId = location.state?.classeId;
  const stateClasse   = location.state?.classe;
  const stateEleve    = location.state?.eleve;

  const [activeTab,      setActiveTab]      = useState('progression');
  const [loading,        setLoading]        = useState(true);
  const [progression,    setProgression]    = useState([]);
  const [modules,        setModules]        = useState([]);
  const [niveauxMap,     setNiveauxMap]     = useState({});
  const [niveauxWithQCM, setNiveauxWithQCM] = useState(new Set());
  const [notes,          setNotes]          = useState([]);
  const [evaluations,    setEvaluations]    = useState([]);
  const [presence,       setPresence]       = useState([]);
  const [observations,   setObservations]   = useState([]);
  const [noteAcks,       setNoteAcks]       = useState({}); // { [note_id]: { parent_label, created_at } }

  useEffect(() => {
    if (!eleveId) return;
    let cancelled = false;
    (async () => {
      try {
        const [prog, mods, rawNotes, pres, obs, evals, acks] = await Promise.all([
          fetchProgressionEleve(eleveId).catch(() => []),
          fetchModulesEnseignant().catch(() => []),
          fetchNotesEleve(eleveId).catch(() => []),
          fetchRetardsAbsencesEleve(eleveId).catch(() => []),
          fetchObservationsEleve(eleveId).catch(() => []),
          stateClasseId ? fetchEvaluationsClasse(stateClasseId).catch(() => []) : Promise.resolve([]),
          fetchNoteAcksEleve(eleveId).catch(() => []),
        ]);
        if (cancelled) return;
        setProgression(prog);
        setModules(mods);
        setNotes(rawNotes);
        setPresence(pres);
        setObservations(obs);
        setEvaluations(evals);
        // Si plusieurs parents (père + mère) signent la même note, on garde le 1er
        // (rare en pratique) — l'ordre DESC privilégie le plus récent.
        const acksMap = {};
        acks.forEach(a => { if (!acksMap[a.note_id]) acksMap[a.note_id] = a; });
        setNoteAcks(acksMap);

        const nivMap = {};
        await Promise.all(mods.map(async (m) => {
          try { nivMap[m.id] = await fetchAllNiveauxForModuleEns(m.id); }
          catch { nivMap[m.id] = []; }
        }));
        if (cancelled) return;
        setNiveauxMap(nivMap);

        const allNivIds = Object.values(nivMap).flat().map(n => n.id);
        if (allNivIds.length > 0) {
          const withQCM = await fetchQCMExistenceEns(allNivIds);
          if (!cancelled) setNiveauxWithQCM(withQCM);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [eleveId, stateClasseId]);

  // ── Données ─────────────────────────────────────────────────────────────────
  const eleve       = stateEleve || {};
  const prenom      = eleve.prenom || '';
  const nom         = eleve.nom || '';
  const dateInscrit = eleve.created_at ? formatDateLong(eleve.created_at) : null;
  const age         = calcAge(eleve.date_naissance);

  // ── Calculs Progression ────────────────────────────────────────────────────
  const isPassed = (nivId) =>
    niveauxWithQCM.has(nivId) && progression.some(p => p.niveau_id === nivId && p.reussi === true);

  const moduleStats = modules.map(m => {
    const nivs         = niveauxMap[m.id] || [];
    const nivsAvecQCM  = nivs.filter(n => niveauxWithQCM.has(n.id));
    const reussis      = nivsAvecQCM.filter(n => isPassed(n.id));
    const scores       = reussis.map(n => {
      const p = progression.find(p => p.niveau_id === n.id && p.reussi);
      return p?.score ?? 0;
    });
    const moyScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const status = nivsAvecQCM.length === 0 ? 'Sans QCM'
      : reussis.length === nivsAvecQCM.length ? 'Terminé'
      : reussis.length > 0 ? 'En cours'
      : 'Non commencé';
    return { m, nivsAvecQCM: nivsAvecQCM.length, reussis: reussis.length, moyScore, status };
  });

  const totalQCM    = moduleStats.reduce((s, r) => s + r.nivsAvecQCM, 0);
  const totalReussi = moduleStats.reduce((s, r) => s + r.reussis, 0);
  const globalPct   = totalQCM > 0 ? Math.round((totalReussi / totalQCM) * 100) : 0;

  // ── Calculs Notes ──────────────────────────────────────────────────────────
  const evalMap       = Object.fromEntries(evaluations.map(e => [e.id, e]));
  const notesWithEval = notes.map(n => ({ ...n, eval: evalMap[n.evaluation_id] }))
    .filter(n => n.eval)
    .sort((a, b) => new Date(b.eval.date_evaluation) - new Date(a.eval.date_evaluation));

  const gradeDist = {};
  notesWithEval.filter(n => !n.absent && n.score != null).forEach(n => {
    const v = parseInt(n.score, 10);
    gradeDist[v] = (gradeDist[v] || 0) + 1;
  });
  const pieTotal = Object.values(gradeDist).reduce((s, v) => s + v, 0);

  // ── Calculs Présence ──────────────────────────────────────────────────────
  const nbRetards  = presence.filter(p => p.type === 'retard').length;
  const nbAbsences = presence.filter(p => p.type === 'absence').length;

  const backUrl = stateClasseId ? `/enseignant/classe/${stateClasseId}` : '/enseignant/classes';

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      padding:'24px 32px 48px', minHeight:'100%',
      background:C.bg, fontFamily:"'Manrope',system-ui,sans-serif", color:C.ink,
    }}>

      {/* ── Bouton retour ─────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(backUrl)}
        style={{
          display:'inline-flex', alignItems:'center', gap:7,
          padding:'7px 14px 7px 10px', borderRadius:999,
          border:`1px solid ${C.rule}`, background:'transparent', color:C.ink2,
          fontFamily:"'Manrope',sans-serif", fontSize:12.5, fontWeight:600,
          cursor:'pointer', marginBottom:20, transition:'all .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = C.paper; e.currentTarget.style.color = C.ink; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink2; }}
      >
        {IconChevLeft}
        Retour{stateClasse ? ` — ${stateClasse.nom}` : ''}
      </button>

      {/* ── En-tête élève ────────────────────────────────────────────────── */}
      <div style={{
        background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20,
        padding:'28px 32px 22px', marginBottom:24,
      }}>
        <Kicker mb={16}>Fiche élève{stateClasse ? ` · ${stateClasse.nom}` : ''}</Kicker>

        <div style={{ display:'flex', alignItems:'center', gap:22, flexWrap:'wrap' }}>
          <EleveAvatar
            eleve={eleve}
            variant="enseignant"
            size={72}
            fallbackStyle={{ background:C.ink, color:C.goldLight, fontWeight:700, letterSpacing:'0.5px', fontSize:24 }}
          />
          <div style={{ flex:1, minWidth:240 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:4 }}>
              <h1 style={{
                margin:0, fontFamily:"'Newsreader',Georgia,serif",
                fontSize:34, fontWeight:500, lineHeight:1.05, letterSpacing:'-0.015em',
                color:C.ink,
              }}>
                <em style={{ fontStyle:'italic', color:C.gold, fontWeight:500 }}>{prenom}</em>
                {' '}
                <span style={{ textTransform:'uppercase' }}>{nom}</span>
              </h1>
              {eleve.actif !== undefined && (
                <span style={{
                  padding:'3px 11px', borderRadius:999,
                  fontFamily:"'Manrope',sans-serif", fontSize:10.5, fontWeight:700,
                  letterSpacing:'0.12em', textTransform:'uppercase',
                  background: eleve.actif ? `${C.gold}14` : C.ruleSoft,
                  color:      eleve.actif ? C.gold       : C.ink3,
                  border:`1px solid ${eleve.actif ? `${C.gold}33` : C.rule}`,
                }}>{eleve.actif ? 'Actif' : 'Inactif'}</span>
              )}
            </div>
            {eleve.identifiant && (
              <div style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:12.5,
                color:C.ink3, letterSpacing:'0.06em',
              }}>{eleve.identifiant.toUpperCase()}</div>
            )}
          </div>
        </div>

        {(stateClasse || dateInscrit || eleve.telephone || eleve.email_contact || age != null) && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:18 }}>
            {stateClasse        && <MetaItem icon="🏫" accent>{stateClasse.nom}</MetaItem>}
            {age != null        && <MetaItem icon="🎂">{age} an{age > 1 ? 's' : ''}</MetaItem>}
            {dateInscrit        && <MetaItem icon="📅">Inscrit le {dateInscrit}</MetaItem>}
            {eleve.telephone    && <MetaItem icon="📞">{eleve.telephone}</MetaItem>}
            {eleve.email_contact && <MetaItem icon="✉️">{eleve.email_contact}</MetaItem>}
          </div>
        )}
      </div>

      {/* ── Onglets (segmented control Pattern B) ────────────────────────── */}
      <div style={{
        display:'inline-flex', background:C.paper, border:`1px solid ${C.rule}`,
        borderRadius:999, padding:3, marginBottom:24,
      }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 18px', borderRadius:999, border:'none',
                background: active ? C.ink : 'transparent',
                color:      active ? C.paper : C.ink3,
                fontFamily:"'Manrope',sans-serif", fontSize:12.5,
                fontWeight: active ? 700 : 600,
                cursor:'pointer', transition:'all .15s', whiteSpace:'nowrap',
              }}
            >
              <span style={{ fontSize:14, opacity: active ? 1 : 0.85 }}>{t.emoji}</span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{
          padding:'60px 0', textAlign:'center',
          fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:16, color:C.ink3,
        }}>Chargement…</div>
      ) : (
        <>
          {/* ═══ PROGRESSION ════════════════════════════════════════════════ */}
          {activeTab === 'progression' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {/* Barre globale */}
              <div style={{
                background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20,
                padding:'26px 30px', display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
              }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', minWidth:120 }}>
                  <div style={{
                    fontFamily:"'JetBrains Mono',monospace", fontSize:54, fontWeight:700,
                    color: globalPct >= 100 ? C.gold : C.ink, lineHeight:1, letterSpacing:'-0.03em',
                    fontVariantNumeric:'tabular-nums',
                  }}>{globalPct}<span style={{ fontSize:24, color:C.ink3 }}>%</span></div>
                  <div style={{
                    fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                    letterSpacing:'0.22em', textTransform:'uppercase', color:C.ink3, marginTop:6,
                  }}>Progression</div>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{
                    fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:14, color:C.ink2, marginBottom:10,
                  }}>
                    <strong style={{ fontStyle:'normal', fontFamily:"'JetBrains Mono',monospace", color:C.ink }}>{totalReussi}</strong>
                    {' / '}
                    <strong style={{ fontStyle:'normal', fontFamily:"'JetBrains Mono',monospace", color:C.ink }}>{totalQCM}</strong>
                    {' '}niveau{totalQCM > 1 ? 'x' : ''} réussi{totalReussi !== 1 ? 's' : ''}
                  </div>
                  <div style={{ height:8, background:C.ruleSoft, borderRadius:4, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', width:`${globalPct}%`,
                      background: globalPct >= 100 ? C.gold : C.goldLight,
                      borderRadius:4, transition:'width .6s ease-out',
                    }}/>
                  </div>
                </div>
              </div>

              {/* Détail par module */}
              <div>
                <Kicker>Détail par module</Kicker>
                {moduleStats.length === 0 ? (
                  <EmptyState>Aucun module disponible.</EmptyState>
                ) : (
                  <div style={{
                    background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20, overflow:'hidden',
                  }}>
                    <div style={{
                      display:'grid', gridTemplateColumns:PROG_COLS, gap:14,
                      padding:'12px 22px', borderBottom:`1px solid ${C.ruleSoft}`,
                      fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                      letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3,
                    }}>
                      <span>Module</span>
                      <span style={{ textAlign:'center' }}>Niveaux QCM</span>
                      <span style={{ textAlign:'center' }}>Réussis</span>
                      <span>Score moyen</span>
                      <span>Statut</span>
                    </div>
                    {moduleStats.map(({ m, nivsAvecQCM, reussis, moyScore, status }, idx) => {
                      const pct = nivsAvecQCM > 0 ? Math.round((reussis / nivsAvecQCM) * 100) : 0;
                      return (
                        <div key={m.id} style={{
                          display:'grid', gridTemplateColumns:PROG_COLS, gap:14,
                          padding:'16px 22px', alignItems:'center',
                          borderBottom: idx < moduleStats.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                        }}>
                          <span style={{
                            fontFamily:"'Newsreader',Georgia,serif", fontSize:16, fontWeight:500, color:C.ink,
                          }}>{m.titre}</span>
                          <span style={{
                            textAlign:'center',
                            fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:600,
                            color: nivsAvecQCM > 0 ? C.ink2 : C.ink3, fontVariantNumeric:'tabular-nums',
                          }}>{nivsAvecQCM > 0 ? nivsAvecQCM : '—'}</span>
                          <span style={{
                            textAlign:'center',
                            fontFamily:"'JetBrains Mono',monospace", fontSize:13, fontWeight:700,
                            color: reussis > 0 ? C.gold : C.ink3, fontVariantNumeric:'tabular-nums',
                          }}>{reussis}</span>
                          <span>
                            {nivsAvecQCM > 0 ? (
                              <div>
                                <div style={{ height:5, background:C.ruleSoft, borderRadius:3, overflow:'hidden', marginBottom:5 }}>
                                  <div style={{ height:'100%', width:`${pct}%`, background:C.goldLight, borderRadius:3 }}/>
                                </div>
                                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:C.ink2 }}>
                                  {moyScore}%
                                </span>
                              </div>
                            ) : <span style={{ color:C.ink3 }}>—</span>}
                          </span>
                          <span><StatusPill status={status} /></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══ NOTES ════════════════════════════════════════════════════════ */}
          {activeTab === 'notes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

              {notesWithEval.length > 0 && (
                <div style={{
                  display:'grid', gap:12,
                  gridTemplateColumns:`repeat(${Math.min(2 + GRADES.filter(g => gradeDist[g.value] > 0).length, 6)}, 1fr)`,
                }}>
                  <StatCard value={notesWithEval.length} label={`Évaluation${notesWithEval.length > 1 ? 's' : ''}`} />
                  <StatCard value={notesWithEval.filter(n => n.absent).length} label="Absences éval." color={C.ink3} />
                  {GRADES.filter(g => gradeDist[g.value] > 0).map(g => (
                    <StatCard key={g.value} value={gradeDist[g.value]} label={`${g.label} · ${g.libelle}`} color={g.color} />
                  ))}
                </div>
              )}

              {notesWithEval.length === 0 ? (
                <EmptyState>
                  {stateClasseId ? "Aucune note enregistrée pour cet élève." : "Navigue depuis la fiche classe pour voir les notes."}
                </EmptyState>
              ) : (
                <>
                  <div style={{ background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20, overflow:'hidden' }}>
                    <div style={{
                      display:'grid', gridTemplateColumns:NOTES_COLS, gap:14,
                      padding:'12px 22px', borderBottom:`1px solid ${C.ruleSoft}`,
                      fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700,
                      letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3,
                    }}>
                      <span>Date</span>
                      <span>Évaluation</span>
                      <span>Appréciation</span>
                      <span>Signature parent</span>
                    </div>
                    {notesWithEval.map((n, i) => {
                      const score = n.score != null ? parseInt(n.score, 10) : null;
                      const ack   = noteAcks[n.id];
                      return (
                        <div key={`${n.evaluation_id}-${i}`} style={{
                          display:'grid', gridTemplateColumns:NOTES_COLS, gap:14,
                          padding:'14px 22px', alignItems:'center',
                          borderBottom: i < notesWithEval.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                        }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:C.ink3, fontVariantNumeric:'tabular-nums' }}>
                            {formatDate(n.eval.date_evaluation)}
                          </span>
                          <span style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:15, fontWeight:500, color:C.ink }}>
                            {n.eval.titre}
                          </span>
                          <span>
                            {n.absent ? (
                              <span style={{
                                display:'inline-flex', alignItems:'center', gap:6,
                                padding:'3px 11px', borderRadius:999,
                                background:`${C.danger}10`, color:C.danger, border:`1px solid ${C.danger}33`,
                                fontFamily:"'Manrope',sans-serif", fontSize:11.5, fontWeight:700,
                              }}>🚫 Absent</span>
                            ) : <GradeChip score={score} />}
                          </span>
                          <span>
                            {ack ? (
                              <span style={{ display:'inline-flex', flexDirection:'column', gap:2 }}>
                                <span style={{
                                  fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:700,
                                  color:C.gold, letterSpacing:'0.04em',
                                }}>✓ Signée par {ack.parent_label || 'le parent'}</span>
                                <span style={{
                                  fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic',
                                  fontSize:11.5, color:C.ink3,
                                }}>le {formatDate(ack.created_at)}</span>
                              </span>
                            ) : (
                              <span style={{
                                fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic',
                                fontSize:13, color:C.ink3,
                              }}>Non signée</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {pieTotal > 0 && <PieChart dist={gradeDist} total={pieTotal} />}
                </>
              )}
            </div>
          )}

          {/* ═══ PRÉSENCE ═════════════════════════════════════════════════════ */}
          {activeTab === 'presence' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                <StatCard value={nbRetards}      label={`Retard${nbRetards !== 1 ? 's' : ''}`}   color={C.gold}  />
                <StatCard value={nbAbsences}     label={`Absence${nbAbsences !== 1 ? 's' : ''}`} color={C.danger}/>
                <StatCard value={presence.length} label="Total" />
              </div>

              {presence.length === 0 ? (
                <EmptyState>Aucun retard ni absence enregistré pour cet élève.</EmptyState>
              ) : (
                <div style={{ background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20, overflow:'hidden' }}>
                  {presence.map((p, idx) => {
                    const isRetard = p.type === 'retard';
                    const color = isRetard ? C.gold : C.danger;
                    return (
                      <div key={p.id} style={{
                        display:'flex', alignItems:'flex-start', gap:16,
                        padding:'16px 22px',
                        borderBottom: idx < presence.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                      }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:7,
                          padding:'5px 13px', borderRadius:999,
                          background:`${color}10`, color, border:`1px solid ${color}33`,
                          fontFamily:"'Manrope',sans-serif", fontSize:11.5, fontWeight:700,
                          letterSpacing:'0.06em', flexShrink:0,
                        }}>
                          {isRetard ? '⏰ Retard' : '🚫 Absence'}
                        </span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{
                            fontFamily:"'Newsreader',Georgia,serif", fontSize:15, fontWeight:500, color:C.ink,
                          }}>{formatDate(p.date)}</div>
                          {p.commentaire && (
                            <div style={{
                              marginTop:4,
                              fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic',
                              fontSize:13.5, color:C.ink2, lineHeight:1.5,
                            }}>{p.commentaire}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══ OBSERVATIONS ═════════════════════════════════════════════════ */}
          {activeTab === 'observations' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {observations.length === 0 ? (
                <EmptyState>Aucune observation enregistrée pour cet élève.</EmptyState>
              ) : observations.map(o => {
                const type = (o.type || 'general').toLowerCase();
                const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
                return (
                  <div key={o.id} style={{
                    position:'relative',
                    background:C.paper, border:`1px solid ${C.rule}`, borderRadius:20,
                    padding:'20px 24px 18px',
                  }}>
                    <span style={{
                      position:'absolute', top:14, right:16,
                      color:C.goldSoft, display:'inline-flex',
                    }}><Diamond size={8} color={C.goldSoft} /></span>

                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <span style={{
                        padding:'3px 11px', borderRadius:999,
                        fontFamily:"'Manrope',sans-serif", fontSize:10.5, fontWeight:700,
                        letterSpacing:'0.14em', textTransform:'uppercase',
                        background:`${C.gold}10`, color:C.gold, border:`1px solid ${C.gold}33`,
                      }}>{typeLabel}</span>
                      <span style={{
                        fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic',
                        fontSize:12.5, color:C.ink3,
                      }}>{formatDateTime(o.created_at)}</span>
                    </div>

                    <div style={{
                      fontFamily:"'Newsreader',Georgia,serif",
                      fontSize:16, color:C.ink, lineHeight:1.55,
                    }}>{o.contenu}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
