import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchProgressionEleve, fetchModulesEnseignant, fetchAllNiveauxForModuleEns,
  fetchQCMExistenceEns, fetchNotesEleve, fetchObservationsEleve,
  fetchRetardsAbsencesEleve, fetchEvaluationsClasse,
} from './supabaseEnseignant';
import EleveAvatar from '../shared/EleveAvatar';
import { calcAge } from '../shared/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: '#30d158' },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: '#0a84ff' },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: '#f7963a' },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: '#ff453a' },
];
function gradeFromScore(score) {
  return GRADES.find(g => g.value === score) || null;
}
function GradeBadge({ score }) {
  const grade = gradeFromScore(score);
  if (!grade) return <span style={{ color:'var(--a-fg-mid)' }}>—</span>;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:40, padding:'3px 10px', borderRadius:8, fontSize:13, fontWeight:800, letterSpacing:'0.5px', background: grade.color + '22', color: grade.color }}>
        {grade.label}
      </span>
      <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>{grade.libelle}</span>
    </span>
  );
}
function PieChart({ dist, total }) {
  const R = 72, CX = 90, CY = 90;
  const segments = GRADES.map(g => ({ ...g, count: dist[g.value] || 0 })).filter(g => g.count > 0);
  if (segments.length === 0) return null;
  let startAngle = -Math.PI / 2;
  const paths = segments.map(seg => {
    const angle = (seg.count / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
    const midAngle = startAngle + angle / 2;
    const lx = CX + R * 0.62 * Math.cos(midAngle);
    const ly = CY + R * 0.62 * Math.sin(midAngle);
    const pct = Math.round((seg.count / total) * 100);
    const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { ...seg, d, lx, ly, pct };
  });
  return (
    <div style={{ marginTop:16, background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius)', padding:'20px 24px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:24 }}>
      <div style={{ width:'100%', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--a-fg-light)', marginBottom:4 }}>
        Récapitulatif des appréciations
      </div>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink:0 }}>
        <filter id="ps2"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12"/></filter>
        <g filter="url(#ps2)">
          {paths.map((seg, i) => <path key={i} d={seg.d} fill={seg.color} stroke="var(--a-bg-card)" strokeWidth="2"/>)}
        </g>
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text key={i} x={seg.lx} y={seg.ly} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="11" fontWeight="800">{seg.pct}%</text>
        ))}
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:10, flex:1, minWidth:140 }}>
        {paths.map((seg, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:12, height:12, borderRadius:3, flexShrink:0, background: seg.color }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'var(--a-fg)', minWidth:34 }}>{seg.label}</span>
            <span style={{ fontSize:12, color:'var(--a-fg-mid)', flex:1 }}>{seg.libelle}</span>
            <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:6, background: seg.color + '22', color: seg.color }}>{seg.count} · {seg.pct}%</span>
          </div>
        ))}
        <div style={{ marginTop:4, fontSize:12, color:'var(--a-fg-mid)', borderTop:'1px solid var(--a-border)', paddingTop:8 }}>
          Total : <strong style={{ color:'var(--a-fg)' }}>{total}</strong> évaluation{total > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
function formatDateTime(str) {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function scoreColor(pct) {
  if (pct >= 70) return 'var(--a-green)';
  if (pct >= 50) return 'var(--a-gold)';
  return 'var(--a-red)';
}

const OBS_COLORS = {
  'general':      { bg: 'rgba(10,132,255,.1)',  color: 'var(--a-blue)' },
  'comportement': { bg: 'rgba(255,69,58,.1)',   color: 'var(--a-red)' },
  'progression':  { bg: 'rgba(48,209,88,.1)',   color: 'var(--a-green)' },
};

// ─── Styles — 100% inline ─────────────────────────────────────────────────────
const S = {
  page:     { minHeight:'100%', display:'flex', flexDirection:'column', gap:16 },
  backBtn:  { display:'inline-flex', alignItems:'center', gap:6, border:'none', background:'none', padding:0, cursor:'pointer', fontSize:13, fontWeight:500, color:'var(--a-fg-mid)', marginBottom:4, transition:'color .15s', fontFamily:'inherit' },

  // Header card
  headerCard:   { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', overflow:'hidden', boxShadow:'0 2px 8px rgba(0,0,0,.06)' },
  headerTop:    { display:'flex', alignItems:'center', gap:16, padding:'20px 24px' },
  avatar:       { width:60, height:60, minWidth:60, borderRadius:'50%', background:'linear-gradient(135deg, var(--a-gold), #e8a93e)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, flexShrink:0, letterSpacing:'-0.03em', boxShadow:'0 4px 16px rgba(212,151,43,.3)' },
  headerInfo:   { flex:1, minWidth:0 },
  headerName:   { fontFamily:'var(--a-font-display)', fontSize:22, fontWeight:800, color:'var(--a-fg)', letterSpacing:'-0.5px', lineHeight:1.2 },
  headerIdLine: { fontFamily:'var(--a-font-mono)', fontSize:12, color:'var(--a-fg-light)', letterSpacing:'0.05em', marginTop:4 },
  badge: (actif) => ({ padding:'3px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.10)', color: actif ? 'var(--a-green)' : 'var(--a-red)', border:`1px solid ${actif ? 'rgba(48,209,88,.25)' : 'rgba(255,69,58,.22)'}`, flexShrink:0 }),
  headerBottom: { display:'flex', flexWrap:'wrap', gap:8, padding:'12px 24px', background:'var(--a-bg)', borderTop:'1px solid var(--a-border)' },
  metaItem:     { display:'inline-flex', alignItems:'center', gap:5, fontSize:13, color:'var(--a-fg-mid)', padding:'4px 12px', borderRadius:8, background:'var(--a-bg-card)', border:'1px solid var(--a-border)' },
  metaItemGold: { display:'inline-flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600, color:'var(--a-gold)', padding:'4px 12px', borderRadius:8, background:'rgba(191,138,48,.08)', border:'1px solid rgba(191,138,48,.22)' },

  // Tabs
  tabsRow: { display:'flex', borderBottom:'1px solid var(--a-border)', background:'var(--a-bg-card)', borderRadius:'var(--a-radius) var(--a-radius) 0 0', padding:'0 8px', gap:0 },
  tab: (active) => ({ padding:'12px 20px', fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:'transparent', color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)', borderBottom: active ? '2px solid var(--a-gold)' : '2px solid transparent', marginBottom:-1, transition:'color .15s', fontFamily:'inherit' }),

  // Section
  sectionTitle: { fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 },
  empty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'56px 24px', fontSize:14, color:'var(--a-fg-mid)', textAlign:'center', background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)' },
  loading: { padding:40, textAlign:'center', fontSize:14, color:'var(--a-fg-mid)' },

  // Stats grid
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:16 },
  statCard:  { background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius-sm)', padding:'16px 20px', textAlign:'center' },
  statNum: (c) => ({ fontFamily:'var(--a-font-display)', fontSize:28, fontWeight:800, color:c, lineHeight:1, letterSpacing:'-0.03em' }),
  statLabel: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'var(--a-fg-light)', marginTop:5 },

  // Global progression bar
  globalBarCard: { background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius)', padding:'20px 24px', display:'flex', alignItems:'center', gap:24, marginBottom:16 },
  globalPctBlock: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minWidth:80 },
  globalPctNum: (pct) => ({ fontSize:36, fontWeight:800, letterSpacing:'-0.04em', lineHeight:1, color: pct >= 100 ? 'var(--a-green)' : pct > 0 ? 'var(--a-gold)' : 'var(--a-fg-light)' }),
  globalPctLabel: { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--a-fg-light)', marginTop:4 },
  globalBarTrack: { flex:1, height:8, background:'rgba(127,127,127,.1)', borderRadius:4, overflow:'hidden' },
  globalBarFill: (pct) => ({ height:'100%', width:`${pct}%`, background: pct >= 100 ? 'var(--a-green)' : 'linear-gradient(90deg, var(--a-gold), #e8a93e)', borderRadius:4, transition:'width .6s ease-out' }),
  globalBarText: { fontSize:13, color:'var(--a-fg-mid)' },

  // Table
  tableWrap: { background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius)', overflow:'hidden' },
  tHead: (cols) => ({ display:'grid', gridTemplateColumns:cols, padding:'10px 20px', borderBottom:'1px solid var(--a-border)', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.7px', background:'var(--a-bg)' }),
  tRow:  (cols) => ({ display:'grid', gridTemplateColumns:cols, padding:'14px 20px', borderBottom:'1px solid var(--a-border)', alignItems:'center' }),

  // Badges
  statusBadge: (status) => {
    const map = {
      'Terminé':      ['rgba(48,209,88,.10)',  'var(--a-green)',    'rgba(48,209,88,.22)'],
      'En cours':     ['rgba(191,138,48,.10)', 'var(--a-gold)',     'rgba(191,138,48,.25)'],
      'Non commencé': ['var(--a-bg)',          'var(--a-fg-light)', 'var(--a-border)'],
      'Sans QCM':     ['var(--a-bg)',          'var(--a-fg-light)', 'var(--a-border)'],
    };
    const [bg, color, border] = map[status] || map['Sans QCM'];
    return { display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700, background:bg, color, border:`1px solid ${border}`, whiteSpace:'nowrap' };
  },
  miniBar:  { height:5, background:'rgba(127,127,127,.1)', borderRadius:3, overflow:'hidden', width:'100%' },
  miniBarF: (pct, c) => ({ height:'100%', width:`${pct}%`, background:c, borderRadius:3 }),
  absentBadge: { display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:12, fontWeight:700, background:'rgba(255,69,58,.08)', color:'#ff453a', border:'1px solid rgba(255,69,58,.2)' },
  presenceBadge: (type) => ({ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, flexShrink:0, background: type === 'retard' ? 'rgba(240,180,41,.10)' : 'rgba(255,69,58,.08)', color: type === 'retard' ? 'var(--a-gold)' : 'var(--a-red)', border:`1px solid ${type === 'retard' ? 'rgba(240,180,41,.25)' : 'rgba(255,69,58,.2)'}` }),
  obsBadge: (type) => { const c = OBS_COLORS[(type || '').toLowerCase()] || OBS_COLORS['general']; return { padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:c.bg, color:c.color, whiteSpace:'nowrap', border:`1px solid ${c.color}33`, flexShrink:0 }; },

  // Rows
  presenceItem: { display:'flex', alignItems:'flex-start', gap:14, padding:'14px 20px', borderBottom:'1px solid var(--a-border)' },
  obsCard:      { padding:'16px 20px', borderBottom:'1px solid var(--a-border)', display:'flex', flexDirection:'column', gap:8 },
  obsCardTop:   { display:'flex', alignItems:'center', gap:10 },
  obsContenu:   { fontSize:14, color:'var(--a-fg)', lineHeight:1.6 },
  obsDate:      { fontSize:12, color:'var(--a-fg-light)' },
};

const TABS = [
  { key: 'progression', label: '📊 Progression' },
  { key: 'notes',       label: '📝 Notes' },
  { key: 'presence',    label: '🕐 Présence' },
  { key: 'observations',label: '💬 Observations' },
];

const PROG_COLS = '2fr 90px 80px 120px 130px';
const NOTES_COLS = '100px 1fr 220px';
const PROG_COLS_HEAD = ['Module', 'Niveaux QCM', 'Réussis', 'Moy. score', 'Statut'];
const NOTES_COLS_HEAD = ['Date', 'Évaluation', 'Appréciation'];

// ─── Composant principal ──────────────────────────────────────────────────────
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

  useEffect(() => {
    if (!eleveId) return;
    let cancelled = false;
    (async () => {
      try {
        const [prog, mods, rawNotes, pres, obs, evals] = await Promise.all([
          fetchProgressionEleve(eleveId).catch(() => []),
          fetchModulesEnseignant().catch(() => []),
          fetchNotesEleve(eleveId).catch(() => []),
          fetchRetardsAbsencesEleve(eleveId).catch(() => []),
          fetchObservationsEleve(eleveId).catch(() => []),
          stateClasseId ? fetchEvaluationsClasse(stateClasseId).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setProgression(prog);
        setModules(mods);
        setNotes(rawNotes);
        setPresence(pres);
        setObservations(obs);
        setEvaluations(evals);

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

  // ── Données ──────────────────────────────────────────────────────────────────
  const eleve      = stateEleve || {};
  const nomComplet = `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() || '—';
  const dateInscrit = eleve.created_at
    ? new Date(eleve.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
    : null;
  const age = calcAge(eleve.date_naissance);

  // ── Calculs Progression ───────────────────────────────────────────────────
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

  // ── Calculs Notes ─────────────────────────────────────────────────────────
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

  return (
    <div style={S.page}>

      {/* Bouton retour */}
      <button style={S.backBtn} onClick={() => navigate(backUrl)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour {stateClasse ? `— ${stateClasse.nom}` : 'à la classe'}
      </button>

      {/* ── Header élève ─────────────────────────────────────────────────────── */}
      <div style={S.headerCard}>
        {/* Zone haute : avatar + nom + badge */}
        <div style={S.headerTop}>
          <EleveAvatar eleve={eleve} variant="enseignant" size={60} />
          <div style={S.headerInfo}>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span style={S.headerName}>{nomComplet}</span>
              {eleve.actif !== undefined && <span style={S.badge(eleve.actif)}>{eleve.actif ? 'Actif' : 'Inactif'}</span>}
            </div>
            {eleve.identifiant && (
              <div style={S.headerIdLine}>{eleve.identifiant.toUpperCase()}</div>
            )}
          </div>
        </div>

        {/* Zone basse : méta-données */}
        {(stateClasse || dateInscrit || eleve.telephone || eleve.email_contact || age != null) && (
          <div style={S.headerBottom}>
            {stateClasse && <span style={S.metaItemGold}>🏫 {stateClasse.nom}</span>}
            {age != null && (
              <span style={S.metaItem}>🎂 {age} an{age > 1 ? 's' : ''}</span>
            )}
            {dateInscrit         && <span style={S.metaItem}>📅 Inscrit le {dateInscrit}</span>}
            {eleve.telephone     && <span style={S.metaItem}>📞 {eleve.telephone}</span>}
            {eleve.email_contact && <span style={S.metaItem}>✉️ {eleve.email_contact}</span>}
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div style={S.tabsRow}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={S.loading}>Chargement...</div>
      ) : (
        <>
          {/* ── TAB PROGRESSION ──────────────────────────────────────────────── */}
          {activeTab === 'progression' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {/* Barre globale */}
              <div style={S.globalBarCard}>
                <div style={S.globalPctBlock}>
                  <div style={S.globalPctNum(globalPct)}>{globalPct}%</div>
                  <div style={S.globalPctLabel}>progression</div>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ marginBottom:8 }}>
                    <span style={S.globalBarText}>
                      {totalReussi} / {totalQCM} niveau{totalQCM > 1 ? 'x' : ''} réussi{totalReussi !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={S.globalBarTrack}>
                    <div style={S.globalBarFill(globalPct)} />
                  </div>
                </div>
              </div>

              {/* Table par module */}
              <div style={S.sectionTitle}>Détail par module</div>
              {moduleStats.length === 0 ? (
                <div style={S.empty}>Aucun module disponible.</div>
              ) : (
                <div style={S.tableWrap}>
                  <div style={S.tHead(PROG_COLS)}>
                    {PROG_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                  </div>
                  {moduleStats.map(({ m, nivsAvecQCM, reussis, moyScore, status }) => {
                    const pct = nivsAvecQCM > 0 ? Math.round((reussis / nivsAvecQCM) * 100) : 0;
                    return (
                      <div key={m.id} style={S.tRow(PROG_COLS)}>
                        <span style={{ fontSize:13, fontWeight:600, color:'var(--a-fg)' }}>{m.titre}</span>
                        <span style={{ textAlign:'center', fontSize:13, color:'var(--a-fg-mid)' }}>
                          {nivsAvecQCM > 0 ? nivsAvecQCM : <span style={{ color:'var(--a-fg-light)' }}>—</span>}
                        </span>
                        <span style={{ textAlign:'center', fontSize:13 }}>
                          {reussis > 0
                            ? <span style={{ fontWeight:700, color:'var(--a-green)' }}>{reussis}</span>
                            : <span style={{ color:'var(--a-fg-light)' }}>0</span>}
                        </span>
                        <span>
                          {nivsAvecQCM > 0 ? (
                            <div>
                              <div style={{ ...S.miniBar, marginBottom:4 }}>
                                <div style={S.miniBarF(pct, scoreColor(pct))} />
                              </div>
                              <span style={{ fontSize:11, fontWeight:700, color: scoreColor(pct) }}>{moyScore}%</span>
                            </div>
                          ) : <span style={{ color:'var(--a-fg-light)' }}>—</span>}
                        </span>
                        <span><span style={S.statusBadge(status)}>{status}</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB NOTES ────────────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {notesWithEval.length > 0 && (
                <div style={{ ...S.statsGrid, gridTemplateColumns:`repeat(${Math.min(2 + GRADES.filter(g => gradeDist[g.value] > 0).length, 5)}, 1fr)` }}>
                  <div style={S.statCard}>
                    <div style={S.statNum('var(--a-fg)')}>{notesWithEval.length}</div>
                    <div style={S.statLabel}>Évaluation{notesWithEval.length > 1 ? 's' : ''}</div>
                  </div>
                  <div style={S.statCard}>
                    <div style={S.statNum('var(--a-red)')}>{notesWithEval.filter(n => n.absent).length}</div>
                    <div style={S.statLabel}>Absence{notesWithEval.filter(n => n.absent).length !== 1 ? 's' : ''} éval.</div>
                  </div>
                  {GRADES.filter(g => gradeDist[g.value] > 0).map(g => (
                    <div key={g.value} style={S.statCard}>
                      <div style={{ ...S.statNum(g.color) }}>{gradeDist[g.value]}</div>
                      <div style={S.statLabel}>{g.label} — {g.libelle}</div>
                    </div>
                  ))}
                </div>
              )}

              {notesWithEval.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📝</div>
                  {stateClasseId ? 'Aucune note enregistrée pour cet élève.' : 'Navigue depuis la fiche classe pour voir les notes.'}
                </div>
              ) : (
                <>
                  <div style={S.tableWrap}>
                    <div style={S.tHead(NOTES_COLS)}>
                      {NOTES_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                    </div>
                    {notesWithEval.map((n, i) => {
                      const score = n.score != null ? parseInt(n.score, 10) : null;
                      return (
                        <div key={`${n.evaluation_id}-${i}`} style={S.tRow(NOTES_COLS)}>
                          <span style={{ fontSize:13, color:'var(--a-fg-mid)' }}>{formatDate(n.eval.date_evaluation)}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--a-fg)' }}>{n.eval.titre}</span>
                          <span>
                            {n.absent
                              ? <span style={S.absentBadge}>Absent</span>
                              : <GradeBadge score={score} />
                            }
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

          {/* ── TAB PRÉSENCE ─────────────────────────────────────────────────── */}
          {activeTab === 'presence' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              <div style={{ ...S.statsGrid, gridTemplateColumns:'repeat(3,1fr)' }}>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-gold)')}>{nbRetards}</div>
                  <div style={S.statLabel}>Retard{nbRetards !== 1 ? 's' : ''}</div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-red)')}>{nbAbsences}</div>
                  <div style={S.statLabel}>Absence{nbAbsences !== 1 ? 's' : ''}</div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-fg)')}>{presence.length}</div>
                  <div style={S.statLabel}>Total</div>
                </div>
              </div>

              {presence.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize:36, marginBottom:10 }}>✅</div>
                  Aucun retard ni absence enregistré pour cet élève.
                </div>
              ) : (
                <div style={S.tableWrap}>
                  {presence.map((p) => (
                    <div key={p.id} style={S.presenceItem}>
                      <span style={S.presenceBadge(p.type)}>
                        {p.type === 'retard' ? '⏰ Retard' : '🚫 Absence'}
                      </span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--a-fg)' }}>
                          {formatDate(p.date)}
                        </div>
                        {p.commentaire && (
                          <div style={{ fontSize:13, color:'var(--a-fg-mid)', marginTop:3 }}>{p.commentaire}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB OBSERVATIONS ─────────────────────────────────────────────── */}
          {activeTab === 'observations' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

              {observations.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize:36, marginBottom:10 }}>💬</div>
                  Aucune observation enregistrée pour cet élève.
                </div>
              ) : (
                <div style={S.tableWrap}>
                  {observations.map((o) => (
                    <div key={o.id} style={S.obsCard}>
                      <div style={S.obsCardTop}>
                        <span style={S.obsBadge(o.type)}>{o.type ? o.type.charAt(0).toUpperCase() + o.type.slice(1) : ''}</span>
                        <span style={S.obsDate}>{formatDateTime(o.created_at)}</span>
                      </div>
                      <div style={S.obsContenu}>{o.contenu}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
