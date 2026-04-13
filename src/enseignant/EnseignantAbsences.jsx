import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchRetardsAbsences, createRetardAbsence, updateRetardAbsence, deleteRetardAbsence,
} from './supabaseEnseignant';

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
  page:       { minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 20 },
  topBar:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  classeTabs: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  classeTab:  (active) => ({
    padding: '7px 16px', borderRadius: 980,
    border: `1.5px solid ${active ? 'var(--a-gold)' : 'var(--a-border)'}`,
    background: active ? 'rgba(191,138,48,.12)' : 'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  }),
  btnRow:  { display: 'flex', gap: 10, flexWrap: 'wrap' },
  btnRetard: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 980, border: 'none', background: 'rgba(240,180,41,0.18)', color: 'var(--a-gold)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnAbsence: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 980, border: 'none', background: 'rgba(255,69,58,0.12)', color: 'var(--a-red)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  // Feedback
  feedback: (ok) => ({
    padding: '12px 18px', borderRadius: 'var(--a-radius-sm)',
    background: ok ? 'rgba(48,209,88,.1)' : 'rgba(255,69,58,.1)',
    border: `1px solid ${ok ? 'rgba(48,209,88,.25)' : 'rgba(255,69,58,.25)'}`,
    color: ok ? 'var(--a-green)' : 'var(--a-red)',
    fontSize: 13, fontWeight: 600,
  }),
  // Tableau
  tableWrap: { background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)', border: '1px solid var(--a-border)', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '110px 1fr 90px 1fr 120px 80px', gap: 0, borderBottom: '1px solid var(--a-border)', padding: '10px 20px', fontSize: 11, fontWeight: 700, color: 'var(--a-fg-light)', textTransform: 'uppercase', letterSpacing: '0.8px' },
  tableRow: (i) => ({ display: 'grid', gridTemplateColumns: '110px 1fr 90px 1fr 120px 80px', gap: 0, padding: '13px 20px', borderBottom: '1px solid var(--a-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(127,127,127,0.02)', alignItems: 'center' }),
  badgeRetard:  { display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: 'rgba(240,180,41,0.15)', color: 'var(--a-gold)', fontSize: 12, fontWeight: 700 },
  badgeAbsence: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,69,58,0.1)', color: 'var(--a-red)', fontSize: 12, fontWeight: 700 },
  actionBtn: (danger) => ({ padding: '5px 10px', borderRadius: 6, border: `1px solid ${danger ? 'rgba(255,69,58,.3)' : 'var(--a-border)'}`, background: 'transparent', color: danger ? 'var(--a-red)' : 'var(--a-fg-mid)', fontSize: 12, cursor: 'pointer', marginLeft: 6 }),
  cell: { fontSize: 13, color: 'var(--a-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cellMid: { fontSize: 13, color: 'var(--a-fg-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  empty: { textAlign: 'center', padding: '60px 20px', color: 'var(--a-fg-mid)', fontSize: 14 },
  // Stats
  statsRow: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  statCard: (color) => ({ background: 'var(--a-bg-card)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '14px 20px', flex: '1 1 120px', minWidth: 120 }),
  statNum:  (color) => ({ fontFamily: 'var(--a-font-display)', fontSize: 26, fontWeight: 800, color }),
  statLabel: { fontSize: 12, color: 'var(--a-fg-mid)', marginTop: 2 },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)', padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 24px 80px rgba(0,0,0,.5)' },
  modalTitle: { fontFamily: 'var(--a-font-display)', fontSize: 17, fontWeight: 700, color: 'var(--a-fg)', marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--a-fg-mid)', marginBottom: 6 },
  input: { width: '100%', background: 'var(--a-bg)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '9px 12px', color: 'var(--a-fg)', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', background: 'var(--a-bg)', border: '1px solid var(--a-border)', borderRadius: 'var(--a-radius-sm)', padding: '9px 12px', color: 'var(--a-fg)', fontSize: 14, resize: 'vertical', minHeight: 80, boxSizing: 'border-box', fontFamily: 'inherit' },
  typeToggleRow: { display: 'flex', gap: 10, marginBottom: 16 },
  typeBtn: (active, isRetard) => ({
    flex: 1, padding: '10px', borderRadius: 'var(--a-radius-sm)', border: `1.5px solid ${active ? (isRetard ? 'var(--a-gold)' : 'var(--a-red)') : 'var(--a-border)'}`,
    background: active ? (isRetard ? 'rgba(240,180,41,0.12)' : 'rgba(255,69,58,0.08)') : 'transparent',
    color: active ? (isRetard ? 'var(--a-gold)' : 'var(--a-red)') : 'var(--a-fg-mid)',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  }),
  modalBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 },
  btnCancel: { padding: '9px 20px', borderRadius: 980, border: '1px solid var(--a-border)', background: 'transparent', color: 'var(--a-fg-mid)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSave:   { padding: '9px 20px', borderRadius: 980, border: 'none', background: 'var(--a-gold)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(191,138,48,.3)' },
  btnDanger: { padding: '9px 20px', borderRadius: 980, border: 'none', background: 'var(--a-red)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
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
    <div style={S.page}>

      {/* Feedback bandeau */}
      {feedback && <div style={S.feedback(feedback.ok)}>{feedback.msg}</div>}

      {/* Top bar : onglets classes + boutons d'ajout */}
      <div style={S.topBar}>
        <div style={S.classeTabs}>
          {classes.map(c => (
            <button key={c.id} style={S.classeTab(selClasse === c.id)}
              onClick={() => setSelClasse(c.id)}>
              {c.nom}
            </button>
          ))}
        </div>
        {selClasse && (
          <div style={S.btnRow}>
            <button style={S.btnRetard} onClick={() => openCreate('retard')}>
              ⏰ Ajouter un retard
            </button>
            <button style={S.btnAbsence} onClick={() => openCreate('absence')}>
              🚫 Ajouter une absence
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      {selClasse && entries.length > 0 && (
        <div style={S.statsRow}>
          <div style={S.statCard('var(--a-gold)')}>
            <div style={S.statNum('var(--a-gold)')}>{nbRetards}</div>
            <div style={S.statLabel}>Retard{nbRetards > 1 ? 's' : ''}</div>
          </div>
          <div style={S.statCard('var(--a-red)')}>
            <div style={S.statNum('var(--a-red)')}>{nbAbsences}</div>
            <div style={S.statLabel}>Absence{nbAbsences > 1 ? 's' : ''}</div>
          </div>
          <div style={S.statCard('var(--a-fg)')}>
            <div style={S.statNum('var(--a-fg)')}>{entries.length}</div>
            <div style={S.statLabel}>Total</div>
          </div>
        </div>
      )}

      {/* Tableau */}
      {!selClasse ? (
        <div style={S.empty}>Sélectionne une classe pour voir les entrées.</div>
      ) : loading ? (
        <div style={S.empty}>Chargement...</div>
      ) : entries.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          Aucun retard ni absence enregistré pour cette classe.
        </div>
      ) : (
        <div style={S.tableWrap}>
          <div style={S.tableHeader}>
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
                <span style={S.cell}>{formatDate(e.date)}</span>
                <span style={S.cell}>{getEleveName(eleves, e.eleve_id)}</span>
                <span>
                  {e.type === 'retard'
                    ? <span style={S.badgeRetard}>⏰ Retard</span>
                    : <span style={S.badgeAbsence}>🚫 Absence</span>
                  }
                </span>
                <span style={S.cellMid}>{e.commentaire || '—'}</span>
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
                    <span style={{ fontSize: 11, color: 'var(--a-fg-light)' }}>—</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal ajout / modification */}
      {modal && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={S.modal}>
            <div style={S.modalTitle}>
              {modal.mode === 'create' ? 'Nouvelle entrée' : 'Modifier l\'entrée'}
            </div>

            {/* Toggle type */}
            <div style={S.typeToggleRow}>
              <button style={S.typeBtn(fType === 'retard', true)} onClick={() => setFType('retard')}>
                ⏰ Retard
              </button>
              <button style={S.typeBtn(fType === 'absence', false)} onClick={() => setFType('absence')}>
                🚫 Absence
              </button>
            </div>

            {/* Élève (uniquement en création) */}
            {modal.mode === 'create' && (
              <div style={S.fieldGroup}>
                <label style={S.label}>Élève</label>
                <select style={S.input} value={fEleve} onChange={e => setFEleve(e.target.value)}>
                  {eleves.map(el => (
                    <option key={el.id} value={el.id}>{el.prenom} {el.nom}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={fDate} onChange={e => setFDate(e.target.value)} />
            </div>

            {/* Commentaire */}
            <div style={S.fieldGroup}>
              <label style={S.label}>Commentaire (optionnel)</label>
              <textarea style={S.textarea} value={fCommentaire} onChange={e => setFCommentaire(e.target.value)}
                placeholder="Ex : arrivé 10 min en retard, justifié..." />
            </div>

            <div style={S.modalBtns}>
              <button style={S.btnCancel} onClick={() => setModal(null)} disabled={saving}>Annuler</button>
              <button style={S.btnSave} onClick={handleSave} disabled={saving || !fEleve || !fDate}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmDel && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null); }}>
          <div style={{ ...S.modal, maxWidth: 380 }}>
            <div style={{ fontSize: 36, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <div style={{ ...S.modalTitle, textAlign: 'center' }}>Supprimer cette entrée ?</div>
            <p style={{ textAlign: 'center', color: 'var(--a-fg-mid)', fontSize: 14, marginBottom: 24 }}>
              {confirmDel.type === 'retard' ? 'Retard' : 'Absence'} du {formatDate(confirmDel.date)}<br />
              pour {getEleveName(eleves, confirmDel.eleve_id)}
            </p>
            <div style={S.modalBtns}>
              <button style={S.btnCancel} onClick={() => setConfirmDel(null)} disabled={saving}>Annuler</button>
              <button style={S.btnDanger} onClick={handleDelete} disabled={saving}>
                {saving ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
