import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchProgressionEleve, fetchModulesEnseignant, fetchAllNiveauxForModuleEns,
  fetchQCMExistenceEns, fetchNotesEleve, fetchObservationsEleve,
  fetchRetardsAbsencesEleve, fetchEvaluationsClasse,
} from './supabaseEnseignant';

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
  if (!grade) return <span style={{ color: 'var(--a-fg-mid)' }}>—</span>;
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
      <span style={{ fontSize: 12, color: 'var(--a-fg-mid)' }}>{grade.libelle}</span>
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
    <div style={{ marginTop: 24, background: 'var(--a-bg-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius)', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24 }}>
      <div style={{ width: '100%', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--a-fg-light)', marginBottom: 4 }}>
        Récapitulatif des appréciations
      </div>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
        <filter id="ps2"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12"/></filter>
        <g filter="url(#ps2)">
          {paths.map((seg, i) => <path key={i} d={seg.d} fill={seg.color} stroke="var(--a-bg-card)" strokeWidth="2"/>)}
        </g>
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text key={i} x={seg.lx} y={seg.ly} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="11" fontWeight="800">{seg.pct}%</text>
        ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 140 }}>
        {paths.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: seg.color, flexShrink: 0 }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--a-fg)', minWidth: 34 }}>{seg.label}</span>
            <span style={{ fontSize: 12, color: 'var(--a-fg-mid)', flex: 1 }}>{seg.libelle}</span>
            <span style={{ fontSize: 12, fontWeight: 700, background: seg.color + '22', color: seg.color, padding: '2px 8px', borderRadius: 6 }}>{seg.count} · {seg.pct}%</span>
          </div>
        ))}
        <div style={{ marginTop: 2, fontSize: 12, color: 'var(--a-fg-mid)', borderTop: '1px solid var(--a-border)', paddingTop: 8 }}>
          Total : <strong style={{ color: 'var(--a-fg)' }}>{total}</strong> évaluation{total > 1 ? 's' : ''}
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
// Utilisé uniquement pour la progression (barres QCM)
function scoreColor(pct) {
  if (pct >= 70) return 'var(--a-green)';
  if (pct >= 50) return 'var(--a-gold)';
  return 'var(--a-red)';
}

const OBS_COLORS = {
  'Général':       { bg: 'rgba(10,132,255,.1)',   color: '#0a84ff' },
  'Comportement':  { bg: 'rgba(255,159,10,.12)',  color: 'var(--a-gold)' },
  'Progression':   { bg: 'rgba(48,209,88,.1)',    color: 'var(--a-green)' },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:    { minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--a-fg-mid)', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: 4 },
  // Header card
  headerCard: { background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)', border: '1px solid var(--a-border)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'var(--a-gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, flexShrink: 0, letterSpacing: '-0.5px' },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 20, fontWeight: 800, color: 'var(--a-fg)', letterSpacing: '-0.4px' },
  headerMeta: { display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 6 },
  metaItem:   { fontSize: 13, color: 'var(--a-fg-mid)', display: 'flex', alignItems: 'center', gap: 4 },
  identifiant:{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--a-gold)', fontSize: 14, background: 'rgba(191,138,48,.1)', padding: '2px 8px', borderRadius: 6 },
  badge: (actif) => ({ padding: '3px 10px', borderRadius: 980, fontSize: 11, fontWeight: 700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),
  // Tabs
  tabsRow:  { display: 'flex', gap: 4, borderBottom: '1px solid var(--a-border)', flexWrap: 'wrap' },
  tab: (active) => ({ padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)', borderBottom: active ? '2px solid var(--a-gold)' : '2px solid transparent', marginBottom: -1, transition: 'color .15s' }),
  // Common
  empty:   { textAlign: 'center', padding: '50px 20px', color: 'var(--a-fg-mid)', fontSize: 14 },
  loading: { textAlign: 'center', padding: '50px 20px', color: 'var(--a-fg-mid)', fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--a-fg-light)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14 },
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  statCard: { background: 'var(--a-bg-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '14px 20px', flex: '1 1 120px', minWidth: 120 },
  statNum:  (c) => ({ fontSize: 26, fontWeight: 800, color: c }),
  statLabel:{ fontSize: 12, color: 'var(--a-fg-mid)', marginTop: 2 },
  // Progression
  globalBarWrap: { background: 'var(--a-bg-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius)', padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 },
  globalBarTrack:{ flex: 1, height: 10, background: 'rgba(127,127,127,.12)', borderRadius: 5, overflow: 'hidden' },
  globalBarFill: (pct) => ({ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #30d158, #7DCFA0)', borderRadius: 5, transition: 'width .6s ease-out' }),
  globalPct: { fontSize: 16, fontWeight: 800, color: 'var(--a-green)', flexShrink: 0, minWidth: 44, textAlign: 'right' },
  tableWrap: { background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)', border: '1px solid var(--a-border)', overflow: 'hidden' },
  tableHead: (cols) => ({ display: 'grid', gridTemplateColumns: cols, padding: '10px 20px', borderBottom: '1px solid var(--a-border)', fontSize: 11, fontWeight: 700, color: 'var(--a-fg-light)', textTransform: 'uppercase', letterSpacing: '.7px' }),
  tableRow:  (cols, i) => ({ display: 'grid', gridTemplateColumns: cols, padding: '13px 20px', borderBottom: '1px solid var(--a-border)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }),
  cell:      { fontSize: 13, color: 'var(--a-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cellMid:   { fontSize: 13, color: 'var(--a-fg-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusBadge: (status) => {
    const map = { 'Terminé': ['rgba(48,209,88,.1)', 'var(--a-green)'], 'En cours': ['rgba(191,138,48,.12)', 'var(--a-gold)'], 'Non commencé': ['rgba(127,127,127,.1)', 'var(--a-fg-light)'], 'Sans QCM': ['rgba(127,127,127,.06)', 'var(--a-fg-light)'] };
    const [bg, color] = map[status] || map['Sans QCM'];
    return { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color };
  },
  miniBarWrap: { height: 6, background: 'rgba(127,127,127,.12)', borderRadius: 3, overflow: 'hidden', width: '100%' },
  miniBarFill: (pct, c) => ({ height: '100%', width: `${pct}%`, background: c, borderRadius: 3 }),
  // Notes
  absentBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(255,69,58,.12)', color: '#ff453a' },
  // Présence
  presenceItem: { display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 20px', borderBottom: '1px solid var(--a-border)' },
  presenceBadge: (type) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, background: type === 'retard' ? 'rgba(240,180,41,.15)' : 'rgba(255,69,58,.1)', color: type === 'retard' ? 'var(--a-gold)' : 'var(--a-red)' }),
  // Observations
  obsItem:  { padding: '16px 20px', borderBottom: '1px solid var(--a-border)', display: 'flex', gap: 14, alignItems: 'flex-start' },
  obsLeft:  { flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  obsBadge: (type) => { const c = OBS_COLORS[type] || OBS_COLORS['Général']; return { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }; },
  obsContenu: { fontSize: 14, color: 'var(--a-fg)', lineHeight: 1.6, flex: 1 },
  obsDate:    { fontSize: 12, color: 'var(--a-fg-light)', marginTop: 4 },
};

const TABS = [
  { key: 'progression', label: '📊 Progression' },
  { key: 'notes',       label: '📝 Notes' },
  { key: 'presence',    label: '🕐 Présence' },
  { key: 'observations',label: '💬 Observations' },
];

const PROG_COLS = '2fr 80px 80px 110px 110px';
const NOTES_COLS = '100px 1fr 220px';
const PROG_COLS_HEAD = ['Module', 'Niveaux QCM', 'Réussis', 'Moy. score', 'Statut'];
const NOTES_COLS_HEAD = ['Date', 'Évaluation', 'Appréciation'];

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EnseignantEleveProfile() {
  const { eleveId } = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();

  // Données passées via navigate state
  const stateClasseId = location.state?.classeId;
  const stateClasse   = location.state?.classe;
  const stateEleve    = location.state?.eleve;

  const [activeTab,     setActiveTab]     = useState('progression');
  const [loading,       setLoading]       = useState(true);
  // Progression
  const [progression,   setProgression]   = useState([]);
  const [modules,       setModules]       = useState([]);
  const [niveauxMap,    setNiveauxMap]    = useState({});
  const [niveauxWithQCM,setNiveauxWithQCM]= useState(new Set());
  // Notes
  const [notes,         setNotes]         = useState([]);
  const [evaluations,   setEvaluations]   = useState([]);
  // Présence & Observations
  const [presence,      setPresence]      = useState([]);
  const [observations,  setObservations]  = useState([]);

  useEffect(() => {
    if (!eleveId) return;
    let cancelled = false;
    (async () => {
      try {
        // Chargement en parallèle : progression, modules, notes, présence, observations
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

        // Pour chaque module : récupérer la hiérarchie niveaux
        const nivMap = {};
        await Promise.all(mods.map(async (m) => {
          try { nivMap[m.id] = await fetchAllNiveauxForModuleEns(m.id); }
          catch { nivMap[m.id] = []; }
        }));
        if (cancelled) return;
        setNiveauxMap(nivMap);

        // Batch QCM existence
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

  // ── Header élève ──────────────────────────────────────────────────────────
  const eleve = stateEleve || {};
  const initiales = ((eleve.prenom?.[0] || '') + (eleve.nom?.[0] || '')).toUpperCase();
  const nomComplet = `${eleve.prenom || ''} ${eleve.nom || ''}`.trim() || '—';
  const dateInscrit = eleve.created_at
    ? new Date(eleve.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  // ── Calculs Progression ────────────────────────────────────────────────────
  const isPassed = (nivId) =>
    niveauxWithQCM.has(nivId) && progression.some(p => p.niveau_id === nivId && p.reussi === true);

  const moduleStats = modules.map(m => {
    const nivs = niveauxMap[m.id] || [];
    const nivsAvecQCM = nivs.filter(n => niveauxWithQCM.has(n.id));
    const reussis = nivsAvecQCM.filter(n => isPassed(n.id));
    const scores  = reussis.map(n => {
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
  const evalMap = Object.fromEntries(evaluations.map(e => [e.id, e]));
  const notesWithEval = notes.map(n => ({ ...n, eval: evalMap[n.evaluation_id] }))
    .filter(n => n.eval)
    .sort((a, b) => new Date(b.eval.date_evaluation) - new Date(a.eval.date_evaluation));

  // Distribution des appréciations pour le camembert
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour {stateClasse ? `— ${stateClasse.nom}` : 'à la classe'}
      </button>

      {/* Header élève */}
      <div style={S.headerCard}>
        <div style={S.avatar}>{initiales || '?'}</div>
        <div style={S.headerInfo}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={S.headerName}>{nomComplet}</span>
            {eleve.actif !== undefined && <span style={S.badge(eleve.actif)}>{eleve.actif ? 'Actif' : 'Inactif'}</span>}
          </div>
          <div style={S.headerMeta}>
            {eleve.identifiant && <span style={S.metaItem}><span style={S.identifiant}>{eleve.identifiant.toUpperCase()}</span></span>}
            {stateClasse && <span style={S.metaItem}>🏫 {stateClasse.nom}</span>}
            {dateInscrit  && <span style={S.metaItem}>📅 Inscrit le {dateInscrit}</span>}
            {eleve.telephone    && <span style={S.metaItem}>📞 {eleve.telephone}</span>}
            {eleve.email_contact && <span style={S.metaItem}>✉️ {eleve.email_contact}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabsRow}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div style={S.loading}>Chargement...</div>
      ) : (
        <>
          {/* ── TAB PROGRESSION ──────────────────────────────────── */}
          {activeTab === 'progression' && (
            <div>
              {/* Barre globale */}
              <div style={S.sectionTitle}>Progression globale</div>
              <div style={S.globalBarWrap}>
                <div style={{ fontSize: 13, color: 'var(--a-fg-mid)', flexShrink: 0 }}>
                  {totalReussi} / {totalQCM} niveau{totalQCM > 1 ? 'x' : ''} réussi{totalReussi > 1 ? 's' : ''}
                </div>
                <div style={S.globalBarTrack}>
                  <div style={S.globalBarFill(globalPct)} />
                </div>
                <span style={S.globalPct}>{globalPct}%</span>
              </div>

              {/* Table par module */}
              <div style={S.sectionTitle}>Détail par module</div>
              {moduleStats.length === 0 ? (
                <div style={S.empty}>Aucun module disponible.</div>
              ) : (
                <div style={S.tableWrap}>
                  <div style={S.tableHead(PROG_COLS)}>
                    {PROG_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                  </div>
                  {moduleStats.map(({ m, nivsAvecQCM, reussis, moyScore, status }, i) => {
                    const pct = nivsAvecQCM > 0 ? Math.round((reussis / nivsAvecQCM) * 100) : 0;
                    return (
                      <div key={m.id} style={S.tableRow(PROG_COLS, i)}>
                        <span style={S.cell}>{m.titre}</span>
                        <span style={{ ...S.cellMid, textAlign: 'center' }}>{nivsAvecQCM}</span>
                        <span style={{ ...S.cellMid, textAlign: 'center' }}>
                          {reussis > 0 ? <span style={{ color: 'var(--a-green)', fontWeight: 700 }}>{reussis}</span> : reussis}
                        </span>
                        <span>
                          {nivsAvecQCM > 0 ? (
                            <div>
                              <div style={{ ...S.miniBarWrap, marginBottom: 3 }}>
                                <div style={S.miniBarFill(pct, scoreColor(pct))} />
                              </div>
                              <span style={{ fontSize: 11, color: scoreColor(pct), fontWeight: 600 }}>{moyScore}%</span>
                            </div>
                          ) : <span style={S.cellMid}>—</span>}
                        </span>
                        <span><span style={S.statusBadge(status)}>{status}</span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB NOTES ────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div>
              {/* Résumé */}
              {notesWithEval.length > 0 && (
                <div style={S.statsRow}>
                  <div style={S.statCard}>
                    <div style={S.statNum('var(--a-fg)')}>{notesWithEval.length}</div>
                    <div style={S.statLabel}>Évaluation{notesWithEval.length > 1 ? 's' : ''}</div>
                  </div>
                  <div style={S.statCard}>
                    <div style={S.statNum('var(--a-red)')}>{notesWithEval.filter(n => n.absent).length}</div>
                    <div style={S.statLabel}>Absence{notesWithEval.filter(n => n.absent).length > 1 ? 's' : ''} éval.</div>
                  </div>
                  {GRADES.filter(g => gradeDist[g.value] > 0).map(g => (
                    <div key={g.value} style={S.statCard}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: g.color }}>{gradeDist[g.value]}</div>
                      <div style={S.statLabel}>{g.label} — {g.libelle}</div>
                    </div>
                  ))}
                </div>
              )}

              {notesWithEval.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                  {stateClasseId ? 'Aucune note enregistrée pour cet élève.' : 'Navigue depuis la fiche classe pour voir les notes.'}
                </div>
              ) : (
                <>
                  <div style={S.tableWrap}>
                    <div style={S.tableHead(NOTES_COLS)}>
                      {NOTES_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                    </div>
                    {notesWithEval.map((n, i) => {
                      const score = n.score != null ? parseInt(n.score, 10) : null;
                      return (
                        <div key={`${n.evaluation_id}-${i}`} style={S.tableRow(NOTES_COLS, i)}>
                          <span style={S.cellMid}>{formatDate(n.eval.date_evaluation)}</span>
                          <span style={S.cell}>{n.eval.titre}</span>
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

          {/* ── TAB PRÉSENCE ─────────────────────────────────────── */}
          {activeTab === 'presence' && (
            <div>
              {/* Stats */}
              <div style={S.statsRow}>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-gold)')}>{nbRetards}</div>
                  <div style={S.statLabel}>Retard{nbRetards > 1 ? 's' : ''}</div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-red)')}>{nbAbsences}</div>
                  <div style={S.statLabel}>Absence{nbAbsences > 1 ? 's' : ''}</div>
                </div>
                <div style={S.statCard}>
                  <div style={S.statNum('var(--a-fg)')}>{presence.length}</div>
                  <div style={S.statLabel}>Total</div>
                </div>
              </div>

              {presence.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
                  Aucun retard ni absence enregistré pour cet élève.
                </div>
              ) : (
                <div style={S.tableWrap}>
                  {presence.map((p, i) => (
                    <div key={p.id} style={{ ...S.presenceItem, background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }}>
                      <span style={S.presenceBadge(p.type)}>
                        {p.type === 'retard' ? '⏰ Retard' : '🚫 Absence'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-fg)' }}>
                          {formatDate(p.date)}
                        </span>
                        {p.commentaire && (
                          <div style={{ fontSize: 13, color: 'var(--a-fg-mid)', marginTop: 3 }}>{p.commentaire}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB OBSERVATIONS ─────────────────────────────────── */}
          {activeTab === 'observations' && (
            <div>
              {observations.length === 0 ? (
                <div style={S.empty}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                  Aucune observation enregistrée pour cet élève.
                </div>
              ) : (
                <div style={S.tableWrap}>
                  {observations.map((o, i) => (
                    <div key={o.id} style={{ ...S.obsItem, background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }}>
                      <div style={S.obsLeft}>
                        <span style={S.obsBadge(o.type)}>{o.type}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={S.obsContenu}>{o.contenu}</div>
                        <div style={S.obsDate}>{formatDateTime(o.created_at)}</div>
                      </div>
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
