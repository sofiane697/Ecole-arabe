import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchNiveauxScolaires, createNiveauScolaire, updateNiveauScolaire, deleteNiveauScolaire,
  fetchClasses, createClasse, updateClasse, deleteClasse, fetchEleves,
  updateEleve, updateEleveNiveauScolaire,
} from './supabaseAdmin';
import { motion, staggerContainer, fadeUp, cardHover } from '../animations';

const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const S = {
  page: 'min-h-full',

  // Breadcrumb
  breadcrumb: 'flex items-center gap-1.5 mb-7 cursor-pointer text-a-fg-mid text-[13px] font-medium select-none',
  breadcrumbSep: 'text-a-border mx-0.5',
  breadcrumbActive: 'text-a-fg font-semibold',

  // Header
  header: 'flex items-center justify-between mb-7',
  headerLeft: 'flex flex-col gap-1',
  headerTitle: 'text-[26px] font-extrabold text-a-gold tracking-tight',
  headerSub: 'text-[13px] text-a-fg-mid',
  addBtn: 'inline-flex items-center gap-[7px] px-5 py-2.5 rounded-full border-none bg-a-gold text-white text-[13px] font-bold cursor-pointer whitespace-nowrap shadow-[0_2px_12px_rgba(191,138,48,.3)]',

  // Grille niveaux
  niveauGrid: 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4',
  niveauCard: 'bg-a-bg-card rounded-a border border-a-border pt-7 px-6 pb-[18px] cursor-pointer transition-[transform,box-shadow,border-color] duration-200 flex flex-col box-border min-h-[160px]',
  niveauName: 'text-[42px] font-black text-a-gold tracking-[-2px] leading-none flex-1',
  niveauStats: 'flex gap-4 mb-3.5',
  niveauStat: 'flex flex-col',
  niveauStatVal: 'text-lg font-extrabold text-a-fg',
  niveauStatLabel: 'text-[11px] text-a-fg-mid uppercase tracking-wide',
  niveauFooter: 'flex gap-2 pt-3.5 border-t border-a-border',
  addNiveauCard: 'bg-transparent rounded-a border-2 border-dashed border-a-border p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer text-a-fg-mid text-[13px] font-semibold transition-[border-color,color] duration-200 min-h-[160px] box-border',

  // Grille classes
  classeGrid: 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5',
  classeCard: 'bg-a-bg-card rounded-a border border-a-border pt-[22px] px-5 pb-4 cursor-pointer transition-[transform,box-shadow,border-color] duration-200 flex flex-col box-border min-h-[140px]',
  classeName: 'text-[28px] font-black text-a-fg tracking-tight leading-none flex-1',
  classeCount: 'text-[13px] text-a-fg-mid mt-1.5 mb-3.5 flex items-center gap-[5px]',
  classeFooter: 'flex gap-2 pt-3 border-t border-a-border',
  addClasseCard: 'bg-transparent rounded-a border-2 border-dashed border-a-border p-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-a-fg-mid text-[13px] font-semibold transition-[border-color,color] duration-200 min-h-[140px] box-border',

  // Cards élèves
  eleveGrid: 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5',
  eleveCard: 'bg-a-bg-card rounded-a border border-a-border px-5 py-[18px] flex flex-col gap-3',
  eleveTop: 'flex items-center gap-3.5',
  eleveAvatar: 'w-12 h-12 rounded-full bg-a-gold text-white flex items-center justify-center text-base font-extrabold shrink-0 tracking-tight',
  eleveName: 'text-[15px] font-bold text-a-fg leading-tight',
  eleveId: 'text-xs text-a-gold font-bold font-a-mono mt-[3px]',
  eleveBody: 'flex flex-col gap-1.5 pt-3 border-t border-a-border',
  eleveRow: 'flex justify-between items-center',
  eleveLabel: 'text-[11px] text-a-fg-mid uppercase tracking-wide',
  eleveVal: 'text-xs text-a-fg font-medium',
  badge: (actif) => ({ padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),

  // Actions
  actionBtn: (color) => ({ padding:'5px 12px', borderRadius:6, border:`1px solid ${color}20`, background:`${color}12`, color, fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontWeight:600 }),

  // Misc
  overlay: 'fixed inset-0 flex items-center justify-center z-[1000]',
  overlayBg: 'rgba(0,0,0,.6)',
  modal: 'bg-a-bg-card rounded-a p-7 w-full max-w-[420px] border border-a-border',
  modalTitle: 'font-a-display text-lg font-bold text-a-fg mb-5',
  field: 'mb-4',
  label: 'block text-[11px] font-bold text-a-fg-mid mb-1.5 uppercase tracking-wide',
  input: 'w-full px-3.5 py-2.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none box-border',
  btnRow: 'flex gap-2.5 justify-end mt-5',
  btnCancel: 'px-5 py-[9px] rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer',
  btnSave: 'px-5 py-[9px] rounded-full border-none bg-a-gold text-white text-[13px] font-semibold cursor-pointer',
  btnDanger: 'px-5 py-[9px] rounded-full border-none bg-a-red text-white text-[13px] font-semibold cursor-pointer',
  empty: 'text-center py-[60px] px-5 text-a-fg-mid text-sm leading-loose',
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

  // ─── VUE 1 : Liste des niveaux scolaires ────────────────────────────────────
  if (!selNiveau) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerSub}>{niveaux.length} niveau{niveaux.length > 1 ? 'x' : ''} scolaire{niveaux.length > 1 ? 's' : ''}</div>
          </div>
          <button style={S.addBtn} onClick={() => setModal({ type:'niveau' })}>
            <IconPlus /> Ajouter un niveau
          </button>
        </div>

        {niveaux.length === 0 && (
          <div style={S.empty}>Aucun niveau créé.<br />Commencez par ajouter <strong>N1</strong>, <strong>N2</strong>…</div>
        )}

        <motion.div style={S.niveauGrid} variants={staggerContainer} initial="hidden" animate="visible">
          {niveaux.map(n => {
            return (
              <motion.div key={n.id} style={S.niveauCard}
                variants={fadeUp}
                {...cardHover}
                onClick={() => openNiveau(n)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,.2)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={S.niveauName}>{n.nom}</div>
                <div style={S.niveauFooter}>
                  <button style={S.actionBtn('var(--a-blue)')} onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}>
                    <IconEdit /> Renommer
                  </button>
                  <button style={S.actionBtn('var(--a-red)')} onClick={e => { e.stopPropagation(); setModal({ type:'confirm', data:n, target:'niveau' }); }}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </motion.div>
            );
          })}

          <motion.div style={S.addNiveauCard}
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
                // Récupère toutes les classes de ce niveau depuis Supabase pour avoir les IDs exacts
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

  // ─── VUE 2 : Classes du niveau ──────────────────────────────────────────────
  if (!selClasse) {
    return (
      <div style={S.page}>
        {/* Breadcrumb */}
        <div style={S.breadcrumb} onClick={goToNiveaux}>
          <IconBack /> <span>Niveaux</span>
          <span style={S.breadcrumbSep}>›</span>
          <span style={S.breadcrumbActive}>{selNiveau.nom}</span>
        </div>

        <div style={S.header}>
          <div style={S.headerLeft}>
            <div style={S.headerTitle}>{selNiveau.nom}</div>
            <div style={S.headerSub}>{classes.length} classe{classes.length > 1 ? 's' : ''}</div>
          </div>
          <button style={S.addBtn} onClick={() => setModal({ type:'classe' })}>
            <IconPlus /> Ajouter une classe
          </button>
        </div>

        {classes.length === 0 && (
          <div style={S.empty}>
            Aucune classe dans ce niveau.<br />
            Ajoutez <strong>{selNiveau.nom}-1</strong>, <strong>{selNiveau.nom}-2</strong>…
          </div>
        )}

        <div style={S.classeGrid}>
          {classes.map(c => {
            const nb = elevesDeClasse(c.id).length;
            return (
              <div key={c.id} style={S.classeCard}
                onClick={() => openClasse(c)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.18)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={S.classeName}>{c.nom}</div>
                <div style={S.classeCount}>
                  <IconUsers />
                  {nb} élève{nb > 1 ? 's' : ''}
                </div>
                <div style={S.classeFooter}>
                  <button style={S.actionBtn('var(--a-blue)')} onClick={e => { e.stopPropagation(); setModal({ type:'classe', data:c }); }}>
                    <IconEdit /> Renommer
                  </button>
                  <button style={S.actionBtn('var(--a-red)')} onClick={e => { e.stopPropagation(); setModal({ type:'confirm', data:c, target:'classe' }); }}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}

          <div style={S.addClasseCard}
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

  // ─── VUE 3 : Élèves de la classe ────────────────────────────────────────────
  const elevesClasse = elevesDeClasse(selClasse.id);
  return (
    <div style={S.page}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-7 text-[13px] font-medium text-a-fg-mid select-none">
        <span className="cursor-pointer flex items-center gap-1" onClick={goToNiveaux}>
          <IconBack /> Niveaux
        </span>
        <span style={S.breadcrumbSep}>›</span>
        <span className="cursor-pointer" onClick={goToClasses}>{selNiveau.nom}</span>
        <span style={S.breadcrumbSep}>›</span>
        <span style={S.breadcrumbActive}>{selClasse.nom}</span>
      </div>

      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerTitle}>{selClasse.nom}</div>
          <div style={S.headerSub}>{elevesClasse.length} élève{elevesClasse.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {elevesClasse.length === 0 && (
        <div style={S.empty}>
          Aucun élève dans cette classe.<br />
          Assignez des élèves depuis <strong>Gestion des élèves → fiche élève → Modifier</strong>.
        </div>
      )}

      <div style={S.eleveGrid}>
        {elevesClasse.map(e => {
          const initiales = (e.prenom?.[0] || '') + (e.nom?.[0] || '');
          const identifiant = (e.identifiant || '').toUpperCase() || '—';
          const dateInscription = e.created_at
            ? new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
            : '—';
          return (
            <div key={e.id} style={{ ...S.eleveCard, cursor:'pointer' }}
              onClick={() => setSelEleve(e)}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor='var(--a-gold)'; ev.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor=''; ev.currentTarget.style.transform=''; }}>
              <div style={S.eleveTop}>
                <div style={S.eleveAvatar}>{initiales}</div>
                <div>
                  <div style={S.eleveName}>{e.prenom} {e.nom}</div>
                  <div style={S.eleveId}>{identifiant}</div>
                </div>
              </div>
              <div style={S.eleveBody}>
                <div style={S.eleveRow}>
                  <span style={S.eleveLabel}>Statut</span>
                  <span style={S.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span>
                </div>
                <div style={S.eleveRow}>
                  <span style={S.eleveLabel}>Inscrit le</span>
                  <span style={S.eleveVal}>{dateInscription}</span>
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
  const initiales = (eleve.prenom?.[0] || '') + (eleve.nom?.[0] || '');
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
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth:420 }} onClick={e => e.stopPropagation()}>
        {/* En-tête */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-a-border">
          <div className="w-14 h-14 rounded-full bg-a-gold text-white flex items-center justify-center text-xl font-extrabold shrink-0">
            {initiales}
          </div>
          <div>
            <div className="text-lg font-bold text-a-fg">{eleve.prenom} {eleve.nom}</div>
            <div className="text-[13px] text-a-gold font-bold font-a-mono mt-[3px]">{identifiant}</div>
            <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-[980px] text-[11px] font-bold" style={{ background: eleve.actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: eleve.actif ? 'var(--a-green)' : 'var(--a-red)' }}>
              {eleve.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Informations */}
        <div className="flex flex-col">
          <Row label="Inscrit le" value={dateInscription} />
          <Row label="Téléphone" value={eleve.telephone} />
          <Row label="Email de contact" value={eleve.email_contact} />
        </div>

        <div className="mt-5 flex justify-end">
          <button style={S.btnCancel} onClick={onClose}>Fermer</button>
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{data ? 'Renommer le niveau' : 'Nouveau niveau scolaire'}</div>
        <div style={S.field}>
          <label style={S.label}>Nom du niveau *</label>
          <input style={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="ex : N1, N2, Débutants…" autoFocus />
        </div>
        <div style={S.field}>
          <label style={S.label}>Ordre d'affichage</label>
          <input style={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} min={1} />
        </div>
        <div style={S.btnRow}>
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button style={{ ...S.btnSave, opacity: (!nom.trim() || loading) ? .5 : 1 }} disabled={!nom.trim() || loading} onClick={() => onSave(nom.trim(), ordre)}>
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{data ? 'Renommer la classe' : `Nouvelle classe — ${niveauNom}`}</div>
        <div style={S.field}>
          <label style={S.label}>Nom de la classe *</label>
          <input style={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder={`ex : ${niveauNom}-1, ${niveauNom}-2…`} autoFocus />
        </div>
        <div style={S.btnRow}>
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button style={{ ...S.btnSave, opacity: (!nom.trim() || loading) ? .5 : 1 }} disabled={!nom.trim() || loading} onClick={() => onSave(nom.trim())}>
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Confirmation ───────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth:400 }} onClick={e => e.stopPropagation()}>
        <div className="text-lg font-bold text-a-fg mb-3">⚠️ Confirmation</div>
        <p className="text-sm text-a-fg-mid mb-6 leading-loose">{message}</p>
        <div className="flex gap-2.5 justify-end">
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button style={S.btnDanger} onClick={() => { onConfirm(); onClose(); }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
