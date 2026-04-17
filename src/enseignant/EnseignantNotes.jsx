import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchEvaluationsClasse, createEvaluation, updateEvaluation, deleteEvaluation,
  fetchNotesEvaluation, upsertNote,
} from './supabaseEnseignant';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit2 = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IconTrash2 = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconChevRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Système de notation par lettres ─────────────────────────────────────────
const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: '#30d158' },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: '#0a84ff' },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: '#f7963a' },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: '#ff453a' },
];

const gradeFromScore = (score) => GRADES.find(g => g.value === score) || null;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const noteKey = (evalId, eleveId) => `${evalId}_${eleveId}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : null;

function initials(e) {
  return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase();
}

// ─── Composant saisie note par lettres ────────────────────────────────────────
function NoteLetterInput({ note, onSave, onAbsent }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSelect = async (grade) => {
    // Déselectionner si on reclique sur la note déjà sélectionnée
    const newScore = note?.score === grade.value ? null : grade.value;
    setSaving(true);
    try {
      await onSave(newScore);
      if (newScore !== null) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    } finally {
      setSaving(false);
    }
  };

  if (note?.absent) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-10 rounded-[10px] flex items-center justify-center font-bold text-xs tracking-[0.5px]"
          style={{
            background:'rgba(255,69,58,.1)', border:'1.5px solid rgba(255,69,58,.25)',
            color:'#ff453a',
          }}>ABSENT</div>
        <button onClick={onAbsent} className="px-3 h-10 rounded-[10px] border border-a-border bg-transparent text-a-fg-mid cursor-pointer text-[11px] whitespace-nowrap shrink-0">
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-[5px] items-center">
      {GRADES.map(g => {
        const isSelected = note?.score === g.value;
        return (
          <button
            key={g.label}
            onClick={() => handleSelect(g)}
            disabled={saving}
            title={g.libelle}
            className="flex-1 h-10 rounded-[10px] transition-all duration-150 tracking-[0.3px]"
            style={{
              border: `1.5px solid ${isSelected ? g.color : 'var(--a-border)'}`,
              background: isSelected ? `${g.color}20` : 'var(--a-bg)',
              color: isSelected ? g.color : 'var(--a-fg-mid)',
              fontWeight: isSelected ? 800 : 600,
              fontSize: g.label === 'ECA' ? 10 : 12,
              cursor: saving ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.color = g.color; }}}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--a-border)'; e.currentTarget.style.color = 'var(--a-fg-mid)'; }}}
          >
            {g.label}
          </button>
        );
      })}

      {/* Bouton absent */}
      <button onClick={onAbsent} title="Marquer absent" className="w-10 h-10 rounded-[10px] border border-a-border bg-transparent text-a-fg-light cursor-pointer flex items-center justify-center text-[10px] font-semibold tracking-[0.2px] shrink-0">
        Abs
      </button>

      {/* Feedback sauvegarde */}
      {saved && (
        <div className="w-9 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ background:'rgba(48,209,88,.15)', color:'#30d158' }}>
          <IconCheck/>
        </div>
      )}
    </div>
  );
}

// ─── Badge note ───────────────────────────────────────────────────────────────
function GradeBadge({ score, size = 'md' }) {
  const g = gradeFromScore(score);
  if (!g) return <span className="text-a-fg-light text-xs">—</span>;
  const fs = size === 'lg' ? 15 : 12;
  return (
    <span className="inline-flex items-center gap-[5px] rounded-lg font-extrabold"
      style={{
        padding: size === 'lg' ? '4px 12px' : '2px 8px',
        fontSize:fs,
        background:`${g.color}18`, color: g.color,
        border:`1px solid ${g.color}35`,
      }}>
      {g.label}
      <span style={{ fontSize:fs-2, fontWeight:400, opacity:.8 }}>{g.libelle}</span>
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantNotes() {
  const user = getEnseignantUser();

  const [classes,     setClasses]     = useState([]);
  const [selClasse,   setSelClasse]   = useState(null);
  const [eleves,      setEleves]      = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [notesMap,    setNotesMap]    = useState({});
  const [loading,     setLoading]     = useState(false);
  const [selEval,     setSelEval]     = useState(null);
  const [modal,       setModal]       = useState(null);
  const [fTitre,      setFTitre]      = useState('');
  const [fDate,       setFDate]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [actionError, setActionError] = useState('');

  // Load classes
  useEffect(() => {
    if (!user?.id) return;
    fetchMesClasses(user.id).then(cls => {
      setClasses(cls);
      if (cls.length) setSelClasse(cls[0].id);
    }).catch(() => {});
  }, []); // eslint-disable-line

  // Load data when class changes
  const loadData = useCallback(async (classeId) => {
    if (!classeId) return;
    setLoading(true);
    setSelEval(null);
    setEleves([]); setEvaluations([]); setNotesMap({});
    try {
      const [elevs, evals] = await Promise.all([
        fetchElevesDeClasse(classeId),
        fetchEvaluationsClasse(classeId),
      ]);
      setEleves(elevs);
      setEvaluations(evals);
      if (evals.length) {
        const arrays = await Promise.all(evals.map(e => fetchNotesEvaluation(e.id)));
        const map = {};
        arrays.forEach(notes => notes.forEach(n => { map[noteKey(n.evaluation_id, n.eleve_id)] = n; }));
        setNotesMap(map);
        setSelEval(evals[0]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (selClasse) loadData(selClasse); }, [selClasse, loadData]);

  // Save note
  const saveNote = useCallback(async (evalId, eleveId, score) => {
    const key = noteKey(evalId, eleveId);
    try {
      const result = await upsertNote(evalId, eleveId, score, false);
      setNotesMap(prev => ({ ...prev, [key]: result }));
    } catch(e) { setActionError(e.message || 'Erreur lors de la sauvegarde de la note.'); }
  }, []);

  const toggleAbsent = useCallback(async (evalId, eleveId) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const newAbsent = !current?.absent;
    setNotesMap(prev => ({
      ...prev,
      [key]: { ...prev[key], evaluation_id: evalId, eleve_id: eleveId, score: null, absent: newAbsent },
    }));
    try {
      const result = await upsertNote(evalId, eleveId, null, newAbsent);
      setNotesMap(prev => ({ ...prev, [key]: result }));
    } catch(e) { setActionError(e.message || 'Erreur lors du marquage absent.'); }
  }, [notesMap]);

  // Stats par évaluation
  const evalStats = (ev) => {
    const noted  = eleves.filter(e => { const n = notesMap[noteKey(ev.id, e.id)]; return n && (n.absent || n.score != null); }).length;
    const absent = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.absent).length;
    const dist   = {};
    GRADES.forEach(g => {
      dist[g.label] = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.score === g.value).length;
    });
    return { noted, absent, dist, total: eleves.length };
  };

  // Modal éval
  const openCreate = () => { setFTitre(''); setFDate(''); setModal({ mode:'create' }); };
  const openEdit   = (ev, e) => { e.stopPropagation(); setFTitre(ev.titre); setFDate(ev.date_evaluation || ''); setModal({ mode:'edit', eval:ev }); };

  const handleSaveEval = async () => {
    if (!fTitre.trim()) return;
    setSaving(true);
    try {
      const data = { titre:fTitre.trim(), classe_id:selClasse, enseignant_id:user.id, date_evaluation:fDate||null, score_max:4 };
      if (modal.mode === 'create') {
        const created = await createEvaluation(data);
        setEvaluations(prev => [...prev, created]);
        setSelEval(created);
      } else {
        await updateEvaluation(modal.eval.id, { titre:data.titre, date_evaluation:data.date_evaluation, score_max:4 }, user.id);
        setEvaluations(prev => prev.map(e => e.id === modal.eval.id ? { ...e, ...data } : e));
        setSelEval(prev => prev?.id === modal.eval.id ? { ...prev, ...data } : prev);
      }
      setModal(null);
    } catch(e) { setActionError(e.message || 'Erreur lors de l\'enregistrement de l\'évaluation.'); }
    setSaving(false);
  };

  const handleDeleteEval = async () => {
    if (!confirmDel) return;
    try {
      await deleteEvaluation(confirmDel.id, user.id);
      const next = evaluations.filter(e => e.id !== confirmDel.id);
      setEvaluations(next);
      setNotesMap(prev => { const n={...prev}; Object.keys(n).forEach(k=>{if(k.startsWith(confirmDel.id+'_'))delete n[k];}); return n; });
      setSelEval(next.length ? next[0] : null);
    } catch(e) { setActionError(e.message || 'Erreur lors de la suppression de l\'évaluation.'); }
    setConfirmDel(null);
  };

  const className = classes.find(c => c.id === selClasse)?.nom || '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="py-6">
      {actionError && <p className="text-[13px] mb-3" style={{ color:'#ff453a' }}>{actionError}</p>}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .eval-card:hover { background: rgba(201,150,58,.06) !important; }
        .eval-card-active { background: rgba(201,150,58,.1) !important; border-color: rgba(201,150,58,.5) !important; }
        .note-row:hover { background: rgba(255,255,255,.02) !important; }
      `}</style>

      {/* ── Tabs classes ── */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {classes.map(c => (
          <button key={c.id} onClick={() => setSelClasse(c.id)} className="rounded-3xl font-bold text-[13px] cursor-pointer transition-all duration-150"
            style={{
              padding:'7px 20px',
              border:'1.5px solid',
              borderColor: selClasse===c.id ? 'var(--a-gold)' : 'var(--a-border)',
              background: selClasse===c.id ? 'var(--a-gold)' : 'transparent',
              color: selClasse===c.id ? '#000' : 'var(--a-fg-mid)',
            }}>{c.nom}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-a-fg-mid" style={{ padding:'80px 0' }}>Chargement…</div>
      ) : (
        <div className="grid gap-5 items-start" style={{ gridTemplateColumns:'280px 1fr' }}>

          {/* ══ COLONNE GAUCHE — liste évaluations ══ */}
          <div className="flex flex-col gap-2.5">

            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-a-fg-mid uppercase tracking-[1px]">
                Évaluations — {className}
              </span>
            </div>

            {/* Légende des notes */}
            <div className="flex flex-wrap gap-1 mb-1">
              {GRADES.map(g => (
                <span key={g.label} className="text-[10px] font-bold rounded-md"
                  style={{
                    padding:'2px 8px',
                    background:`${g.color}18`, color:g.color, border:`1px solid ${g.color}30`,
                  }}>
                  {g.label} = {g.libelle}
                </span>
              ))}
            </div>

            {/* Eval cards */}
            {evaluations.length === 0 ? (
              <div className="text-center rounded-[14px] text-a-fg-mid text-[13px]" style={{ padding:'32px 20px', border:'1px dashed var(--a-border)' }}>
                Aucune évaluation.<br/>Créez-en une ci-dessous.
              </div>
            ) : evaluations.map(ev => {
              const s = evalStats(ev);
              const pct = s.total > 0 ? s.noted / s.total : 0;
              const isActive = selEval?.id === ev.id;
              return (
                <div key={ev.id}
                  className={`eval-card${isActive ? ' eval-card-active' : ''} rounded-[14px] border border-a-border cursor-pointer transition-all duration-150 bg-a-bg-card relative`}
                  onClick={() => setSelEval(ev)}
                  style={{ padding:'14px 16px' }}
                >
                  {isActive && (
                    <div className="absolute left-0 rounded-r-[3px]" style={{ top:14, bottom:14, width:3, background:'var(--a-gold)' }}/>
                  )}

                  <div className="flex items-start justify-between gap-2" style={{ paddingLeft: isActive ? 10 : 0 }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-a-fg mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {ev.titre}
                      </div>
                      {ev.date_evaluation && (
                        <span className="text-[11px] text-a-fg-light bg-a-bg rounded-[10px]" style={{ padding:'1px 8px' }}>
                          {fmt(ev.date_evaluation)}
                        </span>
                      )}
                      {ev.enseignant_id !== user.id && ev.enseignants && (
                        <div className="text-[11px] text-a-fg-light mt-[3px] italic">
                          Par {ev.enseignants.prenom} {ev.enseignants.nom}
                        </div>
                      )}
                    </div>
                    {ev.enseignant_id === user.id && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={e => openEdit(ev, e)} className="w-7 h-7 rounded-lg border border-a-border bg-transparent text-a-fg-mid cursor-pointer flex items-center justify-center">
                          <IconEdit2/>
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDel(ev); }} className="w-7 h-7 rounded-lg bg-transparent text-a-red cursor-pointer flex items-center justify-center" style={{ border:'1px solid rgba(255,69,58,.25)' }}>
                          <IconTrash2/>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Distribution des notes */}
                  <div className="flex gap-1 mt-2" style={{ paddingLeft: isActive ? 10 : 0 }}>
                    {GRADES.map(g => s.dist[g.label] > 0 && (
                      <span key={g.label} className="text-[10px] font-bold rounded-[5px]"
                        style={{
                          padding:'1px 6px',
                          background:`${g.color}18`, color:g.color,
                        }}>{g.label}×{s.dist[g.label]}</span>
                    ))}
                    {s.absent > 0 && <span className="text-[10px] font-bold rounded-[5px]" style={{ padding:'1px 6px', background:'rgba(255,69,58,.12)', color:'#ff453a' }}>Abs×{s.absent}</span>}
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-2" style={{ paddingLeft: isActive ? 10 : 0 }}>
                    <div className="h-1 rounded bg-a-bg overflow-hidden">
                      <div className="h-full rounded transition-[width] duration-300" style={{ width:`${pct*100}%`, background: pct===1 ? '#30d158' : 'var(--a-gold)' }}/>
                    </div>
                    <div className="mt-[5px]">
                      <span className="text-[11px] text-a-fg-mid">{s.noted}/{s.total} élèves saisis</span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-a-gold opacity-70">
                      <IconChevRight/>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Bouton ajouter */}
            <button onClick={openCreate} className="flex items-center justify-center gap-2 p-[13px] rounded-[14px] bg-transparent text-a-gold cursor-pointer text-[13px] font-semibold transition-all duration-150"
              style={{ border:'1.5px dashed rgba(201,150,58,.4)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(201,150,58,.06)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <IconPlus/> Nouvelle évaluation
            </button>
          </div>

          {/* ══ COLONNE DROITE — saisie notes ══ */}
          {selEval ? (
            <div className="bg-a-bg-card rounded-2xl border border-a-border overflow-hidden">

              {/* Header éval */}
              <div className="border-b border-a-border" style={{ padding:'20px 24px', background:'rgba(201,150,58,.04)' }}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="m-0 a-display text-lg font-bold text-a-fg">{selEval.titre}</h3>
                    <div className="flex gap-3 mt-[5px] flex-wrap">
                      {selEval.date_evaluation && <span className="text-[13px] text-a-fg-mid">{fmt(selEval.date_evaluation)}</span>}
                      <div className="flex gap-1.5">
                        {GRADES.map(g => (
                          <span key={g.label} className="text-[11px] font-bold rounded-md"
                            style={{ padding:'1px 7px', background:`${g.color}18`, color:g.color }}>
                            {g.label} = {g.libelle}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Distribution rapide */}
                  {(() => {
                    const s = evalStats(selEval);
                    return (
                      <div className="flex gap-3 text-center shrink-0">
                        <div><div className="a-display text-xl font-bold text-a-gold">{s.noted}</div><div className="text-[11px] text-a-fg-mid">saisis</div></div>
                        {s.absent > 0 && <div><div className="text-xl font-bold" style={{ color:'#ff453a' }}>{s.absent}</div><div className="text-[11px] text-a-fg-mid">absents</div></div>}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Liste élèves */}
              {eleves.length === 0 ? (
                <div className="text-center text-a-fg-mid text-sm" style={{ padding:'60px 24px' }}>
                  Aucun élève dans cette classe
                </div>
              ) : (
                <div>
                  {/* Légende colonnes */}
                  <div className="gap-4 border-b border-a-border" style={{ display:'grid', gridTemplateColumns:'1fr 260px', padding:'12px 24px', background:'rgba(0,0,0,.15)' }}>
                    <span className="text-[11px] font-bold text-a-fg-light uppercase tracking-[1px]">Élève</span>
                    <span className="text-[11px] font-bold text-a-fg-light uppercase tracking-[1px] text-center">Appréciation</span>
                  </div>

                  {eleves.map((eleve, idx) => {
                    const note  = notesMap[noteKey(selEval.id, eleve.id)];
                    const grade = (note && !note.absent && note.score != null) ? gradeFromScore(note.score) : null;
                    return (
                      <div key={eleve.id} className="note-row gap-4 items-center transition-[background] duration-100"
                        style={{
                          display:'grid', gridTemplateColumns:'1fr 260px',
                          padding:'14px 24px',
                          borderBottom: idx < eleves.length-1 ? '1px solid var(--a-border)' : 'none',
                        }}>
                        {/* Identité */}
                        <div className="flex items-center gap-3">
                          <div className="w-[38px] h-[38px] rounded-full shrink-0 flex items-center justify-center text-xs font-bold transition-all duration-200"
                            style={{
                              background: grade ? `${grade.color}18` : 'rgba(255,255,255,.05)',
                              border: `2px solid ${grade ? grade.color : 'var(--a-border)'}`,
                              color: grade ? grade.color : 'var(--a-fg-mid)',
                            }}>
                            {initials(eleve)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-a-fg">{eleve.prenom} {eleve.nom}</div>
                            {note?.absent
                              ? <div className="text-xs mt-px" style={{ color:'#ff453a' }}>Absent(e)</div>
                              : grade
                                ? <div className="text-xs mt-px font-semibold" style={{ color: grade.color }}>
                                    {grade.label} — {grade.libelle}
                                  </div>
                                : <div className="text-xs text-a-fg-light mt-px">Appréciation non saisie</div>
                            }
                          </div>
                        </div>

                        {/* Saisie note (lecture seule si évaluation d'un autre prof) */}
                        {selEval.enseignant_id === user.id ? (
                          <NoteLetterInput
                            note={note}
                            onSave={(score) => saveNote(selEval.id, eleve.id, score)}
                            onAbsent={() => toggleAbsent(selEval.id, eleve.id)}
                          />
                        ) : (
                          <div className="flex justify-center">
                            {note?.absent
                              ? <span className="text-xs font-bold rounded-lg" style={{ padding:'4px 12px', background:'rgba(255,69,58,.12)', color:'#ff453a' }}>ABSENT</span>
                              : <GradeBadge score={note?.score} size="lg" />
                            }
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Pied — distribution globale */}
                  {(() => {
                    const s = evalStats(selEval);
                    const hasNotes = GRADES.some(g => s.dist[g.label] > 0);
                    if (!hasNotes) return null;
                    return (
                      <div className="flex items-center justify-between flex-wrap gap-2.5" style={{ padding:'16px 24px', borderTop:'2px solid rgba(201,150,58,.2)', background:'rgba(201,150,58,.04)' }}>
                        <span className="text-[13px] font-bold text-a-fg-mid uppercase tracking-[0.5px]">Résultats de classe</span>
                        <div className="flex gap-2">
                          {GRADES.map(g => s.dist[g.label] > 0 && (
                            <div key={g.label} className="text-center">
                              <div className="text-lg font-extrabold" style={{ color:g.color }}>{s.dist[g.label]}</div>
                              <div className="text-[10px] font-bold opacity-80" style={{ color:g.color }}>{g.label}</div>
                            </div>
                          ))}
                          {s.absent > 0 && (
                            <div className="text-center">
                              <div className="text-lg font-extrabold" style={{ color:'#ff453a' }}>{s.absent}</div>
                              <div className="text-[10px] font-bold opacity-80" style={{ color:'#ff453a' }}>Abs.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-a-bg-card rounded-2xl border border-a-border text-center" style={{ padding:'80px 24px' }}>
              <div className="text-4xl mb-3 opacity-20">📋</div>
              <div className="text-[15px] font-semibold text-a-fg mb-1.5">Commencez par créer une évaluation</div>
              <div className="text-[13px] text-a-fg-mid">Cliquez sur "Nouvelle évaluation" dans la colonne de gauche.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal évaluation ── */}
      {modal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5" style={{ background:'rgba(0,0,0,.65)' }}
          onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div className="bg-a-bg-card rounded-[20px] p-8 w-full max-w-[420px]" style={{ boxShadow:'0 24px 80px rgba(0,0,0,.6)' }}>
            <h3 className="mt-0 mb-6 a-display text-lg font-bold text-a-fg">
              {modal.mode==='create' ? 'Nouvelle évaluation' : 'Modifier l\'évaluation'}
            </h3>

            {/* Rappel du système de notation */}
            <div className="flex gap-1.5 flex-wrap mb-5 rounded-xl bg-a-bg border border-a-border" style={{ padding:'10px 14px' }}>
              {GRADES.map(g => (
                <span key={g.label} className="text-[11px] font-bold rounded-md"
                  style={{ padding:'2px 8px', background:`${g.color}18`, color:g.color }}>
                  {g.label} = {g.libelle}
                </span>
              ))}
            </div>

            <div className="mb-[18px]">
              <label className="block text-[11px] font-bold text-a-fg-mid mb-2 uppercase tracking-[0.5px]">Titre de l'évaluation</label>
              <input autoFocus className="w-full bg-a-bg text-a-fg rounded-xl text-sm outline-none box-border" style={{ border:'1.5px solid var(--a-border)', padding:'12px 16px' }}
                value={fTitre} onChange={e=>setFTitre(e.target.value)} placeholder="ex : Contrôle de lecture n°1"
                onKeyDown={e => { if (e.key==='Enter' && fTitre.trim()) handleSaveEval(); }}
              />
            </div>

            <div className="mb-7">
              <label className="block text-[11px] font-bold text-a-fg-mid mb-2 uppercase tracking-[0.5px]">Date (facultatif)</label>
              <input type="date" className="w-full bg-a-bg text-a-fg rounded-xl text-sm outline-none box-border" style={{ border:'1.5px solid var(--a-border)', padding:'12px 16px' }}
                value={fDate} onChange={e=>setFDate(e.target.value)}/>
            </div>

            <div className="flex justify-end gap-2.5">
              <button onClick={()=>setModal(null)} className="rounded-3xl border border-a-border bg-transparent text-a-fg-mid cursor-pointer text-[13px]" style={{ padding:'10px 22px' }}>
                Annuler
              </button>
              <button onClick={handleSaveEval} disabled={saving||!fTitre.trim()} className="rounded-3xl border-none bg-a-gold text-black font-bold cursor-pointer text-[13px]" style={{ padding:'10px 24px', opacity: saving||!fTitre.trim() ? .6 : 1 }}>
                {saving ? 'Enregistrement…' : modal.mode==='create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-5" style={{ background:'rgba(0,0,0,.65)' }}>
          <div className="bg-a-bg-card rounded-2xl max-w-[380px] w-full" style={{ padding:28, boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>
            <div className="a-display text-base font-bold text-a-fg mb-2.5">Supprimer cette évaluation ?</div>
            <div className="text-[13px] text-a-fg-mid mb-6 leading-relaxed">
              <strong className="text-a-fg">{confirmDel.titre}</strong> et toutes les appréciations associées seront supprimées définitivement.
            </div>
            <div className="flex justify-end gap-2.5">
              <button onClick={()=>setConfirmDel(null)} className="rounded-3xl border border-a-border bg-transparent text-a-fg-mid cursor-pointer text-[13px]" style={{ padding:'9px 20px' }}>Annuler</button>
              <button onClick={handleDeleteEval} className="rounded-3xl border-none bg-a-red text-white font-bold cursor-pointer text-[13px]" style={{ padding:'9px 20px' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
