import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchRetardsAbsences, createRetardAbsence, updateRetardAbsence, deleteRetardAbsence,
} from './supabaseEnseignant';
import { motion, staggerContainer, fadeUp, tapScale } from '../animations';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function getEleveName(eleves, eleveId) {
  const e = eleves.find(el => el.id === eleveId);
  return e ? `${e.prenom} ${e.nom}` : '—';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:       'min-h-full flex flex-col gap-5',
  topBar:     'flex items-center justify-between flex-wrap gap-3',
  classeTabs: 'flex gap-2 flex-wrap',
  classeTab:  (active) => ({
    padding: '7px 16px', borderRadius: 980,
    border: `1.5px solid ${active ? 'var(--a-gold)' : 'var(--a-border)'}`,
    background: active ? 'rgba(191,138,48,.12)' : 'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  }),
  btnRow:     'flex gap-2.5 flex-wrap',
  btnRetard:  'inline-flex items-center gap-[7px] py-2 px-[18px] rounded-full border-none bg-[rgba(240,180,41,0.18)] text-a-gold text-[13px] font-bold cursor-pointer whitespace-nowrap',
  btnAbsence: 'inline-flex items-center gap-[7px] py-2 px-[18px] rounded-full border-none bg-[rgba(255,69,58,0.12)] text-a-red text-[13px] font-bold cursor-pointer whitespace-nowrap',
  // Feedback
  feedback: (ok) => ({
    padding: '12px 18px', borderRadius: 'var(--a-radius-sm)',
    background: ok ? 'rgba(48,209,88,.1)' : 'rgba(255,69,58,.1)',
    border: `1px solid ${ok ? 'rgba(48,209,88,.25)' : 'rgba(255,69,58,.25)'}`,
    color: ok ? 'var(--a-green)' : 'var(--a-red)',
    fontSize: 13, fontWeight: 600,
  }),
  // Tableau
  tableWrap:   'bg-a-bg-card rounded-a border border-a-border overflow-hidden',
  tableHeader: 'grid grid-cols-[110px_1fr_90px_1fr_120px_80px] gap-0 border-b border-a-border px-5 py-2.5 text-[11px] font-bold text-a-fg-light uppercase tracking-wide',
  tableRow: (i) => ({ display: 'grid', gridTemplateColumns: '110px 1fr 90px 1fr 120px 80px', gap: 0, padding: '13px 20px', borderBottom: '1px solid var(--a-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,0.02)', alignItems: 'center' }),
  badgeRetard:  'inline-block py-[3px] px-2.5 rounded-[20px] bg-[rgba(240,180,41,0.15)] text-a-gold text-xs font-bold',
  badgeAbsence: 'inline-block py-[3px] px-2.5 rounded-[20px] bg-[rgba(255,69,58,0.1)] text-a-red text-xs font-bold',
  actionBtn: (danger) => ({ padding: '5px 10px', borderRadius: 6, border: `1px solid ${danger ? 'rgba(255,69,58,.3)' : 'var(--a-border)'}`, background: 'transparent', color: danger ? 'var(--a-red)' : 'var(--a-fg-mid)', fontSize: 12, cursor: 'pointer', marginLeft: 6 }),
  cell:    'text-[13px] text-a-fg overflow-hidden text-ellipsis whitespace-nowrap',
  cellMid: 'text-[13px] text-a-fg-mid overflow-hidden text-ellipsis whitespace-nowrap',
  empty:   'text-center py-[60px] px-5 text-a-fg-mid text-sm',
  // Stats
  statsRow: 'flex gap-3 flex-wrap',
  statCard: (color) => ({ background: 'var(--a-bg-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '14px 20px', flex: '1 1 120px', minWidth: 120 }),
  statNum:  (color) => ({ fontFamily: 'var(--a-font-display)', fontSize: 26, fontWeight: 800, color }),
  statLabel: 'text-xs text-a-fg-mid mt-0.5',
  // Modal
  overlay:    'fixed inset-0 bg-[rgba(0,0,0,.55)] flex items-center justify-center z-[1000] p-4',
  modal:      'bg-a-bg-card rounded-a p-7 w-full max-w-[440px] shadow-[0_24px_80px_rgba(0,0,0,.5)]',
  modalTitle: 'a-display text-[17px] font-bold text-a-fg mb-5',
  fieldGroup: 'mb-4',
  label:      'block text-xs font-semibold text-a-fg-mid mb-1.5',
  input:      'w-full bg-a-bg border border-a-border rounded-a-sm py-2 px-3 text-a-fg text-sm box-border',
  textarea:   'w-full bg-a-bg border border-a-border rounded-a-sm py-2 px-3 text-a-fg text-sm resize-y min-h-[80px] box-border font-[inherit]',
  typeToggleRow: 'flex gap-2.5 mb-4',
  typeBtn: (active, isRetard) => ({
    flex: 1, padding: '10px', borderRadius: 'var(--a-radius-sm)', border: `1.5px solid ${active ? (isRetard ? 'var(--a-gold)' : 'var(--a-red)') : 'var(--a-border)'}`,
    background: active ? (isRetard ? 'rgba(240,180,41,0.12)' : 'rgba(255,69,58,0.08)') : 'transparent',
    color: active ? (isRetard ? 'var(--a-gold)' : 'var(--a-red)') : 'var(--a-fg-mid)',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  }),
  modalBtns:  'flex gap-2.5 justify-end mt-6',
  btnCancel:  'py-2 px-5 rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer',
  btnSave:    'py-2 px-5 rounded-full border-none bg-a-gold text-white text-[13px] font-bold cursor-pointer shadow-[0_2px_10px_rgba(191,138,48,.3)]',
  btnDanger:  'py-2 px-5 rounded-full border-none bg-a-red text-white text-[13px] font-semibold cursor-pointer',
};

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EnseignantAbsences() {
  const user = getEnseignantUser();
  const [classes,    setClasses]    = useState([]);
  const [selClasse,  setSelClasse]  = useState(null);
  const [eleves,     setEleves]     = useState([]);
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null);  // { mode:'create'|'edit', type:'retard'|'absence', entry? }
  const [confirmDel, setConfirmDel] = useState(null);  // entry à supprimer
  const [saving,     setSaving]     = useState(false);
  const [feedback,   setFeedback]   = useState(null);  // { ok, msg }

  // Form state
  const [fType,       setFType]       = useState('retard');
  const [fEleve,      setFEleve]      = useState('');
  const [fDate,       setFDate]       = useState(todayStr());
  const [fCommentaire,setFCommentaire]= useState('');

  // ── Chargement initial : classes ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchMesClasses(user.id)
      .then(cs => { setClasses(cs); if (cs.length > 0) setSelClasse(cs[0].id); })
      .catch(() => {});
  }, []); // eslint-disable-line

  // ── Chargement élèves + entrées à chaque changement de classe ───────────────
  const load = useCallback(async () => {
    if (!selClasse) return;
    setLoading(true);
    try {
      const [els, ents] = await Promise.all([
        fetchElevesDeClasse(selClasse),
        fetchRetardsAbsences(selClasse),
      ]);
      setEleves(els);
      setEntries(ents);
    } catch {}
    setLoading(false);
  }, [selClasse]);

  useEffect(() => { load(); }, [load]);

  // ── Feedback auto-disparaissant ──────────────────────────────────────────────
  const showFeedback = (ok, msg) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  // ── Ouvrir modal ─────────────────────────────────────────────────────────────
  const openCreate = (type) => {
    setFType(type);
    setFEleve(eleves[0]?.id || '');
    setFDate(todayStr());
    setFCommentaire('');
    setModal({ mode: 'create', type });
  };

  const openEdit = (entry) => {
    setFType(entry.type);
    setFEleve(entry.eleve_id);
    setFDate(entry.date);
    setFCommentaire(entry.commentaire || '');
    setModal({ mode: 'edit', entry });
  };

  // ── Sauvegarder ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!fEleve || !fDate) return;
    setSaving(true);
    try {
      const data = {
        enseignant_id: user.id,
        classe_id:     selClasse,
        eleve_id:      fEleve,
        type:          fType,
        date:          fDate,
        commentaire:   fCommentaire.trim() || null,
      };
      if (modal.mode === 'create') {
        await createRetardAbsence(data);
        showFeedback(true, fType === 'retard' ? 'Retard enregistré.' : 'Absence enregistrée.');
      } else {
        await updateRetardAbsence(modal.entry.id, {
          type: fType, date: fDate, commentaire: fCommentaire.trim() || null,
        }, user.id);
        showFeedback(true, 'Entrée modifiée.');
      }
      setModal(null);
      await load();
    } catch {
      showFeedback(false, 'Une erreur est survenue.');
    }
    setSaving(false);
  };

  // ── Supprimer ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDel) return;
    setSaving(true);
    try {
      await deleteRetardAbsence(confirmDel.id, user.id);
      showFeedback(true, 'Entrée supprimée.');
      setConfirmDel(null);
      await load();
    } catch {
      showFeedback(false, 'Erreur lors de la suppression.');
    }
    setSaving(false);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const nbRetards  = entries.filter(e => e.type === 'retard').length;
  const nbAbsences = entries.filter(e => e.type === 'absence').length;

  return (
    <div className={S.page}>

      {/* Feedback bandeau */}
      {feedback && <div style={S.feedback(feedback.ok)}>{feedback.msg}</div>}

      {/* Top bar : onglets classes + boutons d'ajout */}
      <div className={S.topBar}>
        <div className={S.classeTabs}>
          {classes.map(c => (
            <motion.button key={c.id} style={S.classeTab(selClasse === c.id)}
              {...tapScale}
              onClick={() => setSelClasse(c.id)}>
              {c.nom}
            </motion.button>
          ))}
        </div>
        {selClasse && (
          <div className={S.btnRow}>
            <motion.button className={S.btnRetard} {...tapScale} onClick={() => openCreate('retard')}>
              ⏰ Ajouter un retard
            </motion.button>
            <motion.button className={S.btnAbsence} {...tapScale} onClick={() => openCreate('absence')}>
              🚫 Ajouter une absence
            </motion.button>
          </div>
        )}
      </div>

      {/* Stats */}
      {selClasse && entries.length > 0 && (
        <div className={S.statsRow}>
          <div style={S.statCard('var(--a-gold)')}>
            <div style={S.statNum('var(--a-gold)')}>{nbRetards}</div>
            <div className={S.statLabel}>Retard{nbRetards > 1 ? 's' : ''}</div>
          </div>
          <div style={S.statCard('var(--a-red)')}>
            <div style={S.statNum('var(--a-red)')}>{nbAbsences}</div>
            <div className={S.statLabel}>Absence{nbAbsences > 1 ? 's' : ''}</div>
          </div>
          <div style={S.statCard('var(--a-fg)')}>
            <div style={S.statNum('var(--a-fg)')}>{entries.length}</div>
            <div className={S.statLabel}>Total</div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {!selClasse ? (
        <div className={S.empty}>Sélectionne une classe pour voir les entrées.</div>
      ) : loading ? (
        <div className={S.empty}>Chargement...</div>
      ) : entries.length === 0 ? (
        <div className={S.empty}>
          <div className="text-[40px] mb-3">✅</div>
          Aucun retard ni absence enregistré pour cette classe.
        </div>
      ) : (
        <div className={S.tableWrap}>
          <div className={S.tableHeader}>
            <span>Date</span>
            <span>Élève</span>
            <span>Type</span>
            <span>Commentaire</span>
            <span>Par</span>
            <span>Actions</span>
          </div>
          {entries.map((e, i) => {
            const isOwn = e.enseignant_id === user.id;
            return (
              <div key={e.id} style={S.tableRow(i)}>
                <span className={S.cell}>{formatDate(e.date)}</span>
                <span className={S.cell}>{getEleveName(eleves, e.eleve_id)}</span>
                <span>
                  {e.type === 'retard'
                    ? <span className={S.badgeRetard}>⏰ Retard</span>
                    : <span className={S.badgeAbsence}>🚫 Absence</span>
                  }
                </span>
                <span className={S.cellMid}>{e.commentaire || '—'}</span>
                <span style={{ fontSize: 11, color: isOwn ? 'var(--a-fg-mid)' : 'var(--a-fg-light)', fontStyle: isOwn ? 'normal' : 'italic' }}>
                  {isOwn ? 'Moi' : (e.enseignants ? `${e.enseignants.prenom} ${e.enseignants.nom}` : '—')}
                </span>
                <span>
                  {isOwn ? (
                    <>
                      <button style={S.actionBtn(false)} onClick={() => openEdit(e)}>✏️</button>
                      <button style={S.actionBtn(true)}  onClick={() => setConfirmDel(e)}>🗑️</button>
                    </>
                  ) : (
                    <span className="text-[11px] text-a-fg-light">—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ajout / modification */}
      {modal && (
        <div className={S.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className={S.modal}>
            <div className={S.modalTitle}>
              {modal.mode === 'create' ? 'Nouvelle entrée' : 'Modifier l\'entrée'}
            </div>

            {/* Toggle type */}
            <div className={S.typeToggleRow}>
              <button style={S.typeBtn(fType === 'retard', true)} onClick={() => setFType('retard')}>
                ⏰ Retard
              </button>
              <button style={S.typeBtn(fType === 'absence', false)} onClick={() => setFType('absence')}>
                🚫 Absence
              </button>
            </div>

            {/* Élève (uniquement en création) */}
            {modal.mode === 'create' && (
              <div className={S.fieldGroup}>
                <label className={S.label}>Élève</label>
                <select className={S.input} value={fEleve} onChange={e => setFEleve(e.target.value)}>
                  {eleves.map(el => (
                    <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div className={S.fieldGroup}>
              <label className={S.label}>Date</label>
              <input type="date" className={S.input} value={fDate} onChange={e => setFDate(e.target.value)} />
            </div>

            {/* Commentaire */}
            <div className={S.fieldGroup}>
              <label className={S.label}>Commentaire (optionnel)</label>
              <textarea className={S.textarea} value={fCommentaire} onChange={e => setFCommentaire(e.target.value)}
                placeholder="Ex : arrivé 10 min en retard, justifié..." />
            </div>

            <div className={S.modalBtns}>
              <button className={S.btnCancel} onClick={() => setModal(null)} disabled={saving}>Annuler</button>
              <button className={S.btnSave} onClick={handleSave} disabled={saving || !fEleve || !fDate}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDel && (
        <div className={S.overlay} onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null); }}>
          <div className={`${S.modal} !max-w-[380px]`}>
            <div className="text-4xl text-center mb-3">⚠️</div>
            <div className={`${S.modalTitle} text-center`}>Supprimer cette entrée ?</div>
            <p className="text-center text-a-fg-mid text-sm mb-6">
              {confirmDel.type === 'retard' ? 'Retard' : 'Absence'} du {formatDate(confirmDel.date)}<br />
              pour {getEleveName(eleves, confirmDel.eleve_id)}
            </p>
            <div className={S.modalBtns}>
              <button className={S.btnCancel} onClick={() => setConfirmDel(null)} disabled={saving}>Annuler</button>
              <button className={S.btnDanger} onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
