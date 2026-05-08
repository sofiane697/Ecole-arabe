import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchObservationsClasse, createObservation, deleteObservation,
} from './supabaseEnseignant';
import { motion, staggerContainer, fadeUp, tapScale } from '../animations';
import EleveAvatar from '../shared/EleveAvatar';

// ─── Constantes ───────────────────────────────────────────────────────────────
const TYPES = [
  { value: 'general',      label: 'Général',      color: 'var(--a-blue)',  bg: 'rgba(10,132,255,0.1)',  icon: '💬' },
  { value: 'comportement', label: 'Comportement',  color: 'var(--a-red)',   bg: 'rgba(255,69,58,0.1)',   icon: '⚡' },
  { value: 'progression',  label: 'Progression',  color: 'var(--a-green)', bg: 'rgba(48,209,88,0.1)',   icon: '📈' },
];

function typeInfo(v) { return TYPES.find(t => t.value === v) || TYPES[0]; }

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:   { paddingBottom:24 },
  topbar: { display:'flex', alignItems:'center', gap:10, marginBottom:20, flexWrap:'wrap' },
  tabs:   { display:'flex', gap:6, flex:1, flexWrap:'wrap' },
  tab: (a) => ({
    padding:'6px 16px', borderRadius:20, border:'1px solid var(--a-border)',
    background: a ? 'var(--a-gold)' : 'transparent',
    color: a ? '#000' : 'var(--a-fg-mid)',
    cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .15s',
  }),
  grid: { display:'grid', gridTemplateColumns:'280px 1fr', gap:16, alignItems:'start' },
  // Student list
  list:       { background:'var(--a-bg-card)', borderRadius:14, border:'1px solid var(--a-border)', overflow:'hidden' },
  listHeader: { padding:'11px 16px', borderBottom:'1px solid var(--a-border)', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', letterSpacing:'1px', textTransform:'uppercase' },
  listItem: (active) => ({
    padding:'11px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:10,
    background: active ? 'rgba(201,150,58,.08)' : 'transparent',
    borderLeft: `3px solid ${active ? 'var(--a-gold)' : 'transparent'}`,
    borderBottom:'1px solid var(--a-border)',
    transition:'background .1s',
  }),
  avatar: (hasObs) => ({
    width:34, height:34, borderRadius:'50%', flexShrink:0,
    background: hasObs ? 'rgba(48,209,88,.12)' : 'rgba(255,255,255,.05)',
    border: `2px solid ${hasObs ? 'var(--a-green)' : 'var(--a-border)'}`,
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:12, fontWeight:700, color: hasObs ? 'var(--a-green)' : 'var(--a-fg-mid)',
  }),
  listName: { fontSize:13, fontWeight:600, color:'var(--a-fg)' },
  listSub:  { fontSize:11, color:'var(--a-fg-mid)', marginTop:2 },
  // Right panel
  panel:      { background:'var(--a-bg-card)', borderRadius:14, border:'1px solid var(--a-border)', padding:24 },
  panelTitle: { fontFamily:'var(--a-font-display)', fontSize:17, fontWeight:700, color:'var(--a-fg)', marginBottom:2, marginTop:0 },
  panelSub:   { fontSize:12, color:'var(--a-fg-mid)', marginBottom:22 },
  label:      { display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' },
  typeRow:    { display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 },
  typePill: (active, color, bg) => ({
    padding:'6px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:700,
    background: active ? bg : 'transparent',
    border: `1.5px solid ${active ? color : 'var(--a-border)'}`,
    color: active ? color : 'var(--a-fg-mid)',
    transition:'all .12s',
  }),
  textarea: { width:'100%', minHeight:110, background:'var(--a-bg)', border:'1px solid var(--a-border)', color:'var(--a-fg)', borderRadius:10, padding:12, fontSize:14, lineHeight:1.65, resize:'vertical', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  formBtns:  { display:'flex', justifyContent:'flex-end', gap:10, marginTop:14 },
  btnSave:   { padding:'8px 20px', borderRadius:20, border:'none', background:'var(--a-gold)', color:'#000', fontWeight:700, cursor:'pointer', fontSize:13 },
  btnClear:  { padding:'8px 18px', borderRadius:20, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:13 },
  // History
  histSep:     { display:'flex', alignItems:'center', gap:10, margin:'24px 0 16px', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'1px' },
  histSepLine: { flex:1, height:1, background:'var(--a-border)' },
  histItem:    { padding:14, borderRadius:10, border:'1px solid var(--a-border)', marginBottom:10, position:'relative' },
  histHeader:  { display:'flex', alignItems:'center', gap:8, marginBottom:8 },
  histTypePill: (color, bg) => ({
    padding:'2px 10px', borderRadius:20, background:bg, color,
    fontSize:11, fontWeight:700,
  }),
  histDate: { fontSize:11, color:'var(--a-fg-mid)', marginLeft:'auto', paddingRight:28 },
  histText: { fontSize:13, color:'var(--a-fg)', lineHeight:1.65 },
  delBtn:   { position:'absolute', top:10, right:10, padding:5, borderRadius:6, background:'transparent', border:'none', color:'var(--a-fg-light)', cursor:'pointer', display:'flex', alignItems:'center' },
  // Placeholder
  emptyPanel: { background:'var(--a-bg-card)', borderRadius:14, border:'1px solid var(--a-border)', padding:'60px 24px', textAlign:'center' },
  loading:    { textAlign:'center', padding:'60px 20px', color:'var(--a-fg-mid)', fontSize:14 },
};

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantObservations() {
  const user = getEnseignantUser();

  const [classes,      setClasses]      = useState([]);
  const [selClasse,    setSelClasse]    = useState(null);
  const [eleves,       setEleves]       = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selEleve,     setSelEleve]     = useState(null);
  const [formContenu,  setFormContenu]  = useState('');
  const [formType,     setFormType]     = useState('general');
  const [saving,       setSaving]       = useState(false);
  const [actionError,  setActionError]  = useState('');
  const [confirmDel,   setConfirmDel]   = useState(null); // observation à supprimer

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesClasses(user.id)
      .then(cls => { setClasses(cls); if (cls.length) setSelClasse(cls[0].id); else setLoading(false); })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadData = useCallback(async (classeId) => {
    if (!classeId) return;
    setLoading(true);
    setSelEleve(null);
    try {
      const [elevs, obs] = await Promise.all([
        fetchElevesDeClasse(classeId),
        fetchObservationsClasse(classeId),
      ]);
      setEleves(elevs);
      setObservations(obs);
    } catch(e) { /* silent */ }
    setLoading(false);
  }, [user?.id]); // eslint-disable-line

  useEffect(() => { if (selClasse) loadData(selClasse); }, [selClasse, loadData]);

  const selectEleve = (eleve) => {
    setSelEleve(eleve);
    setFormContenu('');
    setFormType('general');
  };

  const handleSave = async () => {
    if (!formContenu.trim() || !selEleve) return;
    setSaving(true);
    setActionError('');
    try {
      const obs = await createObservation({
        enseignant_id: user.id,
        eleve_id:      selEleve.id,
        classe_id:     selClasse,
        contenu:       formContenu.trim(),
        type:          formType,
      });
      setObservations(prev => [obs, ...prev]);
      setFormContenu('');
      setFormType('general');
    } catch(e) { setActionError(e.message || 'Erreur lors de l\'enregistrement de l\'observation.'); }
    setSaving(false);
  };

  const handleDelete = async (obsId) => {
    try {
      await deleteObservation(obsId, user.id);
      setObservations(prev => prev.filter(o => o.id !== obsId));
      setConfirmDel(null);
    } catch(e) {
      setActionError(e.message || 'Erreur lors de la suppression.');
      setConfirmDel(null);
    }
  };

  const eleveObs  = selEleve ? observations.filter(o => o.eleve_id === selEleve.id) : [];
  const getLatest = (eleveId) => observations.find(o => o.eleve_id === eleveId);
  const obsCount  = (eleveId) => observations.filter(o => o.eleve_id === eleveId).length;

  return (
    <div style={S.page}>

      {/* Onglets classes */}
      <div style={S.topbar}>
        <div style={S.tabs}>
          {classes.map(c => (
            <motion.button key={c.id} style={S.tab(selClasse === c.id)} {...tapScale} onClick={() => setSelClasse(c.id)}>
              {c.nom}
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={S.loading}>Chargement…</div>
      ) : (
        <div style={S.grid}>

          {/* Liste d'élèves */}
          <div style={S.list}>
            <div style={S.listHeader}>Élèves — {eleves.length}</div>
            {eleves.length === 0 ? (
              <div style={{ padding:'24px 16px', color:'var(--a-fg-mid)', fontSize:13, textAlign:'center' }}>
                Aucun élève dans cette classe
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" key={selClasse}>
                {eleves.map(e => {
                  const latest = getLatest(e.id);
                  const count  = obsCount(e.id);
                  const hasObs = count > 0;
                  const ti     = latest ? typeInfo(latest.type) : null;
                  return (
                    <motion.div key={e.id} variants={fadeUp} style={S.listItem(selEleve?.id === e.id)} onClick={() => selectEleve(e)}>
                      <EleveAvatar eleve={e} size={34} fallbackStyle={S.avatar(hasObs)} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={S.listName}>{e.prenom} {e.nom}</div>
                        <div style={S.listSub}>
                          {latest
                            ? <><span style={{ color: ti.color }}>{ti.icon} {ti.label}</span> · {formatDate(latest.created_at)} · {count} obs.</>
                            : 'Aucune observation'
                          }
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Panneau d'édition */}
          {selEleve ? (
            <div style={S.panel}>
              <div style={S.panelTitle}>{selEleve.prenom} {selEleve.nom}</div>
              <div style={S.panelSub}>Nouvelle observation ou appréciation</div>

              {/* Type */}
              <div style={S.label}>Type</div>
              <div style={S.typeRow}>
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    style={S.typePill(formType === t.value, t.color, t.bg)}
                    onClick={() => setFormType(t.value)}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div style={S.label}>Observation</div>
              <textarea
                style={S.textarea}
                value={formContenu}
                onChange={e => setFormContenu(e.target.value)}
                placeholder="Rédigez votre observation, appréciation ou remarque ici…"
              />

              {actionError && <p style={{ color:'#ff453a', fontSize:13, marginTop:8 }}>{actionError}</p>}
              <div style={S.formBtns}>
                <button style={S.btnClear} onClick={() => { setFormContenu(''); setFormType('general'); }}>
                  Effacer
                </button>
                <button style={S.btnSave} onClick={handleSave} disabled={saving || !formContenu.trim()}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              {/* Historique */}
              {eleveObs.length > 0 && (
                <>
                  <div style={S.histSep}>
                    <div style={S.histSepLine}/>
                    <span>Historique ({eleveObs.length})</span>
                    <div style={S.histSepLine}/>
                  </div>
                  {eleveObs.map(obs => {
                    const ti    = typeInfo(obs.type);
                    const isOwn = obs.enseignant_id === user.id;
                    return (
                      <div key={obs.id} style={S.histItem}>
                        {isOwn && (
                          <button style={S.delBtn} title="Supprimer" onClick={() => setConfirmDel(obs)}>
                            <IconTrash />
                          </button>
                        )}
                        <div style={S.histHeader}>
                          <span style={S.histTypePill(ti.color, ti.bg)}>{ti.icon} {ti.label}</span>
                          {!isOwn && obs.enseignants && (
                            <span style={{ fontSize:11, color:'var(--a-fg-light)', fontStyle:'italic' }}>
                              par {obs.enseignants.prenom} {obs.enseignants.nom}
                            </span>
                          )}
                          <span style={S.histDate}>{formatDate(obs.created_at)}</span>
                        </div>
                        <div style={S.histText}>{obs.contenu}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div style={S.emptyPanel}>
              <div style={{ fontSize:36, marginBottom:12, opacity:.2 }}>✏️</div>
              <div style={{ fontSize:14, color:'var(--a-fg-mid)', lineHeight:1.6 }}>
                Sélectionnez un élève dans la liste<br/>pour rédiger une observation.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirmation suppression observation ── */}
      {confirmDel && (
        <div
          style={{
            position:'fixed', inset:0, zIndex:50,
            background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}
          onClick={() => setConfirmDel(null)}
        >
          <div
            style={{
              background:'var(--a-bg-card)', borderRadius:14, border:'1px solid var(--a-border)',
              padding:24, maxWidth:380, width:'90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🗑️</div>
              <div style={{ fontFamily:'var(--a-font-display)', fontSize:17, fontWeight:700, color:'var(--a-fg)', marginBottom:8 }}>
                Supprimer cette observation ?
              </div>
              <p style={{ fontSize:13, color:'var(--a-fg-mid)', lineHeight:1.5 }}>
                {typeInfo(confirmDel.type).icon} {typeInfo(confirmDel.type).label} — {formatDate(confirmDel.created_at)}<br/>
                Cette action est définitive.
              </p>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button
                style={{ padding:'8px 18px', borderRadius:20, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:13 }}
                onClick={() => setConfirmDel(null)}
              >
                Annuler
              </button>
              <button
                style={{ padding:'8px 20px', borderRadius:20, border:'none', background:'var(--a-red, #ff453a)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}
                onClick={() => handleDelete(confirmDel.id)}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
