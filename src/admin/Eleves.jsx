import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePageAnimation } from '../shared/usePageAnimation';
import { fetchEleves, createEleve, updateEleve, updateEleveNiveauScolaire, deleteEleve, updateEleveActif, resetElevePassword, fetchEleveProgression, fetchModules, fetchAllNiveauxForModule, fetchQCMNiveauxIds, fetchAllClasses, fetchNiveauxScolaires, fetchEleveActivite, fetchEleveIdParIdentifiant, uploadElevePhoto, deleteElevePhoto, fetchNotesEleve, fetchRetardsAbsencesEleve, fetchObservationsEleve, sendWelcomeEmail, adminCreateObservation, adminCreateRetardAbsence, adminFetchNoteAcks } from './supabaseAdmin';
import { dispatchPostCreationEmails } from './parentsMail';
import ConfirmModal from './ConfirmModal';
import { generateIdentifiant, generateTempPassword } from './adminUtils';
import { emptyBloc, isBlocUtilisable, processParentBlocs, checkDuplicatesOnSubmit } from './parentsLogic';
import ParentsSection, { ParentResults } from './ParentsSection';
import EleveParentsSection from './EleveParentsSection';
import { calcAge } from '../shared/dateUtils';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';
import EleveAvatar from '../shared/EleveAvatar';
import PhotoEditor from '../shared/PhotoEditor';

const PAGE_SIZE = 25;

// ─── Icônes ──────────────────────────────────────────────────────────────────
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconKey   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IconPause = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>;
const IconPlay  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IconPDF  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>;

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

// ─── Constantes Notes / Absences / Appréciations ───────────────────────────
const SCORE_LABEL = { 4: 'A+', 3: 'A', 2: 'ECA', 1: 'NA' };
const SCORE_SUB   = { 4: 'Acquis +', 3: 'Acquis', 2: 'En cours', 1: 'Non acquis' };
const SCORE_COLOR = { 4: 'var(--a-green)', 3: 'var(--a-gold)', 2: 'var(--a-yellow)', 1: 'var(--a-red)' };
const ABSENCE_CFG = {
  retard:  { label: 'Retard',  color: 'var(--a-yellow)', icon: '⏰' },
  absence: { label: 'Absence', color: 'var(--a-red)',    icon: '🚫' },
};
const OBS_CFG = {
  general:      { label: 'Général',      color: 'var(--a-blue)',   icon: '📋' },
  comportement: { label: 'Comportement', color: 'var(--a-yellow)', icon: '🧭' },
  progression:  { label: 'Progression',  color: 'var(--a-green)',  icon: '📈' },
};

const fmtDateFr = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Helpers JSX locaux pour les sections Notes / Absences / Appréciations ─
const EleveEmptyState = ({ children }) => (
  <div style={{ padding: 32, textAlign: 'center', color: 'var(--a-fg-light)', background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius-sm)', border: '1px solid var(--a-border)', fontSize: 13 }}>
    {children}
  </div>
);

const EleveStatCard = ({ value, color, children }) => (
  <div className="elv-stat-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="elv-stat-value" style={{ color }}>{value}</div>
    <div className="elv-stat-label">{children}</div>
  </div>
);

export default function Eleves({ variant = 'eleves' }) {
  const isAdulte = variant === 'etudiants';
  const nounS = isAdulte ? 'étudiant'  : 'élève';
  const nounP = isAdulte ? 'étudiants' : 'élèves';
  const [eleves, setEleves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEleve, setSelectedEleve] = useState(null);
  const [progression, setProgression] = useState([]);
  const [modules, setModules] = useState([]);
  const [notes, setNotes]               = useState([]);
  const [noteAcks, setNoteAcks]         = useState([]);
  const [absences, setAbsences]         = useState([]);
  const [observations, setObservations] = useState([]);
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
  const [editForm, setEditForm] = useState({ prenom:'', nom:'', telephone:'', email_contact:'', classe_id:'', date_naissance:'', photo_url:null, photo_path:null, photo_scale:1, photo_pos_x:50, photo_pos_y:50 });
  const [editLoading, setEditLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [confirmRemovePhoto, setConfirmRemovePhoto] = useState(false);
  const photoInputRef = useRef(null);
  const pageRef = useRef(null);
  usePageAnimation(pageRef, []);
  const [allClasses, setAllClasses] = useState([]);
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);
  const [detailModule, setDetailModule] = useState(null); // module ouvert dans le panneau latéral
  const [activitePeriode, setActivitePeriode] = useState('30j');
  const [activite, setActivite] = useState([]);
  const [activiteLoading, setActiviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [obsForm, setObsForm]       = useState(null);
  const [obsSubmitting, setObsSub]  = useState(false);
  const [absForm, setAbsForm]       = useState(null);
  const [absSub, setAbsSub]         = useState(false);

  const loadEleves = useCallback(async () => {
    // Séparation étudiants (adultes) / élèves (enfants) via le marqueur est_adulte.
    try { setEleves((await fetchEleves()).filter(e => (isAdulte ? e.est_adulte : !e.est_adulte))); } catch(e) {}
  }, [isAdulte]);

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
  // Token de génération : protège contre les changements rapides d'élève.
  // Si l'admin clique sur A puis B avant la fin du fetch de A, on ignore les
  // setters de A pour éviter qu'ils n'écrasent les données de B.
  const openEleveTokenRef = useRef(0);
  const openEleve = async (eleve) => {
    const token = ++openEleveTokenRef.current;
    setSelectedEleve(eleve);
    setModules([]);
    setProgression([]);
    setNiveauxMap({});
    setQcmNiveauxIds(new Set());
    setNotes([]);
    setNoteAcks([]);
    setAbsences([]);
    setObservations([]);
    setAbsForm(null);
    setObsForm(null);
    try {
      const mods = await fetchModules();
      if (token !== openEleveTokenRef.current) return;
      setModules(mods);
      const logFetchErr = (label) => (e) => { console.warn(`[openEleve] ${label}`, e); return []; };
      const [prog, nivMap, nts, abs, obs, acks] = await Promise.all([
        fetchEleveProgression(eleve.id).catch(logFetchErr('progression')),
        Promise.all(mods.map(async (m) => {
          try { return [m.id, await fetchAllNiveauxForModule(m.id)]; } catch { return [m.id, []]; }
        })).then(entries => Object.fromEntries(entries)),
        fetchNotesEleve(eleve.id).catch(logFetchErr('notes')),
        fetchRetardsAbsencesEleve(eleve.id).catch(logFetchErr('absences')),
        fetchObservationsEleve(eleve.id).catch(logFetchErr('observations')),
        adminFetchNoteAcks(eleve.id).catch(logFetchErr('noteAcks')),
      ]);
      if (token !== openEleveTokenRef.current) return;
      setProgression(prog);
      setNiveauxMap(nivMap);
      setNotes(nts);
      setNoteAcks(Array.isArray(acks) ? acks : []);
      setAbsences(abs);
      setObservations(obs);
      // Charger quels niveaux ont un QCM (même logique que le portail élève)
      const allNiveauIds = Object.values(nivMap).flat().map(n => n.id);
      const qcmIds = await fetchQCMNiveauxIds(allNiveauIds).catch((e) => { console.warn('[openEleve] qcmIds', e); return new Set(); });
      if (token !== openEleveTokenRef.current) return;
      setQcmNiveauxIds(qcmIds);
    } catch(e) { console.warn('[openEleve] modules', e); }
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
            classeNom:   allClasses.find(c => c.id === eleve.classe_id)?.nom || null,
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
    setPhotoError('');
    setEditForm({
      prenom: eleve.prenom || '',
      nom: eleve.nom || '',
      telephone: eleve.telephone || '',
      email_contact: eleve.email_contact || '',
      classe_id: eleve.classe_id || '',
      date_naissance: eleve.date_naissance ? eleve.date_naissance.slice(0, 10) : '',
      photo_url: eleve.photo_url || null,
      photo_path: eleve.photo_path || null,
      photo_scale: Number(eleve.photo_scale ?? 1),
      photo_pos_x: Number(eleve.photo_pos_x ?? 50),
      photo_pos_y: Number(eleve.photo_pos_y ?? 50),
    });
  };

  const handleSelectPhoto = async (file) => {
    if (!file || !editEleve) return;
    setPhotoError('');
    setPhotoUploading(true);
    try {
      // L'Edge Function "eleve-photo" upload + met à jour profils_eleves atomiquement.
      const { photo_url, photo_path } = await uploadElevePhoto(editEleve.id, file);
      // Reset du cadrage : l'ancien offset/zoom ne fait aucun sens sur une nouvelle image.
      const reset = { photo_url, photo_path, photo_scale: 1, photo_pos_x: 50, photo_pos_y: 50 };
      await updateEleve(editEleve.id, { photo_scale: 1, photo_pos_x: 50, photo_pos_y: 50 });
      setEditForm(f => ({ ...f, ...reset }));
      setSelectedEleve(prev => prev && prev.id === editEleve.id ? { ...prev, ...reset } : prev);
      setEleves(prev => prev.map(e => e.id === editEleve.id ? { ...e, ...reset } : e));
    } catch (e) {
      setPhotoError(e.message || 'Erreur lors de l\'upload de la photo.');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleCropChange = async (photo_scale, photo_pos_x, photo_pos_y) => {
    if (!editEleve) return;
    // No-op si rien n'a changé (évite un PATCH inutile après setState des mêmes valeurs).
    if (
      photo_scale === editForm.photo_scale &&
      photo_pos_x === editForm.photo_pos_x &&
      photo_pos_y === editForm.photo_pos_y
    ) return;
    // Sauvegarde des anciennes valeurs pour rollback en cas d'échec DB.
    const prev = {
      photo_scale: editForm.photo_scale,
      photo_pos_x: editForm.photo_pos_x,
      photo_pos_y: editForm.photo_pos_y,
    };
    const patch = { photo_scale, photo_pos_x, photo_pos_y };
    setEditForm(f => ({ ...f, ...patch }));
    setSelectedEleve(p => p && p.id === editEleve.id ? { ...p, ...patch } : p);
    setEleves(list => list.map(e => e.id === editEleve.id ? { ...e, ...patch } : e));
    try {
      await updateEleve(editEleve.id, patch);
    } catch (e) {
      // Rollback UI vers la dernière valeur connue côté DB pour éviter un drift.
      setEditForm(f => ({ ...f, ...prev }));
      setSelectedEleve(p => p && p.id === editEleve.id ? { ...p, ...prev } : p);
      setEleves(list => list.map(x => x.id === editEleve.id ? { ...x, ...prev } : x));
      setPhotoError(e.message || 'Erreur lors de la sauvegarde du cadrage.');
    }
  };

  const handleRemovePhoto = async () => {
    if (!editEleve) return;
    setPhotoError('');
    setPhotoUploading(true);
    try {
      // L'Edge Function purge le storage et met photo_url/path à null en DB.
      await deleteElevePhoto(editEleve.id);
      setEditForm(f => ({ ...f, photo_url: null, photo_path: null }));
      setSelectedEleve(prev => prev && prev.id === editEleve.id ? { ...prev, photo_url: null, photo_path: null } : prev);
      setEleves(prev => prev.map(e => e.id === editEleve.id ? { ...e, photo_url: null, photo_path: null } : e));
    } catch (e) {
      setPhotoError(e.message || 'Erreur lors de la suppression.');
    } finally {
      setPhotoUploading(false);
    }
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
      // Le cadrage (photo_scale/pos_x/pos_y) est commité en temps réel via handleCropChange
      // et photo_url/path via l'Edge Function : on n'a pas besoin de les re-envoyer ici,
      // cela écraserait potentiellement des modifs concurrentes.
      await Promise.all([
        updateEleve(editEleve.id, {
          prenom: cleanPrenom,
          nom: cleanNom,
          telephone: editForm.telephone.trim() || null,
          email_contact: editForm.email_contact.trim() || null,
          classe_id: classeId,
          date_naissance: editForm.date_naissance || null,
        }),
        updateEleveNiveauScolaire(editEleve.id, niveauScolaireId),
      ]);
      const updated = { ...editEleve, prenom: cleanPrenom, nom: cleanNom, telephone: editForm.telephone.trim() || null, email_contact: editForm.email_contact.trim() || null, classe_id: classeId, niveau_scolaire_id: niveauScolaireId, date_naissance: editForm.date_naissance || null, photo_url: editForm.photo_url, photo_path: editForm.photo_path, photo_scale: editForm.photo_scale, photo_pos_x: editForm.photo_pos_x, photo_pos_y: editForm.photo_pos_y };
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
    const age = calcAge(selectedEleve.date_naissance);
    return (
      <div className={CLS.page}>
        <div className={CLS.breadcrumb} onClick={() => setSelectedEleve(null)}>
          <IconBack /> <span>Retour à la liste</span>
        </div>
        {error && <p style={{ color:'var(--a-red)', fontSize:13, marginBottom:12 }}>{error}</p>}

        <div className="elv-detail-header">
          <div className="elv-detail-top">
            <EleveAvatar eleve={selectedEleve} variant="detail" />
            <div className="elv-detail-body">
              <div className="elv-detail-name">{fmtPrenom(selectedEleve.prenom || '')} {fmtNom(selectedEleve.nom || '')}</div>
              <div className="elv-detail-id">ID · {(selectedEleve.identifiant || '').toUpperCase()}</div>
              {(selectedEleve.classe_id || selectedEleve.telephone || selectedEleve.email_contact || age != null) && (
                <div className="elv-detail-meta">
                  {selectedEleve.classe_id && (() => {
                    const cl = allClasses.find(c => c.id === selectedEleve.classe_id);
                    const nv = cl ? niveauxScolaires.find(n => n.id === cl.niveau_id) : null;
                    return cl ? (
                      <span className="elv-detail-meta-item gold">🏫 {nv ? `${nv.nom} — ` : ''}{cl.nom}</span>
                    ) : null;
                  })()}
                  {age != null && (
                    <span className="elv-detail-meta-item">🎂 {age} an{age > 1 ? 's' : ''}</span>
                  )}
                  {selectedEleve.telephone && (
                    <span className="elv-detail-meta-item">📞 {selectedEleve.telephone}</span>
                  )}
                  {selectedEleve.email_contact && (
                    <span className="elv-detail-meta-item">✉️ {selectedEleve.email_contact}</span>
                  )}
                </div>
              )}
            </div>
            <span style={S.badge(selectedEleve.actif)}>{selectedEleve.actif ? 'Actif' : 'Inactif'}</span>
          </div>
          <div className="elv-detail-divider" />
          <div className="elv-detail-actions">
            <button className="elv-action-btn edit" onClick={() => handleOpenEdit(selectedEleve)}>
              <IconEdit /> Modifier
            </button>
            <button className="elv-action-btn reset" onClick={() => handleResetPassword(selectedEleve)}>
              <IconKey /> Réinitialiser le mot de passe
            </button>
            <button className="elv-action-btn toggle" onClick={() => handleToggleActif(selectedEleve)}>
              {selectedEleve.actif ? <><IconPause /> Désactiver</> : <><IconPlay /> Activer</>}
            </button>
            <button className="elv-action-btn delete" onClick={() => setConfirmDelete(selectedEleve)}>
              <IconTrash /> Supprimer
            </button>
            <button className="elv-action-btn pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
              <IconPDF /> {pdfLoading ? 'Génération...' : 'Télécharger la fiche PDF'}
            </button>
          </div>
        </div>

        {/* ─── Parents rattachés à cet élève (masqué pour un étudiant adulte) ─── */}
        {!isAdulte && (
          <EleveParentsSection
            eleveId={selectedEleve.id}
            onChanged={loadEleves}
          />
        )}

        {/* ─── Modal modifier nom/prénom ─── */}
        {editEleve && (
          <div className={CLS.overlay} style={S.overlay} onClick={() => setEditEleve(null)}>
            <div className={`${CLS.modal} !max-w-[400px] max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <div className={CLS.modalTitle}>✏️ Modifier l'élève</div>

              <div className="elv-edit-photo-zone">
                {editForm.photo_url ? (
                  <PhotoEditor
                    // Remount sur changement de photo : les props initiales du composant
                    // ne sont lues qu'au montage, donc on force un re-init quand l'URL change.
                    key={editForm.photo_url}
                    photoUrl={editForm.photo_url}
                    scale={editForm.photo_scale}
                    posX={editForm.photo_pos_x}
                    posY={editForm.photo_pos_y}
                    onChange={handleCropChange}
                    size={160}
                    disabled={photoUploading}
                  />
                ) : (
                  <EleveAvatar
                    eleve={{ prenom: editForm.prenom, nom: editForm.nom, photo_url: null }}
                    variant="detail"
                    size={110}
                  />
                )}
                <div className="elv-edit-photo-actions">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => handleSelectPhoto(e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    className="elv-edit-photo-btn"
                    disabled={photoUploading}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    {photoUploading ? 'Téléchargement…' : (editForm.photo_url ? 'Changer la photo' : 'Ajouter une photo')}
                  </button>
                  {editForm.photo_url && !photoUploading && (
                    <button type="button" className="elv-edit-photo-btn danger" onClick={() => setConfirmRemovePhoto(true)}>
                      Supprimer
                    </button>
                  )}
                </div>
                {photoError && (
                  <div style={{ fontSize: 12, color: 'var(--a-red)', marginTop: 4, textAlign: 'center' }}>{photoError}</div>
                )}
                <div style={{ fontSize: 11, color: 'var(--a-fg-light)', marginTop: 4, textAlign: 'center' }}>
                  JPG, PNG ou WebP — 3 Mo max
                </div>
                <div style={{ fontSize: 11, color: 'var(--a-fg-light)', marginTop: 2, textAlign: 'center', fontStyle: 'italic' }}>
                  La photo est enregistrée dès l'upload.
                </div>
              </div>

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
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Informations personnelles (optionnel)</div>
              <div className={CLS.field}>
                <label className={CLS.label}>Date de naissance</label>
                <input
                  className={CLS.input}
                  type="date"
                  value={editForm.date_naissance}
                  onChange={e => setEditForm(f => ({ ...f, date_naissance: e.target.value }))}
                  max={new Date().toISOString().slice(0, 10)}
                />
                {(() => {
                  const ageEdit = calcAge(editForm.date_naissance);
                  return ageEdit != null ? (
                    <div style={{ fontSize: 12, color: 'var(--a-fg-mid)', marginTop: 4 }}>
                      Âge : {ageEdit} an{ageEdit > 1 ? 's' : ''}
                    </div>
                  ) : null;
                })()}
              </div>

              <div style={{ height:1, background:'var(--a-border)', margin:'0.5rem 0 1rem' }} />
              <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Classe (optionnel)</div>
              <div className={CLS.field}>
                <label className={CLS.label}>Classe</label>
                <select className={`${CLS.input} cursor-pointer`} value={editForm.classe_id} onChange={e => setEditForm(f => ({ ...f, classe_id: e.target.value }))}>
                  <option value="">— Aucune classe —</option>
                  {/* Élève → niveaux enfant ; étudiant → niveaux adulte. */}
                  {niveauxScolaires.filter(n => !!n.est_adulte === isAdulte).map(n => {
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

        {/* ─── Modal confirmation suppression photo ─── */}
        {confirmRemovePhoto && (
          <ConfirmModal
            title="Supprimer la photo ?"
            message={<span>La photo de profil sera retirée définitivement de la fiche élève.<br/>Cette action est immédiate.</span>}
            confirmLabel="Supprimer la photo"
            onConfirm={async () => { setConfirmRemovePhoto(false); await handleRemovePhoto(); }}
            onCancel={() => setConfirmRemovePhoto(false)}
          />
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
                    `🕌 Educamoov — Portail Élève\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/portail/login\n\n⚠️ Changez votre mot de passe à la connexion.`
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
            <div className="elv-stats-grid">
              {[
                { label:'Modules', value: modules.length, color: null },
                { label:'Niveaux réussis', value: totalQCM > 0 ? `${totalReussis} / ${totalQCM}` : '—', color: null },
                { label:'Progression globale', value: totalQCM > 0 ? `${pctGlobal}%` : '—', color: pctGlobal >= 100 ? 'var(--a-green)' : pctGlobal > 0 ? 'var(--a-gold)' : null },
              ].map(s => (
                <div key={s.label} className="elv-stat-card">
                  <div className="elv-stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
                  <div className="elv-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ─── Tableau récapitulatif ─── */}
        <div className="elv-section-title">Progression par module</div>

        <div className="flex gap-4 items-start">

          {/* Tableau */}
          <div className="flex-1 min-w-0 elv-table-card">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-a-border" style={{ background: 'var(--a-bg)' }}>
                  {[
                    { label: 'Module',       align: 'left'   },
                    { label: 'Niveaux QCM',  align: 'center' },
                    { label: 'Réussis',      align: 'center' },
                    { label: 'Moy. score',   align: 'center' },
                    { label: 'Statut',       align: 'left'   },
                    { label: '',             align: 'right'  },
                  ].map(h => (
                    <th key={h.label} style={{ padding:'10px 16px', textAlign: h.align, fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.length === 0 && (
                  <tr><td colSpan={6} style={{ padding:'28px', textAlign:'center', color:'var(--a-fg-light)' }}>Aucun module disponible.</td></tr>
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

                  let statutLabel, statutColor, statutBg, statutBorder;
                  if (totalN === 0)      { statutLabel = 'Sans QCM';      statutColor = 'var(--a-fg-light)'; statutBg = 'var(--a-bg)';           statutBorder = 'var(--a-border)'; }
                  else if (pct === 100)  { statutLabel = 'Terminé';       statutColor = 'var(--a-green)';    statutBg = 'rgba(48,209,88,.10)';    statutBorder = 'rgba(48,209,88,.22)'; }
                  else if (reussis > 0)  { statutLabel = 'En cours';      statutColor = 'var(--a-gold)';     statutBg = 'rgba(191,138,48,.10)';   statutBorder = 'rgba(191,138,48,.25)'; }
                  else                   { statutLabel = 'Non commencé';  statutColor = 'var(--a-fg-light)'; statutBg = 'var(--a-bg)';           statutBorder = 'var(--a-border)'; }

                  return (
                    <tr key={m.id} style={{ borderBottom:'1px solid var(--a-border)', background: isOpen ? 'rgba(191,138,48,.05)' : 'transparent', transition:'background .15s' }}>
                      <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--a-fg)' }}>{m.titre}</td>
                      <td style={{ padding:'12px 16px', color:'var(--a-fg-mid)', textAlign:'center' }}>{totalN > 0 ? totalN : <span style={{ color:'var(--a-fg-light)' }}>—</span>}</td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        {totalN > 0 ? (
                          <span style={{ fontWeight:700, color: pct === 100 ? 'var(--a-green)' : pct > 0 ? 'var(--a-gold)' : 'var(--a-fg-light)' }}>
                            {reussis} / {totalN}
                          </span>
                        ) : <span style={{ color:'var(--a-fg-light)' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        {moyScore != null ? (
                          <span style={{ fontWeight:700, color: moyScore >= 80 ? 'var(--a-green)' : moyScore >= 60 ? 'var(--a-gold)' : 'var(--a-red)' }}>{moyScore}%</span>
                        ) : <span style={{ color:'var(--a-fg-light)' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: statutBg, color: statutColor, border:`1px solid ${statutBorder}`, whiteSpace:'nowrap' }}>
                          {statutLabel}
                        </span>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'right' }}>
                        {totalN > 0 && (
                          <button
                            onClick={() => setDetailModule(isOpen ? null : { id: m.id, titre: m.titre, nivsAvecQCM })}
                            style={{ padding:'5px 12px', borderRadius:8, border:`1px solid ${isOpen ? 'rgba(191,138,48,.4)' : 'var(--a-border)'}`, background: isOpen ? 'rgba(191,138,48,.10)' : 'transparent', color: isOpen ? 'var(--a-gold)' : 'var(--a-fg-mid)', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', transition:'all .15s' }}
                          >
                            {isOpen ? 'Fermer ×' : 'Voir détail'}
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

        {/* ─── Section Notes ─── */}
        {(() => {
          const counts = notes.reduce((acc, n) => {
            if (!n.absent && n.score != null) acc[n.score] = (acc[n.score] || 0) + 1;
            return acc;
          }, {});
          return (
            <>
              <div className="elv-section-title" style={{ marginTop: 32 }}>Notes</div>
              <div className="elv-stats-grid">
                {[4, 3, 2, 1].map(score => (
                  <EleveStatCard key={score} value={counts[score] || 0} color={SCORE_COLOR[score]}>
                    {SCORE_LABEL[score]} <span style={{ color:'var(--a-fg-light)', fontWeight:400 }}>· {SCORE_SUB[score]}</span>
                  </EleveStatCard>
                ))}
              </div>
              {notes.length === 0 ? (
                <EleveEmptyState>Aucune note enregistrée pour l'instant.</EleveEmptyState>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notes.map(n => {
                    const nAcks = noteAcks.filter(a => a.note_id === n.id);
                    return (
                      <div key={n.id} style={{
                        padding: '14px 16px', borderRadius: 'var(--a-radius-sm)',
                        background: 'var(--a-bg-card)', border: '1px solid var(--a-border)',
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--a-fg)' }}>
                              {n.evaluation?.titre || 'Évaluation'}
                            </div>
                            {n.evaluation?.date && (
                              <div style={{ fontSize: 12, color: 'var(--a-fg-mid)', marginTop: 3 }}>
                                {fmtDateFr(n.evaluation.date)}
                              </div>
                            )}
                            {n.commentaire && (
                              <div style={{ fontSize: 13, color: 'var(--a-fg)', marginTop: 8, fontStyle: 'italic' }}>
                                « {n.commentaire} »
                              </div>
                            )}
                          </div>
                          {(() => {
                            const color = n.absent ? 'var(--a-fg-light)' : (SCORE_COLOR[n.score] || 'var(--a-fg-light)');
                            return (
                              <div style={{
                                padding: '6px 14px', borderRadius: 999,
                                background: `${color}22`,
                                color: n.absent ? 'var(--a-fg-mid)' : color,
                                fontSize: 14, fontWeight: 700,
                                minWidth: 50, textAlign: 'center',
                              }}>
                                {n.absent ? 'Abs.' : (SCORE_LABEL[n.score] || '—')}
                              </div>
                            );
                          })()}
                        </div>
                        {nAcks.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--a-border)', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {nAcks.map((a, i) => (
                              <span key={i} style={{ fontSize: 11, color: 'var(--a-fg-mid)' }}>
                                <span style={{ color: '#30d158', marginRight: 3 }}>✓</span>
                                {a.parent_label} · {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ─── Section Retards & absences ─── */}
        {(() => {
          const nbRetards  = absences.filter(i => i.type === 'retard').length;
          const nbAbsences = absences.filter(i => i.type === 'absence').length;
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 12 }}>
                <div className="elv-section-title" style={{ marginTop: 0 }}>Retards et absences</div>
                <button
                  onClick={() => setAbsForm(absForm ? null : { type: 'retard', date: '', commentaire: '', error: '' })}
                  className="elv-add-btn"
                >
                  {absForm ? '✕ Fermer' : '+ Ajouter'}
                </button>
              </div>
              {absForm && (
                <div className="elv-inline-form">
                  <div className="elv-inline-form-title">Nouveau retard / absence</div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                      <label className="elv-form-label">Type</label>
                      <select
                        value={absForm.type}
                        onChange={e => setAbsForm(f => ({ ...f, type: e.target.value, error: '' }))}
                        className="elv-form-input"
                      >
                        <option value="retard">⏱ Retard</option>
                        <option value="absence">🚫 Absence</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <label className="elv-form-label">Date *</label>
                      <input
                        type="date"
                        value={absForm.date}
                        onChange={e => setAbsForm(f => ({ ...f, date: e.target.value, error: '' }))}
                        className="elv-form-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="elv-form-label">Commentaire (optionnel)</label>
                    <textarea
                      value={absForm.commentaire}
                      onChange={e => setAbsForm(f => ({ ...f, commentaire: e.target.value }))}
                      rows={2}
                      placeholder="Précisions sur le retard ou l'absence…"
                      className="elv-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  {absForm.error && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--a-red)', background: 'rgba(231,76,60,0.08)', padding: '8px 12px', borderRadius: 'var(--a-radius-sm)' }}>
                      {absForm.error}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid var(--a-border)' }}>
                    <button onClick={() => setAbsForm(null)} className="a-modal-btn-cancel" disabled={absSub}>
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!absForm.date) return;
                        setAbsSub(true);
                        setAbsForm(f => ({ ...f, error: '' }));
                        try {
                          await adminCreateRetardAbsence({
                            eleve_id: selectedEleve.id,
                            classe_id: selectedEleve.classe_id ?? null,
                            type: absForm.type,
                            date: absForm.date,
                            commentaire: absForm.commentaire || null,
                          });
                          setAbsences(await fetchRetardsAbsencesEleve(selectedEleve.id));
                          setAbsForm(null);
                        } catch (err) {
                          setAbsForm(f => ({ ...f, error: err.message || 'Erreur lors de l\'enregistrement' }));
                        } finally {
                          setAbsSub(false);
                        }
                      }}
                      className="a-modal-btn-save"
                      disabled={absSub || !absForm.date}
                      style={{ opacity: (absSub || !absForm.date) ? 0.6 : 1, cursor: (absSub || !absForm.date) ? 'not-allowed' : 'pointer' }}
                    >
                      {absSub ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
              <div className="elv-stats-grid">
                <EleveStatCard value={nbRetards} color="var(--a-yellow)">Retard{nbRetards > 1 ? 's' : ''}</EleveStatCard>
                <EleveStatCard value={nbAbsences} color="var(--a-red)">Absence{nbAbsences > 1 ? 's' : ''}</EleveStatCard>
              </div>
              {absences.length === 0 ? (
                <EleveEmptyState>Aucun retard ni absence enregistré.</EleveEmptyState>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {absences.map(item => {
                    const cfg = ABSENCE_CFG[item.type] || { label: item.type, color: 'var(--a-fg-mid)', icon: '❓' };
                    return (
                      <div key={item.id} style={{
                        padding: '14px 16px', borderRadius: 'var(--a-radius-sm)',
                        background: 'var(--a-bg-card)', border: '1px solid var(--a-border)',
                        borderLeft: `4px solid ${cfg.color}`,
                        display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                      }}>
                        <div>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '3px 11px', borderRadius: 999,
                            background: `${cfg.color}22`, color: cfg.color,
                            fontSize: 12, fontWeight: 600, marginBottom: item.commentaire ? 8 : 0,
                          }}>
                            <span aria-hidden="true">{cfg.icon}</span> {cfg.label}
                          </div>
                          {item.commentaire && (
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--a-fg)', lineHeight: 1.55 }}>
                              {item.commentaire}
                            </p>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--a-fg-mid)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {fmtDateFr(item.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

        {/* ─── Section Appréciations ─── */}
        {(() => {
          const counts = observations.reduce((acc, o) => {
            acc[o.type] = (acc[o.type] || 0) + 1;
            return acc;
          }, {});
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 12 }}>
                <div className="elv-section-title" style={{ marginTop: 0 }}>Appréciations</div>
                <button
                  onClick={() => setObsForm(obsForm ? null : { type: 'general', contenu: '', error: '' })}
                  className="elv-add-btn"
                >
                  {obsForm ? '✕ Fermer' : '+ Ajouter une appréciation'}
                </button>
              </div>
              {obsForm && (
                <div className="elv-inline-form">
                  <div className="elv-inline-form-title">Nouvelle appréciation</div>
                  <div>
                    <label className="elv-form-label">Type</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {[
                        { value: 'general',      label: 'Général',      icon: '📋' },
                        { value: 'comportement', label: 'Comportement', icon: '⭐' },
                        { value: 'progression',  label: 'Progression',  icon: '📈' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setObsForm(f => ({ ...f, type: opt.value, error: '' }))}
                          style={{
                            flex: 1, padding: '7px 12px', borderRadius: 'var(--a-radius-sm)',
                            border: obsForm.type === opt.value ? '2px solid var(--a-gold)' : '1px solid var(--a-border)',
                            background: obsForm.type === opt.value ? 'rgba(191,138,48,0.12)' : 'var(--a-bg)',
                            color: obsForm.type === opt.value ? 'var(--a-gold)' : 'var(--a-fg-mid)',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="elv-form-label">Appréciation *</label>
                    <textarea
                      value={obsForm.contenu}
                      onChange={e => setObsForm(f => ({ ...f, contenu: e.target.value, error: '' }))}
                      rows={3}
                      placeholder="Saisissez votre appréciation…"
                      className="elv-form-input"
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  {obsForm.error && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--a-red)', background: 'rgba(231,76,60,0.08)', padding: '8px 12px', borderRadius: 'var(--a-radius-sm)' }}>
                      {obsForm.error}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4, borderTop: '1px solid var(--a-border)' }}>
                    <button onClick={() => setObsForm(null)} className="a-modal-btn-cancel" disabled={obsSubmitting}>
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!obsForm.contenu.trim()) return;
                        setObsSub(true);
                        setObsForm(f => ({ ...f, error: '' }));
                        try {
                          await adminCreateObservation({
                            eleve_id: selectedEleve.id,
                            classe_id: selectedEleve.classe_id ?? null,
                            type: obsForm.type,
                            contenu: obsForm.contenu,
                          });
                          setObservations(await fetchObservationsEleve(selectedEleve.id));
                          setObsForm(null);
                        } catch (err) {
                          setObsForm(f => ({ ...f, error: err.message || 'Erreur lors de l\'enregistrement' }));
                        } finally {
                          setObsSub(false);
                        }
                      }}
                      className="a-modal-btn-save"
                      disabled={obsSubmitting || !obsForm.contenu.trim()}
                      style={{ opacity: (obsSubmitting || !obsForm.contenu.trim()) ? 0.6 : 1, cursor: (obsSubmitting || !obsForm.contenu.trim()) ? 'not-allowed' : 'pointer' }}
                    >
                      {obsSubmitting ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}
              <div className="elv-stats-grid">
                {Object.entries(OBS_CFG).map(([key, cfg]) => (
                  <EleveStatCard key={key} value={counts[key] || 0} color={cfg.color}>
                    <span aria-hidden="true">{cfg.icon}</span> {cfg.label}
                  </EleveStatCard>
                ))}
              </div>
              {observations.length === 0 ? (
                <EleveEmptyState>Aucune appréciation pour l'instant.</EleveEmptyState>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {observations.map(obs => {
                    const cfg = OBS_CFG[obs.type] || { label: obs.type, color: 'var(--a-fg-mid)', icon: '📌' };
                    return (
                      <div key={obs.id} style={{
                        padding: '14px 16px', borderRadius: 'var(--a-radius-sm)',
                        background: 'var(--a-bg-card)', border: '1px solid var(--a-border)',
                        borderLeft: `4px solid ${cfg.color}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '3px 11px', borderRadius: 999,
                            background: `${cfg.color}22`, color: cfg.color,
                            fontSize: 12, fontWeight: 600,
                          }}>
                            <span aria-hidden="true">{cfg.icon}</span> {cfg.label}
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--a-fg-light)' }}>
                            {fmtDateFr(obs.created_at)}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--a-fg)', lineHeight: 1.55 }}>
                          {obs.contenu}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}

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
            <div style={{ marginTop:'2rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div className="elv-section-title" style={{ margin: 0 }}>Activité sur le portail</div>
                <div style={S.filterSegment}>
                  {PERIODES.map(p => (
                    <button key={p.key} onClick={() => setActivitePeriode(p.key)} style={S.filterOpt(activitePeriode === p.key)}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0.625rem', marginBottom:'1rem' }}>
                {[
                  { label:'Visites',         value: activiteLoading ? '…' : totalVisites,            color:'var(--a-blue)' },
                  { label:'Temps total',      value: activiteLoading ? '…' : fmtDuration(totalSecs), color:'var(--a-gold)' },
                  { label:'Durée moyenne',    value: activiteLoading ? '…' : fmtDuration(avgSecs),   color:'var(--a-green)' },
                  { label:'Dernière session', value: activiteLoading ? '…' : lastSession,             color:'var(--a-fg-mid)' },
                ].map(card => (
                  <div key={card.label} className="elv-stat-card">
                    <div className="elv-stat-value" style={{ color: card.color, fontSize:'1.1rem' }}>{card.value}</div>
                    <div className="elv-stat-label">{card.label}</div>
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
                      <tr style={{ borderBottom:'1px solid var(--a-border)', background:'var(--a-bg)' }}>
                        {['Date & heure','Durée','Statut'].map(h => (
                          <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activiteLoading ? (
                        <tr><td colSpan={3} style={{ padding:24, textAlign:'center', color:'var(--a-fg-light)' }}>Chargement…</td></tr>
                      ) : activite.slice(0, 10).map(s => {
                        const duree = getDurationSec(s);
                        const termine = s.ended_at != null;
                        const dateStr = new Date(s.started_at).toLocaleDateString('fr-FR', {
                          day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'
                        });
                        return (
                          <tr key={s.id} style={{ borderBottom:'1px solid var(--a-border)' }}>
                            <td style={{ padding:'11px 16px', color:'var(--a-fg)', fontSize:13 }}>{dateStr}</td>
                            <td style={{ padding:'11px 16px', color:'var(--a-fg-mid)', fontWeight:600, fontSize:13 }}>{fmtDuration(duree)}</td>
                            <td style={{ padding:'11px 16px' }}>
                              <span style={{ display:'inline-block', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:20, background: termine ? 'rgba(52,212,114,.10)' : 'rgba(255,159,10,.10)', color: termine ? 'var(--a-green)' : 'var(--a-yellow)', border:`1px solid ${termine ? 'rgba(52,212,114,.22)' : 'rgba(255,159,10,.25)'}` }}>
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
    a.download = `eleves-educamoov-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  async function handleDownloadPDF() {
    if (!selectedEleve) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { applyPlugin } = await import('jspdf-autotable');
      applyPlugin(jsPDF);

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;

      const GOLD  = [191, 138, 48];
      const DARK  = [50, 40, 30];
      const MID   = [110, 95, 75];
      const LIGHT = [245, 241, 233];
      const WHITE = [255, 255, 255];

      // ── En-tête ──
      doc.setFillColor(...GOLD);
      doc.rect(0, 0, pageW, 24, 'F');
      doc.setTextColor(...WHITE);
      doc.setFontSize(17);
      doc.setFont('helvetica', 'bold');
      doc.text('FICHE ÉLÈVE', margin, 11);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Educamoov — ENT', margin, 18);
      const dateGen = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(8);
      doc.text(`Généré le ${dateGen}`, pageW - margin, 18, { align: 'right' });

      let y = 32;

      // ── Infos élève ──
      const age = calcAge(selectedEleve.date_naissance);
      const cl = allClasses.find(c => c.id === selectedEleve.classe_id);
      const nv = cl ? niveauxScolaires.find(n => n.id === cl.niveau_id) : null;
      const classeNom = cl ? `${nv ? nv.nom + ' — ' : ''}${cl.nom}` : '—';

      doc.setFillColor(...LIGHT);
      doc.roundedRect(margin, y, contentW, 38, 3, 3, 'F');

      const col1x = margin + 5;
      const col2x = margin + contentW / 2 + 5;
      const labelW = 30;
      const infoRows = [
        [['Nom',         fmtNom(selectedEleve.nom || '')],                          ['Prénom',      fmtPrenom(selectedEleve.prenom || '')]],
        [['Identifiant', (selectedEleve.identifiant || '').toUpperCase()],           ['Classe',       classeNom]],
        [['Âge',    age ? `${age} an${age > 1 ? 's' : ''}` : '—'],         ['Email',        selectedEleve.email_contact || '—']],
        [['Statut',      selectedEleve.actif ? 'Actif' : 'Inactif'],                ['Inscrit le',   selectedEleve.created_at ? new Date(selectedEleve.created_at).toLocaleDateString('fr-FR') : '—']],
      ];

      let iy = y + 8;
      for (const row of infoRows) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MID);
        doc.text(row[0][0], col1x, iy);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(row[0][1], col1x + labelW, iy);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MID);
        doc.text(row[1][0], col2x, iy);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(row[1][1], col2x + labelW, iy);
        iy += 8;
      }
      y += 44;

      // ── Stats globales ──
      const totalQCM = modules.reduce((acc, m) => {
        return acc + (niveauxMap[m.id] || []).filter(n => qcmNiveauxIds.has(n.id)).length;
      }, 0);
      const totalReussis = modules.reduce((acc, m) => {
        const nivsAvecQCM = (niveauxMap[m.id] || []).filter(n => qcmNiveauxIds.has(n.id));
        return acc + nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
      }, 0);
      const pctGlobal = totalQCM > 0 ? Math.round((totalReussis / totalQCM) * 100) : 0;

      const statsW = (contentW - 4) / 3;
      [
        { label: 'MODULES',         value: String(modules.length) },
        { label: 'NIVEAUX RÉUSSIS', value: totalQCM > 0 ? `${totalReussis} / ${totalQCM}` : '—' },
        { label: 'PROGRESSION',     value: totalQCM > 0 ? `${pctGlobal}%` : '—' },
      ].forEach((s, i) => {
        const sx = margin + i * (statsW + 2);
        doc.setFillColor(...WHITE);
        doc.setDrawColor(...GOLD);
        doc.roundedRect(sx, y, statsW, 18, 2, 2, 'FD');
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(s.value, sx + statsW / 2, y + 9, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MID);
        doc.text(s.label, sx + statsW / 2, y + 15, { align: 'center' });
      });
      y += 24;

      const addSectionTitle = (title) => {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        doc.text(title, margin, y);
        doc.setDrawColor(...GOLD);
        doc.line(margin, y + 1.5, margin + contentW, y + 1.5);
        y += 6;
      };

      // ── Progression par module ──
      addSectionTitle('PROGRESSION PAR MODULE');
      const progRows = modules.map(m => {
        const nivsAvecQCM = (niveauxMap[m.id] || []).filter(n => qcmNiveauxIds.has(n.id));
        const totalN   = nivsAvecQCM.length;
        const reussis  = nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
        const scores   = nivsAvecQCM.map(n => progression.find(p => p.niveau_id === n.id)?.score).filter(s => s != null);
        const moyScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const pct      = totalN > 0 ? Math.round((reussis / totalN) * 100) : null;
        let statut;
        if (totalN === 0)     statut = 'Sans QCM';
        else if (pct === 100) statut = 'Terminé';
        else if (reussis > 0) statut = 'En cours';
        else                  statut = 'Non commencé';
        return [
          m.titre || '—',
          totalN > 0 ? String(totalN) : '—',
          totalN > 0 ? `${reussis}/${totalN}` : '—',
          moyScore != null ? `${moyScore}%` : '—',
          statut,
        ];
      });

      doc.autoTable({
        startY: y,
        head: [['Module', 'QCM', 'Réussis', 'Moy. score', 'Statut']],
        body: progRows.length > 0 ? progRows : [['Aucun module disponible', '', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 65 },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── Notes ──
      if (y > pageH - 65) { doc.addPage(); y = 20; }
      addSectionTitle('NOTES');

      // Récapitulatif A+/A/ECA/NA
      const noteCounts = { 4: 0, 3: 0, 2: 0, 1: 0, absent: 0 };
      notes.forEach(n => { if (n.absent) noteCounts.absent++; else if (n.score) noteCounts[n.score] = (noteCounts[n.score] || 0) + 1; });
      doc.autoTable({
        startY: y,
        body: [[
          `A+ (Acquis +) : ${noteCounts[4]}`,
          `A (Acquis) : ${noteCounts[3]}`,
          `ECA (En cours) : ${noteCounts[2]}`,
          `NA (Non acquis) : ${noteCounts[1]}`,
          `Absent : ${noteCounts.absent}`,
        ]],
        theme: 'plain',
        bodyStyles: { fontSize: 8, textColor: DARK, fontStyle: 'bold', fillColor: LIGHT, cellPadding: { top: 4, bottom: 4, left: 4, right: 2 } },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 3;

      doc.autoTable({
        startY: y,
        head: [['Évaluation', 'Date', 'Note', 'Score', 'Commentaire']],
        body: notes.length > 0 ? notes.map(n => [
          n.evaluation?.titre || 'Évaluation',
          n.evaluation?.date ? new Date(n.evaluation.date).toLocaleDateString('fr-FR') : '—',
          n.absent ? 'Absent' : (SCORE_LABEL[n.score] || '—'),
          n.absent ? '—' : (SCORE_SUB[n.score] || '—'),
          n.commentaire || '',
        ]) : [['Aucune note enregistrée', '', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 52 },
          1: { cellWidth: 26 },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 24 },
          4: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── Retards et Absences ──
      if (y > pageH - 55) { doc.addPage(); y = 20; }
      addSectionTitle('RETARDS ET ABSENCES');

      const nbRetards  = absences.filter(a => a.type === 'retard').length;
      const nbAbsences = absences.filter(a => a.type === 'absence').length;
      doc.autoTable({
        startY: y,
        body: [[`Retards : ${nbRetards}`, `Absences : ${nbAbsences}`, `Total : ${absences.length}`]],
        theme: 'plain',
        bodyStyles: { fontSize: 8, textColor: DARK, fontStyle: 'bold', fillColor: LIGHT, cellPadding: { top: 4, bottom: 4, left: 4, right: 2 } },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 3;

      doc.autoTable({
        startY: y,
        head: [['Type', 'Date', 'Commentaire']],
        body: absences.length > 0 ? absences.map(item => [
          item.type === 'retard' ? 'Retard' : 'Absence',
          item.date ? new Date(item.date).toLocaleDateString('fr-FR') : '—',
          item.commentaire || '',
        ]) : [['Aucun retard ni absence enregistré', '', '']],
        theme: 'grid',
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 28 },
          2: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 10;

      // ── Appréciations ──
      if (y > pageH - 45) { doc.addPage(); y = 20; }
      addSectionTitle('APPRÉCIATIONS');

      const OBS_LABEL = { general: 'Général', comportement: 'Comportement', progression: 'Progression' };
      const obsCounts = { general: 0, comportement: 0, progression: 0 };
      observations.forEach(o => { if (obsCounts[o.type] !== undefined) obsCounts[o.type]++; });
      doc.autoTable({
        startY: y,
        body: [[`Général : ${obsCounts.general}`, `Comportement : ${obsCounts.comportement}`, `Progression : ${obsCounts.progression}`]],
        theme: 'plain',
        bodyStyles: { fontSize: 8, textColor: DARK, fontStyle: 'bold', fillColor: LIGHT, cellPadding: { top: 4, bottom: 4, left: 4, right: 2 } },
        margin: { left: margin, right: margin },
      });
      y = doc.lastAutoTable.finalY + 3;

      doc.autoTable({
        startY: y,
        head: [['Type', 'Date', 'Appréciation']],
        body: observations.length > 0 ? observations.map(obs => [
          OBS_LABEL[obs.type] || obs.type,
          obs.created_at ? new Date(obs.created_at).toLocaleDateString('fr-FR') : '—',
          obs.contenu || '',
        ]) : [['Aucune appréciation enregistrée', '', '']],
        theme: 'grid',
        headStyles: { fillColor: GOLD, textColor: WHITE, fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: DARK },
        alternateRowStyles: { fillColor: LIGHT },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 28 },
          2: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });

      // ── Footer sur chaque page ──
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...LIGHT);
        doc.rect(0, pageH - 10, pageW, 10, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MID);
        doc.text('Educamoov — Document confidentiel', margin, pageH - 4);
        doc.text(`Page ${i} / ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' });
      }

      doc.save(`fiche-eleve-${(selectedEleve.identifiant || 'eleve').toLowerCase()}.pdf`);
    } catch (e) {
      setError('Erreur lors de la génération du PDF.');
      console.error(e);
    } finally {
      setPdfLoading(false);
    }
  };

  // ─── VUE LISTE ───────────────────────────────────────────────────────
  return (
    <div ref={pageRef} className={CLS.page}>
      <div className={CLS.header}>
        <div className={CLS.headerLeft}>
          <span className="a-section-count">{eleves.length} {eleves.length !== 1 ? nounP : nounS} inscrit{eleves.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={CLS.headerActions}>
          {elevesFiltered.length > 0 && (
            <button className={CLS.exportBtn} onClick={exportCSV}>⬇ Exporter CSV{elevesFiltered.length !== eleves.length ? ` (${elevesFiltered.length})` : ''}</button>
          )}
          <button className={CLS.addBtn} onClick={() => setShowModal(true)}><IconPlus /> Ajouter un {nounS}</button>
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

      {eleves.length === 0 && <div className={CLS.empty}>Aucun {nounS} pour le moment. Créez le premier compte.</div>}
      {eleves.length > 0 && elevesFiltered.length === 0 && (
        <div className={CLS.empty}>Aucun {nounS} ne correspond à votre recherche.</div>
      )}

      {(() => {
        const totalPages = Math.max(1, Math.ceil(elevesFiltered.length / PAGE_SIZE));
        const safePage   = Math.min(page, totalPages - 1);
        const paginated  = elevesFiltered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        return (
          <>
            <div className={CLS.grid}>
              {paginated.map(e => {
                return (
                  <div key={e.id} className={CLS.card} onClick={() => openEleve(e)}
                    onMouseEnter={ev => { ev.currentTarget.style.transform='translateY(-2px)'; ev.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,.12)'; }}
                    onMouseLeave={ev => { ev.currentTarget.style.transform=''; ev.currentTarget.style.boxShadow=''; }}>
                    <EleveAvatar eleve={e} variant="card" />
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

      {showModal && <CreateEleveModal isAdulte={isAdulte} onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadEleves(); }} />}
    </div>
  );
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text || '');
  return div.innerHTML;
}

// ─── Modal création élève ────────────────────────────────────────────────────
function CreateEleveModal({ onClose, onCreated, isAdulte = false }) {
  const nounS = isAdulte ? 'étudiant' : 'élève';
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
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

  // ─── Section Parents (ensemble / séparés, détection doublon) ──────────
  // `addParentsNow` : toggle pour rendre cette étape optionnelle. Par défaut
  // décoché — workflow recommandé : créer l'élève d'abord, puis rattacher les
  // parents depuis la fiche élève ou la page Parents.
  const [addParentsNow, setAddParentsNow] = useState(false);
  const [parentsMode, setParentsMode]   = useState('ensemble');
  const [parentsBlocs, setParentsBlocs] = useState([emptyBloc()]);
  const [parentResults, setParentResults] = useState([]);

  // ─── Âge / majorité — détermine si les comptes parents sont requis ────
  // Si l'élève est majeur, pas besoin de créer un compte parent : il gère
  // son compte seul.
  const age = calcAge(dateNaissance);
  const isMajor = age !== null && age >= 18;

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
    if (!dateNaissance) {
      setError("Renseigne la date de naissance de l'élève.");
      return;
    }
    // Parents : obligatoires uniquement si élève mineur ET addParentsNow coché.
    // Si `addParentsNow === false`, l'admin rattachera les parents plus tard.
    const skipParents  = isAdulte || isMajor || !addParentsNow;
    const blocsValides = skipParents ? [] : parentsBlocs.filter(isBlocUtilisable);
    if (!skipParents && blocsValides.length === 0) {
      setError("Renseigne au moins un parent (père ou mère) avec email et téléphone, ou décoche « Ajouter les parents maintenant ».");
      return;
    }

    // Bouton submit désactivé pendant TOUT le processus (check duplicate compris)
    // pour éviter un double-clic qui déclencherait 2 créations en parallèle.
    setLoading(true);

    // Dernier check duplicate (au cas où l'onBlur n'aurait pas eu lieu) — évite
    // les doublons silencieux si admin clique "Créer" avant le debounce.
    if (!skipParents) {
      const { refreshedBlocs, needsReview } = await checkDuplicatesOnSubmit(parentsBlocs);
      if (needsReview) {
        setParentsBlocs(refreshedBlocs);
        setError("Un parent existant correspond à un bloc. Utilisez la bannière jaune pour le rattacher, ou modifiez email/téléphone pour créer un nouveau compte.");
        setLoading(false);
        return;
      }
    }
    try {
      const tempPwd  = generateTempPassword();
      const idLogin  = identifiant.toLowerCase();
      const eleve    = await createEleve(fmtNom(nom), fmtPrenom(prenom), idLogin, tempPwd);
      const eleveId  = eleve?.id ?? await fetchEleveIdParIdentifiant(idLogin);
      // Sans eleveId on ne peut ni patcher la classe/email, ni rattacher les parents.
      // Mieux vaut remonter l'erreur que de laisser l'admin croire que tout s'est bien passé.
      if (!eleveId) throw new Error('Compte élève créé mais ID introuvable — réessayez.');

      const patch = {};
      if (isAdulte)              patch.est_adulte   = true;
      if (classeId)              patch.classe_id    = classeId;
      if (inactif)               patch.actif        = false;
      if (emailContact.trim())   patch.email_contact = emailContact.trim();
      if (dateNaissance)         patch.date_naissance = dateNaissance;
      if (Object.keys(patch).length) await updateEleve(eleveId, patch);
      if (classeId) {
        const niveauScolaireId = allClasses.find(c => c.id === classeId)?.niveau_id || null;
        await updateEleveNiveauScolaire(eleveId, niveauScolaireId);
      }

      // Créer / rattacher les parents (bloc par bloc, reporting partiel).
      const pResults = await processParentBlocs(eleveId, blocsValides);
      setParentResults(pResults);

      const classeNom = allClasses.find(c => c.id === classeId)?.nom || null;
      dispatchPostCreationEmails({
        contactEmail:      emailContact,
        elevePrenom:       fmtPrenom(prenom),
        eleveNom:          fmtNom(nom),
        eleveIdentifiant:  idLogin,
        eleveTempPassword: tempPwd,
        classeNom,
        parentResults:     pResults,
        sendWelcome:       !inactif,  // pas de welcome si l'élève reste inactif
      });

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

  const hasValidParent = parentsBlocs.some(isBlocUtilisable);
  // Un élève majeur n'a pas besoin de compte parent — on n'exige que nom/prénom/date.
  // Si `addParentsNow === false`, on ne bloque pas le submit sur les parents.
  const missingFields = [];
  if (prenom.trim().length < 2)   missingFields.push('prénom');
  if (nom.trim().length < 2)      missingFields.push('nom');
  if (!dateNaissance)             missingFields.push('date de naissance');
  if (!isAdulte && !isMajor && addParentsNow && !hasValidParent) {
    missingFields.push('un parent complet (nom, prénom, email, téléphone)');
  }
  const valid = missingFields.length === 0;

  // ─── Vue résultat (après création) ─────────────────────────────────
  if (result) {
    // Une fois l'élève créé, tout dismiss du modal doit rafraîchir la liste
    // (onCreated = loadEleves + setShowModal(false)). Sinon, un clic hors modal
    // ferme sans rafraîchir et le nouvel élève n'apparaît pas.
    return (
      <div className={CLS.overlay} onClick={onCreated}>
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

          {/* Identifiants des comptes parents créés / rattachés */}
          <ParentResults results={parentResults} />

          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginTop: 12 }}>
            <button className={CLS.btnSave} onClick={() => {
              navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
              alert('Copié dans le presse-papier !');
            }}>
              📋 Copier
            </button>
            <button style={{ padding:'8px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => {
              const msg = encodeURIComponent(
                `🕌 Educamoov — Portail Élève\n\n` +
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
                  <h1>Educamoov</h1>
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
      <div className={`${CLS.modal} max-h-[85vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className={CLS.modalTitle}>Ajouter un {nounS}</div>
        <div className="flex gap-3">
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_prenom" className={CLS.label}>Prénom *</label><input id="eleve_prenom" className={CLS.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Prénom" /></div>
          <div className={`${CLS.field} flex-1`}><label htmlFor="eleve_nom" className={CLS.label}>Nom *</label><input id="eleve_nom" className={CLS.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom" /></div>
        </div>
        <div className={CLS.field}>
          <label htmlFor="eleve_date_naissance" className={CLS.label}>
            Date de naissance *
            {age !== null && (
              <span style={{ color:'var(--a-fg-light)', fontWeight:400, textTransform:'none', marginLeft:8 }}>
                ({age} an{age > 1 ? 's' : ''}{isMajor ? ' — majeur' : ''})
              </span>
            )}
          </label>
          <input
            id="eleve_date_naissance"
            className={CLS.input}
            type="date"
            value={dateNaissance}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setDateNaissance(e.target.value)}
          />
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
              {/* Élève → niveaux enfant ; étudiant → niveaux adulte. */}
              {niveauxScolaires.filter(n => !!n.est_adulte === isAdulte).map(n => {
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

        {/* Section Parents — masquée pour un étudiant (adulte) ou un élève majeur. */}
        {!isAdulte && (
        <div className={CLS.field}>
          {isMajor ? (
            <>
              <label className={CLS.label}>Parents</label>
              <div style={{
                marginTop: 8,
                padding: '16px 18px',
                borderRadius: 12,
                background: 'var(--a-bg-card)',
                border: '1px solid var(--a-border)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span aria-hidden="true" style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(191,138,48,0.10)',
                  color: 'var(--a-gold)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div style={{ flex: 1, lineHeight: 1.5 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-fg)' }}>
                    Élève majeur · {age} ans
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--a-fg-mid)', marginTop: 2 }}>
                    Aucun compte parent requis — l'élève gère sa scolarité seul.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <label className={CLS.label}>Parents</label>

              {/* Toggle : ajouter les parents maintenant ou plus tard */}
              <label
                className="flex items-start gap-3 p-3.5 rounded-lg cursor-pointer text-[13px] mb-3 transition-all duration-150"
                style={{
                  background: addParentsNow ? 'rgba(191,138,48,0.08)' : 'var(--a-bg)',
                  border: `1px solid ${addParentsNow ? 'rgba(191,138,48,0.35)' : 'var(--a-border)'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={addParentsNow}
                  onChange={e => setAddParentsNow(e.target.checked)}
                  className="w-[15px] h-[15px] mt-0.5 cursor-pointer flex-shrink-0"
                  style={{ accentColor: 'var(--a-gold)' }}
                />
                <span className="flex-1" style={{ color: addParentsNow ? 'var(--a-gold)' : 'var(--a-fg)' }}>
                  <strong>Ajouter les parents maintenant</strong>
                  <span className="block text-[12px] font-normal mt-0.5" style={{ color: 'var(--a-fg-mid)' }}>
                    {addParentsNow
                      ? 'Renseignez les parents ci-dessous.'
                      : 'Vous pourrez les rattacher plus tard depuis la fiche de l\'élève ou la page Parents.'}
                  </span>
                </span>
              </label>

              {addParentsNow && (
                <ParentsSection
                  mode={parentsMode}
                  blocs={parentsBlocs}
                  onChange={({ mode, blocs }) => {
                    setParentsMode(mode);
                    setParentsBlocs(blocs);
                  }}
                />
              )}
            </>
          )}
        </div>
        )}
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
