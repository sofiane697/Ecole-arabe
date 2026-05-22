import React, { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import {
  fetchModules, createModule, updateModule, deleteModule,
  fetchThematiques, createThematique, updateThematique, deleteThematique,
  fetchLecons, createLecon, updateLecon, deleteLecon,
  fetchNiveaux, fetchNiveauxByThematique, fetchNiveauxByLecon, createNiveau, updateNiveau, deleteNiveau,
  fetchContenus, createContenu, updateContenu, deleteContenu,
  fetchQCM, createQuestion, updateQuestion, deleteQuestion,
  uploadFile, toSlug, deleteStorageFolder, deleteOldCover,
  fetchNiveauxScolaires, resetProgressionNiveau,
} from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import PhotoEditor from '../shared/PhotoEditor';
import { coverImgStyle, isSafeCoverUrl } from '../shared/imageCrop';
import { normalizeGeniallyUrl } from '../shared/geniallyUtils';

// ─── Icônes SVG ──────────────────────────────────────────────────────────────
const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconVideo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const IconFile  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconText  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>;
const IconWord  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
const IconPPT      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IconGenially = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M14 12H9m5 0a3 3 0 1 1-3-3h3v3z"/></svg>;

const TYPE_ICONS  = { video: <IconVideo />, pdf: <IconFile />, texte: <IconText />, word: <IconWord />, ppt: <IconPPT />, genially: <IconGenially /> };
const TYPE_COLORS = { video: 'var(--a-red)', pdf: 'var(--a-blue)', texte: 'var(--a-green)', word: '#2b579a', ppt: '#c43e1c', genially: '#ff6b2b' };


// ─── Classes CSS ────────────────────────────────────────────────────────────
const S = {
  page: 'min-h-full',
  // Grid & card
  grid: 'cours-grid',
  card: 'cours-card',
  cardImg: 'cours-card-img',
  cardImgOverlay: 'cours-card-img-overlay',
  cardPlaceholder: 'cours-card-placeholder',
  cardBody: 'cours-card-body',
  cardRow: 'cours-card-row',
  cardNum: 'cours-card-num',
  cardTitle: 'cours-card-title',
  cardActions: 'cours-card-actions',
  cardDesc: 'cours-card-desc',
  cardFooter: 'cours-card-footer',
  badge: (c) => ({ display:'inline-flex', alignItems:'center', gap:3, fontSize:10.5, fontWeight:700, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c, whiteSpace:'nowrap', lineHeight:1 }),
  addCard: 'cours-add-card',
  addCardCircle: 'cours-add-card-circle',
  // Breadcrumb
  breadcrumb: 'cours-breadcrumb',
  breadcrumbPath: 'cours-breadcrumb-path',
  breadcrumbSep: 'cours-breadcrumb-sep',
  // List items
  listItem: 'cours-list-item',
  listNum: 'cours-list-num',
  listBody: 'cours-list-body',
  listTitle: 'cours-list-title',
  listSub: 'cours-list-sub',
  listRight: 'cours-list-right',
  // Tabs
  tabs: 'cours-tabs',
  tab: (active) => `cours-tab${active ? ' active' : ''}`,
  // Action buttons
  actionBtn: 'a-action-icon-btn',
  // Modal
  overlay: 'a-modal-overlay',
  modal: 'a-modal',
  modalTitle: 'a-modal-title',
  field: 'a-modal-field',
  label: 'a-modal-label',
  input: 'a-modal-input',
  textarea: 'a-modal-input',
  select: 'a-modal-input',
  btnRow: 'a-modal-btns',
  btnCancel: 'a-modal-btn-cancel',
  btnSave: 'a-modal-btn-save',
  btnDanger: 'a-modal-btn-danger',
  empty: 'a-empty',
};

// ─── Modal générique ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth }) {
  return (
    <div className={S.overlay} onClick={onClose}>
      <div className={S.modal} style={maxWidth ? { maxWidth } : undefined} onClick={e => e.stopPropagation()}>
        <div className={S.modalTitle}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ─── Helpers import CSV ──────────────────────────────────────────────────────

/** Parse une ligne CSV en respectant les guillemets */
function parseCsvLine(line) {
  const cells = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ';' && !inQ) { cells.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** Parse le contenu d'un fichier CSV en tableau de questions QCM */
function parseQCMCsv(text) {
  const LETTRES = ['A','B','C','D','E','F'];
  // Supprimer le BOM UTF-8 si présent
  const clean = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
  const lines = clean.split('\n');
  const questions = [];
  let skipped = 0;

  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue;
    const cells = parseCsvLine(line);
    // Ignorer la ligne d'en-tête
    if (cells[0]?.toLowerCase().startsWith('question')) continue;

    const [question, a, b, c, d, e, f, bonnes] = cells;
    if (!question?.trim() || !bonnes?.trim()) { skipped++; continue; }

    const choix = [a, b, c, d, e, f].filter(v => v?.trim()).map(v => v.trim());
    if (choix.length < 2) { skipped++; continue; }

    const reponse_correcte = bonnes.split(',')
      .map(l => LETTRES.indexOf(l.trim().toUpperCase()))
      .filter(i => i >= 0 && i < choix.length);

    if (reponse_correcte.length === 0) { skipped++; continue; }

    questions.push({ id: null, question: question.trim(), choix, reponse_correcte, ordre: questions.length + 1 });
  }
  return { questions, skipped };
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function Cours() {
  const [view, setView]   = useState('modules'); // 'modules' | 'thematiques' | 'lecons' | 'niveaux' | 'niveau-detail'
  const [modules, setModules]       = useState([]);
  const [thematiques, setThematiques] = useState([]);
  const [lecons, setLecons]         = useState([]);
  const [niveaux, setNiveaux]       = useState([]);
  const [contenus, setContenus]     = useState([]);
  const [questions, setQuestions]   = useState([]);
  const [selModule, setSelModule]   = useState(null);
  const [selThematique, setSelThematique] = useState(null);
  const [selLecon, setSelLecon]     = useState(null);
  const [selNiveau, setSelNiveau]   = useState(null);
  const [modal, setModal] = useState(null); // { type, data? }
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('contenus'); // 'contenus' | 'qcm'
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);

  // ─── Chargement des modules ─────────────────────────────────────────
  const loadModules = useCallback(async () => {
    try { setModules(await fetchModules()); } catch(e) {}
  }, []);
  useEffect(() => { loadModules(); }, [loadModules]);
  useEffect(() => { fetchNiveauxScolaires().then(setNiveauxScolaires).catch(() => {}); }, []);

  const loadThematiques = useCallback(async (modId) => {
    try { setThematiques(await fetchThematiques(modId)); } catch(e) {}
  }, []);

  const loadNiveaux = useCallback(async (modId) => {
    try { setNiveaux(await fetchNiveaux(modId)); } catch(e) {}
  }, []);

  const loadLecons = useCallback(async (thId) => {
    try { setLecons(await fetchLecons(thId)); } catch(e) {}
  }, []);

  const loadNiveauxByThematique = useCallback(async (thId) => {
    try { setNiveaux(await fetchNiveauxByThematique(thId)); } catch(e) {}
  }, []);

  const loadNiveauxByLecon = useCallback(async (leconId) => {
    try { setNiveaux(await fetchNiveauxByLecon(leconId)); } catch(e) {}
  }, []);

  const loadContenus = useCallback(async (nivId) => {
    try { setContenus(await fetchContenus(nivId)); } catch(e) {}
  }, []);

  const loadQuestions = useCallback(async (nivId) => {
    try { setQuestions(await fetchQCM(nivId)); } catch(e) {}
  }, []);

  // ─── Navigation ─────────────────────────────────────────────────────
  const openModule = (mod) => {
    setSelModule(mod);
    setView('thematiques');
    loadThematiques(mod.id);
  };

  const openThematique = (th) => {
    setSelThematique(th);
    setView('lecons');
    loadLecons(th.id);
  };

  const openLecon = async (lec) => {
    setSelLecon(lec);
    setLoading(true);
    try {
      let nivs = await fetchNiveauxByLecon(lec.id);
      if (nivs.length === 0) {
        // Auto-créer un niveau transparent
        await createNiveau({
          module_id: selModule.id,
          thematique_id: selThematique?.id || null,
          lecon_id: lec.id,
          titre: lec.titre,
          description: '',
          image_url: null,
          ordre: 1,
          score_requis: 80,
        });
        nivs = await fetchNiveauxByLecon(lec.id);
      }
      const niv = nivs[0];
      setNiveaux(nivs);
      setSelNiveau(niv);
      setView('niveau-detail');
      setTab('contenus');
      loadContenus(niv.id);
      loadQuestions(niv.id);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const openNiveau = (niv) => {
    setSelNiveau(niv);
    setView('niveau-detail');
    setTab('contenus');
    loadContenus(niv.id);
    loadQuestions(niv.id);
  };

  const goBack = () => {
    if (view === 'niveau-detail') {
      if (selLecon) { setView('lecons'); setSelNiveau(null); loadLecons(selThematique.id); }
      else { setView('niveaux'); setSelNiveau(null); }
    }
    else if (view === 'niveaux') { setView('thematiques'); setSelNiveau(null); loadThematiques(selModule.id); }
    else if (view === 'lecons') { setView('thematiques'); setSelLecon(null); loadThematiques(selModule.id); }
    else if (view === 'thematiques') { setView('modules'); setSelModule(null); setSelThematique(null); }
  };

  // ─── Handlers CRUD ──────────────────────────────────────────────────
  const handleSaveModule = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateModule(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre, actif: data.actif, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      else { await createModule({ titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre || modules.length + 1, actif: true, niveaux_scolaires_ids: data.niveaux_scolaires_ids || [] }); }
      await loadModules();
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteModule = (id, titre) => {
    setConfirm({
      title: 'Supprimer ce module ?',
      message: <span>Le module <strong>"{titre}"</strong> et tout son contenu (niveaux, cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteModule(id);
          await deleteStorageFolder(toSlug(titre)).catch(() => {});
          await loadModules();
        } catch(e) { alert(e.message); }
      },
    });
  };

  const handleSaveThematique = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateThematique(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      else { await createThematique({ module_id: selModule.id, titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre || thematiques.length + 1, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      await loadThematiques(selModule.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteThematique = (id, titre) => {
    setConfirm({
      title: 'Supprimer cette thématique ?',
      message: <span>La thématique <strong>"{titre}"</strong> et tous ses niveaux (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteThematique(id);
          await deleteStorageFolder(`${toSlug(selModule.titre)}/${toSlug(titre)}`).catch(() => {});
          await loadThematiques(selModule.id);
        } catch(e) { alert(e.message); }
      },
    });
  };

  const handleSaveNiveau = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateNiveau(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre, score_requis: data.score_requis }); }
      else { await createNiveau({ module_id: selModule.id, thematique_id: selThematique?.id || null, lecon_id: selLecon?.id || null, titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre || niveaux.length + 1, score_requis: data.score_requis || 80 }); }
      if (selLecon) { await loadNiveauxByLecon(selLecon.id); }
      else if (selThematique) { await loadNiveauxByThematique(selThematique.id); }
      else { await loadNiveaux(selModule.id); }
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteNiveau = (id, titre) => {
    setConfirm({
      title: 'Supprimer ce niveau ?',
      message: <span>Le niveau <strong>"{titre}"</strong> et tout son contenu (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteNiveau(id);
          await deleteStorageFolder(`${toSlug(selModule.titre)}/${toSlug(titre)}`).catch(() => {});
          if (selLecon) { await loadNiveauxByLecon(selLecon.id); }
          else if (selThematique) { await loadNiveauxByThematique(selThematique.id); }
          else { await loadNiveaux(selModule.id); }
        } catch(e) { alert(e.message); }
      },
    });
  };

  const handleSaveLecon = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateLecon(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre }); }
      else { await createLecon({ thematique_id: selThematique.id, titre: data.titre, description: data.description, image_url: data.image_url, image_scale: data.image_scale, image_pos_x: data.image_pos_x, image_pos_y: data.image_pos_y, ordre: data.ordre || lecons.length + 1 }); }
      await loadLecons(selThematique.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteLecon = (id, titre) => {
    setConfirm({
      title: 'Supprimer cette leçon ?',
      message: <span>La leçon <strong>"{titre}"</strong> et tous ses niveaux (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteLecon(id);
          await loadLecons(selThematique.id);
        } catch(e) { alert(e.message); }
      },
    });
  };

  const handleSaveContenu = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateContenu(data.id, { type: data.type, titre: data.titre, contenu: data.contenu, ordre: data.ordre }); }
      else { await createContenu({ niveau_id: selNiveau.id, type: data.type, titre: data.titre, contenu: data.contenu, ordre: data.ordre || contenus.length + 1 }); }
      await loadContenus(selNiveau.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteContenu = (id) => {
    setConfirm({
      title: 'Supprimer ce contenu ?',
      message: <span>Ce fichier/contenu sera supprimé définitivement.<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try { await deleteContenu(id); await loadContenus(selNiveau.id); } catch(e) { alert(e.message); }
      },
    });
  };

  const handleImportQCM = (importedQuestions, mode) => {
    const base = mode === 'remplacer' ? [] : questions;
    const merged = [
      ...base,
      ...importedQuestions.map((q, i) => ({ ...q, ordre: base.length + i + 1 })),
    ];
    setModal({ type: 'qcm-carousel', startIndex: 0, overrideQuestions: merged });
  };

  const handleDeleteQuestion = (id, questionText) => {
    setConfirm({
      title: 'Supprimer cette question ?',
      message: <span>La question <strong>"{questionText}"</strong> sera supprimée définitivement.</span>,
      onConfirm: async () => {
        setConfirm(null);
        try { await deleteQuestion(id); await resetProgressionNiveau(selNiveau.id); await loadQuestions(selNiveau.id); } catch(e) { alert(e.message); }
      },
    });
  };

  const handleDeleteAllQuestions = () => {
    setConfirm({
      title: 'Supprimer tout le QCM ?',
      message: <span>Toutes les questions de ce QCM seront supprimées définitivement.<br/><br/>La progression des élèves pour ce niveau sera <strong>automatiquement réinitialisée</strong> pour éviter les faux "réussis".<br/><br/><span style={{ color:'var(--a-red)', fontWeight:600 }}>Cette action est irréversible.</span></span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await Promise.all(questions.map(q => deleteQuestion(q.id)));
          await resetProgressionNiveau(selNiveau.id);
          await loadQuestions(selNiveau.id);
        } catch(e) { alert(e.message); }
      },
    });
  };


  const handleSaveAllQuestions = async (updatedQuestions, deletedIds) => {
    setLoading(true);
    try {
      await Promise.all(deletedIds.map(id => deleteQuestion(id)));
      for (const q of updatedQuestions) {
        if (!q.question?.trim()) continue;
        const sanitizedChoix = q.choix.filter(c => c.trim());
        const sanitizedReponse = (q.reponse_correcte || []).filter(r => r >= 0 && r < sanitizedChoix.length);
        const payload = { question: q.question, choix: sanitizedChoix, reponse_correcte: sanitizedReponse, ordre: q.ordre };
        if (q.id) { await updateQuestion(q.id, payload); }
        else { await createQuestion({ ...payload, niveau_id: selNiveau.id }); }
      }
      await resetProgressionNiveau(selNiveau.id);
      await loadQuestions(selNiveau.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  // ─── VUE MODULES ───────────────────────────────────────────────────
  if (view === 'modules') {
    return (
      <div className={S.page}>
        <div className={S.grid}>
          {modules.map(m => (
            <div key={m.id} className={S.card} onClick={() => openModule(m)}>
              {isSafeCoverUrl(m.image_url) ? (
                <div className={S.cardImg}>
                  <img src={m.image_url} alt={m.titre} style={coverImgStyle(m)} />
                  <div className={S.cardImgOverlay} />
                </div>
              ) : (
                <div className={S.cardPlaceholder}>📚</div>
              )}
              <div className={S.cardBody}>
                <div className={S.cardRow}>
                  <div className={S.cardNum}>{m.ordre}</div>
                  <h3 className={S.cardTitle}>{m.titre}</h3>
                  <div className={S.cardActions}>
                    <button className={S.actionBtn} title="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'module', data:m }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteModule(m.id, m.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {m.description && <p className={S.cardDesc}>{m.description}</p>}
                <div className={S.cardFooter}>
                  <span style={S.badge(m.actif ? 'var(--a-green)' : 'var(--a-red)')}>{m.actif ? 'Actif' : 'Inactif'}</span>
                  {m.niveaux_scolaires_ids?.length > 0
                    ? m.niveaux_scolaires_ids.map(nsId => {
                        const ns = niveauxScolaires.find(n => n.id === nsId);
                        return ns ? <span key={nsId} style={S.badge('var(--a-blue)')}>{ns.nom}</span> : null;
                      })
                    : <span style={S.badge('var(--a-fg-mid)')}>Non visible</span>
                  }
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'module' })}>
            <div className={S.addCardCircle}><IconPlus /></div>
            Ajouter un module
          </div>
        </div>

        {modal?.type === 'module' && (
          <ModuleModal data={modal.data} onSave={handleSaveModule} onClose={() => setModal(null)} loading={loading} />
        )}
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      </div>
    );
  }

  // ─── VUE THÉMATIQUES ───────────────────────────────────────────────
  if (view === 'thematiques') {
    return (
      <div className={S.page}>
        <div className={S.breadcrumb} onClick={goBack}>
          <IconBack />
          <span>Modules</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selModule?.titre}</span>
        </div>

        <div className={S.grid}>
          {thematiques.map(th => (
            <div key={th.id} className={S.card} onClick={() => openThematique(th)}>
              {isSafeCoverUrl(th.image_url) ? (
                <div className={S.cardImg}>
                  <img src={th.image_url} alt={th.titre} style={coverImgStyle(th)} />
                  <div className={S.cardImgOverlay} />
                </div>
              ) : (
                <div className={S.cardPlaceholder}>📖</div>
              )}
              <div className={S.cardBody}>
                <div className={S.cardRow}>
                  <div className={S.cardNum}>{th.ordre}</div>
                  <h3 className={S.cardTitle}>{th.titre}</h3>
                  <div className={S.cardActions}>
                    <button className={S.actionBtn} title="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'thematique', data:th }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteThematique(th.id, th.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {th.description && <p className={S.cardDesc}>{th.description}</p>}
                <div className={S.cardFooter}>
                  {th.niveaux_scolaires_ids?.length > 0
                    ? th.niveaux_scolaires_ids.map(nsId => {
                        const ns = niveauxScolaires.find(n => n.id === nsId);
                        return ns ? <span key={nsId} style={S.badge('var(--a-blue)')}>{ns.nom}</span> : null;
                      })
                    : <span style={S.badge('var(--a-fg-mid)')}>Aucun accès</span>
                  }
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'thematique' })}>
            <div className={S.addCardCircle}><IconPlus /></div>
            Ajouter une thématique
          </div>
        </div>

        {modal?.type === 'thematique' && (
          <ThematiqueModal data={modal.data} onSave={handleSaveThematique} onClose={() => setModal(null)} loading={loading} moduleTitre={selModule?.titre} />
        )}
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      </div>
    );
  }

  // ─── VUE LEÇONS ────────────────────────────────────────────────────
  if (view === 'lecons') {
    return (
      <div className={S.page}>
        <div className={S.breadcrumb} onClick={goBack}>
          <IconBack />
          <span>Thématiques</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selModule?.titre}</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selThematique?.titre}</span>
        </div>

        <div className={S.grid}>
          {lecons.map(lec => (
            <div key={lec.id} className={S.card} onClick={() => openLecon(lec)}>
              {isSafeCoverUrl(lec.image_url) ? (
                <div className={S.cardImg}>
                  <img src={lec.image_url} alt={lec.titre} style={coverImgStyle(lec)} />
                  <div className={S.cardImgOverlay} />
                </div>
              ) : (
                <div className={S.cardPlaceholder}>🎓</div>
              )}
              <div className={S.cardBody}>
                <div className={S.cardRow}>
                  <div className={S.cardNum}>{lec.ordre}</div>
                  <h3 className={S.cardTitle}>{lec.titre}</h3>
                  <div className={S.cardActions}>
                    <button className={S.actionBtn} title="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'lecon', data:lec }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteLecon(lec.id, lec.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {lec.description && <p className={S.cardDesc}>{lec.description}</p>}
                <div className={S.cardFooter}>
                  <span style={S.badge('var(--a-gold)')}>Leçon {lec.ordre}</span>
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'lecon' })}>
            <div className={S.addCardCircle}><IconPlus /></div>
            Ajouter une leçon
          </div>
        </div>

        {modal?.type === 'lecon' && (
          <LeconModal data={modal.data} onSave={handleSaveLecon} onClose={() => setModal(null)} loading={loading} moduleTitre={selModule?.titre} thematiqueTitre={selThematique?.titre} />
        )}
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      </div>
    );
  }

  // ─── VUE NIVEAUX ───────────────────────────────────────────────────
  if (view === 'niveaux') {
    return (
      <div className={S.page}>
        <div className={S.breadcrumb} onClick={goBack}>
          <IconBack />
          <span>Leçons</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selModule?.titre}</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selThematique?.titre}</span>
          <span className={S.breadcrumbSep}>›</span>
          <span className={S.breadcrumbPath}>{selLecon?.titre}</span>
        </div>

        {niveaux.map(n => (
          <div key={n.id} className={S.listItem} onClick={() => openNiveau(n)}>
            <div className={S.listNum}>{n.ordre}</div>
            <div className={S.listBody}>
              <div className={S.listTitle}>{n.titre}</div>
              {n.description && <div className={S.listSub}>{n.description}</div>}
            </div>
            <div className={S.listRight}>
              <span style={S.badge('var(--a-blue)')}>Score : {n.score_requis}%</span>
              <button className={S.actionBtn} aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}><IconEdit /></button>
              <button className={S.actionBtn} aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteNiveau(n.id, n.titre); }}><IconTrash /></button>
            </div>
          </div>
        ))}

        <div className={`${S.addCard} inline mt-2`} onClick={() => setModal({ type:'niveau' })}>
          <IconPlus /> Ajouter un niveau
        </div>

        {modal?.type === 'niveau' && (
          <NiveauModal data={modal.data} onSave={handleSaveNiveau} onClose={() => setModal(null)} loading={loading} moduleTitre={selModule?.titre} />
        )}
        {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
      </div>
    );
  }

  // ─── VUE DÉTAIL NIVEAU (Contenus + QCM) ────────────────────────────
  return (
    <div className={S.page}>
      <div className={S.breadcrumb} onClick={goBack}>
        <IconBack />
        <span>{selLecon ? 'Leçons' : 'Niveaux'}</span>
        <span className={S.breadcrumbSep}>›</span>
        <span className={S.breadcrumbPath}>
          {selLecon
            ? `${selModule?.titre} › ${selThematique?.titre} › ${selLecon?.titre}`
            : `${selModule?.titre} › ${selThematique?.titre} › ${selNiveau?.titre}`}
        </span>
      </div>

      <div className={S.tabs}>
        <button className={S.tab(tab === 'contenus')} onClick={() => setTab('contenus')}>Contenus ({contenus.length})</button>
        <button className={S.tab(tab === 'qcm')} onClick={() => setTab('qcm')}>QCM ({questions.length})</button>
      </div>

      {tab === 'contenus' && (
        <>
          {contenus.length === 0 && <div className={S.empty}>Aucun contenu pour ce niveau. Ajoutez des vidéos, PDF ou textes.</div>}
          {contenus.map(c => (
            <div key={c.id} className={S.listItem} style={{ borderLeftColor: TYPE_COLORS[c.type] || 'var(--a-gold)' }}>
              <div className={S.listNum} style={{ background: TYPE_COLORS[c.type] || 'var(--a-fg-mid)', borderRadius:8, width:28, height:28 }}>
                {TYPE_ICONS[c.type]}
              </div>
              <div className={S.listBody}>
                <div className={S.listTitle}>{c.titre}</div>
                <div className={S.listSub} style={{ textTransform:'uppercase', letterSpacing:'.05em', color: TYPE_COLORS[c.type] || 'var(--a-fg-mid)' }}>{c.type}</div>
              </div>
              <div className={S.listRight}>
                <button className={S.actionBtn} aria-label="Modifier" onClick={() => setModal({ type:'contenu', data:c })}><IconEdit /></button>
                <button className={S.actionBtn} aria-label="Supprimer" onClick={() => handleDeleteContenu(c.id)}><IconTrash /></button>
              </div>
            </div>
          ))}
          <div className={`${S.addCard} inline mt-2`} onClick={() => setModal({ type:'contenu' })}>
            <IconPlus /> Ajouter un contenu
          </div>
        </>
      )}

      {tab === 'qcm' && (
        <>
          {questions.length === 0 && <div className={S.empty}>Aucune question QCM. Cliquez ci-dessous pour commencer.</div>}
          {questions.map((q, i) => {
            const corrects = Array.isArray(q.reponse_correcte) ? q.reponse_correcte : [q.reponse_correcte];
            return (
              <div key={q.id} className={S.listItem} onClick={() => setModal({ type:'qcm-carousel', startIndex: i })}>
                <div className={S.listNum}>{i + 1}</div>
                <div className={S.listBody}>
                  <div className={S.listTitle}>{q.question}</div>
                  <div className={S.listSub}>
                    {(q.choix || []).map((ch, ci) => (
                      <span key={ci} style={{ marginRight:10, color: corrects.includes(ci) ? 'var(--a-green)' : 'var(--a-fg-mid)', fontWeight: corrects.includes(ci) ? 600 : 400 }}>
                        {corrects.includes(ci) ? '✓ ' : ''}{String.fromCharCode(65+ci)}. {ch}
                      </span>
                    ))}
                  </div>
                </div>
                <div className={S.listRight}>
                  <button className={S.actionBtn} aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'qcm-carousel', startIndex: i }); }}><IconEdit /></button>
                  <button className={S.actionBtn} style={{ color:'var(--a-red)' }} aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteQuestion(q.id, q.question); }}><IconTrash /></button>
                </div>
              </div>
            );
          })}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <div className={`${S.addCard} inline`} style={{ flex:1 }} onClick={() => setModal({ type:'qcm-carousel', startIndex: questions.length, addNew: true })}>
              <IconPlus /> {questions.length > 0 ? 'Gérer / ajouter des questions' : 'Créer les questions du QCM'}
            </div>
            <div className={`${S.addCard} inline`} style={{ flex:'none', color:'var(--a-blue)', borderColor:'var(--a-blue)' }}
              onClick={() => setModal({ type:'import-qcm' })}>
              ⬆ Importer CSV
            </div>
            {questions.length > 0 && (
              <div className={`${S.addCard} inline`} style={{ flex:'none', color:'var(--a-red)', borderColor:'var(--a-red)' }}
                onClick={handleDeleteAllQuestions}>
                🗑 Tout supprimer
              </div>
            )}
          </div>
        </>
      )}

      {modal?.type === 'contenu' && (
        <ContenuModal data={modal.data} onSave={handleSaveContenu} onClose={() => setModal(null)} loading={loading} moduleTitre={selModule?.titre} thematiqueTitre={selThematique?.titre} niveauTitre={selNiveau?.titre} />
      )}
      {modal?.type === 'qcm-carousel' && (
        <QCMCarouselModal
          initialQuestions={modal.overrideQuestions || questions}
          startIndex={modal.startIndex || 0}
          addNew={modal.addNew}
          onSaveAll={handleSaveAllQuestions}
          onClose={() => setModal(null)}
          loading={loading}
        />
      )}
      {modal?.type === 'import-qcm' && (
        <ImportQCMModal
          existingCount={questions.length}
          onLoad={handleImportQCM}
          onClose={() => setModal(null)}
        />
      )}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

// ─── MODALS ──────────────────────────────────────────────────────────────────

// Whitelist stricte : seules ces extensions et MIME sont acceptées pour les
// couvertures. SVG volontairement exclu — il peut embarquer du JS et, servi
// depuis un bucket public, exposer un XSS si un utilisateur ouvre l'image dans
// un nouvel onglet. Idem GIF/AVIF/BMP/TIFF qui n'apportent rien pour une
// couverture et élargissent la surface d'attaque.
const COVER_ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
const COVER_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// Vérifie la signature binaire (4-12 premiers octets) pour attraper un fichier
// renommé `.jpg` mais dont le contenu est autre chose (p.ex. HTML/SVG). Côté
// serveur, le bucket `cours` accepte tout — c'est la seule barrière avant
// l'upload.
async function hasValidImageMagicBytes(file) {
  const buf = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  // JPEG : FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // WEBP : 52 49 46 46 xx xx xx xx 57 45 42 50 (RIFF....WEBP)
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true;
  return false;
}

// ── Composant partagé : zone d'upload image + éditeur de cadrage ────────────
// Quand une image est présente on n'affiche plus un simple aperçu mais le
// PhotoEditor (drag, molette, slider) cadré comme les cards des portails.
function ImageUploadZone({
  imageUrl, setImageUrl,
  imageScale = 1, setImageScale,
  imagePosX  = 50, setImagePosX,
  imagePosY  = 50, setImagePosY,
  uploading, setUploading, uploadErr, setUploadErr,
  dragOver, setDragOver, getFolder,
}) {
  // Compteur local de remplacements. Incrémenté à chaque upload réussi.
  // Sert 2 buts dans le rendu ci-dessous :
  //   1) cache-busting du <img> quand Supabase réécrit sur le même path
  //      (cover.{ext}) et renvoie donc la même URL publique ;
  //   2) forcer le remount du PhotoEditor via sa `key` afin qu'il réinitialise
  //      son state interne (scale/pos sont lus uniquement au montage).
  const [uploadStamp, setUploadStamp] = useState(0);

  const handleFile = async (file) => {
    if (!file) return;
    // MIME (navigateur-fourni, faillible) + extension (attaquant-fourni, faillible)
    // + magic bytes (contenu réel, fiable). Les 3 doivent concorder.
    if (!COVER_ALLOWED_MIME.includes(file.type)) {
      setUploadErr('Format non supporté. Utilisez JPG, PNG ou WebP.');
      return;
    }
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!COVER_ALLOWED_EXT.includes(ext)) {
      setUploadErr('Extension non supportée. Utilisez .jpg, .jpeg, .png ou .webp.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image trop lourde (max 5 Mo)'); return; }
    if (!(await hasValidImageMagicBytes(file))) {
      setUploadErr('Le fichier ne semble pas être une image JPG/PNG/WebP valide.');
      return;
    }
    setUploadErr('');
    setUploading(true);
    try {
      const folder = getFolder();
      await deleteOldCover(folder).catch(() => {});
      const url = await uploadFile(file, `${folder}/cover.${ext}`);
      setImageUrl(url);
      // Nouvelle image : on réinitialise le cadrage — le précédent ne s'applique
      // plus à un contenu différent.
      setImageScale?.(1);
      setImagePosX?.(50);
      setImagePosY?.(50);
      setUploadStamp(s => s + 1);
    } catch(e) { setUploadErr(e.message); }
    setUploading(false);
  };

  const openPicker = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    // Hint UI uniquement — la validation réelle se fait dans handleFile
    // (MIME + extension + magic bytes).
    inp.accept = COVER_ALLOWED_MIME.join(',');
    inp.onchange = ev => handleFile(ev.target.files[0]);
    inp.click();
  };

  const handleCropChange = (s, x, y) => {
    setImageScale?.(s);
    setImagePosX?.(x);
    setImagePosY?.(y);
  };

  return (
    <div className={S.field}>
      <label className={S.label}>Image de couverture</label>

      {/* On n'alimente le PhotoEditor que si l'URL est sûre. Un `image_url`
          stocké en DB pointant vers un domaine tiers ou un schéma `javascript:`
          / `data:` est simplement ignoré — on retombe sur la dropzone. */}
      {isSafeCoverUrl(imageUrl) ? (
        <div style={{
          borderRadius: 'var(--a-radius-sm)',
          border: '1px solid var(--a-border)',
          background: 'rgba(48,209,88,.03)',
          padding: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <PhotoEditor
            key={`${imageUrl}-${uploadStamp}`}
            photoUrl={uploadStamp > 0 ? `${imageUrl}?v=${uploadStamp}` : imageUrl}
            scale={imageScale} posX={imagePosX} posY={imagePosY}
            onChange={handleCropChange}
            shape="rect" width={360} height={180}
          />
          <div style={{ display:'flex', gap: 10, marginTop: 10, fontSize: 11, color: 'var(--a-fg-light)' }}>
            <span>Glissez pour recadrer · molette ou slider pour zoomer</span>
          </div>
          <div style={{ display:'flex', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={openPicker}
              style={{ background: 'transparent', border: '1px solid var(--a-border)', color: 'var(--a-fg-mid)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >🖼 Changer l'image</button>
            <button
              type="button"
              onClick={() => { setImageUrl(''); setImageScale?.(1); setImagePosX?.(50); setImagePosY?.(50); }}
              style={{ background: 'transparent', border: '1px solid var(--a-border)', color: 'var(--a-red)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >✕ Supprimer</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={openPicker}
          style={{
            borderRadius: 'var(--a-radius-sm)',
            border: `2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`,
            background: dragOver ? 'rgba(191,138,48,.04)' : 'transparent',
            padding: 12, cursor: 'pointer', textAlign: 'center',
            transition: 'all .2s', position: 'relative', overflow: 'hidden',
          }}>
          <div style={{ padding:'14px 0', color:'var(--a-fg-mid)', fontSize:13, lineHeight:1.8 }}>
            {uploading
              ? <span style={{ color:'var(--a-gold)' }}>⏳ Upload en cours…</span>
              : <><span style={{ fontSize:20 }}>🖼</span><br/><strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span style={{ fontSize:11, opacity:.65 }}>JPG, PNG, WebP — max 5 Mo</span></>
            }
          </div>
        </div>
      )}

      {uploadErr && <div style={{ color:'var(--a-red)', fontSize:12, marginTop:4 }}>{uploadErr}</div>}
    </div>
  );
}

// ─── Hook partagé — state de l'image de couverture pour les 4 modals ─────────
// Factorise : URL + cadrage (scale/pos_x/pos_y) + flags upload/dragOver/err.
// Expose des props bindables prêtes pour <ImageUploadZone> et un payload
// `toPayload()` pour onSave().
//
// Pourquoi un hook et pas un composant ? Chaque modal veut choisir le `getFolder`
// (slug(titre) vs `${module}/${titre}` vs `${module}/${thema}/${titre}`) et garde
// le contrôle de son sauvegarde — le hook n'encapsule que l'état répétitif.
function useCoverImageState(data) {
  // Coercion Number() indispensable : PostgREST renvoie les NUMERIC en string.
  // Sans cast, la molette du PhotoEditor ferait "1.50" + 0.08 → "1.500.08" → NaN.
  const [image_url,   setImageUrl]   = useState(data?.image_url || '');
  const [image_scale, setImageScale] = useState(Number(data?.image_scale ?? 1));
  const [image_pos_x, setImagePosX]  = useState(Number(data?.image_pos_x ?? 50));
  const [image_pos_y, setImagePosY]  = useState(Number(data?.image_pos_y ?? 50));
  const [dragOver,    setDragOver]   = useState(false);
  const [uploading,   setUploading]  = useState(false);
  const [uploadErr,   setUploadErr]  = useState('');

  return {
    uploading,
    imageProps: {
      imageUrl:    image_url,   setImageUrl,
      imageScale:  image_scale, setImageScale,
      imagePosX:   image_pos_x, setImagePosX,
      imagePosY:   image_pos_y, setImagePosY,
      uploading,   setUploading,
      uploadErr,   setUploadErr,
      dragOver,    setDragOver,
    },
    toPayload: () => ({ image_url, image_scale, image_pos_x, image_pos_y }),
  };
}

// ── Composant partagé : sélecteur niveaux scolaires ──────────────────────────
function NsSelectorField({ list, selected, onChange, warnIfEmpty, warnMsg }) {
  return (
    <div className={S.field}>
      <label className={S.label}>Niveaux scolaires autorisés</label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
        {list.map(ns => (
          <label key={ns.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: 'pointer', userSelect: 'none',
            borderRadius: 'var(--a-radius-sm)',
            padding: '5px 12px', fontSize: 13,
            transition: 'all .15s',
            background: selected.includes(ns.id) ? 'rgba(191,138,48,.13)' : 'var(--a-bg)',
            border: `1px solid ${selected.includes(ns.id) ? 'var(--a-gold)' : 'var(--a-border)'}`,
          }}>
            <input type="checkbox" checked={selected.includes(ns.id)}
              onChange={() => onChange(ns.id)}
              style={{ accentColor:'var(--a-gold)', cursor:'pointer' }} />
            {ns.nom}
          </label>
        ))}
        {list.length === 0 && <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>Chargement…</span>}
      </div>
      {warnIfEmpty && selected.length === 0 && list.length > 0 && (
        <div style={{ color:'var(--a-red)', fontSize:12, marginTop:6 }}>
          ⚠ {warnMsg || 'Aucun niveau sélectionné.'}
        </div>
      )}
    </div>
  );
}

// ── ModuleModal ───────────────────────────────────────────────────────────────
function ModuleModal({ data, onSave, onClose, loading }) {
  const [titre,       setTitre]       = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [ordre,       setOrdre]       = useState(data?.ordre || 1);
  const [actif,       setActif]       = useState(data?.actif !== undefined ? data.actif : true);
  const [nsList,      setNsList]      = useState([]);
  const [selectedNs,  setSelectedNs]  = useState(data?.niveaux_scolaires_ids || []);
  const img = useCoverImageState(data);

  useEffect(() => { fetchNiveauxScolaires().then(setNsList).catch(() => {}); }, []);
  const toggleNs = id => setSelectedNs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <Modal title={data ? 'Modifier le module' : 'Nouveau module'} onClose={onClose}>
      <div className={S.field}>
        <label className={S.label}>Titre *</label>
        <input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Cours de Coran" autoFocus />
      </div>
      <div className={S.field}>
        <label className={S.label}>Description</label>
        <textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description du module…" rows={3} />
      </div>
      <ImageUploadZone {...img.imageProps} getFolder={() => toSlug(titre)} />
      <NsSelectorField list={nsList} selected={selectedNs} onChange={toggleNs}
        warnIfEmpty warnMsg="Aucun niveau sélectionné → module invisible pour tous les élèves" />
      <div style={{ display:'flex', gap:12 }}>
        <div className={S.field} style={{ flex:1 }}>
          <label className={S.label}>Ordre</label>
          <input className={S.input} type="number" min="1" value={ordre} onChange={e => setOrdre(+e.target.value)} />
        </div>
        <div className={S.field} style={{ flex:1 }}>
          <label className={S.label}>Actif</label>
          <select className={S.select} value={actif ? 'true' : 'false'} onChange={e => setActif(e.target.value === 'true')}>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || img.uploading || !titre.trim()}
          onClick={() => onSave({ id:data?.id, titre, description, ...img.toPayload(), ordre, actif, niveaux_scolaires_ids:selectedNs })}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

// ── ThematiqueModal ───────────────────────────────────────────────────────────
function ThematiqueModal({ data, onSave, onClose, loading, moduleTitre }) {
  const [titre,       setTitre]       = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [ordre,       setOrdre]       = useState(data?.ordre || 1);
  const [nsList,      setNsList]      = useState([]);
  const [selectedNs,  setSelectedNs]  = useState(data?.niveaux_scolaires_ids || []);
  const img = useCoverImageState(data);

  useEffect(() => { fetchNiveauxScolaires().then(setNsList).catch(() => {}); }, []);
  const toggleNs = id => setSelectedNs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <Modal title={data ? 'Modifier la thématique' : 'Nouvelle thématique'} onClose={onClose}>
      <div className={S.field}>
        <label className={S.label}>Titre *</label>
        <input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Grammaire arabe" autoFocus />
      </div>
      <div className={S.field}>
        <label className={S.label}>Description</label>
        <textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la thématique…" rows={3} />
      </div>
      <ImageUploadZone {...img.imageProps}
        getFolder={() => `${toSlug(moduleTitre)}/${toSlug(titre)}`} />
      <NsSelectorField list={nsList} selected={selectedNs} onChange={toggleNs}
        warnIfEmpty warnMsg="Aucun niveau sélectionné → thématique invisible pour les élèves" />
      <div className={S.field}>
        <label className={S.label}>Ordre</label>
        <input className={S.input} type="number" min="1" value={ordre} onChange={e => setOrdre(+e.target.value)} style={{ maxWidth:100 }} />
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || img.uploading || !titre.trim()}
          onClick={() => onSave({ id:data?.id, titre, description, ...img.toPayload(), ordre, niveaux_scolaires_ids:selectedNs })}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

// ── LeconModal ────────────────────────────────────────────────────────────────
function LeconModal({ data, onSave, onClose, loading, moduleTitre, thematiqueTitre }) {
  const [titre,       setTitre]       = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [ordre,       setOrdre]       = useState(data?.ordre || 1);
  const img = useCoverImageState(data);

  return (
    <Modal title={data ? 'Modifier la leçon' : 'Nouvelle leçon'} onClose={onClose}>
      <div className={S.field}>
        <label className={S.label}>Titre *</label>
        <input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Leçon 1 — Les voyelles" autoFocus />
      </div>
      <div className={S.field}>
        <label className={S.label}>Description</label>
        <textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la leçon…" rows={3} />
      </div>
      <ImageUploadZone {...img.imageProps}
        getFolder={() => `${toSlug(moduleTitre)}/${toSlug(thematiqueTitre)}/${toSlug(titre)}`} />
      <div className={S.field}>
        <label className={S.label}>Ordre</label>
        <input className={S.input} type="number" min="1" value={ordre} onChange={e => setOrdre(+e.target.value)} style={{ maxWidth:100 }} />
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || img.uploading || !titre.trim()}
          onClick={() => onSave({ id:data?.id, titre, description, ...img.toPayload(), ordre })}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

// ── NiveauModal ───────────────────────────────────────────────────────────────
function NiveauModal({ data, onSave, onClose, loading, moduleTitre }) {
  const [titre,        setTitre]       = useState(data?.titre || '');
  const [description,  setDescription] = useState(data?.description || '');
  const [ordre,        setOrdre]       = useState(data?.ordre || 1);
  const [score_requis, setScoreRequis] = useState(data?.score_requis || 80);
  const img = useCoverImageState(data);

  return (
    <Modal title={data ? 'Modifier le niveau' : 'Nouveau niveau'} onClose={onClose}>
      <div className={S.field}>
        <label className={S.label}>Titre *</label>
        <input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex : Niveau 1 — Introduction" autoFocus />
      </div>
      <div className={S.field}>
        <label className={S.label}>Description</label>
        <textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} rows={2} />
      </div>
      <ImageUploadZone {...img.imageProps}
        getFolder={() => `${toSlug(moduleTitre)}/${toSlug(titre)}`} />
      <div style={{ display:'flex', gap:12 }}>
        <div className={S.field} style={{ flex:1 }}>
          <label className={S.label}>Ordre</label>
          <input className={S.input} type="number" min="1" value={ordre} onChange={e => setOrdre(+e.target.value)} />
        </div>
        <div className={S.field} style={{ flex:1 }}>
          <label className={S.label}>Score requis (%)</label>
          <input className={S.input} type="number" min="0" max="100" value={score_requis} onChange={e => setScoreRequis(+e.target.value)} />
        </div>
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || img.uploading || !titre.trim()}
          onClick={() => onSave({ id:data?.id, titre, description, ...img.toPayload(), ordre, score_requis })}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

function ContenuModal({ data, onSave, onClose, loading, moduleTitre, thematiqueTitre, niveauTitre }) {
  const [type, setType] = useState(data?.type || 'video');
  const [titre, setTitre] = useState(data?.titre || '');
  const [contenu, setContenu] = useState(data?.contenu || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const ACCEPTED_MIME = {
    pdf:  'application/pdf',
    word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt:  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  const ACCEPTED_LABEL = { pdf: 'PDF', word: 'Word (.docx)', ppt: 'PowerPoint (.pptx)' };

  const handleFile = async (file) => {
    if (!file || file.type !== ACCEPTED_MIME[type]) {
      setUploadError(`Seuls les fichiers ${ACCEPTED_LABEL[type]} sont acceptés.`);
      return;
    }
    const maxSize = type === 'ppt' ? 20 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError(`Fichier trop lourd (max ${type === 'ppt' ? '20' : '10'} Mo).`);
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const slugTitle = toSlug(titre || file.name.replace(/\.[^.]+$/, ''));
      const url = await uploadFile(file, `${toSlug(moduleTitre)}/${toSlug(niveauTitre)}/${slugTitle}.${ext}`);
      setContenu(url);
      if (!titre) setTitre(file.name.replace(/\.[^.]+$/, ''));
    } catch(e) {
      setUploadError(e.message || 'Erreur lors de l\'upload.');
    }
    setUploading(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <Modal title={data ? 'Modifier le contenu' : 'Nouveau contenu'} onClose={onClose} maxWidth={type === 'texte' ? 680 : 500}>
      <div className={S.field}>
        <label className={S.label}>Type *</label>
        <select className={S.select} value={type} onChange={e => { setType(e.target.value); setContenu(''); setUploadError(''); }}>
          <option value="video">Vidéo YouTube</option>
          <option value="genially">Genially</option>
          <option value="pdf">PDF</option>
          <option value="texte">Texte</option>
          <option value="word">Word (.docx)</option>
          <option value="ppt">PowerPoint (.pptx)</option>
        </select>
      </div>

      <div className={S.field}>
        <label className={S.label}>Titre</label>
        <input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre du contenu (optionnel)" />
      </div>

      {/* ─── Zone fichier : PDF / Word / PowerPoint — drag & drop + URL ─── */}
      {(type === 'pdf' || type === 'word' || type === 'ppt') && (
        <div className={S.field}>
          <label className={S.label}>
            {type === 'pdf' ? 'Fichier PDF *' : type === 'word' ? 'Fichier Word (.docx) *' : 'Fichier PowerPoint (.pptx) *'}
          </label>

          {/* Zone drag & drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('doc-file-input').click()}
            style={{
              borderRadius:'var(--a-radius-sm)', padding:'24px 16px', textAlign:'center', cursor:'pointer',
              transition:'all 0.2s', marginBottom:10,
              border: `2px dashed ${dragOver ? 'var(--a-gold)' : contenu ? 'var(--a-green)' : 'var(--a-border)'}`,
              background: dragOver ? 'rgba(191,138,48,.05)' : contenu ? 'rgba(48,209,88,.04)' : 'var(--a-bg)',
            }}>
            <input
              id="doc-file-input"
              type="file"
              accept={
                type === 'pdf'  ? 'application/pdf' :
                type === 'word' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              }
              className="hidden"
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
            />
            {uploading ? (
              <div style={{ color:'var(--a-gold)', fontSize:14 }}>⏳ Upload en cours...</div>
            ) : contenu ? (
              <div style={{ color:'var(--a-green)', fontSize:13 }}>
                ✅ Fichier uploadé avec succès
                <div style={{ fontSize:11, color:'var(--a-fg-mid)', marginTop:4, wordBreak:'break-all' }}>{contenu.split('/').pop()}</div>
                <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:2 }}>Cliquer pour remplacer</div>
              </div>
            ) : (
              <div style={{ color:'var(--a-fg-mid)', fontSize:13, lineHeight:1.8 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>
                  {type === 'pdf' ? '📄' : type === 'word' ? '📃' : '📊'}
                </div>
                <strong>
                  Glisser-déposer votre {type === 'pdf' ? 'PDF' : type === 'word' ? 'fichier Word' : 'PowerPoint'} ici
                </strong>
                <div style={{ fontSize:11, marginTop:4, opacity:.7 }}>
                  ou cliquer pour parcourir — max {type === 'ppt' ? '20' : '10'} Mo
                </div>
              </div>
            )}
          </div>

          {uploadError && <div style={{ fontSize:12, color:'var(--a-red)', marginBottom:8 }}>{uploadError}</div>}

          {/* Saisie URL manuelle en fallback */}
          <div style={{ fontSize:11, color:'var(--a-fg-light)', marginBottom:4 }}>Ou saisir une URL directement :</div>
          <input className={S.input} value={contenu} onChange={e => setContenu(e.target.value)} placeholder="https://..." />
        </div>
      )}

      {/* ─── Vidéo ─── */}
      {type === 'video' && (
        <div className={S.field}>
          <label className={S.label}>URL YouTube *</label>
          <input className={S.input} value={contenu} onChange={e => setContenu(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
      )}

      {/* ─── Genially ─── */}
      {type === 'genially' && (
        <div className={S.field}>
          <label className={S.label}>Lien ou code Genially *</label>
          <input
            className={S.input}
            value={contenu}
            onChange={e => setContenu(e.target.value)}
            placeholder="https://view.genially.com/... ou coller le code <iframe>"
          />
          <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:4 }}>
            Dans Genially → Partager → coller le lien ou le code d'intégration
          </div>
          {contenu && !normalizeGeniallyUrl(contenu) && (
            <div style={{ fontSize:12, color:'var(--a-red)', marginTop:4 }}>
              URL Genially non reconnue — vérifiez que le lien contient view.genially.com
            </div>
          )}
        </div>
      )}

      {/* ─── Texte ─── */}
      {type === 'texte' && (
        <div className={S.field}>
          <label className={S.label}>Contenu *</label>
          <RichTextEditor
            value={contenu}
            onChange={setContenu}
            uploadFolder={[moduleTitre, thematiqueTitre, niveauTitre].filter(Boolean).map(toSlug).join('/') + '/images'}
          />
        </div>
      )}

      <div className={`${S.field} max-w-[120px]`}>
        <label className={S.label}>Ordre</label>
        <input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} />
      </div>

      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || uploading || !(type === 'genially' ? normalizeGeniallyUrl(contenu) : contenu.replace(/<[^>]*>/g, '').trim())} onClick={() => onSave({ id: data?.id, type, titre, contenu: type === 'genially' ? normalizeGeniallyUrl(contenu) : contenu, ordre })}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

// ─── Modal Import QCM CSV ─────────────────────────────────────────────────────
function ImportQCMModal({ existingCount, onLoad, onClose }) {
  const [parsed, setParsed]     = useState(null); // { questions, skipped }
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode]         = useState('remplacer'); // 'remplacer' | 'ajouter'
  const fileRef = React.useRef();

  const downloadTemplate = () => {
    const rows = [
      'Question;Choix A;Choix B;Choix C;Choix D;Choix E;Choix F;Bonne(s) réponse(s)',
      'Combien de lettres dans l\'alphabet arabe ?;24;26;28;32;;;C',
      'Quelle est la 1ère lettre de l\'alphabet arabe ?;ب;ت;أ;ث;;;C',
      'Quelles lettres sont des voyelles longues ?;أ;و;ي;ب;;;A,B,C',
    ].join('\n');
    const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'modele-qcm.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) { alert('Veuillez sélectionner un fichier .csv'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setParsed(parseQCMCsv(e.target.result));
    reader.readAsText(file, 'UTF-8');
  };

  const tdBase = { padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)' };
  const tdGreenBg = { padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-green)', fontWeight:600, background:'rgba(48,209,88,.08)' };
  const tdGreenAnswer = { padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-green)', fontWeight:700, textAlign:'center' };

  return (
    <Modal title="⬆ Importer des questions QCM" onClose={onClose}>

      {/* ─── Guide format ─── */}
      <div style={{ marginBottom:16, padding:'12px 14px', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', fontSize:12 }}>
        <div style={{ fontWeight:700, color:'var(--a-fg)', marginBottom:8 }}>📋 Format du fichier CSV</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', fontSize:11, borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Question','Choix A','Choix B','Choix C','Choix D','Bonne(s) réponse(s)'].map(h => (
                  <th key={h} style={{ padding:'4px 8px', background:'var(--a-bg-card)', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...tdBase, color:'var(--a-fg)' }}>Combien de lettres en arabe ?</td>
                <td style={tdBase}>24</td>
                <td style={tdBase}>26</td>
                <td style={tdGreenBg}>28</td>
                <td style={tdBase}>32</td>
                <td style={tdGreenAnswer}>C</td>
              </tr>
              <tr>
                <td style={{ ...tdBase, color:'var(--a-fg)' }}>Voyelles longues ? (plusieurs)</td>
                <td style={tdGreenBg}>أ</td>
                <td style={tdGreenBg}>و</td>
                <td style={tdGreenBg}>ي</td>
                <td style={tdBase}>ب</td>
                <td style={tdGreenAnswer}>A,B,C</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:8, color:'var(--a-fg-mid)', lineHeight:1.5 }}>
          → Colonne <strong>Bonne(s) réponse(s)</strong> : écris <strong style={{ color:'var(--a-green)' }}>C</strong> pour une seule bonne réponse, ou <strong style={{ color:'var(--a-green)' }}>A,B,C</strong> pour plusieurs.
        </div>
      </div>

      {/* ─── Zone A : modèle ─── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, padding:'10px 14px', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--a-fg)' }}>Télécharger le modèle Excel</div>
          <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginTop:2 }}>Fichier pré-rempli avec les bonnes colonnes et des exemples.</div>
        </div>
        <button className={S.btnSave} style={{ marginLeft:12, flexShrink:0, fontSize:12, padding:'8px 14px' }} onClick={downloadTemplate}>
          ⬇ Modèle CSV
        </button>
      </div>

      {/* ─── Zone B : sélection fichier ─── */}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      <div
        style={{ borderRadius:'var(--a-radius-sm)', padding:'28px 20px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', marginBottom:16,
          border: `2px dashed ${dragOver ? 'var(--a-blue)' : 'var(--a-border)'}`,
          background: dragOver ? 'rgba(85,150,247,.06)' : 'var(--a-bg)',
        }}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
        <div style={{ fontSize:'1.75rem', marginBottom:6 }}>📂</div>
        <div style={{ fontSize:13, fontWeight:600, color:'var(--a-fg-mid)' }}>Glissez votre fichier CSV ici</div>
        <div style={{ fontSize:12, color:'var(--a-fg-light)', marginTop:4 }}>ou cliquez pour parcourir</div>
      </div>

      {/* ─── Zone C : aperçu résultat ─── */}
      {parsed && (
        <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:16, marginBottom:16 }}>
          <div style={{ display:'flex', gap:12, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--a-green)' }}>
              ✅ {parsed.questions.length} question{parsed.questions.length > 1 ? 's' : ''} détectée{parsed.questions.length > 1 ? 's' : ''}
            </span>
            {parsed.skipped > 0 && (
              <span style={{ fontSize:13, fontWeight:600, color:'var(--a-red)' }}>
                ⚠️ {parsed.skipped} ligne{parsed.skipped > 1 ? 's' : ''} ignorée{parsed.skipped > 1 ? 's' : ''} (format invalide)
              </span>
            )}
          </div>
          {/* Aperçu des 3 premières questions */}
          {parsed.questions.slice(0, 3).map((q, i) => (
            <div key={i} style={{ fontSize:12, color:'var(--a-fg-mid)', marginBottom:6, paddingLeft:8, borderLeft:'2px solid var(--a-gold)' }}>
              <span style={{ fontWeight:600, color:'var(--a-fg)' }}>{i+1}. {q.question}</span>
              <span style={{ marginLeft:8 }}>{q.choix.length} choix — Bonne(s) : {q.reponse_correcte.map(r => String.fromCharCode(65+r)).join(', ')}</span>
            </div>
          ))}
          {parsed.questions.length > 3 && (
            <div style={{ fontSize:12, color:'var(--a-fg-light)', paddingLeft:8, marginTop:4 }}>… et {parsed.questions.length - 3} autre{parsed.questions.length - 3 > 1 ? 's' : ''}</div>
          )}

          {/* Mode fusion */}
          {existingCount > 0 && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--a-border)' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                {existingCount} question{existingCount > 1 ? 's' : ''} déjà existante{existingCount > 1 ? 's' : ''} dans ce QCM :
              </div>
              <div className="flex gap-2">
                {['remplacer', 'ajouter'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    className="py-[7px] px-3.5 rounded-full border text-xs font-semibold cursor-pointer"
                    style={{ background: mode===m ? 'var(--a-gold)' : 'transparent', color: mode===m ? '#fff' : 'var(--a-fg-mid)', borderColor: mode===m ? 'var(--a-gold)' : 'var(--a-border)' }}>
                    {m === 'remplacer' ? '🔄 Remplacer' : '➕ Ajouter aux existantes'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button
          className={S.btnSave}
          style={{ opacity: (!parsed || parsed.questions.length === 0) ? .4 : 1 }}
          disabled={!parsed || parsed.questions.length === 0}
          onClick={() => onLoad(parsed.questions, mode)}>
          Charger dans le carrousel →
        </button>
      </div>
    </Modal>
  );
}

function QCMCarouselModal({ initialQuestions, startIndex, addNew, onSaveAll, onClose, loading }) {
  const emptyQ = (ordre) => ({ id: null, question: '', choix: ['', '', '', ''], reponse_correcte: [], ordre });

  const [questions, setQuestions] = useState(() => {
    const qs = initialQuestions.map(q => ({
      ...q,
      reponse_correcte: Array.isArray(q.reponse_correcte) ? q.reponse_correcte : [q.reponse_correcte].filter(v => v != null),
    }));
    if (addNew || qs.length === 0) qs.push(emptyQ(qs.length + 1));
    return qs;
  });
  const [current, setCurrent] = useState(Math.min(startIndex, questions.length - 1));
  const [deletedIds, setDeletedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  const q = questions[current];

  const updateQ = (field, value) =>
    setQuestions(prev => prev.map((item, i) => i === current ? { ...item, [field]: value } : item));

  const updateChoix = (ci, val) => {
    const newChoix = [...q.choix]; newChoix[ci] = val; updateQ('choix', newChoix);
  };
  const addChoix = () => { if (q.choix.length < 6) updateQ('choix', [...q.choix, '']); };
  const removeChoix = (ci) => {
    if (q.choix.length <= 2) return;
    const newChoix = q.choix.filter((_, i) => i !== ci);
    const newCorrect = q.reponse_correcte.filter(r => r !== ci).map(r => r > ci ? r - 1 : r);
    setQuestions(prev => prev.map((item, i) => i === current ? { ...item, choix: newChoix, reponse_correcte: newCorrect } : item));
  };
  const toggleCorrect = (ci) => {
    const arr = q.reponse_correcte || [];
    updateQ('reponse_correcte', arr.includes(ci) ? arr.filter(r => r !== ci) : [...arr, ci]);
  };

  const addQuestion = () => {
    const newQ = emptyQ(questions.length + 1);
    setQuestions(prev => [...prev, newQ]);
    setCurrent(questions.length);
  };

  const deleteQuestion = () => {
    if (q.id) setDeletedIds(prev => [...prev, q.id]);
    if (questions.length === 1) {
      setQuestions([emptyQ(1)]);
      return;
    }
    const newQs = questions.filter((_, i) => i !== current);
    setQuestions(newQs);
    setCurrent(Math.max(0, current - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveAll(questions, deletedIds);
    } finally {
      setSaving(false);
    }
  };

  const isCurrentValid = q.question.trim() && q.choix.every(c => c.trim()) && (q.reponse_correcte || []).length > 0
    && (q.reponse_correcte || []).every(r => r >= 0 && r < q.choix.length);
  const allValid = questions.every(q => !q.question.trim() || (
    q.choix.every(c => c.trim()) && (q.reponse_correcte || []).length > 0
    && (q.reponse_correcte || []).every(r => r >= 0 && r < q.choix.length)
  ));

  return (
    <Modal title="Éditeur de QCM" onClose={onClose} maxWidth={580}>
      {/* ─── Navigation carrousel ─── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'8px 14px', marginBottom:20 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
          className={S.actionBtn} style={{ opacity: current === 0 ? .3 : 1, fontSize:18, padding:'2px 8px' }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--a-fg)' }}>
          Question {current + 1} <span style={{ color:'var(--a-fg-mid)', fontWeight:400 }}>/ {questions.length}</span>
        </span>
        <button onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))} disabled={current === questions.length-1}
          className={S.actionBtn} style={{ opacity: current === questions.length-1 ? .3 : 1, fontSize:18, padding:'2px 8px' }}>›</button>
      </div>

      {/* ─── Question ─── */}
      <div className={S.field}>
        <label className={S.label}>Question *</label>
        <textarea className={S.textarea} value={q.question}
          onChange={e => updateQ('question', e.target.value)}
          placeholder="Ex : Quelle est la première sourate du Coran ?" rows={3} />
      </div>

      {/* ─── Choix — 2 colonnes ─── */}
      <div className={S.field}>
        {/* En-têtes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 56px', gap:8, marginBottom:6 }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--a-fg-mid)' }}>
            Réponses possibles *
          </div>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--a-fg-mid)', textAlign:'center' }}>
            Correcte
          </div>
        </div>

        {q.choix.map((ch, ci) => {
          const isCorrect = (q.reponse_correcte || []).includes(ci);
          return (
            <div key={ci} style={{ display:'grid', gridTemplateColumns:'1fr 56px', gap:8, alignItems:'center', marginBottom:7 }}>
              {/* Colonne gauche : lettre + input + supprimer */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{
                  width:22, height:22, borderRadius:6, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:800,
                  background: isCorrect ? 'rgba(48,209,88,.12)' : 'var(--a-bg)',
                  color: isCorrect ? 'var(--a-green)' : 'var(--a-fg-light)',
                  border: `1px solid ${isCorrect ? 'rgba(48,209,88,.35)' : 'var(--a-border)'}`,
                  transition: 'all .15s',
                }}>
                  {String.fromCharCode(65+ci)}
                </span>
                <input className={S.input} style={{ flex:1, borderColor: isCorrect ? 'var(--a-green)' : '' }}
                  value={ch} onChange={e => updateChoix(ci, e.target.value)}
                  placeholder={`Réponse ${String.fromCharCode(65+ci)}`} />
                {q.choix.length > 2 && (
                  <button className={S.actionBtn} style={{ color:'var(--a-red)', padding:'2px 3px', flexShrink:0 }} onClick={() => removeChoix(ci)}>✕</button>
                )}
              </div>
              {/* Colonne droite : case à cocher stylée */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                <label style={{
                  width:34, height:34, borderRadius:8, cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isCorrect ? 'rgba(48,209,88,.12)' : 'var(--a-bg)',
                  border: `2px solid ${isCorrect ? 'var(--a-green)' : 'var(--a-border)'}`,
                  transition: 'all .15s',
                  flexShrink: 0,
                }}>
                  <input type="checkbox" checked={isCorrect} onChange={() => toggleCorrect(ci)}
                    style={{ position:'absolute', opacity:0, width:0, height:0, pointerEvents:'none' }} />
                  {isCorrect
                    ? <span style={{ fontSize:16, color:'var(--a-green)', fontWeight:700, lineHeight:1 }}>✓</span>
                    : <span style={{ fontSize:14, color:'var(--a-border)', lineHeight:1 }}>○</span>
                  }
                </label>
              </div>
            </div>
          );
        })}

        {q.choix.length < 6 && (
          <button className={S.btnCancel}
            style={{ fontSize:12, padding:'5px 14px', marginTop:4 }}
            onClick={addChoix}>
            + Ajouter une réponse
          </button>
        )}

        {!isCurrentValid && q.question.trim() && (q.reponse_correcte || []).length === 0 && (
          <div style={{ fontSize:11, color:'var(--a-red)', marginTop:8 }}>⚠ Cochez au moins une bonne réponse</div>
        )}
        {!isCurrentValid && q.question.trim() && (q.reponse_correcte || []).length > 0
          && !(q.reponse_correcte || []).every(r => r >= 0 && r < q.choix.length) && (
          <div style={{ fontSize:11, color:'var(--a-red)', marginTop:8 }}>⚠ Une bonne réponse cochée correspond à un choix supprimé</div>
        )}
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid var(--a-border)', marginTop:4 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button className={S.btnDanger} style={{ fontSize:12, padding:'7px 14px' }} onClick={deleteQuestion}>
            🗑 Supprimer
          </button>
          <button className={S.btnCancel} style={{ fontSize:12, padding:'7px 14px' }} onClick={addQuestion}>
            + Nouvelle
          </button>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button className={S.btnCancel} onClick={onClose}>Fermer</button>
          <button className={S.btnSave} disabled={saving || loading || !allValid} onClick={handleSave}>
            {saving || loading ? 'Sauvegarde…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
