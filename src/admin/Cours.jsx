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

// ─── Icônes SVG ──────────────────────────────────────────────────────────────
const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconVideo = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>;
const IconFile  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconText  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>;
const IconWord  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>;
const IconPPT   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;

const TYPE_ICONS = { video: <IconVideo />, pdf: <IconFile />, texte: <IconText />, word: <IconWord />, ppt: <IconPPT /> };
const TYPE_COLORS = { video: 'var(--a-red)', pdf: 'var(--a-blue)', texte: 'var(--a-green)', word: '#2b579a', ppt: '#c43e1c' };

// ─── Classes Tailwind ────────────────────────────────────────────────────────
const S = {
  page: 'min-h-full',
  breadcrumb: 'flex items-center gap-2 mb-6 cursor-pointer text-a-fg-mid text-sm font-medium',
  breadcrumbText: 'transition-colors duration-200',
  grid: 'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4',
  card: 'bg-a-bg-card rounded-a border border-a-border p-5 cursor-pointer transition-[transform,box-shadow] duration-200 ease-[var(--a-ease-out)]',
  cardHeader: 'flex justify-between items-start mb-3',
  cardTitle: 'text-base font-semibold text-a-fg m-0',
  cardDesc: 'text-[13px] text-a-fg-mid m-0 leading-normal',
  cardFooter: 'flex gap-2 mt-4',
  badge: (c) => ({ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c }),
  actions: 'flex gap-1.5',
  actionBtn: 'bg-transparent border-none text-a-fg-mid cursor-pointer p-1 rounded-[6px] inline-flex transition-colors duration-200',
  addCard: 'bg-a-bg-card rounded-a border-2 border-dashed border-a-border p-5 cursor-pointer flex items-center justify-center gap-2 text-a-fg-mid text-sm font-medium min-h-[120px] transition-[border-color,color] duration-200',
  // Modal
  overlay: 'fixed inset-0 flex items-center justify-center z-[1000]',
  modal: 'bg-a-bg-card rounded-a p-7 w-full max-w-[500px] max-h-[85vh] overflow-y-auto border border-a-border',
  modalTitle: 'font-a-display text-lg font-bold text-a-fg mb-5',
  field: 'mb-4',
  label: 'block text-xs font-semibold text-a-fg-mid mb-1.5 uppercase tracking-[.5px]',
  input: 'w-full px-3.5 py-2.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none box-border',
  textarea: 'w-full px-3.5 py-2.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none min-h-[80px] resize-y box-border font-[inherit]',
  select: 'w-full px-3.5 py-2.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none box-border',
  btnRow: 'flex gap-2.5 justify-end mt-5',
  btnCancel: 'px-5 py-[9px] rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer',
  btnSave: 'px-5 py-[9px] rounded-full border-none bg-a-gold text-white text-[13px] font-semibold cursor-pointer',
  btnDanger: 'px-5 py-[9px] rounded-full border-none bg-a-red text-white text-[13px] font-semibold cursor-pointer',
  // Tabs
  tabs: 'flex gap-1 mb-5 bg-a-bg rounded-a-sm p-[3px]',
  tab: (active) => `px-4 py-2 rounded-lg border-none text-[13px] font-semibold cursor-pointer transition-all duration-200 ${active ? 'bg-a-bg-card text-a-fg' : 'bg-transparent text-a-fg-mid'}`,
  // List item
  listItem: 'flex items-center justify-between px-4 py-3.5 bg-a-bg-card rounded-a-sm border border-a-border mb-2 transition-transform duration-150',
  listLeft: 'flex items-center gap-3 flex-1 min-w-0',
  listNum: 'w-7 h-7 rounded-full bg-a-gold text-white flex items-center justify-center text-xs font-bold shrink-0',
  empty: 'text-center py-12 px-5 text-a-fg-mid text-sm',
};

// ─── Modal générique ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth }) {
  return (
    <div className={`${S.overlay} bg-black/60 backdrop-blur-[6px]`} onClick={onClose}>
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
      if (data.id) { await updateModule(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre, actif: data.actif, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      else { await createModule({ titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || modules.length + 1, actif: true, niveaux_scolaires_ids: data.niveaux_scolaires_ids || [] }); }
      await loadModules();
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteModule = (id, titre) => {
    setConfirm({
      title: 'Supprimer ce module ?',
      message: <span>Le module <strong>"{titre}"</strong> et tout son contenu (niveaux, cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
      if (data.id) { await updateThematique(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      else { await createThematique({ module_id: selModule.id, titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || thematiques.length + 1, niveaux_scolaires_ids: data.niveaux_scolaires_ids }); }
      await loadThematiques(selModule.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteThematique = (id, titre) => {
    setConfirm({
      title: 'Supprimer cette thématique ?',
      message: <span>La thématique <strong>"{titre}"</strong> et tous ses niveaux (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
      if (data.id) { await updateNiveau(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre, score_requis: data.score_requis }); }
      else { await createNiveau({ module_id: selModule.id, thematique_id: selThematique?.id || null, lecon_id: selLecon?.id || null, titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || niveaux.length + 1, score_requis: data.score_requis || 80 }); }
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
      message: <span>Le niveau <strong>"{titre}"</strong> et tout son contenu (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
      if (data.id) { await updateLecon(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre }); }
      else { await createLecon({ thematique_id: selThematique.id, titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || lecons.length + 1 }); }
      await loadLecons(selThematique.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  const handleDeleteLecon = (id, titre) => {
    setConfirm({
      title: 'Supprimer cette leçon ?',
      message: <span>La leçon <strong>"{titre}"</strong> et tous ses niveaux (cours, QCM, fichiers) seront supprimés définitivement.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
      message: <span>Ce fichier/contenu sera supprimé définitivement.<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
      message: <span>Toutes les questions de ce QCM seront supprimées définitivement.<br/><br/>La progression des élèves pour ce niveau sera <strong>automatiquement réinitialisée</strong> pour éviter les faux "réussis".<br/><br/><span className="text-a-red font-semibold">Cette action est irréversible.</span></span>,
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
            <div key={m.id} className={S.card} style={{ padding: 0, overflow: 'hidden' }} onClick={() => openModule(m)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {/* Image de couverture */}
              {m.image_url ? (
                <div className="w-full h-[140px] overflow-hidden relative bg-a-bg">
                  <img src={m.image_url} alt={m.titre} className="w-full h-full object-cover block" />
                  <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                </div>
              ) : (
                <div className="w-full h-20 flex items-center justify-center text-[32px]" style={{ background:'linear-gradient(135deg, var(--a-gold)22 0%, var(--a-gold)08 100%)' }}>
                  📚
                </div>
              )}
              <div className="p-4">
                <div className={S.cardHeader}>
                  <h3 className={S.cardTitle}>{m.titre}</h3>
                  <div className={S.actions}>
                    <button className={S.actionBtn} title="Modifier" aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'module', data:m }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteModule(m.id, m.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {m.description && <p className={S.cardDesc}>{m.description}</p>}
                <div className={S.cardFooter}>
                  <span style={S.badge('var(--a-gold)')}>Ordre : {m.ordre}</span>
                  <span style={S.badge(m.actif ? 'var(--a-green)' : 'var(--a-red)')}>{m.actif ? 'Actif' : 'Inactif'}</span>
                  {m.niveaux_scolaires_ids?.length > 0
                    ? m.niveaux_scolaires_ids.map(nsId => {
                        const ns = niveauxScolaires.find(n => n.id === nsId);
                        return ns ? <span key={nsId} style={S.badge('var(--a-blue)')}>{ns.nom}</span> : null;
                      })
                    : <span style={S.badge('var(--a-red)')}>Non visible</span>
                  }
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'module' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <IconPlus /> Ajouter un module
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
          <IconBack /> <span className={S.breadcrumbText}>Retour aux modules</span>
          <span className="text-a-fg ml-2 font-semibold">{selModule?.titre}</span>
        </div>

        <div className={S.grid}>
          {thematiques.map(th => (
            <div key={th.id} className={S.card} style={{ padding: 0, overflow: 'hidden' }} onClick={() => openThematique(th)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {th.image_url ? (
                <div className="w-full h-[140px] overflow-hidden relative bg-a-bg">
                  <img src={th.image_url} alt={th.titre} className="w-full h-full object-cover block" />
                  <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                </div>
              ) : (
                <div className="w-full h-20 flex items-center justify-center text-[32px]" style={{ background:'linear-gradient(135deg, var(--a-gold)22 0%, var(--a-gold)08 100%)' }}>
                  📖
                </div>
              )}
              <div className="p-4">
                <div className={S.cardHeader}>
                  <h3 className={S.cardTitle}>{th.titre}</h3>
                  <div className={S.actions}>
                    <button className={S.actionBtn} title="Modifier" aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'thematique', data:th }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteThematique(th.id, th.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {th.description && <p className={S.cardDesc}>{th.description}</p>}
                <div className={S.cardFooter}>
                  <span style={S.badge('var(--a-gold)')}>Ordre : {th.ordre}</span>
                  {th.niveaux_scolaires_ids?.length > 0
                    ? th.niveaux_scolaires_ids.map(nsId => {
                        const ns = niveauxScolaires.find(n => n.id === nsId);
                        return ns ? <span key={nsId} style={S.badge('var(--a-blue)')}>{ns.nom}</span> : null;
                      })
                    : <span style={S.badge('var(--a-red)')}>Aucun accès</span>
                  }
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'thematique' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <IconPlus /> Ajouter une thématique
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
          <IconBack /> <span className={S.breadcrumbText}>Retour aux thématiques</span>
          <span className="text-a-fg ml-2 font-semibold">{selModule?.titre} → {selThematique?.titre}</span>
        </div>

        <div className={S.grid}>
          {lecons.map(lec => (
            <div key={lec.id} className={S.card} style={{ padding: 0, overflow: 'hidden' }} onClick={() => openLecon(lec)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {lec.image_url ? (
                <div className="w-full h-[140px] overflow-hidden relative bg-a-bg">
                  <img src={lec.image_url} alt={lec.titre} className="w-full h-full object-cover block" />
                  <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                </div>
              ) : (
                <div className="w-full h-20 flex items-center justify-center text-[32px]" style={{ background:'linear-gradient(135deg, var(--a-gold)22 0%, var(--a-gold)08 100%)' }}>
                  📖
                </div>
              )}
              <div className="p-4">
                <div className={S.cardHeader}>
                  <h3 className={S.cardTitle}>{lec.titre}</h3>
                  <div className={S.actions}>
                    <button className={S.actionBtn} title="Modifier" aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'lecon', data:lec }); }}><IconEdit /></button>
                    <button className={S.actionBtn} title="Supprimer" aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteLecon(lec.id, lec.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {lec.description && <p className={S.cardDesc}>{lec.description}</p>}
                <div className={S.cardFooter}>
                  <span style={S.badge('var(--a-gold)')}>Ordre : {lec.ordre}</span>
                </div>
              </div>
            </div>
          ))}
          <div className={S.addCard} onClick={() => setModal({ type:'lecon' })}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--a-gold)'; e.currentTarget.style.color='var(--a-gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=''; e.currentTarget.style.color=''; }}>
            <IconPlus /> Ajouter une leçon
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
          <IconBack /> <span className={S.breadcrumbText}>Retour aux leçons</span>
          <span className="text-a-fg ml-2 font-semibold">{selModule?.titre} → {selThematique?.titre} → {selLecon?.titre}</span>
        </div>

        {niveaux.map(n => (
          <div key={n.id} className={S.listItem} onClick={() => openNiveau(n)}>
            <div className={S.listLeft}>
              <div className={S.listNum}>{n.ordre}</div>
              <div>
                <div className="font-semibold text-a-fg text-sm">{n.titre}</div>
                {n.description && <div className="text-xs text-a-fg-mid mt-0.5">{n.description}</div>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span style={S.badge('var(--a-blue)')}>Score requis : {n.score_requis}%</span>
              <button className={S.actionBtn} aria-label="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}><IconEdit /></button>
              <button className={S.actionBtn} aria-label="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteNiveau(n.id, n.titre); }}><IconTrash /></button>
            </div>
          </div>
        ))}

        <div className={`${S.addCard} min-h-[50px] mt-2`} onClick={() => setModal({ type:'niveau' })}>
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
        <IconBack /> <span className={S.breadcrumbText}>{selLecon ? 'Retour aux leçons' : 'Retour aux niveaux'}</span>
        <span className="text-a-fg ml-2 font-semibold">
          {selLecon
            ? `${selModule?.titre} → ${selThematique?.titre} → ${selLecon?.titre}`
            : `${selModule?.titre} → ${selThematique?.titre} → ${selNiveau?.titre}`}
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
            <div key={c.id} className={S.listItem}>
              <div className={S.listLeft}>
                <span style={{ ...S.badge(TYPE_COLORS[c.type] || 'var(--a-fg-mid)'), gap:5 }}>{TYPE_ICONS[c.type]} {c.type}</span>
                <span className="font-medium text-a-fg text-sm overflow-hidden text-ellipsis whitespace-nowrap">{c.titre}</span>
              </div>
              <div className={S.actions}>
                <button className={S.actionBtn} aria-label="Modifier" onClick={() => setModal({ type:'contenu', data:c })}><IconEdit /></button>
                <button className={S.actionBtn} aria-label="Supprimer" onClick={() => handleDeleteContenu(c.id)}><IconTrash /></button>
              </div>
            </div>
          ))}
          <div className={`${S.addCard} min-h-[50px] mt-2`} onClick={() => setModal({ type:'contenu' })}>
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
              <div key={q.id} className={S.listItem}>
                <div className={`${S.listLeft} cursor-pointer flex-1`} onClick={() => setModal({ type:'qcm-carousel', startIndex: i })}>
                  <div className={S.listNum}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-a-fg text-sm">{q.question}</div>
                    <div className="text-xs text-a-fg-mid mt-1">
                      {(q.choix || []).map((ch, ci) => (
                        <span key={ci} className="mr-3" style={{ color: corrects.includes(ci) ? 'var(--a-green)' : 'var(--a-fg-mid)', fontWeight: corrects.includes(ci) ? 600 : 400 }}>
                          {corrects.includes(ci) ? '✓ ' : ''}{String.fromCharCode(65+ci)}. {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button className={S.actionBtn} aria-label="Modifier" onClick={() => setModal({ type:'qcm-carousel', startIndex: i })}><IconEdit /></button>
                  <button className={`${S.actionBtn} text-a-red border-[rgba(255,69,58,.2)] bg-[rgba(255,69,58,.08)]`} aria-label="Supprimer" onClick={() => handleDeleteQuestion(q.id, q.question)}><IconTrash /></button>
                </div>
              </div>
            );
          })}
          <div className="flex gap-2.5 mt-2">
            <div className={`${S.addCard} flex-1 min-h-[50px]`} onClick={() => setModal({ type:'qcm-carousel', startIndex: questions.length, addNew: true })}>
              <IconPlus /> {questions.length > 0 ? 'Gérer / ajouter des questions' : 'Créer les questions du QCM'}
            </div>
            <div className={`${S.addCard} min-h-[50px] flex-none px-5 text-a-blue border-a-blue`}
              onClick={() => setModal({ type:'import-qcm' })}>
              ⬆ Importer CSV
            </div>
            {questions.length > 0 && (
              <div className={`${S.addCard} min-h-[50px] flex-none px-5 text-a-red border-a-red`}
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

function ModuleModal({ data, onSave, onClose, loading }) {
  const [titre, setTitre] = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [image_url, setImageUrl] = useState(data?.image_url || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  const [actif, setActif] = useState(data?.actif !== undefined ? data.actif : true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [niveauxScolairesList, setNiveauxScolairesList] = useState([]);
  const [selectedNsIds, setSelectedNsIds] = useState(data?.niveaux_scolaires_ids || []);

  useEffect(() => {
    fetchNiveauxScolaires().then(setNiveauxScolairesList).catch(() => {});
  }, []);

  const toggleNs = (id) => {
    setSelectedNsIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadErr('Fichier non valide (JPG, PNG, WebP uniquement)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image trop lourde (max 5 Mo)'); return; }
    setUploadErr('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const folder = toSlug(titre);
      await deleteOldCover(folder).catch(() => {});
      const url = await uploadFile(file, `${folder}/cover.${ext}`);
      setImageUrl(url);
    } catch(e) { setUploadErr(e.message); }
    setUploading(false);
  };

  return (
    <Modal title={data ? 'Modifier le module' : 'Nouveau module'} onClose={onClose}>
      <div className={S.field}><label htmlFor="mod_titre" className={S.label}>Titre *</label><input id="mod_titre" className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Cours de Coran" /></div>
      <div className={S.field}><label htmlFor="mod_description" className={S.label}>Description</label><textarea id="mod_description" className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description du module..." /></div>

      {/* Zone upload image */}
      <div className={S.field}>
        <label className={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          className="rounded-a-sm p-3 cursor-pointer text-center transition-all duration-200 relative overflow-hidden"
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, background: dragOver ? 'var(--a-gold)0a' : 'transparent' }}>
          {image_url ? (
            <div className="relative">
              <img src={image_url} alt="aperçu" className="w-full h-[120px] object-cover rounded-md block" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md opacity-0 transition-opacity duration-200"
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span className="text-white text-[13px] font-semibold">🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-a-fg-mid text-[13px]">
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span className="text-[11px] opacity-70">JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div className="text-a-red text-xs mt-1">{uploadErr}</div>}
        {image_url && (
          <div className="flex justify-end mt-1">
            <button className="bg-transparent border-none text-a-red text-xs cursor-pointer py-0.5 px-0" onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      {/* Niveaux scolaires autorisés */}
      <div className={S.field}>
        <label className={S.label}>Niveaux scolaires autorisés</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {niveauxScolairesList.map(ns => (
            <label key={ns.id} className="flex items-center gap-1.5 cursor-pointer rounded-a-sm px-2.5 py-1 text-[13px] transition-all duration-150 select-none"
              style={{
                background: selectedNsIds.includes(ns.id) ? 'rgba(191,138,48,.13)' : 'var(--a-bg)',
                border:`1px solid ${selectedNsIds.includes(ns.id) ? 'var(--a-gold)' : 'var(--a-border)'}`,
              }}>
              <input type="checkbox" checked={selectedNsIds.includes(ns.id)} onChange={() => toggleNs(ns.id)} className="cursor-pointer" style={{ accentColor:'var(--a-gold)' }} />
              {ns.nom}
            </label>
          ))}
          {niveauxScolairesList.length === 0 && (
            <span className="text-xs text-a-fg-mid">Chargement…</span>
          )}
        </div>
        {selectedNsIds.length === 0 && niveauxScolairesList.length > 0 && (
          <div className="text-a-red text-xs mt-1.5">⚠ Aucun niveau sélectionné → module invisible pour tous les élèves (obligatoire)</div>
        )}
      </div>

      <div className="flex gap-3">
        <div className={`${S.field} flex-1`}><label className={S.label}>Ordre</label><input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
        <div className={`${S.field} flex-1`}><label className={S.label}>Actif</label>
          <select className={S.select} value={actif ? 'true' : 'false'} onChange={e => setActif(e.target.value === 'true')}>
            <option value="true">Oui</option><option value="false">Non</option>
          </select>
        </div>
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, actif, niveaux_scolaires_ids: selectedNsIds })}>
          {loading ? '...' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

function ThematiqueModal({ data, onSave, onClose, loading, moduleTitre }) {
  const [titre, setTitre] = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [image_url, setImageUrl] = useState(data?.image_url || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [niveauxScolairesList, setNiveauxScolairesList] = useState([]);
  const [selectedNsIds, setSelectedNsIds] = useState(data?.niveaux_scolaires_ids || []);

  useEffect(() => {
    fetchNiveauxScolaires().then(setNiveauxScolairesList).catch(() => {});
  }, []);

  const toggleNs = (id) => {
    setSelectedNsIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadErr('Fichier non valide (JPG, PNG, WebP uniquement)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image trop lourde (max 5 Mo)'); return; }
    setUploadErr('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const folder = `${toSlug(moduleTitre)}/${toSlug(titre)}`;
      await deleteOldCover(folder).catch(() => {});
      const url = await uploadFile(file, `${folder}/cover.${ext}`);
      setImageUrl(url);
    } catch(e) { setUploadErr(e.message); }
    setUploading(false);
  };

  return (
    <Modal title={data ? 'Modifier la thématique' : 'Nouvelle thématique'} onClose={onClose}>
      <div className={S.field}><label className={S.label}>Titre *</label><input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Grammaire arabe" /></div>
      <div className={S.field}><label className={S.label}>Description</label><textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la thématique..." /></div>

      {/* Zone upload image */}
      <div className={S.field}>
        <label className={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          className="rounded-a-sm p-3 cursor-pointer text-center transition-all duration-200 relative overflow-hidden"
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, background: dragOver ? 'var(--a-gold)0a' : 'transparent' }}>
          {image_url ? (
            <div className="relative">
              <img src={image_url} alt="aperçu" className="w-full h-[120px] object-cover rounded-md block" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md opacity-0 transition-opacity duration-200"
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span className="text-white text-[13px] font-semibold">🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-a-fg-mid text-[13px]">
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span className="text-[11px] opacity-70">JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div className="text-a-red text-xs mt-1">{uploadErr}</div>}
        {image_url && (
          <div className="flex justify-end mt-1">
            <button className="bg-transparent border-none text-a-red text-xs cursor-pointer py-0.5 px-0" onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      {/* Niveaux scolaires autorisés */}
      <div className={S.field}>
        <label className={S.label}>Niveaux scolaires autorisés</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {niveauxScolairesList.map(ns => (
            <label key={ns.id} className="flex items-center gap-1.5 cursor-pointer rounded-a-sm px-2.5 py-1 text-[13px] transition-all duration-150 select-none"
              style={{
                background: selectedNsIds.includes(ns.id) ? 'rgba(191,138,48,.13)' : 'var(--a-bg)',
                border:`1px solid ${selectedNsIds.includes(ns.id) ? 'var(--a-gold)' : 'var(--a-border)'}`,
              }}>
              <input type="checkbox" checked={selectedNsIds.includes(ns.id)} onChange={() => toggleNs(ns.id)} className="cursor-pointer" style={{ accentColor:'var(--a-gold)' }} />
              {ns.nom}
            </label>
          ))}
          {niveauxScolairesList.length === 0 && (
            <span className="text-xs text-a-fg-mid">Chargement…</span>
          )}
        </div>
        {selectedNsIds.length === 0 && niveauxScolairesList.length > 0 && (
          <div className="text-a-red text-xs mt-1.5">⚠ Aucun niveau sélectionné → thématique invisible pour tous les élèves</div>
        )}
      </div>

      <div className={S.field}><label className={S.label}>Ordre</label><input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, niveaux_scolaires_ids: selectedNsIds })}>
          {loading ? '...' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

function LeconModal({ data, onSave, onClose, loading, moduleTitre, thematiqueTitre }) {
  const [titre, setTitre] = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [image_url, setImageUrl] = useState(data?.image_url || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadErr('Fichier non valide (JPG, PNG, WebP uniquement)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image trop lourde (max 5 Mo)'); return; }
    setUploadErr('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const folder = `${toSlug(moduleTitre)}/${toSlug(thematiqueTitre)}/${toSlug(titre)}`;
      await deleteOldCover(folder).catch(() => {});
      const url = await uploadFile(file, `${folder}/cover.${ext}`);
      setImageUrl(url);
    } catch(e) { setUploadErr(e.message); }
    setUploading(false);
  };

  return (
    <Modal title={data ? 'Modifier la leçon' : 'Nouvelle leçon'} onClose={onClose}>
      <div className={S.field}><label className={S.label}>Titre *</label><input className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Leçon 1 - Les voyelles" /></div>
      <div className={S.field}><label className={S.label}>Description</label><textarea className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la leçon..." /></div>

      <div className={S.field}>
        <label className={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          className="rounded-a-sm p-3 cursor-pointer text-center transition-all duration-200 relative overflow-hidden"
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, background: dragOver ? 'var(--a-gold)0a' : 'transparent' }}>
          {image_url ? (
            <div className="relative">
              <img src={image_url} alt="aperçu" className="w-full h-[120px] object-cover rounded-md block" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md opacity-0 transition-opacity duration-200"
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span className="text-white text-[13px] font-semibold">🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-a-fg-mid text-[13px]">
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span className="text-[11px] opacity-70">JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div className="text-a-red text-xs mt-1">{uploadErr}</div>}
        {image_url && (
          <div className="flex justify-end mt-1">
            <button className="bg-transparent border-none text-a-red text-xs cursor-pointer py-0.5 px-0" onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      <div className={S.field}><label className={S.label}>Ordre</label><input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre })}>
          {loading ? '...' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  );
}

function NiveauModal({ data, onSave, onClose, loading, moduleTitre }) {
  const [titre, setTitre] = useState(data?.titre || '');
  const [description, setDescription] = useState(data?.description || '');
  const [image_url, setImageUrl] = useState(data?.image_url || '');
  const [ordre, setOrdre] = useState(data?.ordre || 1);
  const [score_requis, setScoreRequis] = useState(data?.score_requis || 80);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setUploadErr('Fichier non valide (JPG, PNG, WebP uniquement)'); return; }
    if (file.size > 5 * 1024 * 1024) { setUploadErr('Image trop lourde (max 5 Mo)'); return; }
    setUploadErr('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const folder = `${toSlug(moduleTitre)}/${toSlug(titre)}`;
      await deleteOldCover(folder).catch(() => {});
      const url = await uploadFile(file, `${folder}/cover.${ext}`);
      setImageUrl(url);
    } catch(e) { setUploadErr(e.message); }
    setUploading(false);
  };

  return (
    <Modal title={data ? 'Modifier le niveau' : 'Nouveau niveau'} onClose={onClose}>
      <div className={S.field}><label htmlFor="niv_titre" className={S.label}>Titre *</label><input id="niv_titre" className={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Niveau 1 - Introduction" /></div>
      <div className={S.field}><label htmlFor="niv_description" className={S.label}>Description</label><textarea id="niv_description" className={S.textarea} value={description} onChange={e => setDescription(e.target.value)} /></div>

      {/* Zone upload image */}
      <div className={S.field}>
        <label className={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          className="rounded-a-sm p-3 cursor-pointer text-center transition-all duration-200"
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, background: dragOver ? 'var(--a-gold)0a' : 'transparent' }}>
          {image_url ? (
            <div className="relative">
              <img src={image_url} alt="aperçu" className="w-full h-[120px] object-cover rounded-md block" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-md opacity-0 transition-opacity duration-200"
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span className="text-white text-[13px] font-semibold">🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-a-fg-mid text-[13px]">
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span className="text-[11px] opacity-70">JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div className="text-a-red text-xs mt-1">{uploadErr}</div>}
        {image_url && (
          <div className="flex justify-end mt-1">
            <button className="bg-transparent border-none text-a-red text-xs cursor-pointer py-0.5 px-0" onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className={`${S.field} flex-1`}><label className={S.label}>Ordre</label><input className={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
        <div className={`${S.field} flex-1`}><label htmlFor="niv_score_requis" className={S.label}>Score requis (%)</label><input id="niv_score_requis" className={S.input} type="number" min="0" max="100" value={score_requis} onChange={e => setScoreRequis(+e.target.value)} /></div>
      </div>
      <div className={S.btnRow}>
        <button className={S.btnCancel} onClick={onClose}>Annuler</button>
        <button className={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, score_requis })}>
          {loading ? '...' : 'Enregistrer'}
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
            className="rounded-a-sm py-6 px-4 text-center cursor-pointer transition-all duration-200 mb-2.5"
            style={{
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
              <div className="text-a-gold text-sm">⏳ Upload en cours...</div>
            ) : contenu ? (
              <div className="text-a-green text-[13px]">
                ✅ Fichier uploadé avec succès
                <div className="text-[11px] text-a-fg-mid mt-1 break-all">{contenu.split('/').pop()}</div>
                <div className="text-[11px] text-a-fg-light mt-0.5">Cliquer pour remplacer</div>
              </div>
            ) : (
              <div className="text-a-fg-mid text-[13px]">
                <div className="text-[28px] mb-2">
                  {type === 'pdf' ? '📄' : type === 'word' ? '📃' : '📊'}
                </div>
                <strong>
                  Glisser-déposer votre {type === 'pdf' ? 'PDF' : type === 'word' ? 'fichier Word' : 'PowerPoint'} ici
                </strong>
                <div className="text-xs mt-1">
                  ou cliquer pour parcourir — max {type === 'ppt' ? '20' : '10'} Mo
                </div>
              </div>
            )}
          </div>

          {uploadError && <div className="text-xs text-a-red mb-2">{uploadError}</div>}

          {/* Saisie URL manuelle en fallback */}
          <div className="text-[11px] text-a-fg-light mb-1">Ou saisir une URL directement :</div>
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
        <button className={S.btnSave} disabled={loading || uploading || !contenu.replace(/<[^>]*>/g, '').trim()} onClick={() => onSave({ id: data?.id, type, titre, contenu, ordre })}>
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

  const tdBase = 'py-1 px-2 border border-a-border';
  const tdGreenBg = 'py-1 px-2 border border-a-border text-a-green font-semibold bg-[rgba(48,209,88,.08)]';
  const tdGreenAnswer = 'py-1 px-2 border border-a-border text-a-green font-bold text-center';

  return (
    <Modal title="⬆ Importer des questions QCM" onClose={onClose}>

      {/* ─── Guide format ─── */}
      <div className="mb-4 py-3 px-3.5 bg-a-bg rounded-a-sm text-xs">
        <div className="font-bold text-a-fg mb-2">📋 Format du fichier CSV</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                {['Question','Choix A','Choix B','Choix C','Choix D','Bonne(s) réponse(s)'].map(h => (
                  <th key={h} className="py-1 px-2 bg-a-bg-card border border-a-border text-a-fg-mid font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={`${tdBase} text-a-fg`}>Combien de lettres en arabe ?</td>
                <td className={`${tdBase} text-a-fg-mid`}>24</td>
                <td className={`${tdBase} text-a-fg-mid`}>26</td>
                <td className={tdGreenBg}>28</td>
                <td className={`${tdBase} text-a-fg-mid`}>32</td>
                <td className={tdGreenAnswer}>C</td>
              </tr>
              <tr>
                <td className={`${tdBase} text-a-fg`}>Voyelles longues ? (plusieurs)</td>
                <td className={tdGreenBg}>أ</td>
                <td className={tdGreenBg}>و</td>
                <td className={tdGreenBg}>ي</td>
                <td className={`${tdBase} text-a-fg-mid`}>ب</td>
                <td className={tdGreenAnswer}>A,B,C</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-a-fg-mid leading-relaxed">
          → Colonne <strong>Bonne(s) réponse(s)</strong> : écris <strong className="text-a-green">C</strong> pour une seule bonne réponse, ou <strong className="text-a-green">A,B,C</strong> pour plusieurs.
        </div>
      </div>

      {/* ─── Zone A : modèle ─── */}
      <div className="flex items-center justify-between mb-4 py-2.5 px-3.5 bg-a-bg rounded-a-sm">
        <div>
          <div className="text-[13px] font-semibold text-a-fg">Télécharger le modèle Excel</div>
          <div className="text-xs text-a-fg-mid mt-0.5">Fichier pré-rempli avec les bonnes colonnes et des exemples.</div>
        </div>
        <button className={`${S.btnSave} text-xs py-2 px-3.5 shrink-0 ml-3`} onClick={downloadTemplate}>
          ⬇ Modèle CSV
        </button>
      </div>

      {/* ─── Zone B : sélection fichier ─── */}
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
      <div
        className="rounded-a-sm py-7 px-5 text-center cursor-pointer transition-all duration-200 mb-4"
        style={{
          border: `2px dashed ${dragOver ? 'var(--a-blue)' : 'var(--a-border)'}`,
          background: dragOver ? 'rgba(10,132,255,.06)' : 'var(--a-bg)',
        }}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
        <div className="text-[28px] mb-1.5">📂</div>
        <div className="text-[13px] font-semibold text-a-fg-mid">Glissez votre fichier CSV ici</div>
        <div className="text-xs text-a-fg-light mt-1">ou cliquez pour parcourir</div>
      </div>

      {/* ─── Zone C : aperçu résultat ─── */}
      {parsed && (
        <div className="bg-a-bg rounded-a-sm p-4 mb-4">
          <div className="flex gap-3 mb-3 flex-wrap">
            <span className="text-[13px] font-semibold text-a-green">
              ✅ {parsed.questions.length} question{parsed.questions.length > 1 ? 's' : ''} détectée{parsed.questions.length > 1 ? 's' : ''}
            </span>
            {parsed.skipped > 0 && (
              <span className="text-[13px] font-semibold text-a-red">
                ⚠️ {parsed.skipped} ligne{parsed.skipped > 1 ? 's' : ''} ignorée{parsed.skipped > 1 ? 's' : ''} (format invalide)
              </span>
            )}
          </div>
          {/* Aperçu des 3 premières questions */}
          {parsed.questions.slice(0, 3).map((q, i) => (
            <div key={i} className="text-xs text-a-fg-mid mb-1.5 pl-2 border-l-2 border-a-gold">
              <span className="font-semibold text-a-fg">{i+1}. {q.question}</span>
              <span className="ml-2">{q.choix.length} choix — Bonne(s) : {q.reponse_correcte.map(r => String.fromCharCode(65+r)).join(', ')}</span>
            </div>
          ))}
          {parsed.questions.length > 3 && (
            <div className="text-xs text-a-fg-light pl-2 mt-1">… et {parsed.questions.length - 3} autre{parsed.questions.length - 3 > 1 ? 's' : ''}</div>
          )}

          {/* Mode fusion */}
          {existingCount > 0 && (
            <div className="mt-3.5 pt-3.5 border-t border-a-border">
              <div className="text-xs font-semibold text-a-fg-mid mb-2 uppercase tracking-[.5px]">
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
    <Modal title="Éditeur de QCM" onClose={onClose}>
      {/* ─── Navigation carrousel ─── */}
      <div className="flex items-center justify-between bg-a-bg rounded-a-sm py-2 px-3.5 mb-5">
        <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
          className={`${S.actionBtn} text-lg py-0.5 px-2`} style={{ opacity: current === 0 ? .3 : 1 }}>‹</button>
        <span className="text-[13px] font-bold text-a-fg">
          Question {current + 1} <span className="text-a-fg-mid font-normal">/ {questions.length}</span>
        </span>
        <button onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))} disabled={current === questions.length-1}
          className={`${S.actionBtn} text-lg py-0.5 px-2`} style={{ opacity: current === questions.length-1 ? .3 : 1 }}>›</button>
      </div>

      {/* ─── Question ─── */}
      <div className={S.field}>
        <label className={S.label}>Question *</label>
        <textarea className={S.textarea} value={q.question}
          onChange={e => updateQ('question', e.target.value)}
          placeholder="Ex: Quelle est la première sourate du Coran ?" rows={3} />
      </div>

      {/* ─── Choix ─── */}
      <div className={S.field}>
        <label className={S.label}>
          Choix de réponses *
          <span className="font-normal normal-case ml-1.5 text-[11px] text-a-fg-light">
            — cochez la ou les bonnes réponses
          </span>
        </label>
        {q.choix.map((ch, ci) => {
          const isCorrect = (q.reponse_correcte || []).includes(ci);
          return (
            <div key={ci} className="flex gap-2 items-center mb-[7px]">
              <span className="text-[13px] font-bold w-[22px] shrink-0" style={{ color: isCorrect ? 'var(--a-green)' : 'var(--a-fg-light)' }}>
                {String.fromCharCode(65+ci)}.
              </span>
              <input className={`${S.input} flex-1`} style={{ borderColor: isCorrect ? 'var(--a-green)' : '' }}
                value={ch} onChange={e => updateChoix(ci, e.target.value)}
                placeholder={`Choix ${String.fromCharCode(65+ci)}`} />
              <input type="checkbox" checked={isCorrect} onChange={() => toggleCorrect(ci)}
                className="w-[17px] h-[17px] cursor-pointer shrink-0" style={{ accentColor:'var(--a-green)' }} />
              {q.choix.length > 2 && (
                <button className={`${S.actionBtn} text-a-red p-0.5`} onClick={() => removeChoix(ci)}>✕</button>
              )}
            </div>
          );
        })}
        {q.choix.length < 6 && (
          <button className={`${S.btnCancel} text-xs py-[5px] px-3 mt-1`} onClick={addChoix}>
            + Ajouter un choix
          </button>
        )}
        {!isCurrentValid && q.question.trim() && (q.reponse_correcte || []).length === 0 && (
          <div className="text-[11px] text-a-red mt-1.5">⚠ Cochez au moins une bonne réponse</div>
        )}
        {!isCurrentValid && q.question.trim() && (q.reponse_correcte || []).length > 0
          && !(q.reponse_correcte || []).every(r => r >= 0 && r < q.choix.length) && (
          <div className="text-[11px] text-a-red mt-1.5">⚠ Une bonne réponse cochée correspond à un choix supprimé — décochez-la ou recochez un choix valide</div>
        )}
      </div>

      {/* ─── Actions ─── */}
      <div className="flex justify-between items-center pt-4 border-t border-a-border mt-1">
        <div className="flex gap-2">
          <button className={`${S.btnDanger} text-xs py-[7px] px-3.5`} onClick={deleteQuestion}>
            🗑 Supprimer
          </button>
          <button className={`${S.btnCancel} text-xs py-[7px] px-3.5`} onClick={addQuestion}>
            + Nouvelle question
          </button>
        </div>
        <div className="flex gap-2">
          <button className={S.btnCancel} onClick={onClose}>Fermer</button>
          <button className={S.btnSave} disabled={saving || loading || !allValid} onClick={handleSave}>
            {saving || loading ? 'Sauvegarde...' : 'Enregistrer et fermer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
