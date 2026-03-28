import React, { useRef, useEffect, useState, useCallback } from 'react';
import { uploadFile, toSlug } from './supabaseAdmin';

// ─── Icônes SVG ───────────────────────────────────────────────────────────────
const IcoBold       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 0 8H6zm0 8h9a4 4 0 0 1 0 8H6z"/></svg>;
const IcoItalic     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>;
const IcoUnderline  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3v7a6 6 0 0 0 12 0V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>;
const IcoStrike     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6c0-1.657-1.79-3-4-3s-4 1.343-4 3c0 1.12.627 2.108 1.617 2.733"/><path d="M8 18c0 1.657 1.79 3 4 3s4-1.343 4-3"/></svg>;
const IcoUL         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>;
const IcoOL         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">1</text><text x="2" y="14" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">2</text><text x="2" y="20" fontSize="7" fill="currentColor" stroke="none" fontWeight="700">3</text></svg>;
const IcoAlignL     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>;
const IcoAlignC     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>;
const IcoAlignR     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>;
const IcoColor      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L6.5 17"/><path d="M17.5 17L12 2"/><line x1="7" y1="13" x2="17" y2="13"/><line x1="3" y1="21" x2="21" y2="21" strokeWidth="3"/></svg>;
const IcoImage      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IcoFullscreen = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>;
const IcoExitFS     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>;
const IcoImgFloatL  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="4" width="9" height="9" rx="1.5" fill="currentColor" fillOpacity=".25" stroke="currentColor"/><line x1="14" y1="7" x2="22" y2="7"/><line x1="14" y1="11" x2="22" y2="11"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="2" y1="21" x2="17" y2="21"/></svg>;
const IcoImgCenter  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="3" x2="22" y2="3"/><rect x="5" y="6" width="14" height="10" rx="1.5" fill="currentColor" fillOpacity=".25" stroke="currentColor"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
const IcoImgFloatR  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="13" y="4" width="9" height="9" rx="1.5" fill="currentColor" fillOpacity=".25" stroke="currentColor"/><line x1="2" y1="7" x2="10" y2="7"/><line x1="2" y1="11" x2="10" y2="11"/><line x1="2" y1="17" x2="22" y2="17"/><line x1="2" y1="21" x2="17" y2="21"/></svg>;
const IcoImgInline  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="5" x2="6" y2="5"/><rect x="7" y="2" width="10" height="10" rx="1.5" fill="currentColor" fillOpacity=".25" stroke="currentColor"/><line x1="18" y1="5" x2="22" y2="5"/><line x1="2" y1="16" x2="22" y2="16"/><line x1="2" y1="20" x2="18" y2="20"/></svg>;

// ─── Couleurs prédéfinies ─────────────────────────────────────────────────────
const PRESET_COLORS = [
  { label:'Noir',   hex:'#000000' }, { label:'Blanc',  hex:'#ffffff' },
  { label:'Gris',   hex:'#8e8e93' }, { label:'Rouge',  hex:'#ff453a' },
  { label:'Orange', hex:'#ff9500' }, { label:'Jaune',  hex:'#ffd60a' },
  { label:'Vert',   hex:'#30d158' }, { label:'Bleu',   hex:'#0a84ff' },
  { label:'Violet', hex:'#bf5af2' }, { label:'Or',     hex:'#bf8a30' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (fullscreen) => ({
  wrapper: {
    border: fullscreen ? 'none' : '1px solid var(--a-border)',
    borderRadius: fullscreen ? 0 : 'var(--a-radius-sm)',
    overflow: 'hidden',
    background: 'var(--a-bg-input)',
    ...(fullscreen ? { position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', flexDirection: 'column' } : {}),
  },
  tabBar: { display:'flex', alignItems:'center', borderBottom:'1px solid var(--a-border)', background:'var(--a-bg)', flexShrink:0 },
  tabBtn: (active) => ({
    padding:'7px 18px', border:'none', background:'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
    fontSize:12, fontWeight:600, cursor:'pointer',
    borderBottom: active ? '2px solid var(--a-gold)' : '2px solid transparent',
    transition:'all .15s', letterSpacing:'.3px',
  }),
  toolbar: {
    display:'flex', alignItems:'center', gap:1, padding:'5px 8px',
    background:'var(--a-bg)', borderBottom:'1px solid var(--a-border)',
    flexWrap:'wrap', rowGap:4, flexShrink:0,
  },
  toolBtn: (active) => ({
    width:28, height:26, display:'inline-flex', alignItems:'center', justifyContent:'center',
    border:'none', borderRadius:5,
    background: active ? 'rgba(191,138,48,.18)' : 'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
    cursor:'pointer', fontSize:11, fontWeight:700,
    transition:'background .15s, color .15s', flexShrink:0,
  }),
  sep: { width:1, height:18, background:'var(--a-border)', margin:'0 4px', flexShrink:0 },
  editorWrap: { position:'relative', flex: fullscreen ? 1 : 'none', display:'flex', flexDirection:'column', minHeight:0 },
  editor: {
    minHeight: fullscreen ? 0 : 200,
    maxHeight: fullscreen ? 'none' : 320,
    flex: fullscreen ? 1 : 'none',
    overflowY:'auto', padding:'12px 14px 12px 20px', outline:'none',
    color:'var(--a-fg)', fontSize:14, lineHeight:1.7, background:'var(--a-bg-input)',
  },
  preview: {
    minHeight: fullscreen ? 0 : 200,
    maxHeight: fullscreen ? 'none' : 320,
    flex: fullscreen ? 1 : 'none',
    overflowY:'auto', padding:'12px 16px', fontSize:14, lineHeight:1.7, color:'var(--a-fg)',
  },
  previewNote: { fontSize:11, color:'var(--a-fg-light)', padding:'4px 8px', background:'var(--a-bg)', borderBottom:'1px solid var(--a-border)', textAlign:'center', letterSpacing:'.2px', flexShrink:0 },
  colorSwatch: (hex, active) => ({
    width:18, height:18, borderRadius:4, background:hex, cursor:'pointer', flexShrink:0,
    border: active ? '2px solid var(--a-gold)' : '2px solid var(--a-border)', transition:'transform .1s',
  }),
  imgPanel: { padding:'8px 10px', background:'var(--a-bg)', borderBottom:'1px solid var(--a-border)', display:'flex', alignItems:'center', gap:8, flexShrink:0 },
});

// ─── Composant principal ──────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange }) {
  const editorRef     = useRef(null);
  const colorRef      = useRef(null);
  const imgFileRef    = useRef(null);
  const savedRangeRef = useRef(null);
  const resizeDragRef = useRef(null);
  const imgDragRef    = useRef(null);
  const editorRectRef = useRef(null);

  const [tab, setTab]               = useState('editor');
  const [color, setColor]           = useState('#bf8a30');
  const [html, setHtml]             = useState(value || '');
  const [fullscreen, setFullscreen] = useState(false);
  const [showImgPanel, setShowImgPanel] = useState(false);
  const [imgUrl, setImgUrl]         = useState('');
  const [imgUploading, setImgUploading] = useState(false);
  const [selImg, setSelImg]         = useState(null); // { el, top, left, w, h }
  const [dragging, setDragging]     = useState(false);
  const [dragPos, setDragPos]       = useState({ x: 0, y: 0 });
  const [dragZone, setDragZone]     = useState('center');

  const S = makeStyles(fullscreen);

  useEffect(() => {
    if (!editorRef.current) return;
    const initial = value
      ? (value.startsWith('<') ? value : `<p>${value.replace(/\n/g, '<br/>')}</p>`)
      : '<p><br/></p>';
    editorRef.current.innerHTML = initial;
  }, []); // init une seule fois

  // Mise à jour overlay si scroll / resize fenêtre
  useEffect(() => {
    if (!selImg) return;
    const ed = editorRef.current;
    const update = () => {
      if (!selImg?.el || !ed?.contains(selImg.el)) { setSelImg(null); return; }
      const r = selImg.el.getBoundingClientRect();
      setSelImg(prev => prev ? { ...prev, top: r.top, left: r.left, w: r.width, h: r.height } : null);
    };
    ed?.addEventListener('scroll', update);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      ed?.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [selImg]);

  const notify = useCallback(() => {
    const h = editorRef.current?.innerHTML || '';
    setHtml(h);
    onChange(h);
  }, [onChange]);

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    notify();
  }, [notify]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    if (!savedRangeRef.current) return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
    notify();
  };

  const applyColor = (c) => {
    setColor(c);
    restoreRange();
    document.execCommand('foreColor', false, c);
    notify();
  };

  const toggleDir = (dir) => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const block = sel.getRangeAt(0).startContainer.parentElement?.closest('p,h1,h2,h3,li,div') || editorRef.current;
    if (block) { block.dir = dir; block.style.textAlign = dir === 'rtl' ? 'right' : 'left'; }
    notify();
  };

  const insertImage = (url) => {
    if (!url.trim() || !editorRef.current) return;
    const imgTag = `<img src="${url}" alt="" />`;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && editorRef.current.contains(savedRangeRef.current.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      document.execCommand('insertHTML', false, imgTag);
    } else {
      editorRef.current.innerHTML += imgTag;
    }
    notify();
    setImgUrl('');
    setShowImgPanel(false);
  };

  const handleImgFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImgUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const url = await uploadFile(file, `contenu-images/${toSlug(file.name.replace(/\.[^.]+$/, ''))}-${Date.now()}.${ext}`);
      insertImage(url);
    } catch(e) { alert('Erreur upload image : ' + e.message); }
    setImgUploading(false);
  };

  // ─── Sélection image ──────────────────────────────────────────────────────
  const handleEditorClick = useCallback((e) => {
    if (e.target.tagName === 'IMG') {
      const r = e.target.getBoundingClientRect();
      setSelImg({ el: e.target, top: r.top, left: r.left, w: r.width, h: r.height });
    } else {
      setSelImg(null);
    }
  }, []);

  // ─── Redimensionnement (coin bas-droit) ───────────────────────────────────
  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selImg) return;
    resizeDragRef.current = { startX: e.clientX, startW: selImg.el.offsetWidth || selImg.w, img: selImg.el };
    const onMove = (ev) => {
      const d = resizeDragRef.current;
      if (!d) return;
      const newW = Math.max(40, d.startW + (ev.clientX - d.startX));
      d.img.style.width = newW + 'px';
      d.img.style.height = 'auto';
      const r = d.img.getBoundingClientRect();
      setSelImg(prev => prev ? { ...prev, top: r.top, left: r.left, w: r.width, h: r.height } : null);
    };
    const onUp = () => {
      resizeDragRef.current = null;
      notify();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Drag & drop image (déplacer avec la souris) ──────────────────────────
  const startImgDrag = (e) => {
    if (!selImg || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    editorRectRef.current = editorRef.current.getBoundingClientRect();
    imgDragRef.current = { img: selImg.el };
    selImg.el.style.opacity = '0.2';

    setDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
    setDragZone('center');

    const onMove = (ev) => {
      setDragPos({ x: ev.clientX, y: ev.clientY });
      const r = editorRectRef.current;
      if (r) {
        const relX = ev.clientX - r.left;
        const third = r.width / 3;
        setDragZone(relX < third ? 'left' : relX > r.width - third ? 'right' : 'center');
      }
    };

    const onUp = (ev) => {
      setDragging(false);
      const d = imgDragRef.current;
      if (!d) return;
      d.img.style.opacity = '';

      const edRect = editorRectRef.current;
      const relX = ev.clientX - edRect.left;
      const third = edRect.width / 3;

      // Appliquer la position selon la zone de drop
      if (relX < third) {
        d.img.style.float = 'left';
        d.img.style.margin = '4px 16px 8px 0';
        d.img.style.display = 'block';
      } else if (relX > edRect.width - third) {
        d.img.style.float = 'right';
        d.img.style.margin = '4px 0 8px 16px';
        d.img.style.display = 'block';
      } else {
        d.img.style.float = 'none';
        d.img.style.margin = '8px auto';
        d.img.style.display = 'block';
      }

      // Déplacer l'image à la position Y du curseur dans le flux du document
      const inEditor = ev.clientX > edRect.left && ev.clientX < edRect.right &&
                       ev.clientY > edRect.top  && ev.clientY < edRect.bottom;
      if (inEditor) {
        const range = document.caretRangeFromPoint
          ? document.caretRangeFromPoint(ev.clientX, ev.clientY)
          : (() => {
              const pos = document.caretPositionFromPoint?.(ev.clientX, ev.clientY);
              if (!pos) return null;
              const r = document.createRange();
              r.setStart(pos.offsetNode, pos.offset);
              return r;
            })();
        if (range && editorRef.current.contains(range.startContainer)) {
          d.img.parentNode?.removeChild(d.img);
          range.insertNode(d.img);
        }
      }

      const r = d.img.getBoundingClientRect();
      setSelImg({ el: d.img, top: r.top, left: r.left, w: r.width, h: r.height });
      notify();

      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // ─── Positionnement image (toolbar) ──────────────────────────────────────
  const setImgPos = (pos) => {
    if (!selImg) return;
    const img = selImg.el;
    img.style.float = 'none';
    img.style.display = 'block';
    img.style.margin = '8px 0';
    img.style.verticalAlign = '';
    if (pos === 'left')   { img.style.float = 'left';  img.style.margin = '4px 16px 8px 0'; }
    if (pos === 'right')  { img.style.float = 'right'; img.style.margin = '4px 0 8px 16px'; }
    if (pos === 'center') { img.style.margin = '8px auto'; }
    if (pos === 'inline') { img.style.display = 'inline'; img.style.margin = '0 4px'; img.style.verticalAlign = 'middle'; }
    const r = img.getBoundingClientRect();
    setSelImg(prev => prev ? { ...prev, top: r.top, left: r.left, w: r.width, h: r.height } : null);
    notify();
  };

  const deleteSelImg = () => {
    if (!selImg) return;
    selImg.el.remove();
    setSelImg(null);
    notify();
  };

  const mkBtn = (label, cmd, val = null, title = '') => (
    <button key={title || cmd} title={title || (typeof label === 'string' ? label : '')}
      style={S.toolBtn(false)}
      onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
      onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
    >{label}</button>
  );

  const mkBlockBtn = (label, tag, title) => (
    <button key={tag} title={title || label} style={S.toolBtn(false)}
      onMouseDown={e => { e.preventDefault(); editorRef.current?.focus(); document.execCommand('formatBlock', false, tag); notify(); }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
      onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
    >{label}</button>
  );

  const miniBtn = { width:26, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:4, background:'transparent', color:'var(--a-fg-mid)', cursor:'pointer', transition:'background .12s, color .12s' };
  const miniSep = { width:1, height:16, background:'var(--a-border)', margin:'0 3px', flexShrink:0 };

  return (
    <div style={S.wrapper}>

      {/* ── Onglets + plein écran ── */}
      <div style={S.tabBar}>
        <button style={S.tabBtn(tab==='editor')} onClick={() => setTab('editor')}>✏ Éditeur</button>
        <button style={S.tabBtn(tab==='preview')} onClick={() => setTab('preview')}>👁 Aperçu</button>
        <div style={{ flex:1 }} />
        <button title={fullscreen?'Réduire':'Plein écran'} style={{ ...S.toolBtn(fullscreen), margin:'0 6px' }}
          onClick={() => setFullscreen(f => !f)}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
          onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
        >{fullscreen ? <IcoExitFS /> : <IcoFullscreen />}</button>
      </div>

      {tab === 'editor' && (<>
        {/* ── Toolbar ── */}
        <div style={S.toolbar}>
          {mkBtn(<IcoBold />,      'bold',          null, 'Gras')}
          {mkBtn(<IcoItalic />,    'italic',        null, 'Italique')}
          {mkBtn(<IcoUnderline />, 'underline',     null, 'Souligné')}
          {mkBtn(<IcoStrike />,    'strikeThrough', null, 'Barré')}
          <span style={S.sep} />
          {mkBlockBtn('¶','p','Texte normal')} {mkBlockBtn('H1','h1','Titre 1')} {mkBlockBtn('H2','h2','Titre 2')} {mkBlockBtn('H3','h3','Titre 3')}
          <span style={S.sep} />
          {mkBtn(<IcoUL />,'insertUnorderedList',null,'Liste à puces')}
          {mkBtn(<IcoOL />,'insertOrderedList',null,'Liste numérotée')}
          <span style={S.sep} />
          {mkBtn(<IcoAlignL />,'justifyLeft',null,'Aligner gauche')}
          {mkBtn(<IcoAlignC />,'justifyCenter',null,'Centrer')}
          {mkBtn(<IcoAlignR />,'justifyRight',null,'Aligner droite')}
          <span style={S.sep} />
          {PRESET_COLORS.map(({ label, hex }) => (
            <button key={hex} title={label} style={S.colorSwatch(hex, color===hex)}
              onMouseDown={e => { e.preventDefault(); applyColor(hex); }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; }}
            />
          ))}
          <button title="Couleur personnalisée" style={{ ...S.toolBtn(false), position:'relative', overflow:'hidden' }}
            onMouseDown={e => { e.preventDefault(); saveRange(); colorRef.current?.click(); }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=''; }}
          ><IcoColor /></button>
          <input ref={colorRef} type="color" value={color} style={{ display:'none' }} onChange={e => applyColor(e.target.value)} />
          <span style={S.sep} />
          <button title="LTR" style={S.toolBtn(false)}
            onMouseDown={e => { e.preventDefault(); toggleDir('ltr'); }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
          >LTR</button>
          <button title="RTL (arabe)" style={S.toolBtn(false)}
            onMouseDown={e => { e.preventDefault(); toggleDir('rtl'); }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
          >RTL</button>
          <button title="Police arabe" style={{ ...S.toolBtn(false), fontSize:14, fontFamily:"'Scheherazade New',serif", width:'auto', padding:'0 6px' }}
            onMouseDown={e => { e.preventDefault(); editorRef.current?.focus(); document.execCommand('fontName',false,'Scheherazade New'); notify(); }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
          >ع</button>
          <span style={S.sep} />
          <button title="Insérer une image" style={S.toolBtn(showImgPanel)}
            onMouseDown={e => { e.preventDefault(); saveRange(); setShowImgPanel(p => !p); }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.12)'; e.currentTarget.style.color='var(--a-fg)'; }}
            onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
          ><IcoImage /></button>
        </div>

        {/* ── Panneau image ── */}
        {showImgPanel && (
          <div style={S.imgPanel}>
            <button style={{ padding:'5px 12px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-card)', color:'var(--a-fg-mid)', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}
              onClick={() => imgFileRef.current?.click()}
            >{imgUploading ? '⏳ Upload…' : '📁 Choisir un fichier'}</button>
            <input ref={imgFileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { if(e.target.files[0]) handleImgFile(e.target.files[0]); }} />
            <span style={{ color:'var(--a-fg-light)', fontSize:12, flexShrink:0 }}>ou URL :</span>
            <input value={imgUrl} onChange={e => setImgUrl(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') { e.preventDefault(); insertImage(imgUrl); } }}
              placeholder="https://..."
              style={{ flex:1, padding:'5px 10px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none' }}
            />
            <button style={{ padding:'5px 14px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}
              onClick={() => insertImage(imgUrl)}
            >Insérer</button>
            <button style={{ background:'none', border:'none', color:'var(--a-fg-light)', cursor:'pointer', fontSize:16, flexShrink:0 }}
              onClick={() => setShowImgPanel(false)}
            >✕</button>
          </div>
        )}

        {/* ── Zone édition + overlays image ── */}
        <div style={S.editorWrap}>
          <div ref={editorRef} className="rte-editor" contentEditable suppressContentEditableWarning
            style={S.editor} onInput={notify} onPaste={handlePaste}
            onMouseUp={saveRange} onKeyUp={saveRange} onClick={handleEditorClick}
          />

          {/* ─── Overlay image sélectionnée ─── */}
          {selImg && !dragging && (<>
            {/* Bordure + drag handle (curseur grab) */}
            <div
              title="Déplacer l'image"
              style={{
                position:'fixed', top:selImg.top, left:selImg.left, width:selImg.w, height:selImg.h,
                border:'2px solid var(--a-gold)', borderRadius:3, boxSizing:'border-box',
                cursor:'grab', zIndex:2100,
              }}
              onMouseDown={startImgDrag}
            />

            {/* Poignée redimensionnement — coin bas-droit */}
            <div title="Redimensionner" style={{
              position:'fixed', top:selImg.top+selImg.h-7, left:selImg.left+selImg.w-7,
              width:14, height:14, background:'var(--a-gold)', border:'2px solid #fff',
              borderRadius:3, cursor:'se-resize', zIndex:2101,
            }} onMouseDown={startResize} />

            {/* Mini-toolbar */}
            <div style={{
              position:'fixed',
              top: Math.max(4, selImg.top - 42),
              left: Math.max(4, selImg.left + selImg.w / 2 - 135),
              background:'var(--a-bg-card)', border:'1px solid var(--a-border)',
              borderRadius:8, padding:'3px 6px', display:'flex', alignItems:'center', gap:1,
              zIndex:2102, boxShadow:'0 4px 20px rgba(0,0,0,0.4)', whiteSpace:'nowrap',
            }} onMouseDown={e => e.stopPropagation()}>
              {[
                { title:'Flotter à gauche', pos:'left',   Icon:IcoImgFloatL },
                { title:'Centrer',          pos:'center', Icon:IcoImgCenter  },
                { title:'Flotter à droite', pos:'right',  Icon:IcoImgFloatR  },
                { title:'En ligne',         pos:'inline', Icon:IcoImgInline  },
              ].map(({ title, pos, Icon }) => (
                <button key={pos} title={title} style={miniBtn}
                  onMouseDown={e => { e.preventDefault(); setImgPos(pos); }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(191,138,48,.15)'; e.currentTarget.style.color='var(--a-gold)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color=''; }}
                ><Icon /></button>
              ))}
              <span style={miniSep} />
              <input type="number" min="40" max="2000" value={Math.round(selImg.w)}
                style={{ width:58, padding:'2px 6px', borderRadius:5, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:12, outline:'none', textAlign:'center' }}
                onChange={e => {
                  const w = parseInt(e.target.value, 10);
                  if (w >= 40 && selImg?.el) {
                    selImg.el.style.width = w + 'px';
                    selImg.el.style.height = 'auto';
                    const r = selImg.el.getBoundingClientRect();
                    setSelImg(prev => prev ? { ...prev, top:r.top, left:r.left, w:r.width, h:r.height } : null);
                    notify();
                  }
                }}
              />
              <span style={{ fontSize:11, color:'var(--a-fg-light)', marginLeft:2 }}>px</span>
              <span style={miniSep} />
              <button title="Supprimer l'image" style={{ ...miniBtn, color:'var(--a-red)' }}
                onMouseDown={e => { e.preventDefault(); deleteSelImg(); }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,69,58,.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background=''; }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
          </>)}

          {/* ─── Drag en cours : zones + ghost ─── */}
          {dragging && selImg && editorRectRef.current && (<>
            {/* Zones de drop (gauche / centre / droite) */}
            <div style={{
              position:'fixed',
              top: editorRectRef.current.top, left: editorRectRef.current.left,
              width: editorRectRef.current.width, height: editorRectRef.current.height,
              display:'flex', zIndex:2180, pointerEvents:'none',
            }}>
              {['left','center','right'].map(zone => (
                <div key={zone} style={{
                  flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                  background: dragZone===zone ? 'rgba(191,138,48,.18)' : 'rgba(191,138,48,.04)',
                  border: dragZone===zone ? '2px solid rgba(191,138,48,.6)' : '1px dashed rgba(191,138,48,.2)',
                  borderRadius: zone==='left' ? '4px 0 0 4px' : zone==='right' ? '0 4px 4px 0' : '0',
                  transition: 'background .12s, border .12s',
                }}>
                  {dragZone===zone && (<>
                    <span style={{ fontSize:20, opacity:.7 }}>
                      {zone==='left' ? '⬅' : zone==='right' ? '➡' : '↔'}
                    </span>
                    <span style={{ fontSize:10, fontWeight:700, color:'var(--a-gold)', letterSpacing:'.5px' }}>
                      {zone==='left' ? 'GAUCHE' : zone==='right' ? 'DROITE' : 'CENTRÉ'}
                    </span>
                  </>)}
                </div>
              ))}
            </div>

            {/* Ghost image qui suit la souris */}
            <div style={{
              position:'fixed',
              top: dragPos.y - selImg.h / 2,
              left: dragPos.x - selImg.w / 2,
              width: selImg.w, height: selImg.h,
              pointerEvents:'none', zIndex:2300,
              opacity:.85, borderRadius:6,
              border:'2px solid var(--a-gold)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.45)',
              overflow:'hidden', cursor:'grabbing',
            }}>
              <img src={selImg.el?.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            </div>
          </>)}
        </div>
      </>)}

      {tab === 'preview' && (<>
        <div style={S.previewNote}>Rendu tel qu'il apparaîtra aux élèves</div>
        {html && html.replace(/<[^>]*>/g,'').trim() ? (
          <div className="rte-editor" style={S.preview} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div style={{ ...S.preview, color:'var(--a-fg-light)', fontStyle:'italic' }}>Aucun contenu à prévisualiser.</div>
        )}
      </>)}
    </div>
  );
}
