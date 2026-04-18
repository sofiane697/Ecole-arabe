import React, { useState, useEffect, useCallback } from 'react';
import { fetchEleves, createEleve, updateEleve, updateEleveNiveauScolaire, deleteEleve, updateEleveActif, resetElevePassword, fetchEleveProgression, fetchModules, fetchAllNiveauxForModule, fetchQCMNiveauxIds, fetchAllClasses, fetchNiveauxScolaires, sendWelcomeEmail, fetchEleveActivite, fetchEleveIdParIdentifiant } from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import { generateIdentifiant, generateTempPassword } from './adminUtils';

const PAGE_SIZE = 25;

// ─── Formatage des noms ──────────────────────────────────────────────────────
const fmtPrenom = (s) => s.trim() ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s;
const fmtNom    = (s) => s.trim().toUpperCase();

// ─── Icônes ──────────────────────────────────────────────────────────────────
const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconBack = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;

// ─── Styles ──────────────────────────────────────────────────────────────────
const CLS = {
  page: 'min-h-full',
  header: 'a-section-header',
  headerLeft: 'a-section-meta',
  headerActions: 'a-section-actions',
  addBtn: 'a-add-btn',
  exportBtn: 'a-btn-secondary',
  grid: 'elv-grid',
  card: 'elv-card',
  avatar: 'elv-avatar',
  info: 'elv-info',
  name: 'elv-name',
  email: 'elv-email',
  date: 'elv-date',
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
  empty: 'a-empty',
  // Toolbar
  toolbar: 'a-toolbar',
  searchWrap: 'a-search-wrap',
  searchInput: 'a-search-input',
  searchIcon: 'a-search-icon',
  sortSelect: 'a-filter-select',
  // Detail
  breadcrumb: 'a-breadcrumb',
  detailHeader: 'elv-detail-header',
  detailAvatar: 'elv-detail-avatar',
  detailName: 'elv-detail-name',
  detailEmail: 'elv-detail-email',
  progressCard: 'elv-progress-card',
  progressTitle: 'elv-progress-title',
  progressBar: 'elv-progress-bar',
  progressText: 'elv-progress-text',
  toggleBtn: 'a-modal-btn-cancel',
};
// Dynamic styles that must remain inline
const S = {
  badge: (active) => ({ background: active ? 'rgba(52,212,114,.12)' : 'rgba(240,85,85,.12)', color: active ? 'var(--a-green)' : 'var(--a-red)', border: `1px solid ${active ? 'rgba(52,212,114,.2)' : 'rgba(240,85,85,.2)'}`, padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700 }),
  overlay: { background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' },
  progressFill: (pct) => ({ background: pct >= 100 ? 'var(--a-green)' : 'var(--a-gold)', width:`${pct}%`, transition:'width .4s var(--a-ease-out)' }),
  filterSegment: { display:'inline-flex', alignItems:'center', background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:980, padding:3, gap:2 },
  filterOpt: (active) => ({ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 14px', borderRadius:980, border:'none', fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .18s var(--a-ease)', background: active ? 'var(--a-gold)' : 'transparent', color: active ? '#fff' : 'var(--a-fg-mid)', boxShadow: active ? '0 2px 8px rgba(191,138,48,.35)' : 'none', letterSpacing:'-.01em' }),
};

export default function Eleves() {
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [progression, setProgression] = useState([]);
  const [modules, setModules] = useState([]);
  const [niveauxMap, setNiveauxMap] = useState({});
  const [qcmNiveauxIds, setQcmNiveauxIds] = useState(new Set());
  const [resetResult, setResetResult] = useState(null);   // { identifiant, tempPassword }
  const [search, setSearch]       = useState('');
  const [filterActif, setFilterActif] = useState('tous'); // 'tous' | 'actif' | 'inactif'
  const [sortBy, setSortBy]       = useState('date');     // 'date' | 'nom'
  const [page, setPage]           = useState(0);
  const [confirmReset, setConfirmReset] = useState(null);  // élève en attente de confirmation reset
  const [confirmDelete, setConfirmDelete] = useState(null); // élève en attente de confirmation suppression
  const [editEleve, setEditEleve] = useState(null);       // élève en cours d'édition
  const [editForm, setEditForm] = useState({ prenom:'', nom:'', telephone:'', email_contact:'', classe_id:'' });
  const [editLoading, setEditLoading] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);
  const [detailModule, setDetailModule] = useState(null); // module ouvert dans le panneau latéral
  const [activitePeriode, setActivitePeriode] = useState('30j');
  const [activite, setActivite] = useState([]);
  const [activiteLoading, setActiviteLoading] = useState(false);
  const [error, setError] = useState('');

  const loadEleves = useCallback(async () => {
    try { setEleves(await fetchEleves()); } catch(e) {}
  }, []);

  useEffect(() => { loadEleves(); }, [loadEleves]);

  useEffect(() => {
    Promise.all([fetchAllClasses(), fetchNiveauxScolaires()])
      .then(([cs, ns]) => { setAllClasses(cs); setNiveauxScolaires(ns); })
      .catch(() => {});
  }, []);

  // ─── Charger l'activité de l'élève sélectionné (+ poll 30s) ─────────
  useEffect(() => {
    if (!selectedEleve) return;

    const load = (initial) => {
      if (initial) setActiviteLoading(true);
      const to = new Date();
      const from = new Date();
      if (activitePeriode === '7j')  from.setDate(to.getDate() - 7);
      else if (activitePeriode === '30j') from.setDate(to.getDate() - 30);
      else if (activitePeriode === '3m')  from.setMonth(to.getMonth() - 3);
      else                                from.setFullYear(to.getFullYear() - 1);
      fetchEleveActivite(selectedEleve.id, from.toISOString(), to.toISOString())
        .then(setActivite)
        .catch(() => {})
        .finally(() => { if (initial) setActiviteLoading(false); });
    };

    load(true);
    const t = setInterval(() => load(false), 300_000);
    return () => clearInterval(t);
  }, [selectedEleve, activitePeriode]);

  // ─── Voir le détail d'un élève ───────────────────────────────────────
  const openEleve = async (eleve) => {
    setSelectedEleve(eleve);
    setModules([]);
    setProgression([]);
    setNiveauxMap({});
    setQcmNiveauxIds(new Set());
    try {
      const mods = await fetchModules();
      setModules(mods);
      const [prog, nivMap] = await Promise.all([
        fetchEleveProgression(eleve.id).catch(() => []),
        Promise.all(mods.map(async (m) => {
          try { return [m.id, await fetchAllNiveauxForModule(m.id)]; } catch { return [m.id, []]; }
        })).then(entries => Object.fromEntries(entries)),
      ]);
      setProgression(prog);
      setNiveauxMap(nivMap);
      // Charger quels niveaux ont un QCM (même logique que le portail élève)
      const allNiveauIds = Object.values(nivMap).flat().map(n => n.id);
      const qcmIds = await fetchQCMNiveauxIds(allNiveauIds).catch(() => new Set());
      setQcmNiveauxIds(qcmIds);
    } catch(e) {}
  };

  const handleToggleActif = async (eleve) => {
    try {
      const activation = !eleve.actif; // true = on active, false = on désactive
      await updateEleveActif(eleve.id, activation);

      if (activation) {
        // Générer un nouveau mot de passe provisoire et l'envoyer par email
        const tempPwd = generateTempPassword();
        await resetElevePassword(eleve.id, tempPwd);
        setResetResult({ identifiant: eleve.identifiant, tempPassword: tempPwd, prenom: eleve.prenom, nom: eleve.nom, emailSent: eleve.email_contact || null });
        if (eleve.email_contact) {
          sendWelcomeEmail({
            email:       eleve.email_contact,
            prenom:      eleve.prenom,
            nom:         eleve.nom,
            identifiant: eleve.identifiant,
            tempPassword: tempPwd,
          }).catch(() => {});
        }
      }

      await loadEleves();
      if (selectedEleve?.id === eleve.id) setSelectedEleve({ ...eleve, actif: activation });
    } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
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
    } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
    finally { setEditLoading(false); }
  };

  const handleConfirmDelete = async () => {
    const eleve = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteEleve(eleve.id);
      setEleves(prev => prev.filter(e => e.id !== eleve.id));
      setSelectedEleve(null); // retour à la liste
    } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
  };

  const handleConfirmReset = async () => {
    const eleve = confirmReset;
    setConfirmReset(null);
    const tempPwd = generateTempPassword();
    try {
      await resetElevePassword(eleve.id, tempPwd);
      const identifiant = (eleve.identifiant || '').toUpperCase();
      setResetResult({ identifiant, tempPassword: tempPwd, prenom: eleve.prenom, nom: eleve.nom });
    } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
  };

  // ─── VUE DÉTAIL ──────────────────────────────────────────────────────
  if (selectedEleve) {
    const initials = (fmtPrenom(selectedEleve.prenom || '')?.[0] || '') + (fmtNom(selectedEleve.nom || '')?.[0] || '');
    return (
      <div className={CLS.page}>
        <div className={CLS.breadcrumb} onClick={() => setSelectedEleve(null)}>
          <IconBack /> <span>Retour à la liste</span>
        </div>
        {error && <p style={{ color:'var(--a-red)', fontSize:13, marginBottom:12 }}>{error}</p>}

        <div className={CLS.detailHeader}>
          <div className={CLS.detailAvatar}>{initials}</div>
          <div className="flex-1">
            <div className={CLS.detailName}>{fmtPrenom(selectedEleve.prenom || '')} {fmtNom(selectedEleve.nom || '')}</div>
            <div className={CLS.detailEmail}>ID : {(selectedEleve.identifiant || '').toUpperCase()}</div>
            {(selectedEleve.telephone || selectedEleve.email_contact || selectedEleve.classe_id) && (
              <div className="flex gap-4 mt-1.5 flex-wrap">
                {selectedEleve.classe_id && (() => {
                  const cl = allClasses.find(c => c.id === selectedEleve.classe_id);
                  const nv = cl ? niveauxScolaires.find(n => n.id === cl.niveau_id) : null;
                  return cl ? (
                    <span className="text-xs text-a-gold font-semibold">
                      🏫 {nv ? `${nv.nom} — ` : ''}{cl.nom}
                    </span>
                  ) : null;
                })()}
                {selectedEleve.telephone && (
                  <span className="text-xs text-a-fg-mid">
                    📞 {selectedEleve.telephone}
                  </span>
                )}
                {selectedEleve.email_contact && (
                  <span className="text-xs text-a-fg-mid">
                    ✉️ {selectedEleve.email_contact}
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="inline-block text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px]" style={S.badge(selectedEleve.actif)}>{selectedEleve.actif ? 'Actif' : 'Inactif'}</span>
          <button className={CLS.toggleBtn} onClick={() => handleToggleActif(selectedEleve)}>
            {selectedEleve.actif ? 'Désactiver' : 'Activer'}
          </button>
          <button
            className={`${CLS.toggleBtn} !ml-0 !text-a-blue !border-a-blue`}
            onClick={() => handleOpenEdit(selectedEleve)}>
            ✏️ Modifier
          </button>
          <button
            className={`${CLS.toggleBtn} !ml-0 !text-a-gold !border-a-gold`}
            onClick={() => handleResetPassword(selectedEleve)}>
            🔑 Réinitialiser le mot de passe
          </button>
          <button
            className={`${CLS.toggleBtn} !ml-0 !text-a-red !border-a-red`}
            onClick={() => setConfirmDelete(selectedEleve)}>
            🗑 Supprimer
          </button>
        </div>

        {/* ─── Modal modifier nom/prénom ─── */}
        {editEleve && (
          <div className={CLS.overlay} style={S.overlay} onClick={() => setEditEleve(null)}>
            <div className={`${CLS.modal} !max-w-[400px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <div className={CLS.modalTitle}>✏️ Modifier l'élève</div>
              <div className={CLS.field}>
                <label className={CLS.label}>Prénom</label>
                <input
                  className={CLS.input}
                  value={editForm.prenom}
                  onChange={e => setEditForm(f => ({ ...f, prenom: e.target.value }))}
                  placeholder="Prénom"
                  autoFocus
                />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Nom</label>
                <input
                  className={CLS.input}
                  value={editForm.nom}
                  onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Nom"
                />
              </div>
              <div style={{ height:1, background:'var(--a-border)', margin:'0.5rem 0 1rem' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Contact (optionnel)</div>
              <div className={CLS.field}>
                <label className={CLS.label}>Téléphone</label>
                <input
                  className={CLS.input}
                  value={editForm.telephone}
                  onChange={e => setEditForm(f => ({ ...f, telephone: e.target.value }))}
                  placeholder="ex : 06 12 34 56 78"
                  type="tel"
                />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Email de contact</label>
                <input
                  className={CLS.input}
                  value={editForm.email_contact}
                  onChange={e => setEditForm(f => ({ ...f, email_contact: e.target.value }))}
                  placeholder="ex : parent@email.com"
                  type="email"
                />
              </div>
              <div style={{ height:1, background:'var(--a-border)', margin:'0.5rem 0 1rem' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Classe (optionnel)</div>
              <div className={CLS.field}>
                <label className={CLS.label}>Classe</label>
                <select className={`${CLS.input} cursor-pointer`} value={editForm.classe_id} onChange={e => setEditForm(f => ({ ...f, classe_id: e.target.value }))}>
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
              <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginBottom:'1rem', lineHeight:1.5 }}>
                ℹ️ L'identifiant de connexion reste inchangé.
              </div>
              <div className={CLS.btnRow}>
                <button className={CLS.btnCancel} onClick={() => setEditEleve(null)}>Annuler</button>
                <button
                  className={CLS.btnSave}
                  style={{ opacity: (!editForm.prenom.trim() || !editForm.nom.trim() || editLoading) ? .5 : 1 }}
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
          <div className={CLS.overlay} onClick={() => setResetResult(null)}>
            <div className={CLS.modal} style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign:'center', marginBottom:'1rem' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🔑</div>
                <div className={CLS.modalTitle}>Nouveau mot de passe généré</div>
              </div>
              <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'1.25rem', marginBottom:'1rem' }}>
                <div style={{ marginBottom:'0.875rem' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Élève</div>
                  <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{resetResult.prenom} {resetResult.nom}</div>
                </div>
                <div style={{ marginBottom:'0.875rem' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Identifiant</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{resetResult.identifiant}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Nouveau mot de passe provisoire</div>
                  <div style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{resetResult.tempPassword}</div>
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.6, marginBottom:12 }}>
                ⚠️ L'élève devra changer ce mot de passe à sa prochaine connexion.
              </div>
              {resetResult.emailSent ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, background:'rgba(52,212,114,0.1)', border:'1px solid rgba(52,212,114,0.3)', color:'var(--a-green)' }}>
                  <span>✉️</span>
                  <span>Mail envoyé · <strong style={{ fontFamily:'var(--a-font-mono)' }}>{resetResult.emailSent}</strong></span>
                </div>
              ) : resetResult.emailSent === null ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)', color:'var(--a-yellow)' }}>
                  <span>⚠️</span> Aucun email — transmettez les identifiants manuellement.
                </div>
              ) : null}
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <button className={CLS.btnSave} onClick={() => {
                  navigator.clipboard.writeText(`Identifiant : ${resetResult.identifiant}\nMot de passe : ${resetResult.tempPassword}`);
                  alert('Copié !');
                }}>📋 Copier</button>
                <button style={{ padding:'8px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => {
                  const msg = encodeURIComponent(
                    `🕌 Institut As-Safaa — Portail Élève\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/portail/login\n\n⚠️ Changez votre mot de passe à la connexion.`
                  );
                  window.open(`https://wa.me/?text=${msg}`, '_blank');
                }}>💬 WhatsApp</button>
                <button className={CLS.btnCancel} onClick={() => setResetResult(null)}>Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Résumé global ─── */}
        {(() => {
          const totalQCM = modules.reduce((acc, m) => {
            const nivsAvecQCM = (niveauxMap[m.id] || []).filter(n => qcmNiveauxIds.has(n.id));
            return acc + nivsAvecQCM.length;
          }, 0);
          const totalReussis = modules.reduce((acc, m) => {
            const nivsAvecQCM = (niveauxMap[m.id] || []).filter(n => qcmNiveauxIds.has(n.id));
            return acc + nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
          }, 0);
          const pctGlobal = totalQCM > 0 ? Math.round((totalReussis / totalQCM) * 100) : 0;
          return (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.625rem', marginBottom:'1.25rem' }}>
              {[
                { label:'Modules', value: modules.length },
                { label:'Niveaux réussis', value: totalQCM > 0 ? `${totalReussis} / ${totalQCM}` : '—' },
                { label:'Progression globale', value: totalQCM > 0 ? `${pctGlobal}%` : '—', color: pctGlobal >= 100 ? 'var(--a-green)' : pctGlobal > 0 ? 'var(--a-gold)' : 'var(--a-fg-light)' },
              ].map(s => (
                <div key={s.label} style={{ background:'var(--a-bg)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius-sm)', padding:'12px 16px', textAlign:'center' }}>
                  <div style={{ fontSize:'1.25rem', fontWeight:700, color: s.color || 'var(--a-fg)' }}>{s.value}</div>
                  <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ─── Tableau récapitulatif ─── */}
        <h3 className="text-[15px] font-semibold text-a-fg mb-3">Progression par module</h3>

        <div className="flex gap-4 items-start">

          {/* Tableau */}
          <div className="flex-1 min-w-0">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-a-border">
                  {['Module','Niveaux QCM','Réussis','Moy. score','Statut',''].map(h => (
                    <th key={h} className="px-2.5 py-2 text-left text-[11px] font-semibold text-a-fg-light uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-a-fg-light">Aucun module disponible.</td></tr>
                )}
                {modules.map(m => {
                  const nivs = niveauxMap[m.id] || [];
                  const nivsAvecQCM = nivs.filter(n => qcmNiveauxIds.has(n.id));
                  const totalN = nivsAvecQCM.length;
                  const reussis = nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
                  const scores = nivsAvecQCM.map(n => progression.find(p => p.niveau_id === n.id)?.score).filter(s => s != null);
                  const moyScore = scores.length > 0 ? Math.round(scores.reduce((a,b) => a+b, 0) / scores.length) : null;
                  const pct = totalN > 0 ? Math.round((reussis / totalN) * 100) : null;
                  const isOpen = detailModule?.id === m.id;

                  let statutLabel, statutColor, statutBg;
                  if (totalN === 0) { statutLabel = 'Sans QCM'; statutColor = 'var(--a-fg-light)'; statutBg = 'rgba(255,255,255,.05)'; }
                  else if (pct === 100) { statutLabel = 'Terminé'; statutColor = 'var(--a-green)'; statutBg = 'rgba(48,209,88,.12)'; }
                  else if (reussis > 0) { statutLabel = 'En cours'; statutColor = 'var(--a-gold)'; statutBg = 'rgba(191,138,48,.12)'; }
                  else { statutLabel = 'Non commencé'; statutColor = 'var(--a-fg-light)'; statutBg = 'rgba(255,255,255,.05)'; }

                  return (
                    <tr key={m.id} className="border-b border-a-border transition-colors duration-150" style={{ background: isOpen ? 'rgba(191,138,48,.06)' : 'transparent' }}>
                      <td className="px-2.5 py-2.5 font-semibold text-a-fg">{m.titre}</td>
                      <td className="px-2.5 py-2.5 text-a-fg-mid text-center">{totalN > 0 ? totalN : '—'}</td>
                      <td className="px-2.5 py-2.5 text-center">
                        {totalN > 0 ? (
                          <span className="font-semibold" style={{ color: pct === 100 ? 'var(--a-green)' : pct > 0 ? 'var(--a-gold)' : 'var(--a-fg-light)' }}>
                            {reussis} / {totalN}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        {moyScore != null ? (
                          <span className="font-semibold" style={{ color: moyScore >= 80 ? 'var(--a-green)' : moyScore >= 60 ? 'var(--a-gold)' : 'var(--a-red)' }}>{moyScore}%</span>
                        ) : '—'}
                      </td>
                      <td className="px-2.5 py-2.5">
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px]" style={{ background: statutBg, color: statutColor }}>
                          {statutLabel}
                        </span>
                      </td>
                      <td className="px-2.5 py-2.5">
                        {totalN > 0 && (
                          <button
                            onClick={() => setDetailModule(isOpen ? null : { id: m.id, titre: m.titre, nivsAvecQCM })}
                            className="px-3 py-[5px] rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap"
                            style={{ border:`1px solid ${isOpen ? 'var(--a-gold)' : 'var(--a-border)'}`, background: isOpen ? 'rgba(191,138,48,.12)' : 'transparent', color: isOpen ? 'var(--a-gold)' : 'var(--a-fg-mid)' }}
                          >
                            {isOpen ? 'Fermer' : 'Détail'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Panneau latéral détail */}
          {detailModule && (
            <div style={{ width:300, flexShrink:0, background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius-sm)', padding:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
                <div style={{ fontWeight:600, color:'var(--a-fg)', fontSize:13 }}>{detailModule.titre}</div>
                <button onClick={() => setDetailModule(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--a-fg-light)', fontSize:'1.2rem', lineHeight:1, padding:2 }}>×</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {detailModule.nivsAvecQCM.map(n => {
                  const prog = progression.find(p => p.niveau_id === n.id);
                  const score = prog?.score ?? null;
                  const reussi = prog?.reussi ?? false;
                  const tentatives = prog?.tentatives ?? 0;
                  let statusColor, statusLabel;
                  if (reussi)            { statusColor = 'var(--a-green)'; statusLabel = 'Réussi'; }
                  else if (score != null) { statusColor = 'var(--a-red)';   statusLabel = 'Échoué'; }
                  else                   { statusColor = 'var(--a-fg-light)'; statusLabel = 'Non commencé'; }

                  return (
                    <div key={n.id} style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'10px 12px', border:'1px solid var(--a-border)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: score != null ? 8 : 0 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--a-fg)', flex:1, marginRight:8 }}>{n.titre}</span>
                        <span style={{ fontSize:11, fontWeight:600, whiteSpace:'nowrap', color: statusColor }}>{statusLabel}</span>
                      </div>
                      {score != null && (
                        <>
                          <div style={{ height:4, borderRadius:4, background:'var(--a-border)', overflow:'hidden', marginBottom:6 }}>
                            <div style={{ height:'100%', borderRadius:4, background: reussi ? 'var(--a-green)' : score >= 60 ? 'var(--a-gold)' : 'var(--a-red)', width:`${score}%`, transition:'width .3s' }} />
                          </div>
                          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--a-fg-light)' }}>
                            <span>{tentatives} tentative{tentatives > 1 ? 's' : ''}</span>
                            <span style={{ fontWeight:700, color: reussi ? 'var(--a-green)' : score >= 60 ? 'var(--a-gold)' : 'var(--a-red)' }}>{score}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ─── Section Activité ─── */}
        {(() => {
          const getDurationSec = (s) => {
            if (s.duration_seconds != null) return s.duration_seconds;
            const start = new Date(s.started_at);
            const hb    = new Date(s.last_heartbeat);
            return Math.max(0, Math.floor((hb - start) / 1000));
          };
          const fmtDuration = (secs) => {
            if (!secs || secs < 60) return secs > 0 ? `${secs}s` : '< 1 min';
            const m = Math.floor(secs / 60);
            const h = Math.floor(m / 60);
            if (h > 0) return `${h}h ${m % 60}min`;
            return `${m}min`;
          };
          const fmtTimeAgo = (dateStr) => {
            const d = new Date(dateStr);
            const diff = Date.now() - d;
            const mins  = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days  = Math.floor(diff / 86400000);
            if (mins  < 1)  return "À l'instant";
            if (mins  < 60) return `Il y a ${mins}min`;
            if (hours < 24) return `Il y a ${hours}h`;
            if (days  < 30) return `Il y a ${days}j`;
            return `Il y a ${Math.floor(days / 30)}mois`;
          };

          // Dernière déconnexion = ended_at de la session la plus récente, sinon last_heartbeat
          const lastSess = activite[0];
          const lastDecoRef = lastSess ? (lastSess.ended_at || lastSess.last_heartbeat) : null;
          const lastSession = lastDecoRef ? fmtTimeAgo(lastDecoRef) : '—';

          const totalVisites = activite.length;
          const totalSecs    = activite.reduce((acc, s) => acc + getDurationSec(s), 0);
          const avgSecs      = totalVisites > 0 ? Math.round(totalSecs / totalVisites) : 0;

          const PERIODES = [
            { key: '7j',  label: '7 jours' },
            { key: '30j', label: '30 jours' },
            { key: '3m',  label: '3 mois' },
            { key: '1an', label: 'Cette année' },
          ];

          return (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-3.5">
                <h3 className="text-[15px] font-semibold text-a-fg m-0">Activité sur le portail</h3>
                <div className="flex gap-1.5">
                  {PERIODES.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setActivitePeriode(p.key)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border border-a-border transition-all duration-150"
                      style={{
                        background: activitePeriode === p.key ? 'var(--a-gold)' : 'transparent',
                        color: activitePeriode === p.key ? '#fff' : 'var(--a-fg-mid)',
                        borderColor: activitePeriode === p.key ? 'var(--a-gold)' : 'var(--a-border)',
                      }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Stats cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.625rem', marginBottom:'1rem' }}>
                {[
                  { label:'Visites',           value: activiteLoading ? '…' : totalVisites,              color:'var(--a-blue)' },
                  { label:'Temps total',        value: activiteLoading ? '…' : fmtDuration(totalSecs),   color:'var(--a-gold)' },
                  { label:'Durée moyenne',      value: activiteLoading ? '…' : fmtDuration(avgSecs),     color:'var(--a-green)' },
                  { label:'Dernière session',   value: activiteLoading ? '…' : lastSession,              color:'var(--a-fg-mid)' },
                ].map(card => (
                  <div key={card.label} style={{ background:'var(--a-bg)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius-sm)', padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:'1.1rem', fontWeight:700, color: card.color }}>{card.value}</div>
                    <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.07em' }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Tableau des sessions */}
              {!activiteLoading && activite.length === 0 ? (
                <div style={{ textAlign:'center', padding:'28px 20px', color:'var(--a-fg-light)', fontSize:13, background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)' }}>
                  Aucune connexion sur cette période
                </div>
              ) : (
                <div style={{ background:'var(--a-bg-card)', border:'1px solid var(--a-border)', borderRadius:'var(--a-radius-sm)', overflow:'hidden' }}>
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--a-border)' }}>
                        {['Date & heure','Durée','Statut'].map(h => (
                          <th key={h} style={{ padding:'8px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activiteLoading ? (
                        <tr><td colSpan={3} style={{ padding:20, textAlign:'center', color:'var(--a-fg-light)' }}>Chargement…</td></tr>
                      ) : activite.slice(0, 10).map(s => {
                        const duree = getDurationSec(s);
                        const termine = s.ended_at != null;
                        const dateStr = new Date(s.started_at).toLocaleDateString('fr-FR', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        });
                        return (
                          <tr key={s.id} style={{ borderBottom:'1px solid var(--a-border)' }}>
                            <td style={{ padding:'9px 14px', color:'var(--a-fg)' }}>{dateStr}</td>
                            <td style={{ padding:'9px 14px', color:'var(--a-fg-mid)', fontWeight:600 }}>{fmtDuration(duree)}</td>
                            <td style={{ padding:'9px 14px' }}>
                              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'2px 10px', borderRadius:20, background: termine ? 'rgba(52,212,114,.12)' : 'rgba(255,159,10,.12)', color: termine ? 'var(--a-green)' : 'var(--a-yellow)' }}>
                                {termine ? '✓ Terminée' : '~ Interrompue'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

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
    a.download = `eleves-raqib-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── VUE LISTE ───────────────────────────────────────────────────────
  return (
    <div className={CLS.page}>
      <div className={CLS.header}>
        <div className={CLS.headerLeft}>
          <span className="a-section-count">{eleves.length} élève{eleves.length !== 1 ? 's' : ''} inscrit{eleves.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={CLS.headerActions}>
          {elevesFiltered.length > 0 && (
            <button className={CLS.exportBtn} onClick={exportCSV}>⬇ Exporter CSV{elevesFiltered.length !== eleves.length ? ` (${elevesFiltered.length})` : ''}</button>
          )}
          <button className={CLS.addBtn} onClick={() => setShowModal(true)}><IconPlus /> Ajouter un élève</button>
        </div>
      </div>

      {/* ─── Barre de recherche / filtres ─── */}
      {eleves.length > 0 && (
        <div className={CLS.toolbar}>
          <div className={CLS.searchWrap}>
            <svg className={CLS.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              className={CLS.searchInput}
              placeholder="Rechercher par nom ou identifiant…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <div style={S.filterSegment}>
            <button style={S.filterOpt(filterActif === 'tous')}   onClick={() => { setFilterActif('tous');    setPage(0); }}>Tous</button>
            <button style={S.filterOpt(filterActif === 'actif')}  onClick={() => { setFilterActif('actif');   setPage(0); }}>Actifs</button>
            <button style={S.filterOpt(filterActif === 'inactif')} onClick={() => { setFilterActif('inactif'); setPage(0); }}>Inactifs</button>
          </div>
          <select className={CLS.sortSelect} value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(0); }}>
            <option value="date">↓ Plus récents</option>
            <option value="nom">↑ Nom A→Z</option>
          </select>
        </div>
      )}

      {eleves.length === 0 && <div className={CLS.empty}>Aucun élève pour le moment. Créez le premier compte.</div>}
      {eleves.length > 0 && elevesFiltered.length === 0 && (
        <div className={CLS.empty}>Aucun élève ne correspond à votre recherche.</div>
      )}

      {(() => {
        const totalPages = Math.max(1, Math.ceil(elevesFiltered.length / PAGE_SIZE));
        const safePage   = Math.min(page, totalPages - 1);
        const paginated  = elevesFiltered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        return (
          <>
            <div className={CLS.grid}>
              {paginated.map(e => {
                const initials = (fmtPrenom(e.prenom || '')?.[0] || '') + (fmtNom(e.nom || '')?.[0] || '');
                return (
                  <div key={e.id} className={CLS.card} onClick={() => openEleve(e)}
                    onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-2px)'; ev.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.12)'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.transform=''; ev.currentTarget.style.boxShadow=''; }}>
                    <div className={CLS.avatar}>{initials}</div>
                    <div className={CLS.info}>
                      <div className={CLS.name}>{fmtPrenom(e.prenom || '')} {fmtNom(e.nom || '')}</div>
                      <div className={CLS.email}>ID : <span style={{ fontFamily:'var(--a-font-mono)', fontWeight:700, color:'var(--a-gold)' }}>{(e.identifiant || '').toUpperCase()}</span></div>
                      <div className={CLS.date}>Inscrit le {new Date(e.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span className="inline-block text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px]" style={S.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="a-pagination">
                <button className="a-page-btn" disabled={safePage === 0} onClick={() => setPage(p => p - 1)}>← Précédent</button>
                <span className="a-page-info">Page {safePage + 1} / {totalPages} — {elevesFiltered.length} résultat{elevesFiltered.length !== 1 ? 's' : ''}</span>
                <button className="a-page-btn" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Suivant →</button>
              </div>
            )}
          </>
        );
      })()}

      {showModal && <CreateEleveModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadEleves(); }} />}
    </div>
  );
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
  const [emailContact, setEmailContact] = useState('');
  const [inactif, setInactif] = useState(false);
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
    setError('');
    const NOM_REGEX = /^[a-zA-Zàâäéèêëïîôùûüœæ\s'\-]{1,50}$/;
    if (!NOM_REGEX.test(prenom.trim())) {
      setError('Le prénom contient des caractères non autorisés.');
      return;
    }
    if (!NOM_REGEX.test(nom.trim())) {
      setError('Le nom contient des caractères non autorisés.');
      return;
    }
    setLoading(true);
    try {
      const tempPwd  = generateTempPassword();
      const idLogin  = identifiant.toLowerCase();
      const eleve    = await createEleve(fmtNom(nom), fmtPrenom(prenom), idLogin, tempPwd);
      const eleveId  = eleve?.id ?? await fetchEleveIdParIdentifiant(idLogin);

      if (eleveId) {
        const patch = {};
        if (classeId)              patch.classe_id    = classeId;
        if (inactif)               patch.actif        = false;
        if (emailContact.trim())   patch.email_contact = emailContact.trim();
        if (Object.keys(patch).length) await updateEleve(eleveId, patch);
        if (classeId) {
          const niveauScolaireId = allClasses.find(c => c.id === classeId)?.niveau_id || null;
          await updateEleveNiveauScolaire(eleveId, niveauScolaireId);
        }
      }

      // Email uniquement si l'élève est actif
      if (emailContact.trim() && !inactif) {
        const classeNom = allClasses.find(c => c.id === classeId)?.nom || null;
        sendWelcomeEmail({
          email:        emailContact.trim(),
          prenom:       fmtPrenom(prenom),
          nom:          fmtNom(nom),
          identifiant:  idLogin,
          tempPassword: tempPwd,
          classeNom,
        }).catch(() => {});
      }

      const emailTrimmed = emailContact.trim();
      setResult({
        identifiant,
        tempPassword:  tempPwd,
        emailContact:  emailTrimmed || null,
        emailSent:     (!inactif && emailTrimmed) ? emailTrimmed : null,
        inactif,
      });
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const valid = nom.trim().length >= 2 && prenom.trim().length >= 2;

  // ─── Vue résultat (après création) ─────────────────────────────────
  if (result) {
    return (
      <div className={CLS.overlay} onClick={onClose}>
        <div className={`${CLS.modal} !max-w-[480px]`} onClick={e => e.stopPropagation()}>
          <div className="text-center mb-5">
            <div className="text-[40px] mb-2">{result.inactif ? '⏳' : '✅'}</div>
            <div className={CLS.modalTitle}>{result.inactif ? 'Compte créé — en attente' : 'Compte créé avec succès'}</div>
          </div>
          <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'1.25rem', marginBottom:'1rem' }}>
            <div style={{ marginBottom:'0.875rem' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Élève</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{prenom} {nom}</div>
            </div>
            <div style={{ marginBottom:'0.875rem' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Identifiant de connexion</div>
              <div style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{result.identifiant}</div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                Mot de passe provisoire
                {pwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {countdown}s</span>}
              </div>
              <div style={{ fontSize:'1.2rem', fontWeight:800, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em', cursor: pwdVisible ? 'default' : 'pointer' }}
                onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}>
                {pwdVisible ? result.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400, fontFamily:'inherit' }}>●●●●●●●● (cliquer pour afficher)</span>}
              </div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.6, marginBottom:12 }}>
            ⚠️ <strong>Notez ces identifiants</strong> — le mot de passe provisoire ne sera plus visible après fermeture.
          </div>
          {result.emailSent ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, background:'rgba(52,212,114,0.1)', border:'1px solid rgba(52,212,114,0.3)', color:'var(--a-green)' }}>
              <span>✉️</span>
              <span>Mail envoyé · <strong style={{ fontFamily:'var(--a-font-mono)' }}>{result.emailSent}</strong></span>
            </div>
          ) : result.inactif && result.emailContact ? (
            <div style={{ display:'flex', alignItems:'center', gap:8, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)', color:'var(--a-yellow)' }}>
              <span>⏳</span>
              <span>Identifiants envoyés à <strong style={{ fontFamily:'var(--a-font-mono)' }}>{result.emailContact}</strong> lors du passage au statut actif.</span>
            </div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:8, borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:12, background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)', color:'var(--a-yellow)' }}>
              <span>⚠️</span> Aucun email — transmettez les identifiants manuellement.
            </div>
          )}
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            <button className={CLS.btnSave} onClick={() => {
              navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
              alert('Copié dans le presse-papier !');
            }}>
              📋 Copier
            </button>
            <button style={{ padding:'8px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => {
              const msg = encodeURIComponent(
                `🕌 Institut As-Safaa — Portail Élève\n\n` +
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
            <button className="a-modal-btn-cancel" onClick={() => {
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
                  <h1>الصفاء — Institut As-Safaa</h1>
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
            <button className={CLS.btnCancel} onClick={() => { onCreated(); }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vue formulaire ────────────────────────────────────────────────
  return (
    <div className={CLS.overlay} onClick={onClose}>
      <div className={CLS.modal} onClick={e => e.stopPropagation()}>
        <div className={CLS.modalTitle}>Ajouter un élève</div>
        <div className="flex gap-3">
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_prenom" className={CLS.label}>Prénom *</label><input id="eleve_prenom" className={CLS.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" /></div>
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_nom" className={CLS.label}>Nom *</label><input id="eleve_nom" className={CLS.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" /></div>
        </div>
        {identifiant && (
          <div className={CLS.field} style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'12px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Identifiant généré automatiquement</div>
            <div style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{identifiant}</div>
            <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:3 }}>
              {prenom[0]?.toUpperCase()} (prénom) + {nom[1]?.toLowerCase()} (2e lettre nom) + {nom[0]?.toUpperCase()} (nom) + 4 chiffres
            </div>
          </div>
        )}
        {niveauxScolaires.length > 0 && (
          <div className={CLS.field}>
            <label htmlFor="eleve_classe" className={CLS.label}>Classe (optionnel)</label>
            <select id="eleve_classe" className={`${CLS.input} cursor-pointer`} value={classeId} onChange={e => setClasseId(e.target.value)}>
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
        <div className={CLS.field}>
          <label className={CLS.label}>Email de contact <span style={{ color:'var(--a-fg-light)', fontWeight:400, textTransform:'none' }}>(facultatif — pour envoi des identifiants)</span></label>
          <input
            className={CLS.input}
            type="email"
            value={emailContact}
            onChange={e => setEmailContact(e.target.value)}
            placeholder="parent@email.com"
          />
        </div>
        <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.5, marginBottom:12 }}>
          Un mot de passe provisoire sera généré automatiquement. L'élève devra le modifier à sa première connexion.
        </div>
        <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer text-[13px] mb-3 transition-all duration-150"
          style={{
            background: inactif ? 'rgba(255,159,10,0.08)' : 'transparent',
            border: `1px solid ${inactif ? 'rgba(255,159,10,0.35)' : 'var(--a-border)'}`,
            color: inactif ? 'var(--a-yellow)' : 'var(--a-fg-mid)',
          }}>
          <input
            type="checkbox"
            checked={inactif}
            onChange={e => setInactif(e.target.checked)}
            className="w-[15px] h-[15px] cursor-pointer"
            style={{ accentColor:'var(--a-yellow)' }}
          />
          Inactif pour l'instant — l'élève ne pourra pas se connecter avant activation
        </label>
        {error && <div style={{ color:'var(--a-red)', fontSize:13, marginTop:8 }}>{error}</div>}
        <div className={CLS.btnRow}>
          <button className={CLS.btnCancel} onClick={onClose}>Annuler</button>
          <button className={CLS.btnSave} disabled={loading || !valid} onClick={handleSubmit}>
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </div>
  );
}
