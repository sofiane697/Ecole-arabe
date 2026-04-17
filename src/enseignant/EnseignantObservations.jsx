import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchObservationsClasse, createObservation, deleteObservation,
} from './supabaseEnseignant';
import { motion, staggerContainer, fadeUp, tapScale } from '../animations';

// ─── Constantes ───────────────────────────────────────────────────────────────
const TYPES = [
  { value: 'general',      label: 'Général',      color: 'var(--a-blue)'  },
  { value: 'comportement', label: 'Comportement',  color: 'var(--a-red)'   },
  { value: 'progression',  label: 'Progression',  color: 'var(--a-green)' },
];

function typeInfo(v) { return TYPES.find(t => t.value === v) || TYPES[0]; }

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function initials(e) {
  return `${(e.prenom || '')[0] || ''}${(e.nom || '')[0] || ''}`.toUpperCase();
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
  page:   'py-6',
  topbar: 'flex items-center gap-2.5 mb-5 flex-wrap',
  tabs:   'flex gap-1.5 flex-1 flex-wrap',
  tab: (a) => ({
    padding:'6px 16px', borderRadius:20, border:'1px solid var(--a-border)',
    background: a ? 'var(--a-gold)' : 'transparent',
    color: a ? '#000' : 'var(--a-fg-mid)',
    cursor:'pointer', fontSize:13, fontWeight:600, transition:'all .15s',
  }),
  grid: 'grid grid-cols-[280px_1fr] gap-4 items-start',
  // Student list
  list:       'bg-a-bg-card rounded-xl border border-a-border overflow-hidden',
  listHeader: 'py-[11px] px-4 border-b border-a-border text-[11px] font-bold text-a-fg-mid tracking-[1px] uppercase',
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
  listName: 'text-[13px] font-semibold text-a-fg',
  listSub:  'text-[11px] text-a-fg-mid mt-px',
  // Right panel
  panel:      'bg-a-bg-card rounded-xl border border-a-border p-6',
  panelTitle: 'a-display text-[17px] font-bold text-a-fg mb-0.5',
  panelSub:   'text-xs text-a-fg-mid mb-[22px]',
  label:      'block text-[11px] font-bold text-a-fg-mid mb-2 uppercase tracking-[0.5px]',
  typeRow:    'flex gap-2 flex-wrap mb-4',
  typePill: (active, color) => ({
    padding:'5px 14px', borderRadius:20, cursor:'pointer', fontSize:12, fontWeight:600,
    background: active ? color : 'transparent',
    border: `1.5px solid ${active ? color : 'var(--a-border)'}`,
    color: active ? '#fff' : 'var(--a-fg-mid)',
    transition:'all .12s',
  }),
  textarea: 'w-full min-h-[110px] bg-a-bg border border-a-border text-a-fg rounded-[10px] p-3 text-sm leading-[1.65] resize-y outline-none box-border font-[inherit]',
  formBtns:  'flex justify-end gap-2.5 mt-3.5',
  btnSave:   'py-2 px-5 rounded-[20px] border-none bg-a-gold text-black font-bold cursor-pointer text-[13px]',
  btnClear:  'py-2 px-[18px] rounded-[20px] border border-a-border bg-transparent text-a-fg-mid cursor-pointer text-[13px]',
  // History
  histSep:     'flex items-center gap-2.5 my-6 mb-4 text-[11px] font-bold text-a-fg-mid uppercase tracking-[1px]',
  histSepLine: 'flex-1 h-px bg-a-border',
  histItem:    'p-3.5 rounded-[10px] border border-a-border mb-2.5 relative',
  histHeader:  'flex items-center gap-2 mb-2',
  histTypePill: (color) => ({
    padding:'2px 10px', borderRadius:20, background:`${color}22`, color,
    fontSize:11, fontWeight:700,
  }),
  histDate: 'text-[11px] text-a-fg-mid ml-auto pr-7',
  histText: 'text-[13px] text-a-fg leading-[1.65]',
  delBtn:   'absolute top-2.5 right-2.5 p-[5px] rounded-md bg-transparent border-none text-a-fg-light cursor-pointer flex items-center',
  // Placeholder panel
  emptyPanel: 'bg-a-bg-card rounded-xl border border-a-border py-[60px] px-6 text-center',
  loading:    'text-center py-[60px] px-5 text-a-fg-mid text-sm',
};

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantObservations() {
  const user = getEnseignantUser();

  const [classes,      setClasses]      = useState([]);
  const [selClasse,    setSelClasse]    = useState(null);
  const [eleves,       setEleves]       = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [selEleve,     setSelEleve]     = useState(null);
  const [formContenu,  setFormContenu]  = useState('');
  const [formType,     setFormType]     = useState('general');
  const [saving,       setSaving]       = useState(false);
  const [actionError,  setActionError]  = useState('');

  // Load classes on mount
  useEffect(() => {
    if (!user?.id) return;
    fetchMesClasses(user.id)
      .then(cls => { setClasses(cls); if (cls.length) setSelClasse(cls[0].id); })
      .catch(() => {});
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
    } catch(e) { setActionError(e.message || 'Erreur lors de la suppression.'); }
  };

  const eleveObs   = selEleve ? observations.filter(o => o.eleve_id === selEleve.id) : [];
  const getLatest  = (eleveId) => observations.find(o => o.eleve_id === eleveId);
  const obsCount   = (eleveId) => observations.filter(o => o.eleve_id === eleveId).length;

  return (
    <div className={S.page}>

      {/* ── Onglets classes ── */}
      <div className={S.topbar}>
        <div className={S.tabs}>
          {classes.map(c => (
            <motion.button key={c.id} style={S.tab(selClasse === c.id)} {...tapScale} onClick={() => setSelClasse(c.id)}>
              {c.nom}
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className={S.loading}>Chargement…</div>
      ) : (
        <div className={S.grid}>

          {/* ── Liste d'élèves ── */}
          <div className={S.list}>
            <div className={S.listHeader}>Élèves — {eleves.length}</div>
            {eleves.length === 0 ? (
              <div className="py-6 px-4 text-a-fg-mid text-[13px] text-center">
                Aucun élève dans cette classe
              </div>
            ) : (<motion.div variants={staggerContainer} initial="hidden" animate="visible" key={selClasse}>{eleves.map(e => {
              const latest  = getLatest(e.id);
              const count   = obsCount(e.id);
              const hasObs  = count > 0;
              const ti      = latest ? typeInfo(latest.type) : null;
              return (
                <motion.div key={e.id} variants={fadeUp} style={S.listItem(selEleve?.id === e.id)} onClick={() => selectEleve(e)}>
                  <div style={S.avatar(hasObs)}>{initials(e)}</div>
                  <div className="flex-1 min-w-0">
                    <div className={S.listName}>{e.prenom} {e.nom}</div>
                    <div className={S.listSub}>
                      {latest
                        ? <><span style={{ color: ti.color }}>{ti.label}</span> · {formatDate(latest.created_at)} · {count} obs.</>
                        : 'Aucune observation'
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}</motion.div>)}
          </div>

          {/* ── Panneau d'édition ── */}
          {selEleve ? (
            <div className={S.panel}>
              <div className={S.panelTitle}>{selEleve.prenom} {selEleve.nom}</div>
              <div className={S.panelSub}>Nouvelle observation ou appréciation</div>

              {/* Type */}
              <div className={S.label}>Type</div>
              <div className={S.typeRow}>
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    style={S.typePill(formType === t.value, t.color)}
                    onClick={() => setFormType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className={S.label}>Observation</div>
              <textarea
                className={S.textarea}
                value={formContenu}
                onChange={e => setFormContenu(e.target.value)}
                placeholder="Rédigez votre observation, appréciation ou remarque ici…"
              />

              {actionError && <p className="text-[#ff453a] text-[13px] mt-2">{actionError}</p>}
              <div className={S.formBtns}>
                <button className={S.btnClear} onClick={() => { setFormContenu(''); setFormType('general'); }}>
                  Effacer
                </button>
                <button className={S.btnSave} onClick={handleSave} disabled={saving || !formContenu.trim()}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>

              {/* ── Historique ── */}
              {eleveObs.length > 0 && (
                <>
                  <div className={S.histSep}>
                    <div className={S.histSepLine}/>
                    <span>Historique ({eleveObs.length})</span>
                    <div className={S.histSepLine}/>
                  </div>
                  {eleveObs.map(obs => {
                    const ti = typeInfo(obs.type);
                    const isOwn = obs.enseignant_id === user.id;
                    return (
                      <div key={obs.id} className={S.histItem}>
                        {isOwn && (
                          <button className={S.delBtn} title="Supprimer" onClick={() => handleDelete(obs.id)}>
                            <IconTrash />
                          </button>
                        )}
                        <div className={S.histHeader}>
                          <span style={S.histTypePill(ti.color)}>{ti.label}</span>
                          {!isOwn && obs.enseignants && (
                            <span className="text-[11px] text-a-fg-light italic">
                              par {obs.enseignants.prenom} {obs.enseignants.nom}
                            </span>
                          )}
                          <span className={S.histDate}>{formatDate(obs.created_at)}</span>
                        </div>
                        <div className={S.histText}>{obs.contenu}</div>
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
    </div>
  );
}
