import React, { useState, useEffect, useCallback } from 'react';
import RichTextEditor from './RichTextEditor';
import {
  fetchModules, createModule, updateModule, deleteModule,
  fetchThematiques, createThematique, updateThematique, deleteThematique,
  fetchNiveaux, fetchNiveauxByThematique, createNiveau, updateNiveau, deleteNiveau,
  fetchContenus, createContenu, updateContenu, deleteContenu,
  fetchQCM, createQuestion, updateQuestion, deleteQuestion,
  uploadFile, toSlug, deleteStorageFolder, deleteOldCover,
  fetchNiveauxScolaires,
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

// ─── Styles inline ───────────────────────────────────────────────────────────
const S = {
  page: { minHeight: '100%' },
  breadcrumb: { display:'flex', alignItems:'center', gap:8, marginBottom:24, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:14, fontWeight:500 },
  breadcrumbText: { transition:'color .2s' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 },
  card: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:20, cursor:'pointer', transition:'transform .2s var(--a-ease-out), box-shadow .2s' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 },
  cardTitle: { fontSize:16, fontWeight:600, color:'var(--a-fg)', margin:0 },
  cardDesc: { fontSize:13, color:'var(--a-fg-mid)', margin:0, lineHeight:1.5 },
  cardFooter: { display:'flex', gap:8, marginTop:16 },
  badge: (c) => ({ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c }),
  actions: { display:'flex', gap:6 },
  actionBtn: { background:'none', border:'none', color:'var(--a-fg-mid)', cursor:'pointer', padding:4, borderRadius:6, display:'inline-flex', transition:'color .2s' },
  addCard: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'2px dashed var(--a-border)', padding:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--a-fg-mid)', fontSize:14, fontWeight:500, minHeight:120, transition:'border-color .2s, color .2s' },
  // Modal
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', padding:28, width:'100%', maxWidth:500, maxHeight:'85vh', overflowY:'auto', border:'1px solid var(--a-border)' },
  modalTitle: { fontSize:18, fontWeight:600, color:'var(--a-fg)', marginBottom:20 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:12, fontWeight:600, color:'var(--a-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' },
  input: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  textarea: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', minHeight:80, resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' },
  select: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  btnRow: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 },
  btnCancel: { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnDanger: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-red)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  // Tabs
  tabs: { display:'flex', gap:4, marginBottom:20, background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:3 },
  tab: (active) => ({ padding:'8px 16px', borderRadius:8, border:'none', background: active ? 'var(--a-bg-card)' : 'transparent', color: active ? 'var(--a-fg)' : 'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }),
  // List item
  listItem: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'var(--a-bg-card)', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', marginBottom:8, transition:'transform .15s' },
  listLeft: { display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 },
  listNum: { width:28, height:28, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 },
  empty: { textAlign:'center', padding:'48px 20px', color:'var(--a-fg-mid)', fontSize:14 },
};

// ─── Modal générique ─────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, ...(maxWidth ? { maxWidth } : {}) }} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{title}</div>
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
  const [view, setView]   = useState('modules'); // 'modules' | 'thematiques' | 'niveaux' | 'niveau-detail'
  const [modules, setModules]       = useState([]);
  const [thematiques, setThematiques] = useState([]);
  const [niveaux, setNiveaux]       = useState([]);
  const [contenus, setContenus]     = useState([]);
  const [questions, setQuestions]   = useState([]);
  const [selModule, setSelModule]   = useState(null);
  const [selThematique, setSelThematique] = useState(null);
  const [selNiveau, setSelNiveau]   = useState(null);
  const [modal, setModal] = useState(null); // { type, data? }
  const [confirm, setConfirm] = useState(null); // { title, message, onConfirm }
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('contenus'); // 'contenus' | 'qcm'
  const [niveauxScolaires, setNiveauxScolaires] = useState([]);

  // ─── Chargement des modules ─────────────────────────────────────────
  const loadModules = useCallback(async () => {
    try { setModules(await fetchModules()); } catch(e) { console.error(e); }
  }, []);
  useEffect(() => { loadModules(); }, [loadModules]);
  useEffect(() => { fetchNiveauxScolaires().then(setNiveauxScolaires).catch(() => {}); }, []);

  const loadThematiques = useCallback(async (modId) => {
    try { setThematiques(await fetchThematiques(modId)); } catch(e) { console.error(e); }
  }, []);

  const loadNiveaux = useCallback(async (modId) => {
    try { setNiveaux(await fetchNiveaux(modId)); } catch(e) { console.error(e); }
  }, []);

  const loadNiveauxByThematique = useCallback(async (thId) => {
    try { setNiveaux(await fetchNiveauxByThematique(thId)); } catch(e) { console.error(e); }
  }, []);

  const loadContenus = useCallback(async (nivId) => {
    try { setContenus(await fetchContenus(nivId)); } catch(e) { console.error(e); }
  }, []);

  const loadQuestions = useCallback(async (nivId) => {
    try { setQuestions(await fetchQCM(nivId)); } catch(e) { console.error(e); }
  }, []);

  // ─── Navigation ─────────────────────────────────────────────────────
  const openModule = (mod) => {
    setSelModule(mod);
    setView('thematiques');
    loadThematiques(mod.id);
  };

  const openThematique = (th) => {
    setSelThematique(th);
    setView('niveaux');
    loadNiveauxByThematique(th.id);
  };

  const openNiveau = (niv) => {
    setSelNiveau(niv);
    setView('niveau-detail');
    setTab('contenus');
    loadContenus(niv.id);
    loadQuestions(niv.id);
  };

  const goBack = () => {
    if (view === 'niveau-detail') { setView('niveaux'); setSelNiveau(null); }
    else if (view === 'niveaux') { setView('thematiques'); setSelNiveau(null); loadThematiques(selModule.id); }
    else if (view === 'thematiques') { setView('modules'); setSelModule(null); setSelThematique(null); }
  };

  // ─── Handlers CRUD ──────────────────────────────────────────────────
  const handleSaveModule = async (data) => {
    setLoading(true);
    try {
      if (data.id) { await updateModule(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre, actif: data.actif }); }
      else { await createModule({ titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || modules.length + 1, actif: true }); }
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
      if (data.id) { await updateNiveau(data.id, { titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre, score_requis: data.score_requis }); }
      else { await createNiveau({ module_id: selModule.id, thematique_id: selThematique?.id || null, titre: data.titre, description: data.description, image_url: data.image_url, ordre: data.ordre || niveaux.length + 1, score_requis: data.score_requis || 80 }); }
      if (selThematique) { await loadNiveauxByThematique(selThematique.id); }
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
          await loadNiveaux(selModule.id);
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

  const handleSaveAllQuestions = async (updatedQuestions, deletedIds) => {
    setLoading(true);
    try {
      await Promise.all(deletedIds.map(id => deleteQuestion(id)));
      for (const q of updatedQuestions) {
        if (!q.question?.trim()) continue;
        const payload = { question: q.question, choix: q.choix, reponse_correcte: q.reponse_correcte, ordre: q.ordre };
        if (q.id) { await updateQuestion(q.id, payload); }
        else { await createQuestion({ ...payload, niveau_id: selNiveau.id }); }
      }
      await loadQuestions(selNiveau.id);
      setModal(null);
    } catch(e) { alert(e.message); }
    setLoading(false);
  };

  // ─── VUE MODULES ───────────────────────────────────────────────────
  if (view === 'modules') {
    return (
      <div style={S.page}>
        <div style={S.grid}>
          {modules.map(m => (
            <div key={m.id} style={{ ...S.card, padding:0, overflow:'hidden' }} onClick={() => openModule(m)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {/* Image de couverture */}
              {m.image_url ? (
                <div style={{ width:'100%', height:140, overflow:'hidden', position:'relative', background:'var(--a-bg)' }}>
                  <img src={m.image_url} alt={m.titre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                </div>
              ) : (
                <div style={{ width:'100%', height:80, background:'linear-gradient(135deg, var(--a-gold)22 0%, var(--a-gold)08 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                  📚
                </div>
              )}
              <div style={{ padding:16 }}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>{m.titre}</h3>
                  <div style={S.actions}>
                    <button style={S.actionBtn} title="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'module', data:m }); }}><IconEdit /></button>
                    <button style={S.actionBtn} title="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteModule(m.id, m.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {m.description && <p style={S.cardDesc}>{m.description}</p>}
                <div style={S.cardFooter}>
                  <span style={S.badge('var(--a-gold)')}>Ordre : {m.ordre}</span>
                  <span style={S.badge(m.actif ? 'var(--a-green)' : 'var(--a-red)')}>{m.actif ? 'Actif' : 'Inactif'}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={S.addCard} onClick={() => setModal({ type:'module' })}
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
      <div style={S.page}>
        <div style={S.breadcrumb} onClick={goBack}>
          <IconBack /> <span style={S.breadcrumbText}>Retour aux modules</span>
          <span style={{ color:'var(--a-fg)', marginLeft:8, fontWeight:600 }}>{selModule?.titre}</span>
        </div>

        <div style={S.grid}>
          {thematiques.map(th => (
            <div key={th.id} style={{ ...S.card, padding:0, overflow:'hidden' }} onClick={() => openThematique(th)}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {th.image_url ? (
                <div style={{ width:'100%', height:140, overflow:'hidden', position:'relative', background:'var(--a-bg)' }}>
                  <img src={th.image_url} alt={th.titre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.45) 100%)' }} />
                </div>
              ) : (
                <div style={{ width:'100%', height:80, background:'linear-gradient(135deg, var(--a-gold)22 0%, var(--a-gold)08 100%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>
                  📖
                </div>
              )}
              <div style={{ padding:16 }}>
                <div style={S.cardHeader}>
                  <h3 style={S.cardTitle}>{th.titre}</h3>
                  <div style={S.actions}>
                    <button style={S.actionBtn} title="Modifier" onClick={e => { e.stopPropagation(); setModal({ type:'thematique', data:th }); }}><IconEdit /></button>
                    <button style={S.actionBtn} title="Supprimer" onClick={e => { e.stopPropagation(); handleDeleteThematique(th.id, th.titre); }}><IconTrash /></button>
                  </div>
                </div>
                {th.description && <p style={S.cardDesc}>{th.description}</p>}
                <div style={S.cardFooter}>
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
          <div style={S.addCard} onClick={() => setModal({ type:'thematique' })}
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

  // ─── VUE NIVEAUX ───────────────────────────────────────────────────
  if (view === 'niveaux') {
    return (
      <div style={S.page}>
        <div style={S.breadcrumb} onClick={goBack}>
          <IconBack /> <span style={S.breadcrumbText}>Retour aux thématiques</span>
          <span style={{ color:'var(--a-fg)', marginLeft:8, fontWeight:600 }}>{selModule?.titre} → {selThematique?.titre}</span>
        </div>

        {niveaux.map(n => (
          <div key={n.id} style={S.listItem} onClick={() => openNiveau(n)}>
            <div style={S.listLeft}>
              <div style={S.listNum}>{n.ordre}</div>
              <div>
                <div style={{ fontWeight:600, color:'var(--a-fg)', fontSize:14 }}>{n.titre}</div>
                {n.description && <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginTop:2 }}>{n.description}</div>}
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={S.badge('var(--a-blue)')}>Score requis : {n.score_requis}%</span>
              <button style={S.actionBtn} onClick={e => { e.stopPropagation(); setModal({ type:'niveau', data:n }); }}><IconEdit /></button>
              <button style={S.actionBtn} onClick={e => { e.stopPropagation(); handleDeleteNiveau(n.id, n.titre); }}><IconTrash /></button>
            </div>
          </div>
        ))}

        <div style={{ ...S.addCard, minHeight:50, marginTop:8 }} onClick={() => setModal({ type:'niveau' })}>
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
    <div style={S.page}>
      <div style={S.breadcrumb} onClick={goBack}>
        <IconBack /> <span style={S.breadcrumbText}>Retour aux niveaux</span>
        <span style={{ color:'var(--a-fg)', marginLeft:8, fontWeight:600 }}>{selModule?.titre} → {selThematique?.titre} → {selNiveau?.titre}</span>
      </div>

      <div style={S.tabs}>
        <button style={S.tab(tab === 'contenus')} onClick={() => setTab('contenus')}>Contenus ({contenus.length})</button>
        <button style={S.tab(tab === 'qcm')} onClick={() => setTab('qcm')}>QCM ({questions.length})</button>
      </div>

      {tab === 'contenus' && (
        <>
          {contenus.length === 0 && <div style={S.empty}>Aucun contenu pour ce niveau. Ajoutez des vidéos, PDF ou textes.</div>}
          {contenus.map(c => (
            <div key={c.id} style={S.listItem}>
              <div style={S.listLeft}>
                <span style={{ ...S.badge(TYPE_COLORS[c.type] || 'var(--a-fg-mid)'), gap:5 }}>{TYPE_ICONS[c.type]} {c.type}</span>
                <span style={{ fontWeight:500, color:'var(--a-fg)', fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</span>
              </div>
              <div style={S.actions}>
                <button style={S.actionBtn} onClick={() => setModal({ type:'contenu', data:c })}><IconEdit /></button>
                <button style={S.actionBtn} onClick={() => handleDeleteContenu(c.id)}><IconTrash /></button>
              </div>
            </div>
          ))}
          <div style={{ ...S.addCard, minHeight:50, marginTop:8 }} onClick={() => setModal({ type:'contenu' })}>
            <IconPlus /> Ajouter un contenu
          </div>
        </>
      )}

      {tab === 'qcm' && (
        <>
          {questions.length === 0 && <div style={S.empty}>Aucune question QCM. Cliquez ci-dessous pour commencer.</div>}
          {questions.map((q, i) => {
            const corrects = Array.isArray(q.reponse_correcte) ? q.reponse_correcte : [q.reponse_correcte];
            return (
              <div key={q.id} style={{ ...S.listItem, cursor:'pointer' }} onClick={() => setModal({ type:'qcm-carousel', startIndex: i })}>
                <div style={S.listLeft}>
                  <div style={S.listNum}>{i + 1}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:500, color:'var(--a-fg)', fontSize:14 }}>{q.question}</div>
                    <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginTop:4 }}>
                      {(q.choix || []).map((ch, ci) => (
                        <span key={ci} style={{ marginRight:12, color: corrects.includes(ci) ? 'var(--a-green)' : 'var(--a-fg-mid)', fontWeight: corrects.includes(ci) ? 600 : 400 }}>
                          {corrects.includes(ci) ? '✓ ' : ''}{String.fromCharCode(65+ci)}. {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button style={S.actionBtn}><IconEdit /></button>
              </div>
            );
          })}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <div style={{ ...S.addCard, flex:1, minHeight:50 }} onClick={() => setModal({ type:'qcm-carousel', startIndex: questions.length, addNew: true })}>
              <IconPlus /> {questions.length > 0 ? 'Gérer / ajouter des questions' : 'Créer les questions du QCM'}
            </div>
            <div style={{ ...S.addCard, minHeight:50, flex:'0 0 auto', paddingLeft:20, paddingRight:20, color:'var(--a-blue)', borderColor:'var(--a-blue)' }}
              onClick={() => setModal({ type:'import-qcm' })}>
              ⬆ Importer CSV
            </div>
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
      <div style={S.field}><label style={S.label}>Titre *</label><input style={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Cours de Coran" /></div>
      <div style={S.field}><label style={S.label}>Description</label><textarea style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description du module..." /></div>

      {/* Zone upload image */}
      <div style={S.field}>
        <label style={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, borderRadius:'var(--a-radius-sm)', padding:12, cursor:'pointer', textAlign:'center', transition:'all .2s', background: dragOver ? 'var(--a-gold)0a' : 'transparent', position:'relative', overflow:'hidden' }}>
          {image_url ? (
            <div style={{ position:'relative' }}>
              <img src={image_url} alt="aperçu" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:6, display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, opacity:0, transition:'opacity .2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div style={{ padding:'16px 0', color:'var(--a-fg-mid)', fontSize:13 }}>
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span style={{ fontSize:11, opacity:.7 }}>JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div style={{ color:'var(--a-red)', fontSize:12, marginTop:4 }}>{uploadErr}</div>}
        {image_url && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <button style={{ background:'none', border:'none', color:'var(--a-red)', fontSize:12, cursor:'pointer', padding:'2px 0' }} onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:12 }}>
        <div style={{ ...S.field, flex:1 }}><label style={S.label}>Ordre</label><input style={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
        <div style={{ ...S.field, flex:1 }}><label style={S.label}>Actif</label>
          <select style={S.select} value={actif ? 'true' : 'false'} onChange={e => setActif(e.target.value === 'true')}>
            <option value="true">Oui</option><option value="false">Non</option>
          </select>
        </div>
      </div>
      <div style={S.btnRow}>
        <button style={S.btnCancel} onClick={onClose}>Annuler</button>
        <button style={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, actif })}>
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
      <div style={S.field}><label style={S.label}>Titre *</label><input style={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Grammaire arabe" /></div>
      <div style={S.field}><label style={S.label}>Description</label><textarea style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description de la thématique..." /></div>

      {/* Zone upload image */}
      <div style={S.field}>
        <label style={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, borderRadius:'var(--a-radius-sm)', padding:12, cursor:'pointer', textAlign:'center', transition:'all .2s', background: dragOver ? 'var(--a-gold)0a' : 'transparent', position:'relative', overflow:'hidden' }}>
          {image_url ? (
            <div style={{ position:'relative' }}>
              <img src={image_url} alt="aperçu" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:6, display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, opacity:0, transition:'opacity .2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div style={{ padding:'16px 0', color:'var(--a-fg-mid)', fontSize:13 }}>
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span style={{ fontSize:11, opacity:.7 }}>JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div style={{ color:'var(--a-red)', fontSize:12, marginTop:4 }}>{uploadErr}</div>}
        {image_url && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <button style={{ background:'none', border:'none', color:'var(--a-red)', fontSize:12, cursor:'pointer', padding:'2px 0' }} onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      {/* Niveaux scolaires autorisés */}
      <div style={S.field}>
        <label style={S.label}>Niveaux scolaires autorisés</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
          {niveauxScolairesList.map(ns => (
            <label key={ns.id} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer',
                background: selectedNsIds.includes(ns.id) ? 'rgba(191,138,48,.13)' : 'var(--a-bg)',
                border:`1px solid ${selectedNsIds.includes(ns.id) ? 'var(--a-gold)' : 'var(--a-border)'}`,
                borderRadius:'var(--a-radius-sm)', padding:'4px 10px', fontSize:13, transition:'all .15s',
                userSelect:'none' }}>
              <input type="checkbox" checked={selectedNsIds.includes(ns.id)} onChange={() => toggleNs(ns.id)} style={{ accentColor:'var(--a-gold)', cursor:'pointer' }} />
              {ns.nom}
            </label>
          ))}
          {niveauxScolairesList.length === 0 && (
            <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>Chargement…</span>
          )}
        </div>
        {selectedNsIds.length === 0 && niveauxScolairesList.length > 0 && (
          <div style={{ color:'var(--a-red)', fontSize:12, marginTop:6 }}>⚠ Aucun niveau sélectionné → thématique invisible pour tous les élèves</div>
        )}
      </div>

      <div style={S.field}><label style={S.label}>Ordre</label><input style={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
      <div style={S.btnRow}>
        <button style={S.btnCancel} onClick={onClose}>Annuler</button>
        <button style={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, niveaux_scolaires_ids: selectedNsIds })}>
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
      <div style={S.field}><label style={S.label}>Titre *</label><input style={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Ex: Niveau 1 - Introduction" /></div>
      <div style={S.field}><label style={S.label}>Description</label><textarea style={S.textarea} value={description} onChange={e => setDescription(e.target.value)} /></div>

      {/* Zone upload image */}
      <div style={S.field}>
        <label style={S.label}>Image de couverture</label>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleImageFile(e.dataTransfer.files[0]); }}
          onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=ev=>handleImageFile(ev.target.files[0]); i.click(); }}
          style={{ border:`2px dashed ${dragOver ? 'var(--a-gold)' : 'var(--a-border)'}`, borderRadius:'var(--a-radius-sm)', padding:12, cursor:'pointer', textAlign:'center', transition:'all .2s', background: dragOver ? 'var(--a-gold)0a' : 'transparent' }}>
          {image_url ? (
            <div style={{ position:'relative' }}>
              <img src={image_url} alt="aperçu" style={{ width:'100%', height:120, objectFit:'cover', borderRadius:6, display:'block' }} />
              <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:6, opacity:0, transition:'opacity .2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity=1} onMouseLeave={e => e.currentTarget.style.opacity=0}>
                <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>🖼 Changer l'image</span>
              </div>
            </div>
          ) : (
            <div style={{ padding:'16px 0', color:'var(--a-fg-mid)', fontSize:13 }}>
              {uploading ? '⏳ Upload en cours...' : <>🖼 <strong>Glissez une image</strong> ou cliquez pour parcourir<br/><span style={{ fontSize:11, opacity:.7 }}>JPG, PNG, WebP — max 5 Mo</span></>}
            </div>
          )}
        </div>
        {uploadErr && <div style={{ color:'var(--a-red)', fontSize:12, marginTop:4 }}>{uploadErr}</div>}
        {image_url && (
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
            <button style={{ background:'none', border:'none', color:'var(--a-red)', fontSize:12, cursor:'pointer', padding:'2px 0' }} onClick={() => setImageUrl('')}>✕ Supprimer l'image</button>
          </div>
        )}
      </div>

      <div style={{ display:'flex', gap:12 }}>
        <div style={{ ...S.field, flex:1 }}><label style={S.label}>Ordre</label><input style={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} /></div>
        <div style={{ ...S.field, flex:1 }}><label style={S.label}>Score requis (%)</label><input style={S.input} type="number" min="0" max="100" value={score_requis} onChange={e => setScoreRequis(+e.target.value)} /></div>
      </div>
      <div style={S.btnRow}>
        <button style={S.btnCancel} onClick={onClose}>Annuler</button>
        <button style={S.btnSave} disabled={loading || uploading || !titre.trim()} onClick={() => onSave({ id: data?.id, titre, description, image_url, ordre, score_requis })}>
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
      <div style={S.field}>
        <label style={S.label}>Type *</label>
        <select style={S.select} value={type} onChange={e => { setType(e.target.value); setContenu(''); setUploadError(''); }}>
          <option value="video">Vidéo YouTube</option>
          <option value="pdf">PDF</option>
          <option value="texte">Texte</option>
          <option value="word">Word (.docx)</option>
          <option value="ppt">PowerPoint (.pptx)</option>
        </select>
      </div>

      <div style={S.field}>
        <label style={S.label}>Titre *</label>
        <input style={S.input} value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre du contenu" />
      </div>

      {/* ─── Zone fichier : PDF / Word / PowerPoint — drag & drop + URL ─── */}
      {(type === 'pdf' || type === 'word' || type === 'ppt') && (
        <div style={S.field}>
          <label style={S.label}>
            {type === 'pdf' ? 'Fichier PDF *' : type === 'word' ? 'Fichier Word (.docx) *' : 'Fichier PowerPoint (.pptx) *'}
          </label>

          {/* Zone drag & drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => document.getElementById('doc-file-input').click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--a-gold)' : contenu ? 'var(--a-green)' : 'var(--a-border)'}`,
              borderRadius: 'var(--a-radius-sm)',
              padding: '24px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(191,138,48,.05)' : contenu ? 'rgba(48,209,88,.04)' : 'var(--a-bg)',
              transition: 'all .2s',
              marginBottom: 10,
            }}>
            <input
              id="doc-file-input"
              type="file"
              accept={
                type === 'pdf'  ? 'application/pdf' :
                type === 'word' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
              }
              style={{ display:'none' }}
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
              <div style={{ color:'var(--a-fg-mid)', fontSize:13 }}>
                <div style={{ fontSize:28, marginBottom:8 }}>
                  {type === 'pdf' ? '📄' : type === 'word' ? '📃' : '📊'}
                </div>
                <strong>
                  Glisser-déposer votre {type === 'pdf' ? 'PDF' : type === 'word' ? 'fichier Word' : 'PowerPoint'} ici
                </strong>
                <div style={{ fontSize:12, marginTop:4 }}>
                  ou cliquer pour parcourir — max {type === 'ppt' ? '20' : '10'} Mo
                </div>
              </div>
            )}
          </div>

          {uploadError && <div style={{ fontSize:12, color:'var(--a-red)', marginBottom:8 }}>{uploadError}</div>}

          {/* Saisie URL manuelle en fallback */}
          <div style={{ fontSize:11, color:'var(--a-fg-light)', marginBottom:4 }}>Ou saisir une URL directement :</div>
          <input style={S.input} value={contenu} onChange={e => setContenu(e.target.value)} placeholder="https://..." />
        </div>
      )}

      {/* ─── Vidéo ─── */}
      {type === 'video' && (
        <div style={S.field}>
          <label style={S.label}>URL YouTube *</label>
          <input style={S.input} value={contenu} onChange={e => setContenu(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
      )}

      {/* ─── Texte ─── */}
      {type === 'texte' && (
        <div style={S.field}>
          <label style={S.label}>Contenu *</label>
          <RichTextEditor
            value={contenu}
            onChange={setContenu}
            uploadFolder={[moduleTitre, thematiqueTitre, niveauTitre].filter(Boolean).map(toSlug).join('/') + '/images'}
          />
        </div>
      )}

      <div style={{ ...S.field, maxWidth:120 }}>
        <label style={S.label}>Ordre</label>
        <input style={S.input} type="number" value={ordre} onChange={e => setOrdre(+e.target.value)} />
      </div>

      <div style={S.btnRow}>
        <button style={S.btnCancel} onClick={onClose}>Annuler</button>
        <button style={S.btnSave} disabled={loading || uploading || !titre.trim() || !contenu.replace(/<[^>]*>/g, '').trim()} onClick={() => onSave({ id: data?.id, type, titre, contenu, ordre })}>
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

  const dropZoneStyle = {
    border: `2px dashed ${dragOver ? 'var(--a-blue)' : 'var(--a-border)'}`,
    borderRadius: 'var(--a-radius-sm)', padding: '28px 20px', textAlign: 'center',
    background: dragOver ? 'rgba(10,132,255,.06)' : 'var(--a-bg)',
    cursor: 'pointer', transition: 'all .2s', marginBottom: 16,
  };

  return (
    <Modal title="⬆ Importer des questions QCM" onClose={onClose}>

      {/* ─── Guide format ─── */}
      <div style={{ marginBottom:16, padding:'12px 14px', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', fontSize:12 }}>
        <div style={{ fontWeight:700, color:'var(--a-fg)', marginBottom:8 }}>📋 Format du fichier CSV</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%', fontSize:11 }}>
            <thead>
              <tr>
                {['Question','Choix A','Choix B','Choix C','Choix D','Bonne(s) réponse(s)'].map(h => (
                  <th key={h} style={{ padding:'4px 8px', background:'var(--a-bg-card)', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg)' }}>Combien de lettres en arabe ?</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)' }}>24</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)' }}>26</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', background:'rgba(48,209,88,.08)', color:'var(--a-green)', fontWeight:600 }}>28</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)' }}>32</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-green)', fontWeight:700, textAlign:'center' }}>C</td>
              </tr>
              <tr>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg)' }}>Voyelles longues ? (plusieurs)</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', background:'rgba(48,209,88,.08)', color:'var(--a-green)', fontWeight:600 }}>أ</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', background:'rgba(48,209,88,.08)', color:'var(--a-green)', fontWeight:600 }}>و</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', background:'rgba(48,209,88,.08)', color:'var(--a-green)', fontWeight:600 }}>ي</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-fg-mid)' }}>ب</td>
                <td style={{ padding:'4px 8px', border:'1px solid var(--a-border)', color:'var(--a-green)', fontWeight:700, textAlign:'center' }}>A,B,C</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop:8, color:'var(--a-fg-mid)', lineHeight:1.6 }}>
          → Colonne <strong>Bonne(s) réponse(s)</strong> : écris <strong style={{color:'var(--a-green)'}}>C</strong> pour une seule bonne réponse, ou <strong style={{color:'var(--a-green)'}}>A,B,C</strong> pour plusieurs.
        </div>
      </div>

      {/* ─── Zone A : modèle ─── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, padding:'10px 14px', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)' }}>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--a-fg)' }}>Télécharger le modèle Excel</div>
          <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginTop:2 }}>Fichier pré-rempli avec les bonnes colonnes et des exemples.</div>
        </div>
        <button style={{ ...S.btnSave, fontSize:12, padding:'8px 14px', flexShrink:0, marginLeft:12 }} onClick={downloadTemplate}>
          ⬇ Modèle CSV
        </button>
      </div>

      {/* ─── Zone B : sélection fichier ─── */}
      <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
      <div style={dropZoneStyle}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}>
        <div style={{ fontSize:28, marginBottom:6 }}>📂</div>
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
              <div style={{ fontSize:12, fontWeight:600, color:'var(--a-fg-mid)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.5px' }}>
                {existingCount} question{existingCount > 1 ? 's' : ''} déjà existante{existingCount > 1 ? 's' : ''} dans ce QCM :
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {['remplacer', 'ajouter'].map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    style={{ padding:'7px 14px', borderRadius:980, border:'1px solid var(--a-border)', fontSize:12, fontWeight:600, cursor:'pointer', background: mode===m ? 'var(--a-gold)' : 'transparent', color: mode===m ? '#fff' : 'var(--a-fg-mid)', borderColor: mode===m ? 'var(--a-gold)' : 'var(--a-border)' }}>
                    {m === 'remplacer' ? '🔄 Remplacer' : '➕ Ajouter aux existantes'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={S.btnRow}>
        <button style={S.btnCancel} onClick={onClose}>Annuler</button>
        <button
          style={{ ...S.btnSave, opacity: (!parsed || parsed.questions.length === 0) ? .4 : 1 }}
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
    await onSaveAll(questions, deletedIds);
    setSaving(false);
  };

  const isCurrentValid = q.question.trim() && q.choix.every(c => c.trim()) && (q.reponse_correcte || []).length > 0;
  const allValid = questions.every(q => !q.question.trim() || (q.choix.every(c => c.trim()) && (q.reponse_correcte || []).length > 0));

  return (
    <Modal title="Éditeur de QCM" onClose={onClose}>
      {/* ─── Navigation carrousel ─── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'8px 14px', marginBottom:20 }}>
        <button onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}
          style={{ ...S.actionBtn, fontSize:18, padding:'2px 8px', opacity: current === 0 ? .3 : 1 }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--a-fg)' }}>
          Question {current + 1} <span style={{ color:'var(--a-fg-mid)', fontWeight:400 }}>/ {questions.length}</span>
        </span>
        <button onClick={() => setCurrent(c => Math.min(questions.length-1, c+1))} disabled={current === questions.length-1}
          style={{ ...S.actionBtn, fontSize:18, padding:'2px 8px', opacity: current === questions.length-1 ? .3 : 1 }}>›</button>
      </div>

      {/* ─── Question ─── */}
      <div style={S.field}>
        <label style={S.label}>Question *</label>
        <textarea style={S.textarea} value={q.question}
          onChange={e => updateQ('question', e.target.value)}
          placeholder="Ex: Quelle est la première sourate du Coran ?" rows={3} />
      </div>

      {/* ─── Choix ─── */}
      <div style={S.field}>
        <label style={S.label}>
          Choix de réponses *
          <span style={{ fontWeight:400, textTransform:'none', marginLeft:6, fontSize:11, color:'var(--a-fg-light)' }}>
            — cochez la ou les bonnes réponses
          </span>
        </label>
        {q.choix.map((ch, ci) => {
          const isCorrect = (q.reponse_correcte || []).includes(ci);
          return (
            <div key={ci} style={{ display:'flex', gap:8, alignItems:'center', marginBottom:7 }}>
              <span style={{ fontSize:13, fontWeight:700, color: isCorrect ? 'var(--a-green)' : 'var(--a-fg-light)', width:22, flexShrink:0 }}>
                {String.fromCharCode(65+ci)}.
              </span>
              <input style={{ ...S.input, flex:1, borderColor: isCorrect ? 'var(--a-green)' : '' }}
                value={ch} onChange={e => updateChoix(ci, e.target.value)}
                placeholder={`Choix ${String.fromCharCode(65+ci)}`} />
              <input type="checkbox" checked={isCorrect} onChange={() => toggleCorrect(ci)}
                style={{ width:17, height:17, cursor:'pointer', accentColor:'var(--a-green)', flexShrink:0 }} />
              {q.choix.length > 2 && (
                <button style={{ ...S.actionBtn, color:'var(--a-red)', padding:2 }} onClick={() => removeChoix(ci)}>✕</button>
              )}
            </div>
          );
        })}
        {q.choix.length < 6 && (
          <button style={{ ...S.btnCancel, fontSize:12, padding:'5px 12px', marginTop:4 }} onClick={addChoix}>
            + Ajouter un choix
          </button>
        )}
        {!isCurrentValid && q.question.trim() && (q.reponse_correcte || []).length === 0 && (
          <div style={{ fontSize:11, color:'var(--a-red)', marginTop:6 }}>⚠ Cochez au moins une bonne réponse</div>
        )}
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:16, borderTop:'1px solid var(--a-border)', marginTop:4 }}>
        <div style={{ display:'flex', gap:8 }}>
          <button style={{ ...S.btnDanger, fontSize:12, padding:'7px 14px' }} onClick={deleteQuestion}>
            🗑 Supprimer
          </button>
          <button style={{ ...S.btnCancel, fontSize:12, padding:'7px 14px' }} onClick={addQuestion}>
            + Nouvelle question
          </button>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btnCancel} onClick={onClose}>Fermer</button>
          <button style={S.btnSave} disabled={saving || loading || !allValid} onClick={handleSave}>
            {saving || loading ? 'Sauvegarde...' : 'Enregistrer et fermer'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
