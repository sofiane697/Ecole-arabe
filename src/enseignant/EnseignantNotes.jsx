import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchEvaluationsClasse, createEvaluation, updateEvaluation, deleteEvaluation,
  fetchNotesEvaluation, upsertNote,
} from './supabaseEnseignant';
import { Flourish, Star5 } from '../shared/Ornaments';
import EleveAvatar from '../shared/EleveAvatar';

const C = {
  bg:       '#F2EEDF',
  paper:    '#FBFAF1',
  ink:      '#1E2317',
  ink2:     '#3F4A33',
  ink3:     '#7A876A',
  gold:     '#8A6B1F',
  goldSoft: '#DCBC6E',
  rule:     'rgba(138,107,31,0.18)',
  ruleSoft: 'rgba(138,107,31,0.10)',
};

const GRADES = [
  { value: 4, label: 'A+',  stars: 4, libelle: 'Excellent'              },
  { value: 3, label: 'A',   stars: 3, libelle: 'Acquis'                 },
  { value: 2, label: 'ECA', stars: 2, libelle: "En cours d'acquisition" },
  { value: 1, label: 'NA',  stars: 1, libelle: 'Non acquis'             },
];

const noteKey = (evalId, eleveId) => `${evalId}_${eleveId}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : null;
const fmtAgo = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1) return 'à l\'instant';
  if (diff < 60) return `il y a ${diff} minute${diff>1?'s':''}`;
  return fmt(iso);
};

function initials(e) { return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase(); }

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconMsg = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconEdit = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
  </svg>
);

// ── Barème ──
function Bareme() {
  return (
    <div style={{ background: C.paper, borderRadius: 16, border: `1px solid ${C.rule}`, padding: '14px 16px' }}>
      <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.ink3, marginBottom: 10 }}>
        Barème · Échelle d'étoiles
      </div>
      {[...GRADES, { value: 0, label: 'Abs', stars: 0, libelle: 'Absent' }].map(g => (
        <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
          <span style={{ display: 'inline-flex', gap: 2, minWidth: 52 }}>
            {[1,2,3,4].map(i => <Star5 key={i} size={10} filled={i <= g.stars} />)}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, fontWeight: 700, color: C.gold, minWidth: 28 }}>
            {g.label}
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: C.ink3 }}>
            {g.libelle}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Saisie note ──
function NoteInput({ eleveId, evalId, note, isOwner, onSave, onToggleAbsent, onOpenComment }) {
  const [saving, setSaving] = useState(false);
  const handleGrade = async (val) => {
    if (!isOwner) return;
    setSaving(true);
    try { await onSave(note?.score === val ? null : val); } finally { setSaving(false); }
  };
  const handleAbsent = async () => {
    if (!isOwner) return;
    setSaving(true);
    try { await onToggleAbsent(); } finally { setSaving(false); }
  };

  if (!isOwner) {
    const g = GRADES.find(x => x.value === note?.score);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {note?.absent ? (
          <span style={{ padding: '3px 12px', borderRadius: 999, background: 'rgba(179,64,64,0.10)', color: '#b34040', fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700 }}>Absent</span>
        ) : g ? (
          <span style={{ padding: '3px 12px', borderRadius: 999, background: 'rgba(138,107,31,0.10)', color: C.gold, fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700 }}>{g.label}</span>
        ) : (
          <span style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 12, color: C.ink3 }}>non saisi</span>
        )}
        {note?.commentaire && (
          <button onClick={onOpenComment} style={{ width: 28, height: 28, borderRadius: '50%', border: `1px solid ${C.rule}`, background: 'rgba(138,107,31,0.08)', color: C.gold, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMsg />
          </button>
        )}
      </div>
    );
  }

  if (note?.absent) {
    return (
      <div style={{ display: 'flex', gap: 6 }}>
        <span style={{ padding: '5px 14px', borderRadius: 999, background: 'rgba(179,64,64,0.10)', border: '1px solid rgba(179,64,64,0.25)', color: '#b34040', fontFamily: "'Manrope',sans-serif", fontSize: 11.5, fontWeight: 700 }}>
          Absent
        </span>
        <button onClick={handleAbsent} disabled={saving} style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink3, fontFamily: "'Manrope',sans-serif", fontSize: 11, cursor: 'pointer' }}>
          Retirer
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {GRADES.map(g => {
        const active = note?.score === g.value;
        return (
          <button
            key={g.label}
            onClick={() => handleGrade(g.value)}
            disabled={saving}
            style={{
              padding: '5px 11px', borderRadius: 999,
              border: `1px solid ${active ? C.ink : C.rule}`,
              background: active ? C.ink : 'transparent',
              color: active ? C.paper : C.ink3,
              fontFamily: "'Manrope',sans-serif", fontSize: 11.5, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {g.label}
          </button>
        );
      })}
      <button
        onClick={handleAbsent}
        disabled={saving}
        style={{
          padding: '5px 11px', borderRadius: 999,
          border: `1px solid ${C.rule}`, background: 'transparent',
          color: C.ink3, fontFamily: "'Manrope',sans-serif", fontSize: 11.5, fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Abs
      </button>
      <button
        onClick={onOpenComment}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          border: `1px solid ${note?.commentaire ? C.gold : C.rule}`,
          background: note?.commentaire ? 'rgba(138,107,31,0.08)' : 'transparent',
          color: note?.commentaire ? C.gold : C.ink3,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <IconMsg />
      </button>
    </div>
  );
}

// ── Modal commentaire ──
function CommentModal({ eleve, currentValue, onSave, onClose, readOnly }) {
  const [value, setValue] = useState(currentValue || '');
  const [saving, setSaving] = useState(false);
  const handleSave = async () => { setSaving(true); try { await onSave(value.trim() || null); } finally { setSaving(false); } };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,35,23,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.paper, borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, border: `1px solid ${C.rule}` }}>
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 20, fontWeight: 500, color: C.ink, marginBottom: 4 }}>
          {readOnly ? 'Commentaire' : 'Appréciation'}
        </div>
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 13, color: C.ink3, marginBottom: 18 }}>
          {eleve?.prenom} {eleve?.nom}
        </div>
        <textarea
          autoFocus={!readOnly}
          readOnly={readOnly}
          value={value}
          maxLength={500}
          onChange={e => setValue(e.target.value)}
          placeholder={readOnly ? '' : 'Ex : Très bon travail, peut encore progresser...'}
          style={{ width: '100%', background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 12, padding: '10px 14px', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.ink, outline: 'none', resize: 'vertical', minHeight: 100, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {readOnly ? 'Fermer' : 'Annuler'}
          </button>
          {!readOnly && (
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 22px', borderRadius: 999, border: 'none', background: C.ink, color: C.paper, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
export default function EnseignantNotes() {
  const user = getEnseignantUser();
  const [classes,      setClasses]      = useState([]);
  const [selClasse,    setSelClasse]    = useState(null);
  const [eleves,       setEleves]       = useState([]);
  const [evaluations,  setEvaluations]  = useState([]);
  const [notesMap,     setNotesMap]     = useState({});
  const [loading,      setLoading]      = useState(true);
  const [selEval,      setSelEval]      = useState(null);
  const [modal,        setModal]        = useState(null);
  const [confirmDel,   setConfirmDel]   = useState(null);
  const [commentModal, setCommentModal] = useState(null);
  const [fTitre,       setFTitre]       = useState('');
  const [fDate,        setFDate]        = useState('');
  const [saving,       setSaving]       = useState(false);
  const [lastSave,     setLastSave]     = useState(null);
  const [validatedEval, setValidatedEval] = useState(null); // id de l'éval validée localement

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesClasses(user.id).then(cls => {
      setClasses(cls);
      if (cls.length) setSelClasse(cls[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadData = useCallback(async (classeId) => {
    if (!classeId) return;
    setLoading(true);
    setSelEval(null);
    setEleves([]); setEvaluations([]); setNotesMap({});
    try {
      const [elvs, evals] = await Promise.all([fetchElevesDeClasse(classeId), fetchEvaluationsClasse(classeId)]);
      setEleves(elvs);
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

  const saveNote = useCallback(async (evalId, eleveId, score) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const result = await upsertNote(evalId, eleveId, score, false, current?.commentaire ?? null);
    setNotesMap(prev => ({ ...prev, [key]: result }));
    setLastSave(new Date());
    setValidatedEval(v => v === evalId ? null : v);
  }, [notesMap]);

  const toggleAbsent = useCallback(async (evalId, eleveId) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const newAbsent = !current?.absent;
    setNotesMap(prev => ({ ...prev, [key]: { ...prev[key], evaluation_id:evalId, eleve_id:eleveId, score:null, absent:newAbsent } }));
    const result = await upsertNote(evalId, eleveId, null, newAbsent, current?.commentaire ?? null);
    setNotesMap(prev => ({ ...prev, [key]: result }));
    setLastSave(new Date());
    setValidatedEval(v => v === evalId ? null : v);
  }, [notesMap]);

  const saveComment = useCallback(async (evalId, eleveId, commentaire) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const result = await upsertNote(evalId, eleveId, current?.score ?? null, current?.absent ?? false, commentaire);
    setNotesMap(prev => ({ ...prev, [key]: result }));
    setCommentModal(null);
    setLastSave(new Date());
    setValidatedEval(v => v === evalId ? null : v);
  }, [notesMap]);

  const handleValiderSerie = () => {
    if (!selEval) return;
    const stats = evalStats(selEval);
    const manquants = stats.total - stats.noted;
    if (manquants > 0) {
      const ok = window.confirm(
        `${manquants} élève${manquants > 1 ? 's' : ''} non noté${manquants > 1 ? 's' : ''} pour cette évaluation. Valider la série quand même ?`
      );
      if (!ok) return;
    }
    setValidatedEval(selEval.id);
  };

  const evalStats = (ev) => {
    const noted  = eleves.filter(e => { const n = notesMap[noteKey(ev.id, e.id)]; return n && (n.absent || n.score != null); }).length;
    const absent = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.absent).length;
    return { noted, absent, total: eleves.length };
  };

  const handleSaveEval = async () => {
    if (!fTitre.trim()) return;
    setSaving(true);
    try {
      const data = { titre: fTitre.trim(), classe_id: selClasse, enseignant_id: user.id, date_evaluation: fDate || null, score_max: 4 };
      if (modal.mode === 'create') {
        const created = await createEvaluation(data);
        setEvaluations(prev => [...prev, created]);
        setSelEval(created);
      } else {
        await updateEvaluation(modal.eval.id, { titre: data.titre, date_evaluation: data.date_evaluation, score_max: 4 }, user.id);
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
      await deleteEvaluation(confirmDel.id, user.id);
      const next = evaluations.filter(e => e.id !== confirmDel.id);
      setEvaluations(next);
      setSelEval(next.length ? next[0] : null);
    } catch {}
    setConfirmDel(null);
  };

  const classeActive = classes.find(c => c.id === selClasse);
  const inputStyle = { width:'100%', background:C.bg, border:`1px solid ${C.rule}`, borderRadius:12, padding:'9px 13px', fontFamily:"'Manrope',sans-serif", fontSize:13, color:C.ink, outline:'none', boxSizing:'border-box' };
  const modalOverlay = { position:'fixed', inset:0, background:'rgba(30,35,23,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 };

  return (
    <div style={{ padding:'32px 40px 48px', minHeight:'100%', background:C.bg, fontFamily:"'Manrope',system-ui,sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <Flourish size={26} />
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:C.ink3 }}>
              Espace évaluations
            </span>
          </div>
          <h1 style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:40, fontWeight:500, color:C.ink, margin:0, lineHeight:1.05, letterSpacing:'-0.015em' }}>
            <em style={{ fontStyle:'italic', color:C.gold }}>Notes</em> &amp; appréciations
          </h1>
        </div>
        <div style={{ textAlign:'right', paddingTop:6 }}>
          <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:12.5, color:C.ink2 }}>{today}</div>
          {selEval && (
            <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3, marginTop:3 }}>
              Semaine {Math.ceil(new Date().getDate()/7)} · Trimestre 3
            </div>
          )}
        </div>
      </div>

      {/* ── Onglets classes + bouton ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {classes.map(c => {
            const isActive = selClasse === c.id;
            const elvCount = isActive ? eleves.length : 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelClasse(c.id)}
                style={{
                  padding:'7px 16px', borderRadius:999, cursor:'pointer',
                  border:`1px solid ${isActive ? C.ink : C.rule}`,
                  background: isActive ? C.ink : 'transparent',
                  color: isActive ? C.paper : C.ink2,
                  fontFamily:"'Manrope',sans-serif", fontSize:12.5, fontWeight: isActive ? 700 : 500,
                  display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1.2,
                }}
              >
                <span>{c.nom}</span>
                {isActive && c.niveaux_scolaires?.nom && (
                  <span style={{ fontSize:9, opacity:0.7, letterSpacing:'0.05em', marginTop:1 }}>
                    {c.niveaux_scolaires.nom} · {elvCount} él.
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => { setFTitre(''); setFDate(''); setModal({ mode:'create' }); }}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:'60px 60px 12px 12px', border:'none', background:C.gold, color:C.paper, fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity='1'}
        >
          <IconPlus /> Nouvelle évaluation
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px 0', fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:16, color:C.ink3 }}>
          Chargement…
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20, alignItems:'start' }}>

          {/* ── Colonne gauche : eval list + barème ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Label section */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:C.ink3 }}>
                Évaluations · {classeActive?.nom}
              </span>
              {evaluations.length > 0 && (
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:C.ink3 }}>
                  {evaluations.length} au total
                </span>
              )}
            </div>

            {/* Cards évaluations */}
            {evaluations.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px', fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:14, color:C.ink3, border:`1px dashed ${C.rule}`, borderRadius:14 }}>
                Aucune évaluation.<br/>Créez-en une ci-dessus.
              </div>
            ) : evaluations.map(ev => {
              const isActive = selEval?.id === ev.id;
              const isOwn = ev.enseignant_id === user.id;
              const s = evalStats(ev);
              const firstWord = ev.titre.split(' ')[0];
              const rest = ev.titre.slice(firstWord.length);
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelEval(ev)}
                  style={{
                    background: C.paper,
                    borderRadius: '30px 30px 16px 16px',
                    border:`1px solid ${isActive ? C.gold : C.rule}`,
                    padding:'14px 16px', cursor:'pointer',
                    boxShadow: isActive ? `0 0 0 2px rgba(138,107,31,0.15)` : 'none',
                  }}
                >
                  {/* Status + actions */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:8.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:C.gold }}>
                      EN COURS
                    </span>
                    {isOwn && (
                      <div style={{ display:'flex', gap:4 }}>
                        <button onClick={e => { e.stopPropagation(); setFTitre(ev.titre); setFDate(ev.date_evaluation||''); setModal({ mode:'edit', eval:ev }); }} style={{ width:24, height:24, borderRadius:6, border:`1px solid ${C.rule}`, background:'transparent', color:C.ink3, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <IconEdit />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDel(ev); }} style={{ width:24, height:24, borderRadius:6, border:`1px solid rgba(179,64,64,0.25)`, background:'rgba(179,64,64,0.06)', color:'#b34040', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <IconTrash />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Titre */}
                  <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:17, fontWeight:500, color:C.ink, letterSpacing:'-0.01em', marginBottom:4 }}>
                    <em style={{ fontStyle:'italic', color:C.gold }}>{firstWord}</em>{rest}
                  </div>

                  {/* Date + count */}
                  {(ev.date_evaluation || s.total > 0) && (
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:11, color:C.ink3, marginBottom:8 }}>
                      {ev.date_evaluation && fmt(ev.date_evaluation)}
                      {ev.date_evaluation && s.total > 0 && ' · '}
                      {s.total > 0 && `${s.total} élève${s.total>1?'s':''}`}
                    </div>
                  )}

                  {/* Étoiles niveau moyen */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:11, color:C.ink3 }}>Niveau moyen</span>
                    <span style={{ display:'inline-flex', gap:2 }}>
                      {[1,2,3,4].map(i => <Star5 key={i} size={10} filled={false} />)}
                    </span>
                  </div>

                  {/* Progrès */}
                  <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:11, color:C.ink3 }}>
                    {s.noted} saisi sur {s.total}
                  </div>
                </div>
              );
            })}

            {/* Barème */}
            <Bareme />
          </div>

          {/* ── Colonne droite : panneau saisie ── */}
          {selEval ? (
            <div style={{ background:C.paper, borderRadius:20, border:`1px solid ${C.rule}`, overflow:'hidden' }}>
              {/* Header panneau */}
              <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.ruleSoft}` }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:C.ink3, marginBottom:4 }}>
                      Évaluation · {classeActive?.nom}
                    </div>
                    <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:22, fontWeight:500, color:C.ink, letterSpacing:'-0.01em' }}>
                      <em style={{ fontStyle:'italic', color:C.gold }}>{selEval.titre.split(' ')[0]}</em>
                      {selEval.titre.slice(selEval.titre.split(' ')[0].length)}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:28, fontWeight:700, color:C.ink, lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                      {evalStats(selEval).noted}
                    </div>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:8.5, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.ink3, marginTop:2 }}>
                      / {evalStats(selEval).total} élèves notés
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau élèves */}
              {eleves.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px', fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:15, color:C.ink3 }}>
                  Aucun élève dans cette classe.
                </div>
              ) : eleves.map((eleve, idx) => {
                const note = notesMap[noteKey(selEval.id, eleve.id)];
                const isOwner = selEval.enseignant_id === user.id;
                return (
                  <div key={eleve.id} style={{
                    display:'flex', alignItems:'center', gap:14, padding:'12px 22px',
                    borderBottom: idx < eleves.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                  }}>
                    {/* Avatar */}
                    <EleveAvatar
                      eleve={eleve}
                      size={40}
                      variant="enseignant"
                      fallbackStyle={{
                        background: '#1E2317', color: '#C09844',
                        fontWeight: 700, letterSpacing: '0.5px',
                      }}
                    />
                    {/* Nom */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, color:C.ink }}>
                        {eleve.prenom} <span style={{ textTransform:'uppercase' }}>{eleve.nom}</span>
                      </div>
                      <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:11, color:C.ink3, marginTop:1 }}>
                        {note?.absent ? 'absent' : note?.score != null ? GRADES.find(g=>g.value===note.score)?.libelle : 'non saisi'}
                      </div>
                    </div>
                    {/* Saisie */}
                    <NoteInput
                      eleveId={eleve.id}
                      evalId={selEval.id}
                      note={note}
                      isOwner={isOwner}
                      onSave={score => saveNote(selEval.id, eleve.id, score)}
                      onToggleAbsent={() => toggleAbsent(selEval.id, eleve.id)}
                      onOpenComment={() => setCommentModal({ eleve, note, readOnly: !isOwner, evalId: selEval.id })}
                    />
                  </div>
                );
              })}

              {/* Footer autosave + valider */}
              {(() => {
                const isValidated = validatedEval === selEval.id;
                return (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 22px', borderTop:`1px solid ${C.ruleSoft}` }}>
                    <span style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:11.5, color: isValidated ? C.gold : C.ink3 }}>
                      {isValidated
                        ? `✓ Série validée · ${evalStats(selEval).noted} / ${evalStats(selEval).total} élèves notés`
                        : lastSave ? `Auto-sauvegardé · ${fmtAgo(lastSave)}` : 'Modifiez une note pour sauvegarder'}
                    </span>
                    <button
                      onClick={handleValiderSerie}
                      disabled={isValidated}
                      style={{
                        padding:'9px 22px', borderRadius:999, border:'none',
                        background: isValidated ? C.rule : C.ink,
                        color: isValidated ? C.ink3 : C.paper,
                        fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600,
                        cursor: isValidated ? 'default' : 'pointer',
                      }}
                      onMouseEnter={e => { if (!isValidated) e.currentTarget.style.opacity='0.85'; }}
                      onMouseLeave={e => { if (!isValidated) e.currentTarget.style.opacity='1'; }}
                    >
                      {isValidated ? '✓ Validée' : 'Valider la série →'}
                    </button>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ background:C.paper, borderRadius:20, border:`1px solid ${C.rule}`, padding:'60px 24px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:18, color:C.ink3 }}>
                Sélectionnez une évaluation
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal créer / modifier évaluation ── */}
      {modal && (
        <div style={modalOverlay} onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div style={{ background:C.paper, borderRadius:20, padding:28, width:'100%', maxWidth:420, border:`1px solid ${C.rule}` }}>
            <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:22, fontWeight:500, color:C.ink, marginBottom:20 }}>
              {modal.mode==='create' ? 'Nouvelle évaluation' : "Modifier l'évaluation"}
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>Titre *</label>
              <input style={inputStyle} autoFocus value={fTitre} onChange={e => setFTitre(e.target.value)} placeholder="Ex : Contrôle de lecture n°1" />
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3, marginBottom:6 }}>Date (facultatif)</label>
              <input type="date" style={inputStyle} value={fDate} onChange={e => setFDate(e.target.value)} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setModal(null)} style={{ padding:'9px 20px', borderRadius:999, border:`1px solid ${C.rule}`, background:'transparent', color:C.ink2, fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
              <button onClick={handleSaveEval} disabled={saving||!fTitre.trim()} style={{ padding:'9px 22px', borderRadius:999, border:'none', background:C.ink, color:C.paper, fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving||!fTitre.trim()?0.5:1 }}>
                {saving ? 'Enregistrement…' : modal.mode==='create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal commentaire ── */}
      {commentModal && (
        <CommentModal
          eleve={commentModal.eleve}
          currentValue={commentModal.note?.commentaire||''}
          readOnly={commentModal.readOnly}
          onClose={() => setCommentModal(null)}
          onSave={v => saveComment(commentModal.evalId, commentModal.eleve.id, v)}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div style={modalOverlay} onClick={e => { if (e.target===e.currentTarget) setConfirmDel(null); }}>
          <div style={{ background:C.paper, borderRadius:20, padding:28, width:'100%', maxWidth:380, border:`1px solid ${C.rule}`, textAlign:'center' }}>
            <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:20, fontWeight:500, color:C.ink, marginBottom:10 }}>Supprimer l'évaluation ?</div>
            <p style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:14, color:C.ink2, marginBottom:24 }}>
              « {confirmDel.titre} » et toutes les notes seront supprimées.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding:'9px 20px', borderRadius:999, border:`1px solid ${C.rule}`, background:'transparent', color:C.ink2, fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Annuler</button>
              <button onClick={handleDeleteEval} style={{ padding:'9px 22px', borderRadius:999, border:'none', background:'#b34040', color:'#fff', fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
