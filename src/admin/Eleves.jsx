import React, { useState, useEffect, useCallback } from 'react';
import { fetchEleves, createEleve, updateEleve, updateEleveNiveauScolaire, deleteEleve, updateEleveActif, resetElevePassword, fetchEleveProgression, fetchModules, fetchNiveaux, fetchAllClasses, fetchNiveauxScolaires } from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';

// ─── Formatage des noms ──────────────────────────────────────────────────────
const fmtPrenom = (s) => s.trim() ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s;
const fmtNom    = (s) => s.trim().toUpperCase();

// ─── Icônes ──────────────────────────────────────────────────────────────────
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconBack = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100%' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  headerTitle: { fontSize:14, color:'var(--a-fg-mid)', fontWeight:500 },
  addBtn: { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', transition:'opacity .2s' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 },
  card: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:18, display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'transform .15s var(--a-ease-out), box-shadow .15s' },
  avatar: (name) => ({ width:42, height:42, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, flexShrink:0, textTransform:'uppercase', letterSpacing:'-0.5px' }),
  info: { flex:1, minWidth:0 },
  name: { fontWeight:600, color:'var(--a-fg)', fontSize:14 },
  email: { fontSize:12, color:'var(--a-fg-mid)', marginTop:2 },
  badge: (active) => ({ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: active ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.12)', color: active ? 'var(--a-green)' : 'var(--a-red)' }),
  date: { fontSize:11, color:'var(--a-fg-light)', marginTop:4 },
  // Modal
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', padding:28, width:'100%', maxWidth:460, border:'1px solid var(--a-border)' },
  modalTitle: { fontSize:18, fontWeight:600, color:'var(--a-fg)', marginBottom:20 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:12, fontWeight:600, color:'var(--a-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' },
  input: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  btnRow: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 },
  btnCancel: { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  error: { color:'var(--a-red)', fontSize:13, marginTop:8 },
  empty: { textAlign:'center', padding:'48px 20px', color:'var(--a-fg-mid)', fontSize:14 },
  // Barre recherche / filtres
  toolbar: { display:'flex', gap:10, alignItems:'center', marginBottom:20, flexWrap:'wrap' },
  searchWrap: { position:'relative', flex:'1', minWidth:200 },
  searchInput: { width:'100%', padding:'9px 14px 9px 36px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none', boxSizing:'border-box' },
  searchIcon: { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--a-fg-light)', pointerEvents:'none' },
  filterBtn: (active) => ({ padding:'8px 16px', borderRadius:980, border:'1px solid var(--a-border)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s', background: active ? 'var(--a-gold)' : 'transparent', color: active ? '#fff' : 'var(--a-fg-mid)', borderColor: active ? 'var(--a-gold)' : 'var(--a-border)' }),
  sortSelect: { padding:'8px 12px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg-mid)', fontSize:12, fontWeight:600, cursor:'pointer', outline:'none' },
  // Detail
  breadcrumb: { display:'flex', alignItems:'center', gap:8, marginBottom:24, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:14, fontWeight:500 },
  detailHeader: { display:'flex', alignItems:'center', gap:16, marginBottom:28, padding:20, background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)' },
  detailAvatar: { width:56, height:56, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700 },
  detailName: { fontSize:20, fontWeight:700, color:'var(--a-fg)' },
  detailEmail: { fontSize:13, color:'var(--a-fg-mid)', marginTop:2 },
  progressCard: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', padding:16, marginBottom:10 },
  progressTitle: { fontWeight:600, color:'var(--a-fg)', fontSize:14, marginBottom:8 },
  progressBar: { height:6, borderRadius:3, background:'var(--a-border)', overflow:'hidden', marginTop:8 },
  progressFill: (pct) => ({ height:'100%', borderRadius:3, background: pct >= 100 ? 'var(--a-green)' : 'var(--a-gold)', width:`${pct}%`, transition:'width .4s var(--a-ease-out)' }),
  progressText: { fontSize:12, color:'var(--a-fg-mid)', marginTop:6, display:'flex', justifyContent:'space-between' },
  toggleBtn: { padding:'8px 16px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:12, fontWeight:600, cursor:'pointer', marginLeft:'auto' },
  exportBtn: { display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' },
};

export default function Eleves() {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [progression, setProgression] = useState([]);
  const [modules, setModules] = useState([]);
  const [niveauxMap, setNiveauxMap] = useState({});
  const [resetResult, setResetResult] = useState(null);   // { identifiant, tempPassword }
  const [search, setSearch]       = useState('');
  const [filterActif, setFilterActif] = useState('tous'); // 'tous' | 'actif' | 'inactif'
  const [sortBy, setSortBy]       = useState('date');     // 'date' | 'nom'
  const [confirmReset, setConfirmReset] = useState(null);  // élève en attente de confirmation reset
  const [confirmDelete, setConfirmDelete] = useState(null); // élève en attente de confirmation suppression
  const [editEleve, setEditEleve] = useState(null);       // élève en cours d'édition
  const [editForm, setEditForm] = useState({ prenom:'', nom:'', telephone:'', email_contact:'', classe_id:'' });
  const [editLoading, setEditLoading] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);

  const loadEleves = useCallback(async () => {
    try { setEleves(await fetchEleves()); } catch(e) { console.error(e); }
  }, []);

  useEffect(() => { loadEleves(); }, [loadEleves]);

  useEffect(() => {
    Promise.all([fetchAllClasses(), fetchNiveauxScolaires()])
      .then(([cs, ns]) => { setAllClasses(cs); setNiveauxScolaires(ns); })
      .catch(() => {});
  }, []);

  // ─── Voir le détail d'un élève ───────────────────────────────────────
  const openEleve = async (eleve) => {
    setSelectedEleve(eleve);
    setModules([]);
    setProgression([]);
    setNiveauxMap({});
    try {
      const mods = await fetchModules();
      setModules(mods);
      const [prog, nivMap] = await Promise.all([
        fetchEleveProgression(eleve.id).catch(() => []),
        Promise.all(mods.map(async (m) => {
          try { return [m.id, await fetchNiveaux(m.id)]; } catch { return [m.id, []]; }
        })).then(entries => Object.fromEntries(entries)),
      ]);
      setProgression(prog);
      setNiveauxMap(nivMap);
    } catch(e) { console.error(e); }
  };

  const handleToggleActif = async (eleve) => {
    try {
      await updateEleveActif(eleve.id, !eleve.actif);
      await loadEleves();
      if (selectedEleve?.id === eleve.id) setSelectedEleve({ ...eleve, actif: !eleve.actif });
    } catch(e) { alert(e.message); }
  };

  const handleResetPassword = (eleve) => {
    // Ouvre la modale de confirmation — pas d'action immédiate
    setConfirmReset(eleve);
  };

  const handleOpenEdit = (eleve) => {
    setEditEleve(eleve);
    setEditForm({ prenom: eleve.prenom || '', nom: eleve.nom || '', telephone: eleve.telephone || '', email_contact: eleve.email_contact || '', classe_id: eleve.classe_id || '' });
  };

  const handleSaveEdit = async () => {
    if (!editForm.prenom.trim() || !editForm.nom.trim()) return;
    setEditLoading(true);
    try {
      const cleanPrenom = fmtPrenom(editForm.prenom);
      const cleanNom    = fmtNom(editForm.nom);
      // Dériver niveau_scolaire_id depuis la classe sélectionnée
      const classeId = editForm.classe_id || null;
      const niveauScolaireId = classeId ? (allClasses.find(c => c.id === classeId)?.niveau_id || null) : null;
      await Promise.all([
        updateEleve(editEleve.id, {
          prenom: cleanPrenom,
          nom: cleanNom,
          telephone: editForm.telephone.trim() || null,
          email_contact: editForm.email_contact.trim() || null,
          classe_id: classeId,
        }),
        updateEleveNiveauScolaire(editEleve.id, niveauScolaireId),
      ]);
      const updated = { ...editEleve, prenom: cleanPrenom, nom: cleanNom, telephone: editForm.telephone.trim() || null, email_contact: editForm.email_contact.trim() || null, classe_id: classeId, niveau_scolaire_id: niveauScolaireId };
      setSelectedEleve(updated);
      setEleves(prev => prev.map(e => e.id === updated.id ? updated : e));
      setEditEleve(null);
    } catch(e) { alert(e.message); }
    finally { setEditLoading(false); }
  };

  const handleConfirmDelete = async () => {
    const eleve = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteEleve(eleve.id);
      setEleves(prev => prev.filter(e => e.id !== eleve.id));
      setSelectedEleve(null); // retour à la liste
    } catch(e) { alert(e.message); }
  };

  const handleConfirmReset = async () => {
    const eleve = confirmReset;
    setConfirmReset(null);
    const tempPwd = generateTempPassword();
    try {
      await resetElevePassword(eleve.id, tempPwd);
      const identifiant = (eleve.identifiant || '').toUpperCase();
      setResetResult({ identifiant, tempPassword: tempPwd, prenom: eleve.prenom, nom: eleve.nom });
    } catch(e) { alert(e.message); }
  };

  // ─── VUE DÉTAIL ──────────────────────────────────────────────────────
  if (selectedEleve) {
    const initials = (fmtPrenom(selectedEleve.prenom || '')?.[0] || '') + (fmtNom(selectedEleve.nom || '')?.[0] || '');
    return (
      <div style={S.page}>
        <div style={S.breadcrumb} onClick={() => setSelectedEleve(null)}>
          <IconBack /> <span>Retour à la liste</span>
        </div>

        <div style={S.detailHeader}>
          <div style={S.detailAvatar}>{initials}</div>
          <div style={{ flex:1 }}>
            <div style={S.detailName}>{fmtPrenom(selectedEleve.prenom || '')} {fmtNom(selectedEleve.nom || '')}</div>
            <div style={S.detailEmail}>ID : {(selectedEleve.identifiant || '').toUpperCase()}</div>
            {(selectedEleve.telephone || selectedEleve.email_contact || selectedEleve.classe_id) && (
              <div style={{ display:'flex', gap:16, marginTop:6, flexWrap:'wrap' }}>
                {selectedEleve.classe_id && (() => {
                  const cl = allClasses.find(c => c.id === selectedEleve.classe_id);
                  const nv = cl ? niveauxScolaires.find(n => n.id === cl.niveau_id) : null;
                  return cl ? (
                    <span style={{ fontSize:12, color:'var(--a-gold)', fontWeight:600 }}>
                      🏫 {nv ? `${nv.nom} — ` : ''}{cl.nom}
                    </span>
                  ) : null;
                })()}
                {selectedEleve.telephone && (
                  <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>
                    📞 {selectedEleve.telephone}
                  </span>
                )}
                {selectedEleve.email_contact && (
                  <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>
                    ✉️ {selectedEleve.email_contact}
                  </span>
                )}
              </div>
            )}
          </div>
          <span style={S.badge(selectedEleve.actif)}>{selectedEleve.actif ? 'Actif' : 'Inactif'}</span>
          <button style={S.toggleBtn} onClick={() => handleToggleActif(selectedEleve)}>
            {selectedEleve.actif ? 'Désactiver' : 'Activer'}
          </button>
          <button
            style={{ ...S.toggleBtn, marginLeft:0, color:'var(--a-blue)', borderColor:'var(--a-blue)' }}
            onClick={() => handleOpenEdit(selectedEleve)}>
            ✏️ Modifier
          </button>
          <button
            style={{ ...S.toggleBtn, marginLeft:0, color:'var(--a-gold)', borderColor:'var(--a-gold)' }}
            onClick={() => handleResetPassword(selectedEleve)}>
            🔑 Réinitialiser le mot de passe
          </button>
          <button
            style={{ ...S.toggleBtn, marginLeft:0, color:'var(--a-red)', borderColor:'var(--a-red)' }}
            onClick={() => setConfirmDelete(selectedEleve)}>
            🗑 Supprimer
          </button>
        </div>

        {/* ─── Modal modifier nom/prénom ─── */}
        {editEleve && (
          <div style={S.overlay} onClick={() => setEditEleve(null)}>
            <div style={{ ...S.modal, maxWidth:400, maxHeight:'85vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
              <div style={S.modalTitle}>✏️ Modifier l'élève</div>
              <div style={S.field}>
                <label style={S.label}>Prénom</label>
                <input
                  style={S.input}
                  value={editForm.prenom}
                  onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                  placeholder="Prénom"
                  autoFocus
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Nom</label>
                <input
                  style={S.input}
                  value={editForm.nom}
                  onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom"
                />
              </div>
              <div style={{ height:1, background:'var(--a-border)', margin:'8px 0 16px' }} />
              <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12 }}>Contact (optionnel)</div>
              <div style={S.field}>
                <label style={S.label}>Téléphone</label>
                <input
                  style={S.input}
                  value={editForm.telephone}
                  onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="ex : 06 12 34 56 78"
                  type="tel"
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Email de contact</label>
                <input
                  style={S.input}
                  value={editForm.email_contact}
                  onChange={e => setEditForm(f => ({ ...f, email_contact: e.target.value }))}
                  placeholder="ex : parent@email.com"
                  type="email"
                />
              </div>
              <div style={{ height:1, background:'var(--a-border)', margin:'8px 0 16px' }} />
              <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:12 }}>Classe (optionnel)</div>
              <div style={S.field}>
                <label style={S.label}>Classe</label>
                <select style={{ ...S.input, cursor:'pointer' }} value={editForm.classe_id} onChange={e => setEditForm(f => ({ ...f, classe_id: e.target.value }))}>
                  <option value="">— Aucune classe —</option>
                  {niveauxScolaires.map(n => {
                    const cs = allClasses.filter(c => c.niveau_id === n.id);
                    if (!cs.length) return null;
                    return (
                      <optgroup key={n.id} label={n.nom}>
                        {cs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginBottom:16, lineHeight:1.5 }}>
                ℹ️ L'identifiant de connexion reste inchangé.
              </div>
              <div style={S.btnRow}>
                <button style={S.btnCancel} onClick={() => setEditEleve(null)}>Annuler</button>
                <button
                  style={{ ...S.btnSave, opacity: (!editForm.prenom.trim() || !editForm.nom.trim() || editLoading) ? .5 : 1 }}
                  disabled={!editForm.prenom.trim() || !editForm.nom.trim() || editLoading}
                  onClick={handleSaveEdit}>
                  {editLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Modal confirmation reset mot de passe ─── */}
        {confirmReset && (
          <ConfirmModal
            title="Réinitialiser le mot de passe ?"
            message={<span>Un nouveau mot de passe provisoire va être généré pour <strong>{confirmReset.prenom} {confirmReset.nom}</strong>.<br/>L'élève devra le changer à sa prochaine connexion.</span>}
            confirmLabel="Confirmer la réinitialisation"
            danger={false}
            icon="warn"
            onConfirm={handleConfirmReset}
            onCancel={() => setConfirmReset(null)}
          />
        )}

        {/* ─── Modal confirmation suppression élève ─── */}
        {confirmDelete && (
          <ConfirmModal
            title="Supprimer cet élève ?"
            message={<span>Le compte de <strong>{confirmDelete.prenom} {confirmDelete.nom}</strong> sera définitivement supprimé, ainsi que toute sa progression.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>}
            confirmLabel="Supprimer définitivement"
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {/* ─── Modal résultat reset mot de passe ─── */}
        {resetResult && (
          <div style={S.overlay} onClick={() => setResetResult(null)}>
            <div style={{ ...S.modal, maxWidth:440 }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>🔑</div>
                <div style={S.modalTitle}>Nouveau mot de passe généré</div>
              </div>
              <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:20, marginBottom:16 }}>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Élève</div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{resetResult.prenom} {resetResult.nom}</div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Identifiant</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--a-gold)', fontFamily:'monospace', letterSpacing:1 }}>{resetResult.identifiant}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Nouveau mot de passe provisoire</div>
                  <div style={{ fontSize:18, fontWeight:700, color:'var(--a-red)', fontFamily:'monospace', letterSpacing:1 }}>{resetResult.tempPassword}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.6, marginBottom:16 }}>
                ⚠️ L'élève devra changer ce mot de passe à sa prochaine connexion.
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <button style={{ ...S.btnSave, fontSize:12, padding:'9px 16px' }} onClick={() => {
                  navigator.clipboard.writeText(`Identifiant : ${resetResult.identifiant}\nMot de passe : ${resetResult.tempPassword}`);
                  alert('Copié !');
                }}>📋 Copier</button>
                <button style={{ padding:'9px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => {
                  const msg = encodeURIComponent(
                    `🕌 École Raqib — Portail Élève\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/portail/login\n\n⚠️ Changez votre mot de passe à la connexion.`
                  );
                  window.open(`https://wa.me/?text=${msg}`, '_blank');
                }}>💬 WhatsApp</button>
                <button style={{ ...S.btnCancel, fontSize:12, padding:'9px 16px' }} onClick={() => setResetResult(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        <h3 style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)', marginBottom:16 }}>Progression par module</h3>

        {modules.length === 0 && <div style={S.empty}>Aucun module disponible.</div>}
        {modules.map(m => {
          const nivs = niveauxMap[m.id] || [];
          const totalNiveaux = nivs.length;
          const reussis = nivs.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
          const pct = totalNiveaux > 0 ? Math.round((reussis / totalNiveaux) * 100) : 0;

          return (
            <div key={m.id} style={S.progressCard}>
              <div style={S.progressTitle}>{m.titre}</div>
              <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>
              <div style={S.progressText}>
                <span>{reussis} / {totalNiveaux} niveaux réussis</span>
                <span style={{ fontWeight:600, color: pct >= 100 ? 'var(--a-green)' : 'var(--a-gold)' }}>{pct}%</span>
              </div>
              {nivs.map(n => {
                const prog = progression.find(p => p.niveau_id === n.id);
                return (
                  <div key={n.id} style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, fontSize:13, color:'var(--a-fg-mid)' }}>
                    <span style={{ fontSize:14 }}>{prog?.reussi ? '✅' : prog?.score != null ? '❌' : '⬜'}</span>
                    <span style={{ flex:1 }}>{n.titre}</span>
                    {prog?.score != null && <span style={{ fontWeight:600, color: prog.reussi ? 'var(--a-green)' : 'var(--a-red)' }}>{prog.score}%</span>}
                    {prog?.tentatives > 0 && <span style={{ fontSize:11 }}>({prog.tentatives} tentative{prog.tentatives > 1 ? 's' : ''})</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Filtrage + tri côté client ───────────────────────────────────
  const elevesFiltered = eleves
    .filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || `${e.prenom} ${e.nom}`.toLowerCase().includes(q)
        || e.identifiant?.toLowerCase().includes(q);
      const matchActif = filterActif === 'tous' || (filterActif === 'actif' ? e.actif : !e.actif);
      return matchSearch && matchActif;
    })
    .sort((a, b) => sortBy === 'nom'
      ? `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`)
      : new Date(b.created_at) - new Date(a.created_at)
    );

  const exportCSV = () => {
    const headers = ['Prénom', 'Nom', 'Identifiant', 'Téléphone', 'Email de contact', "Date d'inscription", 'Statut'];
    const rows = elevesFiltered.map(e => [
      e.prenom || '',
      e.nom || '',
      (e.identifiant || '').toUpperCase(),
      e.telephone || '',
      e.email_contact || '',
      new Date(e.created_at).toLocaleDateString('fr-FR'),
      e.actif ? 'Actif' : 'Inactif',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eleves-alnour-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── VUE LISTE ───────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.headerTitle}>{eleves.length} élève{eleves.length !== 1 ? 's' : ''} inscrit{eleves.length !== 1 ? 's' : ''}</span>
        <div style={{ display:'flex', gap:10 }}>
          {elevesFiltered.length > 0 && (
            <button style={S.exportBtn} onClick={exportCSV}>⬇ Exporter CSV{elevesFiltered.length !== eleves.length ? ` (${elevesFiltered.length})` : ''}</button>
          )}
          <button style={S.addBtn} onClick={() => setShowModal(true)}><IconPlus /> Ajouter un élève</button>
        </div>
      </div>

      {/* ─── Barre de recherche / filtres ─── */}
      {eleves.length > 0 && (
        <div style={S.toolbar}>
          <div style={S.searchWrap}>
            <svg style={S.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              style={S.searchInput}
              placeholder="Rechercher par nom ou identifiant…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button style={S.filterBtn(filterActif === 'tous')}   onClick={() => setFilterActif('tous')}>Tous</button>
          <button style={S.filterBtn(filterActif === 'actif')}  onClick={() => setFilterActif('actif')}>Actifs</button>
          <button style={S.filterBtn(filterActif === 'inactif')} onClick={() => setFilterActif('inactif')}>Inactifs</button>
          <select style={S.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="date">↓ Plus récents</option>
            <option value="nom">↑ Nom A→Z</option>
          </select>
        </div>
      )}

      {eleves.length === 0 && <div style={S.empty}>Aucun élève pour le moment. Créez le premier compte.</div>}
      {eleves.length > 0 && elevesFiltered.length === 0 && (
        <div style={S.empty}>Aucun élève ne correspond à votre recherche.</div>
      )}

      <div style={S.grid}>
        {elevesFiltered.map(e => {
          const initials = (fmtPrenom(e.prenom || '')?.[0] || '') + (fmtNom(e.nom || '')?.[0] || '');
          return (
            <div key={e.id} style={S.card} onClick={() => openEleve(e)}
              onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-2px)'; ev.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.12)'; }}
              onMouseLeave={ev => { ev.currentTarget.style.transform=''; ev.currentTarget.style.boxShadow=''; }}>
              <div style={S.avatar()}>{initials}</div>
              <div style={S.info}>
                <div style={S.name}>{fmtPrenom(e.prenom || '')} {fmtNom(e.nom || '')}</div>
                <div style={S.email}>ID : <span style={{ fontFamily:'monospace', fontWeight:600, color:'var(--a-gold)' }}>{(e.identifiant || '').toUpperCase()}</span></div>
                <div style={S.date}>Inscrit le {new Date(e.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <span style={S.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span>
            </div>
          );
        })}
      </div>

      {showModal && <CreateEleveModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadEleves(); }} />}
    </div>
  );
}

// ─── Génération identifiant : 1ère lettre prénom + 2ème lettre nom + 1ère lettre nom + 4 chiffres
function generateIdentifiant(prenom, nom) {
  const p = prenom.trim().replace(/\s/g, '');
  const n = nom.trim().replace(/\s/g, '');
  const part1 = (p[0] || 'X').toUpperCase();
  const part2 = (n[1] || n[0] || 'X').toLowerCase();
  const part3 = (n[0] || 'X').toUpperCase();
  const digits = String(Math.floor(1000 + Math.random() * 9000)); // 4 chiffres
  return `${part1}${part2}${part3}${digits}`;
}

// ─── Génération mot de passe provisoire (10 chars, 1 majuscule, 1 chiffre, 1 spécial)
function generateTempPassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const specials = '!@#$%&*?';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  for (let i = 0; i < 4; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  // Mélanger
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text || '');
  return div.innerHTML;
}

// ─── Modal création élève ────────────────────────────────────────────────────
function CreateEleveModal({ onClose, onCreated }) {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [classeId, setClasseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [allClasses, setAllClasses] = useState([]);
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);
  const [pwdVisible, setPwdVisible] = useState(true);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    Promise.all([fetchAllClasses(), fetchNiveauxScolaires()])
      .then(([cs, ns]) => { setAllClasses(cs); setNiveauxScolaires(ns); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!result) return;
    setPwdVisible(true);
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setPwdVisible(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const identifiant = nom.trim() && prenom.trim() ? generateIdentifiant(prenom, nom) : '';

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const tempPwd = generateTempPassword();
      const eleve = await createEleve(fmtNom(nom), fmtPrenom(prenom), identifiant.toLowerCase(), tempPwd);
      if (classeId && eleve?.id) {
        await updateEleve(eleve.id, { classe_id: classeId }).catch(() => {});
      }
      setResult({ identifiant, tempPassword: tempPwd });
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const valid = nom.trim().length >= 2 && prenom.trim().length >= 2;

  // ─── Vue résultat (après création) ─────────────────────────────────
  if (result) {
    return (
      <div style={S.overlay} onClick={onClose}>
        <div style={{ ...S.modal, maxWidth:480 }} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign:'center', marginBottom:20 }}>
            <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
            <div style={S.modalTitle}>Compte créé avec succès</div>
          </div>
          <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:20, marginBottom:16 }}>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Élève</div>
              <div style={{ fontSize:16, fontWeight:600, color:'var(--a-fg)' }}>{prenom} {nom}</div>
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Identifiant de connexion</div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--a-gold)', fontFamily:'monospace', letterSpacing:1 }}>{result.identifiant}</div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>
                Mot de passe provisoire
                {pwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {countdown}s</span>}
              </div>
              <div style={{ fontSize:18, fontWeight:700, color:'var(--a-red)', fontFamily:'monospace', letterSpacing:1, cursor: pwdVisible ? 'default' : 'pointer' }}
                onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}>
                {pwdVisible ? result.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400 }}>●●●●●●●● (cliquer pour afficher)</span>}
              </div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.6, marginBottom:16, padding:'0 4px' }}>
            ⚠️ <strong>Notez ces identifiants</strong> — le mot de passe provisoire ne sera plus visible après fermeture.
            L'élève devra le modifier à sa première connexion.
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button style={{ ...S.btnSave, padding:'10px 18px', fontSize:12 }} onClick={() => {
              navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
              alert('Copié dans le presse-papier !');
            }}>
              📋 Copier
            </button>
            <button style={{ padding:'10px 18px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => {
              const msg = encodeURIComponent(
                `🕌 École Raqib — Portail Élève\n\n` +
                `Bonjour ${prenom},\n\n` +
                `Voici vos identifiants de connexion :\n\n` +
                `👤 Identifiant : ${result.identifiant}\n` +
                `🔑 Mot de passe : ${result.tempPassword}\n\n` +
                `📱 Connectez-vous sur : ${window.location.origin}/portail/login\n\n` +
                `⚠️ Vous devrez changer votre mot de passe à la première connexion.\n\n` +
                `Bonne étude ! 📚`
              );
              window.open(`https://wa.me/?text=${msg}`, '_blank');
            }}>
              💬 WhatsApp
            </button>
            <button style={{ padding:'10px 18px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => {
              const printWin = window.open('', '_blank', 'width=400,height=500');
              printWin.document.write(`
                <html><head><title>Fiche élève</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
                  .card { border: 2px solid #bf8a30; border-radius: 16px; padding: 30px; max-width: 320px; margin: 0 auto; }
                  h1 { font-size: 18px; color: #bf8a30; margin: 0 0 4px; }
                  h2 { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 24px; }
                  .field { margin-bottom: 16px; text-align: left; }
                  .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
                  .value { font-size: 20px; font-weight: 700; font-family: monospace; letter-spacing: 1px; }
                  .gold { color: #bf8a30; }
                  .red { color: #e53935; }
                  .name { font-size: 16px; font-weight: 600; margin-bottom: 20px; }
                  .note { font-size: 10px; color: #999; margin-top: 20px; line-height: 1.5; }
                  .url { font-size: 11px; color: #666; margin-top: 12px; word-break: break-all; }
                </style></head><body>
                <div class="card">
                  <h1>رقيب — RAQIB</h1>
                  <h2>Portail Élève</h2>
                  <div class="name">${escapeHtml(prenom)} ${escapeHtml(nom)}</div>
                  <div class="field">
                    <div class="label">Identifiant</div>
                    <div class="value gold">${escapeHtml(result.identifiant)}</div>
                  </div>
                  <div class="field">
                    <div class="label">Mot de passe provisoire</div>
                    <div class="value red">${escapeHtml(result.tempPassword)}</div>
                  </div>
                  <div class="note">⚠️ Changez votre mot de passe à la première connexion.<br>Min. 8 caractères, 1 chiffre, 1 caractère spécial.</div>
                  <div class="url">${window.location.origin}/portail/login</div>
                </div>
                </body></html>
              `);
              printWin.document.close();
              printWin.print();
            }}>
              🖨️ Imprimer
            </button>
            <button style={{ ...S.btnCancel, padding:'10px 18px', fontSize:12 }} onClick={() => { onCreated(); }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vue formulaire ────────────────────────────────────────────────
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Ajouter un élève</div>
        <div style={{ display:'flex', gap:12 }}>
          <div style={{ ...S.field, flex:1 }}><label style={S.label}>Prénom *</label><input style={S.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" /></div>
          <div style={{ ...S.field, flex:1 }}><label style={S.label}>Nom *</label><input style={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" /></div>
        </div>
        {identifiant && (
          <div style={{ ...S.field, background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'12px 16px' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Identifiant généré automatiquement</div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--a-gold)', fontFamily:'monospace', letterSpacing:1 }}>{identifiant}</div>
            <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:4 }}>
              {prenom[0]?.toUpperCase()} (prénom) + {nom[1]?.toLowerCase()} (2e lettre nom) + {nom[0]?.toUpperCase()} (nom) + 4 chiffres
            </div>
          </div>
        )}
        {niveauxScolaires.length > 0 && (
          <div style={S.field}>
            <label style={S.label}>Classe (optionnel)</label>
            <select style={{ ...S.input, cursor:'pointer' }} value={classeId} onChange={e => setClasseId(e.target.value)}>
              <option value="">— Aucune classe —</option>
              {niveauxScolaires.map(n => {
                const cs = allClasses.filter(c => c.niveau_id === n.id);
                if (!cs.length) return null;
                return (
                  <optgroup key={n.id} label={n.nom}>
                    {cs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </optgroup>
                );
              })}
            </select>
          </div>
        )}
        <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.5, marginBottom:8 }}>
          Un mot de passe provisoire sera généré automatiquement. L'élève devra le modifier à sa première connexion.
        </div>
        {error && <div style={S.error}>{error}</div>}
        <div style={S.btnRow}>
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button style={S.btnSave} disabled={loading || !valid} onClick={handleSubmit}>
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </div>
  );
}
