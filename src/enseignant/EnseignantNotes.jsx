import React, { useEffect, useState, useCallback, useRef } from 'react';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const noteKey = (evalId, eleveId) => `${evalId}_${eleveId}`;

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : null;

function scoreColor(score, max) {
  if (score === null || score === undefined) return null;
  const sur20 = max > 0 ? (score / max) * 20 : 0;
  if (sur20 >= 14) return '#30d158';  // vert  : ≥ 14/20
  if (sur20 >= 10) return '#f7963a';  // orange: 10–13.5/20
  return '#ff453a';                   // rouge : < 10/20
}

function initials(e) {
  return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase();
}

// ─── Composant saisie note ────────────────────────────────────────────────────
function NoteInput({ note, scoreMax, onSave, onAbsent }) {
  const [isAbsent, setIsAbsent] = useState(!!note?.absent);
  const [val,      setVal]      = useState(!note?.absent && note?.score != null ? String(note.score) : '');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const inputRef = useRef(null);
  // "dirty" = l'utilisateur a tapé quelque chose qui n'est pas encore sauvegardé.
  // Tant que dirty=true, on bloque la sync depuis le prop parent pour ne pas
  // écraser ce que l'utilisateur est en train de saisir.
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (dirtyRef.current) return;
    setIsAbsent(!!note?.absent);
    setVal(!note?.absent && note?.score != null ? String(note.score) : '');
    setSaved(false);
  }, [note?.absent, note?.score]); // eslint-disable-line

  const handleRetirer = () => {
    dirtyRef.current = false;
    setIsAbsent(false);
    setVal('');
    onAbsent();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = async () => {
    if (isAbsent) return;
    const score = val === '' ? null : Math.min(Math.max(0, parseFloat(val)), parseFloat(scoreMax));
    if (val !== '' && isNaN(score)) return;
    setSaving(true);
    await onSave(score);
    dirtyRef.current = false; // sync autorisée à nouveau après la sauvegarde
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  if (isAbsent) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          flex:1, height:44, borderRadius:12,
          background:'rgba(255,69,58,.1)', border:'1.5px solid rgba(255,69,58,.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'#ff453a', fontWeight:700, fontSize:13, letterSpacing:.5,
        }}>
          ABSENT
        </div>
        <button onClick={handleRetirer} style={{
          padding:'0 14px', height:44, borderRadius:12, border:'1px solid var(--a-border)',
          background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:12,
          whiteSpace:'nowrap', flexShrink:0,
        }}>
          Retirer
        </button>
      </div>
    );
  }

  const color = val !== '' && !isNaN(parseFloat(val))
    ? scoreColor(parseFloat(val), parseFloat(scoreMax))
    : null;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ position:'relative', flex:1 }}>
        <input
          ref={inputRef}
          type="number" min="0" max={scoreMax} step="0.5"
          placeholder="—"
          value={val}
          onChange={e => { dirtyRef.current = true; setVal(e.target.value); setSaved(false); }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); } if (e.key === 'Escape') { setVal(note?.score != null ? String(note.score) : ''); e.target.blur(); } }}
          style={{
            width:'100%', height:44, borderRadius:12,
            background: color ? `${color}12` : 'var(--a-bg)',
            border: `1.5px solid ${color || 'var(--a-border)'}`,
            color: color || 'var(--a-fg)',
            fontSize:20, fontWeight:700, textAlign:'center',
            outline:'none', boxSizing:'border-box',
            transition:'border-color .15s, background .15s, color .15s',
            paddingRight:28,
          }}
        />
        {/* /max badge */}
        <span style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          fontSize:11, color:'var(--a-fg-light)', fontWeight:500, pointerEvents:'none',
        }}>/{scoreMax}</span>
      </div>

      {/* Status / absent btn */}
      {saved ? (
        <div style={{ width:44, height:44, borderRadius:12, background:'rgba(48,209,88,.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#30d158', flexShrink:0 }}>
          <IconCheck/>
        </div>
      ) : saving ? (
        <div style={{ width:44, height:44, borderRadius:12, background:'var(--a-bg)', border:'1px solid var(--a-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid var(--a-gold)', borderTopColor:'transparent', animation:'spin .6s linear infinite' }}/>
        </div>
      ) : (
        <button onClick={onAbsent} title="Marquer absent" style={{
          width:44, height:44, borderRadius:12, border:'1px solid var(--a-border)',
          background:'transparent', color:'var(--a-fg-light)', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          fontSize:11, fontWeight:600, letterSpacing:.3,
        }}>
          Abs
        </button>
      )}
    </div>
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
  const [fMax,        setFMax]        = useState('20');
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(null);

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
    } catch {}
  }, []);

  const toggleAbsent = useCallback(async (evalId, eleveId) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const newAbsent = !current?.absent;
    // Mise à jour optimiste immédiate — sans rollback pour ne pas bloquer l'UI
    setNotesMap(prev => ({
      ...prev,
      [key]: { ...prev[key], evaluation_id: evalId, eleve_id: eleveId, score: null, absent: newAbsent },
    }));
    try {
      const result = await upsertNote(evalId, eleveId, null, newAbsent);
      setNotesMap(prev => ({ ...prev, [key]: result }));
    } catch {
      // Pas de rollback : l'UI reste dans l'état voulu, la DB se resynchronisera
    }
  }, [notesMap]);

  // Stats per eval
  const evalStats = (ev) => {
    const noted  = eleves.filter(e => { const n = notesMap[noteKey(ev.id, e.id)]; return n && (n.absent || n.score != null); }).length;
    const absent = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.absent).length;
    const scores = eleves.map(e => notesMap[noteKey(ev.id, e.id)]).filter(n => n && !n.absent && n.score != null).map(n => parseFloat(n.score));
    const avg = scores.length ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : null;
    return { noted, absent, avg, total: eleves.length };
  };

  // Modal eval
  const openCreate = () => { setFTitre(''); setFDate(''); setFMax('20'); setModal({ mode:'create' }); };
  const openEdit   = (ev, e) => { e.stopPropagation(); setFTitre(ev.titre); setFDate(ev.date_evaluation || ''); setFMax(String(ev.score_max)); setModal({ mode:'edit', eval:ev }); };

  const handleSaveEval = async () => {
    if (!fTitre.trim()) return;
    setSaving(true);
    try {
      const data = { titre:fTitre.trim(), classe_id:selClasse, enseignant_id:user.id, date_evaluation:fDate||null, score_max:parseFloat(fMax)||20 };
      if (modal.mode === 'create') {
        const created = await createEvaluation(data);
        setEvaluations(prev => [...prev, created]);
        setSelEval(created);
      } else {
        await updateEvaluation(modal.eval.id, { titre:data.titre, date_evaluation:data.date_evaluation, score_max:data.score_max });
        setEvaluations(prev => prev.map(e => e.id === modal.eval.id ? { ...e, ...data } : e));
        setSelEval(prev => prev?.id === modal.eval.id ? { ...prev, ...data } : prev);
      }
      setModal(null);
    } catch {}
    setSaving(false);
  };

  const handleDeleteEval = async () => {
    if (!confirmDel) return;
    try {
      await deleteEvaluation(confirmDel.id);
      const next = evaluations.filter(e => e.id !== confirmDel.id);
      setEvaluations(next);
      setNotesMap(prev => { const n={...prev}; Object.keys(n).forEach(k=>{if(k.startsWith(confirmDel.id+'_'))delete n[k];}); return n; });
      setSelEval(next.length ? next[0] : null);
    } catch {}
    setConfirmDel(null);
  };

  const className = classes.find(c => c.id === selClasse)?.nom || '';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:'24px 0' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .eval-card:hover { background: rgba(201,150,58,.06) !important; }
        .eval-card-active { background: rgba(201,150,58,.1) !important; border-color: rgba(201,150,58,.5) !important; }
        .note-row:hover { background: rgba(255,255,255,.02) !important; }
        .abs-toggle:hover { border-color: rgba(255,69,58,.4) !important; color: #ff453a !important; }
      `}</style>

      {/* ── Tabs classes ── */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {classes.map(c => (
          <button key={c.id} onClick={() => setSelClasse(c.id)} style={{
            padding:'7px 20px', borderRadius:24, border:'1.5px solid',
            borderColor: selClasse===c.id ? 'var(--a-gold)' : 'var(--a-border)',
            background: selClasse===c.id ? 'var(--a-gold)' : 'transparent',
            color: selClasse===c.id ? '#000' : 'var(--a-fg-mid)',
            fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .15s',
          }}>{c.nom}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'80px 0', color:'var(--a-fg-mid)' }}>Chargement…</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>

          {/* ══ COLONNE GAUCHE — liste évaluations ══ */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

            {/* Header section */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:1 }}>
                Évaluations — {className}
              </span>
            </div>

            {/* Eval cards */}
            {evaluations.length === 0 ? (
              <div style={{ padding:'32px 20px', textAlign:'center', borderRadius:14, border:'1px dashed var(--a-border)', color:'var(--a-fg-mid)', fontSize:13 }}>
                Aucune évaluation.<br/>Créez-en une ci-dessous.
              </div>
            ) : evaluations.map(ev => {
              const s = evalStats(ev);
              const pct = s.total > 0 ? s.noted / s.total : 0;
              const isActive = selEval?.id === ev.id;
              const avgColor = s.avg ? scoreColor(parseFloat(s.avg), parseFloat(ev.score_max)) : null;
              return (
                <div key={ev.id}
                  className={`eval-card${isActive ? ' eval-card-active' : ''}`}
                  onClick={() => setSelEval(ev)}
                  style={{
                    borderRadius:14, border:'1px solid var(--a-border)',
                    padding:'14px 16px', cursor:'pointer', transition:'all .15s',
                    background:'var(--a-bg-card)', position:'relative',
                  }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div style={{ position:'absolute', left:0, top:14, bottom:14, width:3, borderRadius:'0 3px 3px 0', background:'var(--a-gold)' }}/>
                  )}

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, paddingLeft: isActive ? 10 : 0 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'var(--a-fg)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ev.titre}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>/{ev.score_max}</span>
                        {ev.date_evaluation && <span style={{ fontSize:11, color:'var(--a-fg-light)', background:'var(--a-bg)', padding:'1px 8px', borderRadius:10 }}>{fmt(ev.date_evaluation)}</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      <button onClick={e => openEdit(ev, e)} style={{ width:28, height:28, borderRadius:8, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <IconEdit2/>
                      </button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDel(ev); }} style={{ width:28, height:28, borderRadius:8, border:'1px solid rgba(255,69,58,.25)', background:'transparent', color:'var(--a-red)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <IconTrash2/>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop:10, paddingLeft: isActive ? 10 : 0 }}>
                    <div style={{ height:4, borderRadius:4, background:'var(--a-bg)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct*100}%`, borderRadius:4, background: pct===1 ? '#30d158' : 'var(--a-gold)', transition:'width .3s' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:5 }}>
                      <span style={{ fontSize:11, color:'var(--a-fg-mid)' }}>{s.noted}/{s.total} élèves</span>
                      {s.avg && <span style={{ fontSize:11, fontWeight:700, color: avgColor || 'var(--a-fg-mid)' }}>moy. {s.avg}</span>}
                      {s.absent > 0 && <span style={{ fontSize:11, color:'rgba(255,69,58,.7)' }}>{s.absent} abs.</span>}
                    </div>
                  </div>

                  {isActive && (
                    <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', color:'var(--a-gold)', opacity:.7 }}>
                      <IconChevRight/>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add button */}
            <button onClick={openCreate} style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'13px', borderRadius:14, border:'1.5px dashed rgba(201,150,58,.4)',
              background:'transparent', color:'var(--a-gold)', cursor:'pointer',
              fontSize:13, fontWeight:600, transition:'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(201,150,58,.06)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <IconPlus/> Nouvelle évaluation
            </button>
          </div>

          {/* ══ COLONNE DROITE — saisie notes ══ */}
          {selEval ? (
            <div style={{ background:'var(--a-bg-card)', borderRadius:16, border:'1px solid var(--a-border)', overflow:'hidden' }}>

              {/* Header éval */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--a-border)', background:'rgba(201,150,58,.04)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'var(--a-fg)' }}>{selEval.titre}</h3>
                    <div style={{ display:'flex', gap:12, marginTop:5 }}>
                      <span style={{ fontSize:13, color:'var(--a-fg-mid)' }}>Barème : <strong style={{color:'var(--a-gold)'}}>{selEval.score_max} pts</strong></span>
                      {selEval.date_evaluation && <span style={{ fontSize:13, color:'var(--a-fg-mid)' }}>{fmt(selEval.date_evaluation)}</span>}
                    </div>
                  </div>
                  {/* Mini stats */}
                  {(() => { const s = evalStats(selEval); return (
                    <div style={{ display:'flex', gap:16, textAlign:'center' }}>
                      <div><div style={{ fontSize:20, fontWeight:700, color:'var(--a-gold)' }}>{s.noted}</div><div style={{ fontSize:11, color:'var(--a-fg-mid)' }}>saisis</div></div>
                      {s.avg && <div><div style={{ fontSize:20, fontWeight:700, color: scoreColor(parseFloat(s.avg), parseFloat(selEval.score_max)) }}>{s.avg}</div><div style={{ fontSize:11, color:'var(--a-fg-mid)' }}>moyenne</div></div>}
                      {s.absent > 0 && <div><div style={{ fontSize:20, fontWeight:700, color:'#ff453a' }}>{s.absent}</div><div style={{ fontSize:11, color:'var(--a-fg-mid)' }}>absents</div></div>}
                    </div>
                  ); })()}
                </div>
              </div>

              {/* Liste élèves */}
              {eleves.length === 0 ? (
                <div style={{ padding:'60px 24px', textAlign:'center', color:'var(--a-fg-mid)', fontSize:14 }}>
                  Aucun élève dans cette classe
                </div>
              ) : (
                <div>
                  {/* Légende */}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:16, padding:'12px 24px', borderBottom:'1px solid var(--a-border)', background:'rgba(0,0,0,.15)' }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:1 }}>Élève</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:1, textAlign:'center' }}>Note</span>
                  </div>

                  {eleves.map((eleve, idx) => {
                    const note  = notesMap[noteKey(selEval.id, eleve.id)];
                    const color = (note && !note.absent && note.score != null) ? scoreColor(note.score, selEval.score_max) : null;
                    return (
                      <div key={eleve.id} className="note-row" style={{
                        display:'grid', gridTemplateColumns:'1fr 200px', gap:16,
                        padding:'14px 24px', alignItems:'center',
                        borderBottom: idx < eleves.length-1 ? '1px solid var(--a-border)' : 'none',
                        transition:'background .1s',
                      }}>
                        {/* Identité */}
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{
                            width:38, height:38, borderRadius:'50%', flexShrink:0,
                            background: color ? `${color}18` : 'rgba(255,255,255,.05)',
                            border: `2px solid ${color || 'var(--a-border)'}`,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:12, fontWeight:700,
                            color: color || 'var(--a-fg-mid)',
                            transition:'all .2s',
                          }}>
                            {initials(eleve)}
                          </div>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--a-fg)' }}>{eleve.prenom} {eleve.nom}</div>
                            {note?.absent
                              ? <div style={{ fontSize:12, color:'#ff453a', marginTop:1 }}>Absent(e)</div>
                              : note?.score != null
                                ? <div style={{ fontSize:12, color: color, marginTop:1 }}>
                                    {note.score}/{selEval.score_max} pts · {Math.round(note.score/selEval.score_max*100)}%
                                  </div>
                                : <div style={{ fontSize:12, color:'var(--a-fg-light)', marginTop:1 }}>Note non saisie</div>
                            }
                          </div>
                        </div>

                        {/* Input note */}
                        <NoteInput
                          note={note}
                          scoreMax={selEval.score_max}
                          onSave={(score) => saveNote(selEval.id, eleve.id, score)}
                          onAbsent={() => toggleAbsent(selEval.id, eleve.id)}
                        />
                      </div>
                    );
                  })}

                  {/* Pied — moyenne globale */}
                  {(() => {
                    const s = evalStats(selEval);
                    if (!s.avg) return null;
                    return (
                      <div style={{ padding:'16px 24px', borderTop:'2px solid rgba(201,150,58,.2)', background:'rgba(201,150,58,.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:13, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:.5 }}>Moyenne de classe</span>
                        <span style={{ fontSize:22, fontWeight:700, color: scoreColor(parseFloat(s.avg), parseFloat(selEval.score_max)) }}>{s.avg}<span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400 }}>/{selEval.score_max}</span></span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'var(--a-bg-card)', borderRadius:16, border:'1px solid var(--a-border)', padding:'80px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12, opacity:.2 }}>📋</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)', marginBottom:6 }}>Commencez par créer une évaluation</div>
              <div style={{ fontSize:13, color:'var(--a-fg-mid)' }}>Cliquez sur "Nouvelle évaluation" dans la colonne de gauche.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal évaluation ── */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div style={{ background:'var(--a-bg-card)', borderRadius:20, padding:32, width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,.6)' }}>
            <h3 style={{ margin:'0 0 24px', fontSize:18, fontWeight:700, color:'var(--a-fg)' }}>
              {modal.mode==='create' ? 'Nouvelle évaluation' : 'Modifier'}
            </h3>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Titre de l'évaluation</label>
              <input autoFocus style={{ width:'100%', background:'var(--a-bg)', border:'1.5px solid var(--a-border)', color:'var(--a-fg)', borderRadius:12, padding:'12px 16px', fontSize:14, outline:'none', boxSizing:'border-box' }}
                value={fTitre} onChange={e=>setFTitre(e.target.value)} placeholder="ex : Contrôle de lecture n°1"
                onKeyDown={e => { if (e.key==='Enter' && fTitre.trim()) handleSaveEval(); }}
              />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Note maximale</label>
                <input type="number" min="1" max="100" style={{ width:'100%', background:'var(--a-bg)', border:'1.5px solid var(--a-border)', color:'var(--a-fg)', borderRadius:12, padding:'12px 16px', fontSize:14, outline:'none', boxSizing:'border-box' }}
                  value={fMax} onChange={e=>setFMax(e.target.value)} placeholder="20"/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:.5 }}>Date (facultatif)</label>
                <input type="date" style={{ width:'100%', background:'var(--a-bg)', border:'1.5px solid var(--a-border)', color:'var(--a-fg)', borderRadius:12, padding:'12px 16px', fontSize:14, outline:'none', boxSizing:'border-box' }}
                  value={fDate} onChange={e=>setFDate(e.target.value)}/>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'10px 22px', borderRadius:24, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:13 }}>
                Annuler
              </button>
              <button onClick={handleSaveEval} disabled={saving||!fTitre.trim()} style={{ padding:'10px 24px', borderRadius:24, border:'none', background:'var(--a-gold)', color:'#000', fontWeight:700, cursor:'pointer', fontSize:13, opacity: saving||!fTitre.trim() ? .6 : 1 }}>
                {saving ? 'Enregistrement…' : modal.mode==='create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.65)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'var(--a-bg-card)', borderRadius:16, padding:28, maxWidth:380, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--a-fg)', marginBottom:10 }}>Supprimer cette évaluation ?</div>
            <div style={{ fontSize:13, color:'var(--a-fg-mid)', marginBottom:24, lineHeight:1.6 }}>
              <strong style={{color:'var(--a-fg)'}}>{confirmDel.titre}</strong> et toutes les notes associées seront supprimées définitivement.
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button onClick={()=>setConfirmDel(null)} style={{ padding:'9px 20px', borderRadius:24, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:13 }}>Annuler</button>
              <button onClick={handleDeleteEval} style={{ padding:'9px 20px', borderRadius:24, border:'none', background:'var(--a-red)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
