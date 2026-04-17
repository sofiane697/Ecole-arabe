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
// Tailwind class strings (static styles migrated from inline)
const CLS = {
  page: 'min-h-full',
  header: 'flex justify-between items-center mb-6',
  headerTitle: 'text-sm text-a-fg-mid font-medium',
  addBtn: 'inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded-full border-none bg-a-gold text-white text-[13px] font-semibold cursor-pointer transition-opacity duration-200',
  grid: 'grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3',
  card: 'bg-a-bg-card rounded-a border border-a-border p-[18px] flex items-center gap-3.5 cursor-pointer transition-[transform,box-shadow] duration-150',
  avatar: 'w-[42px] h-[42px] rounded-full bg-a-gold text-white flex items-center justify-center text-base font-bold shrink-0 uppercase tracking-tight',
  info: 'flex-1 min-w-0',
  name: 'font-semibold text-a-fg text-sm',
  email: 'text-xs text-a-fg-mid mt-0.5',
  date: 'text-[11px] text-a-fg-light mt-1',
  // Modal
  overlay: 'fixed inset-0 flex items-center justify-center z-[1000]',
  modal: 'bg-a-bg-card rounded-a p-7 w-full max-w-[460px] border border-a-border',
  modalTitle: 'font-a-display text-lg font-bold text-a-fg mb-5',
  field: 'mb-4',
  label: 'block text-xs font-semibold text-a-fg-mid mb-1.5 uppercase tracking-wide',
  input: 'w-full px-3.5 py-2.5 rounded-a-sm border border-a-border bg-[var(--a-bg-input)] text-a-fg text-sm outline-none box-border',
  btnRow: 'flex gap-2.5 justify-end mt-5',
  btnCancel: 'px-5 py-[9px] rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer',
  btnSave: 'px-5 py-[9px] rounded-full border-none bg-a-gold text-white text-[13px] font-semibold cursor-pointer',
  error: 'text-a-red text-[13px] mt-2',
  empty: 'text-center py-12 px-5 text-a-fg-mid text-sm',
  // Barre recherche / filtres
  toolbar: 'flex gap-2.5 items-center mb-5 flex-wrap',
  searchWrap: 'relative flex-1 min-w-[200px]',
  searchInput: 'w-full py-[9px] pr-3.5 pl-9 rounded-full border border-a-border bg-[var(--a-bg-input)] text-a-fg text-[13px] outline-none box-border',
  searchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 text-a-fg-light pointer-events-none',
  sortSelect: 'px-3 py-2 rounded-full border border-a-border bg-[var(--a-bg-input)] text-a-fg-mid text-xs font-semibold cursor-pointer outline-none',
  // Detail
  breadcrumb: 'flex items-center gap-2 mb-6 cursor-pointer text-a-fg-mid text-sm font-medium',
  detailHeader: 'flex items-center gap-4 mb-7 p-5 bg-a-bg-card rounded-a border border-a-border',
  detailAvatar: 'w-14 h-14 rounded-full bg-a-gold text-white flex items-center justify-center text-[22px] font-bold',
  detailName: 'text-xl font-bold text-a-fg',
  detailEmail: 'text-[13px] text-a-fg-mid mt-0.5',
  progressCard: 'bg-a-bg-card rounded-a-sm border border-a-border p-4 mb-2.5',
  progressTitle: 'font-semibold text-a-fg text-sm mb-2',
  progressBar: 'h-1.5 rounded-sm bg-a-border overflow-hidden mt-2',
  progressText: 'text-xs text-a-fg-mid mt-1.5 flex justify-between',
  toggleBtn: 'px-4 py-2 rounded-full border border-a-border bg-transparent text-a-fg-mid text-xs font-semibold cursor-pointer ml-auto',
  exportBtn: 'inline-flex items-center gap-1.5 px-[18px] py-[9px] rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer transition-all duration-200',
};
// Dynamic styles that must remain inline
const S = {
  badge: (active) => ({ background: active ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.12)', color: active ? 'var(--a-green)' : 'var(--a-red)' }),
  overlay: { background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' },
  progressFill: (pct) => ({ background: pct >= 100 ? 'var(--a-green)' : 'var(--a-gold)', width:`${pct}%`, transition:'width .4s var(--a-ease-out)' }),
  filterBtn: (active) => ({ background: active ? 'var(--a-gold)' : 'transparent', color: active ? '#fff' : 'var(--a-fg-mid)', borderColor: active ? 'var(--a-gold)' : 'var(--a-border)' }),
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
        {error && <p className="text-a-red text-[13px] mb-3">{error}</p>}

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
              <div className="h-px bg-a-border my-2 mb-4" />
              <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-3">Contact (optionnel)</div>
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
              <div className="h-px bg-a-border my-2 mb-4" />
              <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-3">Classe (optionnel)</div>
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
              <div className="text-xs text-a-fg-mid mb-4 leading-normal">
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
            message={<span>Le compte de <strong>{confirmDelete.prenom} {confirmDelete.nom}</strong> sera définitivement supprimé, ainsi que toute sa progression.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>}
            confirmLabel="Supprimer définitivement"
            onConfirm={handleConfirmDelete}
            onCancel={() => setConfirmDelete(null)}
          />
        )}

        {/* ─── Modal résultat reset mot de passe ─── */}
        {resetResult && (
          <div className={CLS.overlay} style={S.overlay} onClick={() => setResetResult(null)}>
            <div className={`${CLS.modal} !max-w-[440px]`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🔑</div>
                <div className={CLS.modalTitle}>Nouveau mot de passe généré</div>
              </div>
              <div className="bg-a-bg rounded-a-sm p-5 mb-4">
                <div className="mb-3.5">
                  <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Élève</div>
                  <div className="text-[15px] font-semibold text-a-fg">{resetResult.prenom} {resetResult.nom}</div>
                </div>
                <div className="mb-3.5">
                  <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Identifiant</div>
                  <div className="text-lg font-bold text-a-gold font-a-mono tracking-wider">{resetResult.identifiant}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Nouveau mot de passe provisoire</div>
                  <div className="text-lg font-bold text-a-red font-a-mono tracking-wider">{resetResult.tempPassword}</div>
                </div>
              </div>
              <div className="text-xs text-a-fg-mid leading-relaxed mb-3">
                ⚠️ L'élève devra changer ce mot de passe à sa prochaine connexion.
              </div>
              {resetResult.emailSent ? (
                <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 mb-4 text-xs" style={{ background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.3)' }}>
                  <span className="text-base">✉️</span>
                  <span className="text-a-green leading-normal">
                    Mail envoyé avec les identifiants et mot de passe provisoire<br />
                    <strong className="font-a-mono">{resetResult.emailSent}</strong>
                  </span>
                </div>
              ) : resetResult.emailSent === null ? (
                <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 mb-4 text-xs" style={{ background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)', color:'var(--a-yellow)' }}>
                  <span className="text-base">⚠️</span>
                  Aucun email de contact — transmettez les identifiants manuellement.
                </div>
              ) : null}
              <div className="flex gap-2 justify-center flex-wrap">
                <button className={`${CLS.btnSave} !text-xs !px-4 !py-[9px]`} onClick={() => {
                  navigator.clipboard.writeText(`Identifiant : ${resetResult.identifiant}\nMot de passe : ${resetResult.tempPassword}`);
                  alert('Copié !');
                }}>📋 Copier</button>
                <button className="px-4 py-[9px] rounded-full border-none bg-[#25D366] text-white text-xs font-semibold cursor-pointer" onClick={() => {
                  const msg = encodeURIComponent(
                    `🕌 Institut As-Safaa — Portail Élève\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/portail/login\n\n⚠️ Changez votre mot de passe à la connexion.`
                  );
                  window.open(`https://wa.me/?text=${msg}`, '_blank');
                }}>💬 WhatsApp</button>
                <button className={`${CLS.btnCancel} !text-xs !px-4 !py-[9px]`} onClick={() => setResetResult(null)}>Fermer</button>
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
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {[
                { label:'Modules', value: modules.length },
                { label:'Niveaux réussis', value: totalQCM > 0 ? `${totalReussis} / ${totalQCM}` : '—' },
                { label:'Progression globale', value: totalQCM > 0 ? `${pctGlobal}%` : '—', color: pctGlobal >= 100 ? 'var(--a-green)' : pctGlobal > 0 ? 'var(--a-gold)' : 'var(--a-fg-light)' },
              ].map(s => (
                <div key={s.label} className="bg-a-bg border border-a-border rounded-a-sm px-4 py-3 text-center">
                  <div className="text-xl font-bold" style={{ color: s.color || 'var(--a-fg)' }}>{s.value}</div>
                  <div className="text-[11px] text-a-fg-light mt-0.5 uppercase tracking-wide">{s.label}</div>
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
            <div className="w-[300px] shrink-0 bg-a-bg-card border border-a-border rounded-a-sm p-4">
              <div className="flex justify-between items-center mb-3.5">
                <div className="font-semibold text-a-fg text-[13px]">{detailModule.titre}</div>
                <button onClick={() => setDetailModule(null)} className="bg-none border-none cursor-pointer text-a-fg-light text-lg leading-none p-0.5">×</button>
              </div>
              <div className="flex flex-col gap-2">
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
                    <div key={n.id} className="bg-a-bg rounded-a-sm px-3 py-2.5 border border-a-border">
                      <div className="flex justify-between items-center" style={{ marginBottom: score != null ? 8 : 0 }}>
                        <span className="text-xs font-semibold text-a-fg flex-1 mr-2">{n.titre}</span>
                        <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: statusColor }}>{statusLabel}</span>
                      </div>
                      {score != null && (
                        <>
                          <div className="h-1 rounded-sm bg-a-border overflow-hidden mb-1.5">
                            <div className="h-full rounded-sm" style={{ background: reussi ? 'var(--a-green)' : score >= 60 ? 'var(--a-gold)' : 'var(--a-red)', width:`${score}%`, transition:'width .3s' }} />
                          </div>
                          <div className="flex justify-between text-[11px] text-a-fg-light">
                            <span>{tentatives} tentative{tentatives > 1 ? 's' : ''}</span>
                            <span className="font-bold" style={{ color: reussi ? 'var(--a-green)' : score >= 60 ? 'var(--a-gold)' : 'var(--a-red)' }}>{score}%</span>
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
              <div className="grid grid-cols-4 gap-2.5 mb-4">
                {[
                  { label:'Visites',           value: activiteLoading ? '…' : totalVisites,              color:'var(--a-blue)' },
                  { label:'Temps total',        value: activiteLoading ? '…' : fmtDuration(totalSecs),   color:'var(--a-gold)' },
                  { label:'Durée moyenne',      value: activiteLoading ? '…' : fmtDuration(avgSecs),     color:'var(--a-green)' },
                  { label:'Dernière déconnexion', value: activiteLoading ? '…' : lastSession,             color:'var(--a-fg-mid)' },
                ].map(card => (
                  <div key={card.label} className="bg-a-bg border border-a-border rounded-a-sm px-3.5 py-3 text-center">
                    <div className="text-lg font-bold" style={{ color: card.color }}>{card.value}</div>
                    <div className="text-[11px] text-a-fg-light mt-0.5 uppercase tracking-wide">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Tableau des sessions */}
              {!activiteLoading && activite.length === 0 ? (
                <div className="text-center px-5 py-7 text-a-fg-light text-[13px] bg-a-bg rounded-a-sm border border-a-border">
                  Aucune connexion sur cette période
                </div>
              ) : (
                <div className="bg-a-bg-card border border-a-border rounded-a-sm overflow-hidden">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-a-border">
                        {['Date & heure','Durée','Statut'].map(h => (
                          <th key={h} className="px-3.5 py-2 text-left text-[11px] font-semibold text-a-fg-light uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activiteLoading ? (
                        <tr><td colSpan={3} className="p-5 text-center text-a-fg-light">Chargement…</td></tr>
                      ) : activite.slice(0, 10).map(s => {
                        const duree = getDurationSec(s);
                        const termine = s.ended_at != null;
                        const dateStr = new Date(s.started_at).toLocaleDateString('fr-FR', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        });
                        return (
                          <tr key={s.id} className="border-b border-a-border">
                            <td className="px-3.5 py-[9px] text-a-fg">{dateStr}</td>
                            <td className="px-3.5 py-[9px] text-a-fg-mid font-semibold">{fmtDuration(duree)}</td>
                            <td className="px-3.5 py-[9px]">
                              <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-[20px]" style={{
                                background: termine ? 'rgba(48,209,88,.12)' : 'rgba(255,159,10,.12)',
                                color: termine ? 'var(--a-green)' : 'var(--a-yellow)',
                              }}>
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
        <span className={CLS.headerTitle}>{eleves.length} élève{eleves.length !== 1 ? 's' : ''} inscrit{eleves.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2.5">
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
          <button className="px-3 py-2 rounded-full border text-xs font-semibold cursor-pointer" style={S.filterBtn(filterActif === 'tous')}   onClick={() => { setFilterActif('tous'); setPage(0); }}>Tous</button>
          <button className="px-3 py-2 rounded-full border text-xs font-semibold cursor-pointer" style={S.filterBtn(filterActif === 'actif')}  onClick={() => { setFilterActif('actif'); setPage(0); }}>Actifs</button>
          <button className="px-3 py-2 rounded-full border text-xs font-semibold cursor-pointer" style={S.filterBtn(filterActif === 'inactif')} onClick={() => { setFilterActif('inactif'); setPage(0); }}>Inactifs</button>
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
                      <div className={CLS.email}>ID : <span className="font-a-mono font-semibold text-a-gold">{(e.identifiant || '').toUpperCase()}</span></div>
                      <div className={CLS.date}>Inscrit le {new Date(e.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <span className="inline-block text-[11px] font-semibold px-2.5 py-[3px] rounded-[20px]" style={S.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <button disabled={safePage === 0} onClick={() => setPage(p => p - 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-a-border bg-a-bg-card text-[13px]"
                  style={{ color:'var(--a-text)', cursor: safePage === 0 ? 'not-allowed' : 'pointer', opacity: safePage === 0 ? 0.4 : 1 }}>
                  ← Précédent
                </button>
                <span className="text-xs" style={{ color:'var(--a-muted)' }}>
                  Page {safePage + 1} / {totalPages} — {elevesFiltered.length} résultat{elevesFiltered.length !== 1 ? 's' : ''}
                </span>
                <button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                  className="px-3.5 py-1.5 rounded-lg border border-a-border bg-a-bg-card text-[13px]"
                  style={{ color:'var(--a-text)', cursor: safePage >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: safePage >= totalPages - 1 ? 0.4 : 1 }}>
                  Suivant →
                </button>
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
      <div className={CLS.overlay} style={S.overlay} onClick={onClose}>
        <div className={`${CLS.modal} !max-w-[480px]`} onClick={e => e.stopPropagation()}>
          <div className="text-center mb-5">
            <div className="text-[40px] mb-2">{result.inactif ? '⏳' : '✅'}</div>
            <div className={CLS.modalTitle}>{result.inactif ? 'Compte créé — en attente' : 'Compte créé avec succès'}</div>
          </div>
          <div className="bg-a-bg rounded-a-sm p-5 mb-4">
            <div className="mb-3.5">
              <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Élève</div>
              <div className="text-base font-semibold text-a-fg">{prenom} {nom}</div>
            </div>
            <div className="mb-3.5">
              <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Identifiant de connexion</div>
              <div className="text-lg font-bold text-a-gold font-a-mono tracking-wider">{result.identifiant}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">
                Mot de passe provisoire
                {pwdVisible && <span className="ml-2 text-a-fg-mid font-normal text-[10px]">masqué dans {countdown}s</span>}
              </div>
              <div className="text-lg font-bold text-a-red font-a-mono tracking-wider"
                style={{ cursor: pwdVisible ? 'default' : 'pointer' }}
                onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}>
                {pwdVisible ? result.tempPassword : <span className="text-[13px] text-a-fg-mid font-normal">●●●●●●●● (cliquer pour afficher)</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-a-fg-mid leading-relaxed mb-3 px-1">
            ⚠️ <strong>Notez ces identifiants</strong> — le mot de passe provisoire ne sera plus visible après fermeture.
            L'élève devra le modifier à sa première connexion.
          </div>
          {result.emailSent ? (
            <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 mb-4 text-xs" style={{ background:'rgba(48,209,88,0.1)', border:'1px solid rgba(48,209,88,0.3)' }}>
              <span className="text-base">✉️</span>
              <span className="text-a-green leading-normal">
                Mail envoyé avec les identifiants et mot de passe provisoire<br />
                <strong className="font-a-mono">{result.emailSent}</strong>
              </span>
            </div>
          ) : result.inactif && result.emailContact ? (
            <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 mb-4 text-xs text-a-yellow" style={{ background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)' }}>
              <span className="text-base">⏳</span>
              <span className="leading-normal">
                Les identifiants et le mot de passe provisoire seront envoyés à<br />
                <strong className="font-a-mono">{result.emailContact}</strong><br />
                lors du passage au statut actif.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 mb-4 text-xs text-a-yellow" style={{ background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)' }}>
              <span className="text-base">⚠️</span>
              Aucun email de contact — transmettez les identifiants manuellement.
            </div>
          )}
          <div className="flex gap-2 justify-center flex-wrap">
            <button className={`${CLS.btnSave} !px-[18px] !py-2.5 !text-xs`} onClick={() => {
              navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
              alert('Copié dans le presse-papier !');
            }}>
              📋 Copier
            </button>
            <button className="px-[18px] py-2.5 rounded-full border-none bg-[#25D366] text-white text-xs font-semibold cursor-pointer" onClick={() => {
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
            <button className="px-[18px] py-2.5 rounded-full border border-a-border bg-transparent text-a-fg-mid text-xs font-semibold cursor-pointer" onClick={() => {
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
            <button className={`${CLS.btnCancel} !px-[18px] !py-2.5 !text-xs`} onClick={() => { onCreated(); }}>
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vue formulaire ────────────────────────────────────────────────
  return (
    <div className={CLS.overlay} style={S.overlay} onClick={onClose}>
      <div className={CLS.modal} onClick={e => e.stopPropagation()}>
        <div className={CLS.modalTitle}>Ajouter un élève</div>
        <div className="flex gap-3">
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_prenom" className={CLS.label}>Prénom *</label><input id="eleve_prenom" className={CLS.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" /></div>
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_nom" className={CLS.label}>Nom *</label><input id="eleve_nom" className={CLS.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" /></div>
        </div>
        {identifiant && (
          <div className={`${CLS.field} bg-a-bg rounded-a-sm px-4 py-3`}>
            <div className="text-[11px] font-semibold text-a-fg-light uppercase tracking-wide mb-1">Identifiant généré automatiquement</div>
            <div className="text-[17px] font-bold text-a-gold font-a-mono tracking-wider">{identifiant}</div>
            <div className="text-[11px] text-a-fg-light mt-1">
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
          <label className={CLS.label}>Email de contact <span className="text-a-fg-light font-normal normal-case">(facultatif — pour envoi des identifiants)</span></label>
          <input
            className={CLS.input}
            type="email"
            value={emailContact}
            onChange={e => setEmailContact(e.target.value)}
            placeholder="parent@email.com"
          />
        </div>
        <div className="text-xs text-a-fg-mid leading-normal mb-3">
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
        {error && <div className={CLS.error}>{error}</div>}
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
