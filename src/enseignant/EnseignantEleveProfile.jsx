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
  if (!grade) return <span className="text-a-fg-mid">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center justify-center min-w-[40px] px-2.5 py-[3px] rounded-lg text-[13px] font-[800] tracking-[0.5px]"
        style={{ background: grade.color + '22', color: grade.color }}>
        {grade.label}
      </span>
      <span className="text-xs text-a-fg-mid">{grade.libelle}</span>
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
    <div className="mt-6 bg-a-bg-card border border-a-border rounded-a p-5 px-6 flex flex-wrap items-center gap-6">
      <div className="w-full text-[11px] font-bold uppercase tracking-[1px] text-a-fg-light mb-1">
        Récapitulatif des appréciations
      </div>
      <svg width="180" height="180" viewBox="0 0 180 180" className="shrink-0">
        <filter id="ps2"><feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12"/></filter>
        <g filter="url(#ps2)">
          {paths.map((seg, i) => <path key={i} d={seg.d} fill={seg.color} stroke="var(--a-bg-card)" strokeWidth="2"/>)}
        </g>
        {paths.map((seg, i) => seg.pct >= 10 && (
          <text key={i} x={seg.lx} y={seg.ly} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="11" fontWeight="800">{seg.pct}%</text>
        ))}
      </svg>
      <div className="flex flex-col gap-2.5 flex-1 min-w-[140px]">
        {paths.map((seg, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ background: seg.color }}/>
            <span className="text-[13px] font-bold text-a-fg min-w-[34px]">{seg.label}</span>
            <span className="text-xs text-a-fg-mid flex-1">{seg.libelle}</span>
            <span className="text-xs font-bold px-2 py-[2px] rounded-[6px]" style={{ background: seg.color + '22', color: seg.color }}>{seg.count} · {seg.pct}%</span>
          </div>
        ))}
        <div className="mt-0.5 text-xs text-a-fg-mid border-t border-a-border pt-2">
          Total : <strong className="text-a-fg">{total}</strong> évaluation{total > 1 ? 's' : ''}
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
  page:    'min-h-full flex flex-col gap-5',
  backBtn: 'inline-flex items-center gap-1.5 bg-transparent border-none text-a-fg-mid text-[13px] font-medium cursor-pointer p-0 mb-1',
  // Header card
  headerCard: 'bg-a-bg-card rounded-a border border-a-border py-5 px-6 flex items-center gap-5 flex-wrap',
  avatar: 'w-14 h-14 rounded-full bg-a-gold text-white flex items-center justify-center text-xl font-[800] shrink-0 tracking-[-0.5px]',
  headerInfo: 'flex-1 min-w-0',
  headerName: { fontFamily: 'var(--a-font-display)', fontSize: 20, fontWeight: 800, color: 'var(--a-fg)', letterSpacing: '-0.4px' },
  headerMeta: 'flex flex-wrap gap-x-4 gap-y-1.5 mt-1.5',
  metaItem:   'text-[13px] text-a-fg-mid flex items-center gap-1',
  identifiant:{ fontFamily: 'var(--a-font-mono)', fontWeight: 700, color: 'var(--a-gold)', fontSize: 14, background: 'rgba(191,138,48,.1)', padding: '2px 8px', borderRadius: 6 },
  badge: (actif) => ({ padding: '3px 10px', borderRadius: 980, fontSize: 11, fontWeight: 700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),
  // Tabs
  tabsRow:  'flex gap-1 border-b border-a-border flex-wrap',
  tab: (active) => ({ padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)', borderBottom: active ? '2px solid var(--a-gold)' : '2px solid transparent', marginBottom: -1, transition: 'color .15s' }),
  // Common
  empty:   'text-center py-[50px] px-5 text-a-fg-mid text-sm',
  loading: 'text-center py-[50px] px-5 text-a-fg-mid text-sm',
  sectionTitle: 'text-[13px] font-bold text-a-fg-light uppercase tracking-[0.8px] mb-3.5',
  statsRow: 'flex gap-3 flex-wrap mb-5',
  statCard: 'bg-a-bg-card border border-a-border rounded-a-sm py-3.5 px-5 flex-[1_1_120px] min-w-[120px]',
  statNum:  (c) => ({ fontFamily: 'var(--a-font-display)', fontSize: 26, fontWeight: 800, color: c }),
  statLabel:'text-xs text-a-fg-mid mt-0.5',
  // Progression
  globalBarWrap: 'bg-a-bg-card border border-a-border rounded-a py-4 px-5 mb-5 flex items-center gap-4',
  globalBarTrack:{ flex: 1, height: 10, background: 'rgba(127,127,127,.12)', borderRadius: 5, overflow: 'hidden' },
  globalBarFill: (pct) => ({ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #30d158, #7DCFA0)', borderRadius: 5, transition: 'width .6s ease-out' }),
  globalPct: 'text-base font-[800] text-a-green shrink-0 min-w-[44px] text-right',
  tableWrap: 'bg-a-bg-card rounded-a border border-a-border overflow-hidden',
  tableHead: (cols) => ({ display: 'grid', gridTemplateColumns: cols, padding: '10px 20px', borderBottom: '1px solid var(--a-border)', fontSize: 11, fontWeight: 700, color: 'var(--a-fg-light)', textTransform: 'uppercase', letterSpacing: '.7px' }),
  tableRow:  (cols, i) => ({ display: 'grid', gridTemplateColumns: cols, padding: '13px 20px', borderBottom: '1px solid var(--a-border)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }),
  cell:      'text-[13px] text-a-fg overflow-hidden text-ellipsis whitespace-nowrap',
  cellMid:   'text-[13px] text-a-fg-mid overflow-hidden text-ellipsis whitespace-nowrap',
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
  presenceItem: 'flex gap-3.5 items-start py-3.5 px-5 border-b border-a-border',
  presenceBadge: (type) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, flexShrink: 0, background: type === 'retard' ? 'rgba(240,180,41,.15)' : 'rgba(255,69,58,.1)', color: type === 'retard' ? 'var(--a-gold)' : 'var(--a-red)' }),
  // Observations
  obsItem:  'py-4 px-5 border-b border-a-border flex gap-3.5 items-start',
  obsLeft:  'shrink-0 flex flex-col items-center gap-1',
  obsBadge: (type) => { const c = OBS_COLORS[type] || OBS_COLORS['Général']; return { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, whiteSpace: 'nowrap' }; },
  obsContenu: 'text-sm text-a-fg leading-relaxed flex-1',
  obsDate:    'text-xs text-a-fg-light mt-1',
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
    <div className={S.page}>

      {/* Bouton retour */}
      <button className={S.backBtn} onClick={() => navigate(backUrl)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour {stateClasse ? `— ${stateClasse.nom}` : 'à la classe'}
      </button>

      {/* Header élève */}
      <div className={S.headerCard}>
        <div className={S.avatar}>{initiales || '?'}</div>
        <div className={S.headerInfo}>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span style={S.headerName}>{nomComplet}</span>
            {eleve.actif !== undefined && <span style={S.badge(eleve.actif)}>{eleve.actif ? 'Actif' : 'Inactif'}</span>}
          </div>
          <div className={S.headerMeta}>
            {eleve.identifiant && <span className={S.metaItem}><span style={S.identifiant}>{eleve.identifiant.toUpperCase()}</span></span>}
            {stateClasse && <span className={S.metaItem}>🏫 {stateClasse.nom}</span>}
            {dateInscrit  && <span className={S.metaItem}>📅 Inscrit le {dateInscrit}</span>}
            {eleve.telephone    && <span className={S.metaItem}>📞 {eleve.telephone}</span>}
            {eleve.email_contact && <span className={S.metaItem}>✉️ {eleve.email_contact}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={S.tabsRow}>
        {TABS.map(t => (
          <button key={t.key} style={S.tab(activeTab === t.key)} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {loading ? (
        <div className={S.loading}>Chargement...</div>
      ) : (
        <>
          {/* ── TAB PROGRESSION ──────────────────────────────────── */}
          {activeTab === 'progression' && (
            <div>
              {/* Barre globale */}
              <div className={S.sectionTitle}>Progression globale</div>
              <div className={S.globalBarWrap}>
                <div className="text-[13px] text-a-fg-mid shrink-0">
                  {totalReussi} / {totalQCM} niveau{totalQCM > 1 ? 'x' : ''} réussi{totalReussi > 1 ? 's' : ''}
                </div>
                <div style={S.globalBarTrack}>
                  <div style={S.globalBarFill(globalPct)} />
                </div>
                <span className={S.globalPct}>{globalPct}%</span>
              </div>

              {/* Table par module */}
              <div className={S.sectionTitle}>Détail par module</div>
              {moduleStats.length === 0 ? (
                <div className={S.empty}>Aucun module disponible.</div>
              ) : (
                <div className={S.tableWrap}>
                  <div style={S.tableHead(PROG_COLS)}>
                    {PROG_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                  </div>
                  {moduleStats.map(({ m, nivsAvecQCM, reussis, moyScore, status }, i) => {
                    const pct = nivsAvecQCM > 0 ? Math.round((reussis / nivsAvecQCM) * 100) : 0;
                    return (
                      <div key={m.id} style={S.tableRow(PROG_COLS, i)}>
                        <span className={S.cell}>{m.titre}</span>
                        <span className={`${S.cellMid} text-center`}>{nivsAvecQCM}</span>
                        <span className={`${S.cellMid} text-center`}>
                          {reussis > 0 ? <span className="text-a-green font-bold">{reussis}</span> : reussis}
                        </span>
                        <span>
                          {nivsAvecQCM > 0 ? (
                            <div>
                              <div style={{ ...S.miniBarWrap, marginBottom: 3 }}>
                                <div style={S.miniBarFill(pct, scoreColor(pct))} />
                              </div>
                              <span className="text-[11px] font-semibold" style={{ color: scoreColor(pct) }}>{moyScore}%</span>
                            </div>
                          ) : <span className={S.cellMid}>—</span>}
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
                <div className={S.statsRow}>
                  <div className={S.statCard}>
                    <div style={S.statNum('var(--a-fg)')}>{notesWithEval.length}</div>
                    <div className={S.statLabel}>Évaluation{notesWithEval.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className={S.statCard}>
                    <div style={S.statNum('var(--a-red)')}>{notesWithEval.filter(n => n.absent).length}</div>
                    <div className={S.statLabel}>Absence{notesWithEval.filter(n => n.absent).length > 1 ? 's' : ''} éval.</div>
                  </div>
                  {GRADES.filter(g => gradeDist[g.value] > 0).map(g => (
                    <div key={g.value} className={S.statCard}>
                      <div className="text-[26px] font-[800]" style={{ color: g.color }}>{gradeDist[g.value]}</div>
                      <div className={S.statLabel}>{g.label} — {g.libelle}</div>
                    </div>
                  ))}
                </div>
              )}

              {notesWithEval.length === 0 ? (
                <div className={S.empty}>
                  <div className="text-4xl mb-2.5">📝</div>
                  {stateClasseId ? 'Aucune note enregistrée pour cet élève.' : 'Navigue depuis la fiche classe pour voir les notes.'}
                </div>
              ) : (
                <>
                  <div className={S.tableWrap}>
                    <div style={S.tableHead(NOTES_COLS)}>
                      {NOTES_COLS_HEAD.map(h => <span key={h}>{h}</span>)}
                    </div>
                    {notesWithEval.map((n, i) => {
                      const score = n.score != null ? parseInt(n.score, 10) : null;
                      return (
                        <div key={`${n.evaluation_id}-${i}`} style={S.tableRow(NOTES_COLS, i)}>
                          <span className={S.cellMid}>{formatDate(n.eval.date_evaluation)}</span>
                          <span className={S.cell}>{n.eval.titre}</span>
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
              <div className={S.statsRow}>
                <div className={S.statCard}>
                  <div style={S.statNum('var(--a-gold)')}>{nbRetards}</div>
                  <div className={S.statLabel}>Retard{nbRetards > 1 ? 's' : ''}</div>
                </div>
                <div className={S.statCard}>
                  <div style={S.statNum('var(--a-red)')}>{nbAbsences}</div>
                  <div className={S.statLabel}>Absence{nbAbsences > 1 ? 's' : ''}</div>
                </div>
                <div className={S.statCard}>
                  <div style={S.statNum('var(--a-fg)')}>{presence.length}</div>
                  <div className={S.statLabel}>Total</div>
                </div>
              </div>

              {presence.length === 0 ? (
                <div className={S.empty}>
                  <div className="text-4xl mb-2.5">✅</div>
                  Aucun retard ni absence enregistré pour cet élève.
                </div>
              ) : (
                <div className={S.tableWrap}>
                  {presence.map((p, i) => (
                    <div key={p.id} className={S.presenceItem} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }}>
                      <span style={S.presenceBadge(p.type)}>
                        {p.type === 'retard' ? '⏰ Retard' : '🚫 Absence'}
                      </span>
                      <div className="flex-1">
                        <span className="text-[13px] font-semibold text-a-fg">
                          {formatDate(p.date)}
                        </span>
                        {p.commentaire && (
                          <div className="text-[13px] text-a-fg-mid mt-[3px]">{p.commentaire}</div>
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
                <div className={S.empty}>
                  <div className="text-4xl mb-2.5">💬</div>
                  Aucune observation enregistrée pour cet élève.
                </div>
              ) : (
                <div className={S.tableWrap}>
                  {observations.map((o, i) => (
                    <div key={o.id} className={S.obsItem} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,.02)' }}>
                      <div className={S.obsLeft}>
                        <span style={S.obsBadge(o.type)}>{o.type}</span>
                      </div>
                      <div className="flex-1">
                        <div className={S.obsContenu}>{o.contenu}</div>
                        <div className={S.obsDate}>{formatDateTime(o.created_at)}</div>
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
