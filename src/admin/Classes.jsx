import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchNiveauxScolaires, createNiveauScolaire, updateNiveauScolaire, deleteNiveauScolaire,
  fetchClasses, createClasse, updateClasse, deleteClasse, fetchEleves,
} from './supabaseAdmin';

const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

const S = {
  page: { minHeight: '100%' },

  // Breadcrumb
  breadcrumb: { display:'flex', alignItems:'center', gap:6, marginBottom:28, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:13, fontWeight:500, userSelect:'none' },
  breadcrumbSep: { color:'var(--a-border)', margin:'0 2px' },
  breadcrumbActive: { color:'var(--a-fg)', fontWeight:600 },

  // Header
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 },
  headerLeft: { display:'flex', flexDirection:'column', gap:4 },
  headerTitle: { fontSize:26, fontWeight:800, color:'var(--a-gold)', letterSpacing:'-0.5px' },
  headerSub: { fontSize:13, color:'var(--a-fg-mid)' },
  addBtn: { display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(191,138,48,.3)' },

  // Grille niveaux
  niveauGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 },
  niveauCard: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:'28px 24px 18px', cursor:'pointer', transition:'transform .2s, box-shadow .2s, border-color .2s', display:'flex', flexDirection:'column', boxSizing:'border-box', minHeight:160 },
  niveauName: { fontSize:42, fontWeight:900, color:'var(--a-gold)', letterSpacing:'-2px', lineHeight:1, flex:1 },
  niveauStats: { display:'flex', gap:16, marginBottom:14 },
  niveauStat: { display:'flex', flexDirection:'column' },
  niveauStatVal: { fontSize:18, fontWeight:800, color:'var(--a-fg)' },
  niveauStatLabel: { fontSize:11, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'.5px' },
  niveauFooter: { display:'flex', gap:8, paddingTop:14, borderTop:'1px solid var(--a-border)' },
  addNiveauCard: { background:'transparent', borderRadius:'var(--a-radius)', border:'2px dashed var(--a-border)', padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, transition:'border-color .2s, color .2s', minHeight:160, boxSizing:'border-box' },

  // Grille classes
  classeGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 },
  classeCard: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:'22px 20px 16px', cursor:'pointer', transition:'transform .2s, box-shadow .2s, border-color .2s', display:'flex', flexDirection:'column', boxSizing:'border-box', minHeight:140 },
  classeName: { fontSize:28, fontWeight:900, color:'var(--a-fg)', letterSpacing:'-1px', lineHeight:1, flex:1 },
  classeCount: { fontSize:13, color:'var(--a-fg-mid)', marginTop:6, marginBottom:14, display:'flex', alignItems:'center', gap:5 },
  classeFooter: { display:'flex', gap:8, paddingTop:12, borderTop:'1px solid var(--a-border)' },
  addClasseCard: { background:'transparent', borderRadius:'var(--a-radius)', border:'2px dashed var(--a-border)', padding:20, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, transition:'border-color .2s, color .2s', minHeight:140, boxSizing:'border-box' },

  // Cards élèves
  eleveGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 },
  eleveCard: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:'18px 20px', display:'flex', flexDirection:'column', gap:12 },
  eleveTop: { display:'flex', alignItems:'center', gap:14 },
  eleveAvatar: { width:48, height:48, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, flexShrink:0, letterSpacing:'-0.5px' },
  eleveName: { fontSize:15, fontWeight:700, color:'var(--a-fg)', lineHeight:1.2 },
  eleveId: { fontSize:12, color:'var(--a-gold)', fontWeight:700, fontFamily:'monospace', marginTop:3 },
  eleveBody: { display:'flex', flexDirection:'column', gap:6, paddingTop:12, borderTop:'1px solid var(--a-border)' },
  eleveRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  eleveLabel: { fontSize:11, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'.5px' },
  eleveVal: { fontSize:12, color:'var(--a-fg)', fontWeight:500 },
  badge: (actif) => ({ padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),

  // Actions
  actionBtn: (color) => ({ padding:'5px 12px', borderRadius:6, border:`1px solid ${color}20`, background:`${color}12`, color, fontSize:11, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontWeight:600 }),

  // Misc
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', padding:28, width:'100%', maxWidth:420, border:'1px solid var(--a-border)' },
  modalTitle: { fontSize:18, fontWeight:700, color:'var(--a-fg)', marginBottom:20 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' },
  input: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  btnRow: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 },
  btnCancel: { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnDanger: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-red)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  empty: { textAlign:'center', padding:'60px 20px', color:'var(--a-fg-mid)', fontSize:14, lineHeight:2 },
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
  const nbElevesNiveau = (niveauId) => {
    // On compte les élèves dont la classe appartient à ce niveau
    const classesIds = classes.map(c => c.id);
    return eleves.filter(e => classesIds.includes(e.classe_id)).length;
  };

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

        <div style={S.niveauGrid}>
          {niveaux.map(n => {
            // Compte les classes de ce niveau pour afficher dans la carte
            // (on doit charger toutes les classes pour ça — simplifié ici)
            return (
              <div key={n.id} style={S.niveauCard}
                onClick={() => openNiveau(n)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,.2)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={S.niveauName}>{n.nom}</div>
                <div style={S.niveauFooter}>
                  <button style={S.actionBtn('var(--a-blue)')} onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}>
                    <IconEdit /> Renommer
                  </button>
                  <button style={S.actionBtn('var(--a-red)')} onClick={e => { e.stopPropagation(); setModal({ type:'confirm', data:n, target:'niveau' }); }}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}

          <div style={S.addNiveauCard}
            onClick={() => setModal({ type:'niveau' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <div style={{ fontSize:32, opacity:.3 }}>＋</div>
            <div>Ajouter un niveau</div>
          </div>
        </div>

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
              try { await deleteNiveauScolaire(modal.data.id); await loadAll(); setModal(null); }
              catch(e) { alert(e.message); }
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
            <div style={{ fontSize:28, opacity:.3 }}>＋</div>
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
              try { await deleteClasse(modal.data.id); await loadClasses(selNiveau.id); await loadAll(); setModal(null); }
              catch(e) { alert(e.message); }
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
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:28, fontSize:13, fontWeight:500, color:'var(--a-fg-mid)', userSelect:'none' }}>
        <span style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:4 }} onClick={goToNiveaux}>
          <IconBack /> Niveaux
        </span>
        <span style={S.breadcrumbSep}>›</span>
        <span style={{ cursor:'pointer' }} onClick={goToClasses}>{selNiveau.nom}</span>
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
    <div style={{ display:'flex', flexDirection:'column', gap:4, padding:'12px 0', borderBottom:'1px solid var(--a-border)' }}>
      <span style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</span>
      <span style={{ fontSize:14, color: value ? 'var(--a-fg)' : 'var(--a-fg-light)', fontStyle: value ? 'normal' : 'italic' }}>
        {value || 'Non renseigné'}
      </span>
    </div>
  );

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth:420 }} onClick={e => e.stopPropagation()}>
        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, paddingBottom:20, borderBottom:'1px solid var(--a-border)' }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, flexShrink:0 }}>
            {initiales}
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, color:'var(--a-fg)' }}>{eleve.prenom} {eleve.nom}</div>
            <div style={{ fontSize:13, color:'var(--a-gold)', fontWeight:700, fontFamily:'monospace', marginTop:3 }}>{identifiant}</div>
            <span style={{ display:'inline-block', marginTop:6, padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: eleve.actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: eleve.actif ? 'var(--a-green)' : 'var(--a-red)' }}>
              {eleve.actif ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>

        {/* Informations */}
        <div style={{ display:'flex', flexDirection:'column' }}>
          <Row label="Inscrit le" value={dateInscription} />
          <Row label="Téléphone" value={eleve.telephone} />
          <Row label="Email de contact" value={eleve.email_contact} />
        </div>

        <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
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
        <div style={{ fontSize:18, fontWeight:700, color:'var(--a-fg)', marginBottom:12 }}>⚠️ Confirmation</div>
        <p style={{ fontSize:14, color:'var(--a-fg-mid)', marginBottom:24, lineHeight:1.7 }}>{message}</p>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button style={S.btnDanger} onClick={() => { onConfirm(); onClose(); }}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
