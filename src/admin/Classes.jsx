import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePageAnimation } from '../shared/usePageAnimation';
import {
  fetchNiveauxScolaires, createNiveauScolaire, updateNiveauScolaire, deleteNiveauScolaire,
  fetchClasses, createClasse, updateClasse, deleteClasse, fetchEleves,
  updateEleve, updateEleveNiveauScolaire,
} from './supabaseAdmin';
import { motion, staggerContainer, fadeUp, cardHover } from '../animations';
import EleveAvatar from '../shared/EleveAvatar';

const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// CSS class strings — using dedicated classes from admin-overrides.css
const S = {
  page: 'min-h-full',
  breadcrumb: 'a-breadcrumb',
  breadcrumbSep: 'a-breadcrumb-sep',
  breadcrumbActive: 'a-breadcrumb-current',
  header: 'a-section-header',
  headerLeft: 'a-section-meta',
  addBtn: 'a-add-btn',

  // Niveau grid
  niveauGrid: 'cls-niveau-grid',
  niveauCard: 'cls-niveau-card',
  niveauName: 'cls-niveau-name',
  niveauFooter: 'cls-niveau-footer',
  addNiveauCard: 'cls-add-card',

  // Classe grid
  classeGrid: 'cls-classe-grid',
  classeCard: 'cls-classe-card',
  classeName: 'cls-classe-name',
  classeCount: 'cls-classe-count',
  classeFooter: 'cls-classe-footer',
  addClasseCard: 'cls-add-card',

  // Élève grid
  eleveGrid: 'cls-eleve-grid',
  eleveCard: 'cls-eleve-card',
  eleveTop: 'cls-eleve-top',
  eleveAvatar: 'a-avatar sm',
  eleveName: 'cls-eleve-name',
  eleveId: 'cls-eleve-id',
  eleveBody: 'cls-eleve-body',
  eleveRow: 'cls-eleve-row',
  eleveLabel: 'cls-eleve-label',

  // Modal
  overlay: 'a-modal-overlay',
  modal: 'a-modal',
  modalTitle: 'a-modal-title',
  field: 'a-modal-field',
  label: 'a-modal-label',
  input: 'a-modal-input',
  btnRow: 'a-modal-btns',
  btnCancel: 'a-modal-btn-cancel',
  btnSave: 'a-modal-btn-save',
  btnDanger: 'a-modal-btn-danger',
  empty: 'a-empty',
};

// Dynamic inline styles (functions returning objects)
const DS = {
  badge: (actif) => ({ padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(52,212,114,.15)' : 'rgba(240,85,85,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),
  actionBtn: (color) => ({ padding:'5px 12px', borderRadius:6, border:`1px solid ${color}22`, background:`${color}12`, color, fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontWeight:600 }),
};

export default function Classes() {
  const [niveaux, setNiveaux]     = useState([]);
  const [eleves, setEleves]       = useState([]);
  const [selNiveau, setSelNiveau] = useState(null);
  const [classes, setClasses]     = useState([]);
  const [selClasse, setSelClasse] = useState(null);
  const [selEleve, setSelEleve]   = useState(null);
  const [modal, setModal]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const pageRef = useRef(null);
  usePageAnimation(pageRef, [selNiveau?.id, selClasse?.id]);

  const loadAll = useCallback(async () => {
    try {
      const [ns, es] = await Promise.all([fetchNiveauxScolaires(), fetchEleves()]);
      setNiveaux(ns);
      setEleves(es);
    } catch(e) {}
  }, []);

  const loadClasses = useCallback(async (niveauId) => {
    try { setClasses(await fetchClasses(niveauId)); } catch(e) {}
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openNiveau = (n) => { setSelNiveau(n); setSelClasse(null); loadClasses(n.id); };
  const openClasse = (c) => setSelClasse(c);
  const goToNiveaux = () => { setSelNiveau(null); setSelClasse(null); setClasses([]); };
  const goToClasses = () => setSelClasse(null);

  const elevesDeClasse = (classeId) => eleves.filter(e => e.classe_id === classeId);

  // ─── VUE 1 : Liste des niveaux scolaires ──────────────────────────────────────
  if (!selNiveau) {
    return (
      <div ref={pageRef} className={S.page}>
        <div className={S.header}>
          <div className={S.headerLeft}>
            <span className="a-section-count">{niveaux.length} niveau{niveaux.length > 1 ? 'x' : ''} scolaire{niveaux.length > 1 ? 's' : ''}</span>
          </div>
          <button className={S.addBtn} onClick={() => setModal({ type:'niveau' })}>
            <IconPlus /> Ajouter un niveau
          </button>
        </div>

        {niveaux.length === 0 && (
          <div className={S.empty}>Aucun niveau créé.<br />Commencez par ajouter <strong>N1</strong>, <strong>N2</strong>…</div>
        )}

        <motion.div className={S.niveauGrid} variants={staggerContainer} initial="hidden" animate="visible">
          {niveaux.map(n => (
            <motion.div key={n.id} className={S.niveauCard}
              variants={fadeUp}
              {...cardHover}
              onClick={() => openNiveau(n)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,.2)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
              <div className={S.niveauName}>{n.nom}</div>
              <div className={S.niveauFooter}>
                <button className="a-action-btn blue" onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}>
                  <IconEdit /> Renommer
                </button>
                <button className="a-action-btn red" onClick={e => { e.stopPropagation(); setModal({ type:'confirm', data:n, target:'niveau' }); }}>
                  <IconTrash /> Supprimer
                </button>
              </div>
            </motion.div>
          ))}

          <motion.div className={S.addNiveauCard}
            variants={fadeUp}
            {...cardHover}
            onClick={() => setModal({ type:'niveau' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <div className="text-[32px] opacity-30">＋</div>
            <div>Ajouter un niveau</div>
          </motion.div>
        </motion.div>

        {modal?.type === 'niveau' && (
          <NiveauModal data={modal.data} loading={loading} onClose={() => setModal(null)}
            onSave={async (nom, ordre) => {
              setLoading(true);
              try {
                if (modal.data) await updateNiveauScolaire(modal.data.id, { nom, ordre });
                else await createNiveauScolaire(nom, ordre);
                await loadAll(); setModal(null);
              } catch(e) { alert(e.message); }
              setLoading(false);
            }} />
        )}

        {modal?.type === 'confirm' && modal.target === 'niveau' && (
          <ConfirmModal
            message={`Supprimer le niveau « ${modal.data.nom} » ? Toutes ses classes seront supprimées.`}
            onClose={() => setModal(null)}
            onConfirm={async () => {
              try {
                const classesNiveau = await fetchClasses(modal.data.id);
                const classesNiveauIds = new Set(classesNiveau.map(c => c.id));
                const elevesAssignes = eleves.filter(e => classesNiveauIds.has(e.classe_id));
                if (elevesAssignes.length > 0) {
                  await Promise.all(elevesAssignes.map(e => Promise.all([
                    updateEleve(e.id, { classe_id: null }),
                    updateEleveNiveauScolaire(e.id, null),
                  ])));
                }
                await deleteNiveauScolaire(modal.data.id);
                await loadAll();
                setModal(null);
              } catch(e) { alert(e.message); }
            }} />
        )}
      </div>
    );
  }

  // ─── VUE 2 : Classes du niveau ────────────────────────────────────────────────
  if (!selClasse) {
    return (
      <div className={S.page}>
        <div className={S.breadcrumb}>
          <span className="cursor-pointer flex items-center gap-1" onClick={goToNiveaux}>
            <IconBack /> Niveaux
          </span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbActive}>{selNiveau.nom}</span>
        </div>

        <div className={S.header}>
          <div className={S.headerLeft}>
            <div style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--a-gold)', letterSpacing:'-0.04em' }}>{selNiveau.nom}</div>
            <span className="a-section-count">{classes.length} classe{classes.length > 1 ? 's' : ''}</span>
          </div>
          <button className={S.addBtn} onClick={() => setModal({ type:'classe' })}>
            <IconPlus /> Ajouter une classe
          </button>
        </div>

        {classes.length === 0 && (
          <div className={S.empty}>
            Aucune classe dans ce niveau.<br />
            Ajoutez <strong>{selNiveau.nom}-1</strong>, <strong>{selNiveau.nom}-2</strong>…
          </div>
        )}

        <div className={S.classeGrid}>
          {classes.map(c => {
            const nb = elevesDeClasse(c.id).length;
            return (
              <div key={c.id} className={S.classeCard}
                onClick={() => openClasse(c)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.18)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div className={S.classeName}>{c.nom}</div>
                <div className={S.classeCount}>
                  <IconUsers />
                  {nb} élève{nb > 1 ? 's' : ''}
                </div>
                <div className={S.classeFooter}>
                  <button className="a-action-btn blue" onClick={e => { e.stopPropagation(); setModal({ type:'classe', data:c }); }}>
                    <IconEdit /> Renommer
                  </button>
                  <button className="a-action-btn red" onClick={e => { e.stopPropagation(); setModal({ type:'confirm', data:c, target:'classe' }); }}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}

          <div className={S.addClasseCard}
            onClick={() => setModal({ type:'classe' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <div className="text-[28px] opacity-30">＋</div>
            <div>Ajouter une classe</div>
          </div>
        </div>

        {modal?.type === 'classe' && (
          <ClasseModal data={modal.data} niveauNom={selNiveau.nom} loading={loading} onClose={() => setModal(null)}
            onSave={async (nom) => {
              setLoading(true);
              try {
                if (modal.data) await updateClasse(modal.data.id, nom);
                else await createClasse(selNiveau.id, nom);
                await loadClasses(selNiveau.id); setModal(null);
              } catch(e) { alert(e.message); }
              setLoading(false);
            }} />
        )}

        {modal?.type === 'confirm' && modal.target === 'classe' && (
          <ConfirmModal
            message={`Supprimer la classe « ${modal.data.nom} » ? Les élèves assignés seront désassignés.`}
            onClose={() => setModal(null)}
            onConfirm={async () => {
              try {
                const elevesAssignes = eleves.filter(e => e.classe_id === modal.data.id);
                if (elevesAssignes.length > 0) {
                  await Promise.all(elevesAssignes.map(e => Promise.all([
                    updateEleve(e.id, { classe_id: null }),
                    updateEleveNiveauScolaire(e.id, null),
                  ])));
                }
                await deleteClasse(modal.data.id);
                await loadClasses(selNiveau.id);
                await loadAll();
                setModal(null);
              } catch(e) { alert(e.message); }
            }} />
        )}
      </div>
    );
  }

  // ─── VUE 3 : Élèves de la classe ──────────────────────────────────────────────
  const elevesClasse = elevesDeClasse(selClasse.id);
  return (
    <div className={S.page}>
      <div className={S.breadcrumb}>
        <span className="cursor-pointer flex items-center gap-1" onClick={goToNiveaux}>
          <IconBack /> Niveaux
        </span>
        <span className={S.breadcrumbSep}>›</span>
        <span className="cursor-pointer" onClick={goToClasses}>{selNiveau.nom}</span>
        <span className={S.breadcrumbSep}>›</span>
        <span className={S.breadcrumbActive}>{selClasse.nom}</span>
      </div>

      <div className={S.header}>
        <div className={S.headerLeft}>
          <div style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--a-fg)', letterSpacing:'-0.04em' }}>{selClasse.nom}</div>
          <span className="a-section-count">{elevesClasse.length} élève{elevesClasse.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {elevesClasse.length === 0 && (
        <div className={S.empty}>
          Aucun élève dans cette classe.<br />
          Assignez des élèves depuis <strong>Gestion des élèves → fiche élève → Modifier</strong>.
        </div>
      )}

      <div className={S.eleveGrid}>
        {elevesClasse.map(e => {
          const identifiant = (e.identifiant || '').toUpperCase() || '—';
          const dateInscription = e.created_at
            ? new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
            : '—';
          return (
            <div key={e.id} className={S.eleveCard}
              onClick={() => setSelEleve(e)}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor='var(--a-gold)'; ev.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor=''; ev.currentTarget.style.transform=''; }}>
              <div className={S.eleveTop}>
                <EleveAvatar eleve={e} size={35} />
                <div>
                  <div className={S.eleveName}>{e.prenom} {e.nom}</div>
                  <div className={S.eleveId}>{identifiant}</div>
                </div>
              </div>
              <div className={S.eleveBody}>
                <div className={S.eleveRow}>
                  <span className={S.eleveLabel}>Statut</span>
                  <span style={DS.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span>
                </div>
                <div className={S.eleveRow}>
                  <span className={S.eleveLabel}>Inscrit le</span>
                  <span style={{ fontSize:12, color:'var(--a-fg)', fontWeight:500 }}>{dateInscription}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selEleve && <EleveInfoModal eleve={selEleve} onClose={() => setSelEleve(null)} />}
    </div>
  );
}

// ─── Modal Info Élève (lecture seule) ─────────────────────────────────────────
function EleveInfoModal({ eleve, onClose }) {
  const identifiant = (eleve.identifiant || '').toUpperCase() || '—';
  const dateInscription = eleve.created_at
    ? new Date(eleve.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
    : '—';

  const Row = ({ label, value }) => (
    <div className="flex flex-col gap-1 py-3 border-b border-a-border">
      <span className="text-[11px] font-bold text-a-fg-mid uppercase tracking-wide">{label}</span>
      <span className="text-sm" style={{ color: value ? 'var(--a-fg)' : 'var(--a-fg-light)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Non renseigné'}
      </span>
    </div>
  );

  return (
    <div className={S.overlay} onClick={onClose}>
      <div className={S.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-a-border">
          <EleveAvatar eleve={eleve} size={56} />
          <div>
            <div className="text-lg font-bold text-a-fg">{eleve.prenom} {eleve.nom}</div>
            <div className="text-[13px] text-a-gold font-bold font-a-mono mt-[3px]">{identifiant}</div>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-[980px] text-[11px] font-bold"
              style={{ background: eleve.actif ? 'rgba(52,212,114,.15)' : 'rgba(240,85,85,.15)', color: eleve.actif ? 'var(--a-green)' : 'var(--a-red)' }}>
              {eleve.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
        <div className="flex flex-col">
          <Row label="Inscrit le" value={dateInscription} />
          <Row label="Téléphone" value={eleve.telephone} />
          <Row label="Email de contact" value={eleve.email_contact} />
        </div>
        <div className="mt-5 flex justify-end">
          <button className={S.btnCancel} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Niveau ─────────────────────────────────────────────────────────────
function NiveauModal({ data, onSave, onClose, loading }) {
  const [nom, setNom]     = useState(data?.nom || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  return (
    <div className={S.overlay} onClick={onClose}>
      <div className={S.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className={S.modalTitle}>{data ? 'Renommer le niveau' : 'Nouveau niveau scolaire'}</div>
        <div className={S.field}>
          <label className={S.label}>Nom du niveau *</label>
          <input className={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="ex : N1, N2, Débutants…" autoFocus />
        </div>
        <div className={S.field}>
          <label className={S.label}>Ordre d'affichage</label>
          <input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} min={1} />
        </div>
        <div className={S.btnRow}>
          <button className={S.btnCancel} onClick={onClose}>Annuler</button>
          <button className={S.btnSave} style={{ opacity: (!nom.trim() || loading) ? .5 : 1 }} disabled={!nom.trim() || loading} onClick={() => onSave(nom.trim(), ordre)}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Classe ─────────────────────────────────────────────────────────────
function ClasseModal({ data, niveauNom, onSave, onClose, loading }) {
  const [nom, setNom] = useState(data?.nom || '');
  return (
    <div className={S.overlay} onClick={onClose}>
      <div className={S.modal} style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className={S.modalTitle}>{data ? 'Renommer la classe' : `Nouvelle classe — ${niveauNom}`}</div>
        <div className={S.field}>
          <label className={S.label}>Nom de la classe *</label>
          <input className={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder={`ex : ${niveauNom}-1, ${niveauNom}-2…`} autoFocus />
        </div>
        <div className={S.btnRow}>
          <button className={S.btnCancel} onClick={onClose}>Annuler</button>
          <button className={S.btnSave} style={{ opacity: (!nom.trim() || loading) ? .5 : 1 }} disabled={!nom.trim() || loading} onClick={() => onSave(nom.trim())}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Confirmation ───────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      // Erreur déjà notifiée par le caller (alert/toast). On garde la modale
      // ouverte pour que l'utilisateur puisse annuler explicitement ou retenter.
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={S.overlay} onClick={submitting ? undefined : onClose}>
      <div className={S.modal} style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="text-lg font-bold text-a-fg mb-3">⚠️ Confirmation</div>
        <p className="text-sm text-a-fg-mid mb-6 leading-loose">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button className={S.btnCancel} onClick={onClose} disabled={submitting}>Annuler</button>
          <button className={S.btnDanger} onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}
