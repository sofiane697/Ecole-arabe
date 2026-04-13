import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getEnseignantUser, fetchTousLesElevesEnseignant, fetchMesClasses,
  fetchChatMessages, sendChatMessage, markMessagesReadEnseignant, fetchUnreadCountParEleve,
  deleteConversation, sendGroupMessage, fetchBroadcastsClasse,
  updateBroadcast, deleteBroadcast,
} from './supabaseEnseignant';

const fmtPrenom = (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : '';
const fmtNom    = (s) => s ? s.trim().toUpperCase() : '';
const initiales = (prenom, nom) => `${(prenom||'')[0]||''}${(nom||'')[0]||''}`.toUpperCase();

const BROADCAST_MAX = 2000;

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) + ' ' +
         d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

const S = {
  page:       { display:'flex', height:'calc(100vh - 130px)', gap:0, overflow:'hidden', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', background:'var(--a-bg-card)' },
  // Colonne gauche
  sidebar:    { width:280, flexShrink:0, borderRight:'1px solid var(--a-border)', display:'flex', flexDirection:'column', overflow:'hidden' },
  sideTitle:  { padding:'14px 18px', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--a-border)' },
  sideSubTitle:{ padding:'12px 18px 6px', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px' },
  search:     { padding:'10px 14px', borderBottom:'1px solid var(--a-border)' },
  searchInput:{ width:'100%', padding:'8px 12px', borderRadius:20, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none', boxSizing:'border-box' },
  listWrap:   { flex:1, overflowY:'auto' },
  eleveItem:  (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: active ? 'rgba(191,138,48,.1)' : 'transparent', borderBottom:'1px solid var(--a-border)', transition:'background .15s' }),
  classeItem: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: active ? 'rgba(191,138,48,.15)' : 'transparent', borderBottom:'1px solid var(--a-border)', transition:'background .15s', width:'100%', textAlign:'left', border:'none', color:'var(--a-fg)' }),
  eleveAvatar:{ width:36, height:36, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  classeIcon: { width:36, height:36, borderRadius:10, background:'rgba(191,138,48,.15)', color:'var(--a-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  eleveName:  { fontSize:13, fontWeight:600, color:'var(--a-fg)' },
  eleveId:    { fontSize:11, color:'var(--a-fg-light)', fontFamily:'var(--a-font-mono)', marginTop:1 },
  badge:      { marginLeft:'auto', background:'var(--a-red)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20, flexShrink:0 },
  // Zone chat
  chat:       { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  chatHeader: { padding:'12px 18px', borderBottom:'1px solid var(--a-border)', display:'flex', alignItems:'center', gap:12 },
  chatAvatar: { width:36, height:36, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  chatName:   { fontSize:14, fontWeight:700, color:'var(--a-fg)' },
  chatSub:    { fontSize:11, color:'var(--a-fg-light)', fontFamily:'var(--a-font-mono)' },
  messages:   { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 },
  bubbleRow:  (mine) => ({ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }),
  bubbleWrap: (mine) => ({ maxWidth:'68%', display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start' }),
  bubble:     (mine) => ({
    padding:'10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: mine ? 'var(--a-gold)' : 'var(--a-bg)',
    color: mine ? '#fff' : 'var(--a-fg)',
    fontSize:13, lineHeight:1.5,
    border: mine ? 'none' : '1px solid var(--a-border)',
    wordBreak:'break-word',
  }),
  bubbleTime: (mine) => ({ fontSize:11, color: mine ? 'rgba(255,255,255,.6)' : 'var(--a-fg-light)', marginTop:3, textAlign: mine ? 'right' : 'left' }),
  broadcastBubble: {
    padding:'12px 16px', borderRadius:14,
    background:'rgba(191,138,48,.12)', border:'1px solid rgba(191,138,48,.35)',
    color:'var(--a-fg)', fontSize:13, lineHeight:1.5, wordBreak:'break-word', maxWidth:'85%',
  },
  broadcastBadge: { fontSize:11, fontWeight:700, color:'var(--a-gold)', marginBottom:6, letterSpacing:'.3px' },
  inputRow:   { padding:'10px 14px', borderTop:'1px solid var(--a-border)', display:'flex', gap:8, alignItems:'flex-end' },
  textarea:   { flex:1, padding:'9px 13px', borderRadius:16, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none', resize:'none', minHeight:38, maxHeight:100, boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.5 },
  sendBtn:    (disabled) => ({ padding:'9px 18px', borderRadius:16, border:'none', background: disabled ? 'var(--a-border)' : 'var(--a-gold)', color: disabled ? 'var(--a-fg-light)' : '#fff', fontSize:13, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink:0, transition:'background .2s' }),
  empty:      { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--a-fg-light)', fontSize:14, gap:10 },
};

export default function EnseignantMessages() {
  const user = getEnseignantUser();
  const enseignantId = user?.id;

  const [classes, setClasses]     = useState([]);
  const [eleves, setEleves]       = useState(null);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [selEleve, setSelEleve]   = useState(null);
  const [selClasse, setSelClasse] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]         = useState(false);
  const [unreadMap, setUnreadMap]     = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError]     = useState('');
  const [classeDropdownOpen, setClasseDropdownOpen] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null); // { id, broadcast_id, contenu }
  const [editText, setEditText] = useState('');
  const [confirmDeleteBroadcast, setConfirmDeleteBroadcast] = useState(null); // broadcast_id
  const classeDropdownRef = useRef(null);
  const bottomRef                 = useRef(null);
  const pollRef                   = useRef(null);

  // Charger tous les élèves + classes + badge non-lus
  useEffect(() => {
    if (!enseignantId) return;
    fetchMesClasses(enseignantId).then(setClasses).catch(() => setClasses([]));
    fetchTousLesElevesEnseignant(enseignantId).then(async (list) => {
      setEleves(list);
      setFiltered(list);
      const map = {};
      await Promise.all(list.map(async e => {
        map[e.id] = await fetchUnreadCountParEleve(e.id, enseignantId).catch(() => 0);
      }));
      setUnreadMap(map);
    }).catch(() => { setEleves([]); setFiltered([]); });
  }, [enseignantId]);

  // Filtre recherche
  useEffect(() => {
    if (!eleves) return;
    const q = search.toLowerCase();
    setFiltered(!q ? eleves : eleves.filter(e =>
      `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
      (e.identifiant || '').toLowerCase().includes(q)
    ));
  }, [search, eleves]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, broadcasts]);

  const loadMessages = useCallback(async () => {
    if (!enseignantId || !selEleve) return;
    try {
      const msgs = await fetchChatMessages(selEleve.id, enseignantId);
      setMessages(msgs || []);
      await markMessagesReadEnseignant(selEleve.id, enseignantId);
      setUnreadMap(prev => ({ ...prev, [selEleve.id]: 0 }));
    } catch {}
  }, [enseignantId, selEleve]);

  const loadBroadcasts = useCallback(async () => {
    if (!enseignantId || !selClasse) return;
    try {
      const list = await fetchBroadcastsClasse(enseignantId, selClasse.id);
      setBroadcasts(list || []);
    } catch {}
  }, [enseignantId, selClasse]);

  useEffect(() => {
    if (selEleve) {
      setConfirmDelete(false);
      loadMessages();
      pollRef.current = setInterval(loadMessages, 5000);
      return () => clearInterval(pollRef.current);
    }
    if (selClasse) {
      loadBroadcasts();
      pollRef.current = setInterval(loadBroadcasts, 10000);
      return () => clearInterval(pollRef.current);
    }
  }, [selEleve, selClasse, loadMessages, loadBroadcasts]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setActionError('');
    try {
      if (selClasse) {
        await sendGroupMessage(enseignantId, selClasse.id, text.trim());
        setText('');
        await loadBroadcasts();
      } else if (selEleve) {
        await sendChatMessage(selEleve.id, enseignantId, text.trim(), 'enseignant');
        setText('');
        await loadMessages();
      }
    } catch(e) { setActionError(e.message || 'Erreur lors de l\'envoi du message.'); }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteConversation = async () => {
    if (!selEleve || !enseignantId) return;
    try {
      await deleteConversation(selEleve.id, enseignantId);
      setMessages([]);
      setConfirmDelete(false);
    } catch(e) { setActionError(e.message || 'Erreur lors de la suppression de la conversation.'); }
  };

  const selectEleve  = (e) => { setSelClasse(null); setSelEleve(e); };
  const selectClasse = (c) => { setSelEleve(null); setSelClasse(c); setBroadcasts([]); setClasseDropdownOpen(false); };

  // Fermer le dropdown au clic externe
  useEffect(() => {
    if (!classeDropdownOpen) return;
    const onClick = (e) => {
      if (classeDropdownRef.current && !classeDropdownRef.current.contains(e.target)) setClasseDropdownOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [classeDropdownOpen]);

  const startEditBroadcast = (b) => {
    setActionError('');
    setEditingBroadcast(b);
    setEditText(b.contenu);
    setConfirmDeleteBroadcast(null);
  };

  const saveEditBroadcast = async () => {
    if (!editingBroadcast || !editText.trim()) return;
    setActionError('');
    try {
      await updateBroadcast(enseignantId, editingBroadcast.broadcast_id, editText.trim());
      setEditingBroadcast(null);
      setEditText('');
      await loadBroadcasts();
    } catch(e) { setActionError(e.message || 'Erreur lors de la modification.'); }
  };

  const askDeleteBroadcast = (id) => {
    setActionError('');
    setConfirmDeleteBroadcast(id);
  };

  const handleDeleteBroadcast = async (broadcastId) => {
    setActionError('');
    try {
      await deleteBroadcast(enseignantId, broadcastId);
      setConfirmDeleteBroadcast(null);
      await loadBroadcasts();
    } catch(e) { setActionError(e.message || 'Erreur lors de la suppression.'); }
  };

  if (eleves === null) return <div style={{ padding:32, color:'var(--a-fg-mid)' }}>Chargement…</div>;

  return (
    <div style={S.page}>
      {/* Colonne gauche */}
      <div style={S.sidebar}>
        <div style={S.sideTitle}>Messages</div>

        {classes.length === 1 && (
          <>
            <div style={S.sideSubTitle}>Mes classes</div>
            <div>
              {classes.map(c => (
                <button
                  key={c.id}
                  style={S.classeItem(selClasse?.id === c.id)}
                  onClick={() => selectClasse(c)}
                >
                  <div style={S.classeIcon}>📢</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={S.eleveName}>{c.nom}</div>
                    <div style={S.eleveId}>Annonce à la classe</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {classes.length > 1 && (
          <>
            <div style={S.sideSubTitle}>Annonce à une classe</div>
            <div style={{ padding:'8px 14px 12px', borderBottom:'1px solid var(--a-border)', position:'relative' }} ref={classeDropdownRef}>
              <button
                type="button"
                onClick={() => setClasseDropdownOpen(v => !v)}
                style={{
                  width:'100%', display:'flex', alignItems:'center', gap:10,
                  background: selClasse ? 'linear-gradient(135deg, rgba(191,138,48,.14) 0%, rgba(191,138,48,.04) 100%)' : 'var(--a-bg-input)',
                  border:`1px solid ${selClasse || classeDropdownOpen ? 'var(--a-gold)' : 'var(--a-border)'}`,
                  borderRadius:10, padding:'9px 12px', cursor:'pointer',
                  fontFamily:'inherit', textAlign:'left',
                  boxShadow: classeDropdownOpen ? '0 4px 14px rgba(191,138,48,.18)' : 'none',
                  transition:'all .15s',
                }}
              >
                <div style={{ width:28, height:28, borderRadius:8, background:'rgba(191,138,48,.18)', color:'var(--a-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>📢</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'var(--a-fg-light)', letterSpacing:.5, textTransform:'uppercase', marginBottom:1 }}>
                    {selClasse ? 'Classe sélectionnée' : 'Annoncer à…'}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color: selClasse ? 'var(--a-fg)' : 'var(--a-fg-light)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {selClasse ? selClasse.nom : 'Choisir une classe'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color:'var(--a-fg-light)', flexShrink:0, transform: classeDropdownOpen ? 'rotate(180deg)' : 'none', transition:'transform .2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {classeDropdownOpen && (
                <div style={{
                  position:'absolute', top:'100%', left:14, right:14, zIndex:20,
                  marginTop:4, background:'var(--a-bg-card)',
                  border:'1px solid var(--a-border)', borderRadius:10,
                  boxShadow:'0 8px 24px rgba(0,0,0,.18)',
                  maxHeight:260, overflowY:'auto', padding:4,
                }}>
                  {selClasse && (
                    <button
                      type="button"
                      onClick={() => { setSelClasse(null); setBroadcasts([]); setClasseDropdownOpen(false); }}
                      style={{ width:'100%', textAlign:'left', padding:'8px 10px', fontSize:12, color:'var(--a-fg-light)', background:'transparent', border:'none', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--a-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      ✕ Désélectionner
                    </button>
                  )}
                  {classes.map(c => {
                    const active = selClasse?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClasse(c)}
                        style={{
                          width:'100%', display:'flex', alignItems:'center', gap:10,
                          padding:'9px 10px', borderRadius:6, cursor:'pointer',
                          background: active ? 'rgba(191,138,48,.15)' : 'transparent',
                          border:'none', fontFamily:'inherit', textAlign:'left',
                          transition:'background .1s',
                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--a-bg)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ width:24, height:24, borderRadius:6, background: active ? 'var(--a-gold)' : 'rgba(191,138,48,.15)', color: active ? '#fff' : 'var(--a-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0 }}>📢</div>
                        <div style={{ flex:1, fontSize:13, fontWeight: active ? 700 : 500, color:'var(--a-fg)' }}>{c.nom}</div>
                        {active && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--a-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <div style={S.sideSubTitle}>Mes élèves</div>
        <div style={S.search}>
          <input
            style={S.searchInput}
            placeholder="Rechercher un élève…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={S.listWrap}>
          {filtered.length === 0 && (
            <div style={{ padding:'20px 16px', fontSize:13, color:'var(--a-fg-light)', textAlign:'center' }}>
              {eleves.length === 0 ? 'Aucun élève dans vos classes.' : 'Aucun résultat.'}
            </div>
          )}
          {filtered.map(e => {
            const unread = unreadMap[e.id] || 0;
            const active = selEleve?.id === e.id;
            return (
              <div key={e.id} style={S.eleveItem(active)} onClick={() => selectEleve(e)}>
                <div style={S.eleveAvatar}>{initiales(e.prenom, e.nom)}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={S.eleveName}>{fmtPrenom(e.prenom)} {fmtNom(e.nom)}</div>
                  <div style={S.eleveId}>{(e.identifiant || '').toUpperCase()}</div>
                </div>
                {unread > 0 && <span style={S.badge}>{unread}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone chat */}
      <div style={S.chat}>
        {!selEleve && !selClasse ? (
          <div style={S.empty}>
            <span style={{ fontSize:40 }}>💬</span>
            <span>Sélectionnez un élève ou une classe pour commencer</span>
          </div>
        ) : selClasse ? (
          <>
            <div style={S.chatHeader}>
              <div style={{ ...S.classeIcon, width:36, height:36 }}>📢</div>
              <div style={{ flex:1 }}>
                <div style={S.chatName}>Annonce à la classe « {selClasse.nom} »</div>
                <div style={S.chatSub}>Message diffusé à tous les élèves de la classe (lecture seule)</div>
              </div>
            </div>

            <div style={S.messages}>
              {broadcasts.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--a-fg-light)', fontSize:13, marginTop:40 }}>
                  Aucune annonce envoyée à cette classe pour l'instant.
                </div>
              )}
              {broadcasts.map(m => {
                const isEditing = editingBroadcast?.broadcast_id === m.broadcast_id;
                const askDelete = confirmDeleteBroadcast === m.broadcast_id;
                return (
                  <div key={m.id} style={{ display:'flex', justifyContent:'flex-start' }}>
                    <div style={{ maxWidth:'85%' }}>
                      <div style={{ ...S.broadcastBubble, maxWidth:'100%' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                          <div style={S.broadcastBadge}>📢 ANNONCE CLASSE</div>
                          <div style={{ flex:1 }} />
                          {!isEditing && !askDelete && (
                            <>
                              <button
                                onClick={() => startEditBroadcast(m)}
                                title="Modifier"
                                style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--a-fg-light)', padding:4, borderRadius:6, display:'flex', alignItems:'center' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--a-gold)'; e.currentTarget.style.background = 'rgba(191,138,48,.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--a-fg-light)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button
                                onClick={() => askDeleteBroadcast(m.broadcast_id)}
                                title="Supprimer"
                                style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--a-fg-light)', padding:4, borderRadius:6, display:'flex', alignItems:'center' }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--a-red)'; e.currentTarget.style.background = 'rgba(255,69,58,.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--a-fg-light)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                        {isEditing ? (
                          <>
                            <textarea
                              value={editText}
                              onChange={e => setEditText(e.target.value.slice(0, BROADCAST_MAX))}
                              rows={3}
                              maxLength={BROADCAST_MAX}
                              autoFocus
                              style={{ width:'100%', padding:'8px 10px', borderRadius:8, border:'1px solid var(--a-gold)', background:'var(--a-bg-card)', color:'var(--a-fg)', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.5 }}
                            />
                            {isEditing && actionError && (
                              <div style={{ marginTop:6, padding:'6px 9px', background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.35)', borderRadius:7, color:'var(--a-red)', fontSize:12 }}>
                                ⚠ {actionError}
                              </div>
                            )}
                            <div style={{ display:'flex', gap:6, marginTop:6, justifyContent:'space-between', alignItems:'center' }}>
                              <span style={{ fontSize:11, color: editText.length > BROADCAST_MAX * 0.9 ? 'var(--a-red)' : 'var(--a-fg-light)' }}>
                                {editText.length} / {BROADCAST_MAX}
                              </span>
                              <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => { setEditingBroadcast(null); setEditText(''); }} style={{ padding:'5px 12px', borderRadius:7, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:12, cursor:'pointer' }}>Annuler</button>
                              <button onClick={saveEditBroadcast} disabled={!editText.trim()} style={{ padding:'5px 14px', borderRadius:7, border:'none', background: editText.trim() ? 'var(--a-gold)' : 'var(--a-border)', color: editText.trim() ? '#fff' : 'var(--a-fg-light)', fontSize:12, fontWeight:600, cursor: editText.trim() ? 'pointer' : 'not-allowed' }}>Enregistrer</button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>{m.contenu}</div>
                        )}
                      </div>
                      {askDelete && (
                        <div style={{ marginTop:6 }}>
                          <div style={{ padding:'8px 10px', background:'rgba(255,69,58,.08)', border:'1px solid rgba(255,69,58,.3)', borderRadius:8, display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                            <span style={{ flex:1, color:'var(--a-fg)' }}>Supprimer cette annonce pour tous les élèves ?</span>
                            <button onClick={() => handleDeleteBroadcast(m.broadcast_id)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'var(--a-red)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>Confirmer</button>
                            <button onClick={() => setConfirmDeleteBroadcast(null)} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:12, cursor:'pointer' }}>Annuler</button>
                          </div>
                          {actionError && (
                            <div style={{ marginTop:6, padding:'6px 9px', background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.35)', borderRadius:7, color:'var(--a-red)', fontSize:12 }}>
                              ⚠ {actionError}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:3 }}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {actionError && <p style={{ color:'#ff453a', fontSize:13, margin:'0 14px 4px' }}>{actionError}</p>}
            <div style={{ ...S.inputRow, flexDirection:'column', alignItems:'stretch', gap:6 }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
                <textarea
                  style={S.textarea}
                  placeholder={`Écrire une annonce à la classe ${selClasse.nom}…`}
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, BROADCAST_MAX))}
                  onKeyDown={handleKeyDown}
                  maxLength={BROADCAST_MAX}
                  rows={1}
                />
                <button style={S.sendBtn(!text.trim() || sending)} onClick={handleSend} disabled={!text.trim() || sending}>
                  {sending ? '…' : 'Envoyer à la classe'}
                </button>
              </div>
              <div style={{ fontSize:11, color: text.length > BROADCAST_MAX * 0.9 ? 'var(--a-red)' : 'var(--a-fg-light)', textAlign:'right', paddingRight:4 }}>
                {text.length} / {BROADCAST_MAX}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={S.chatHeader}>
              <div style={S.chatAvatar}>{initiales(selEleve.prenom, selEleve.nom)}</div>
              <div style={{ flex:1 }}>
                <div style={S.chatName}>{fmtPrenom(selEleve.prenom)} {fmtNom(selEleve.nom)}</div>
                <div style={S.chatSub}>{(selEleve.identifiant || '').toUpperCase()}</div>
              </div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Effacer la conversation"
                  style={{ background:'none', border:'1px solid var(--a-border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--a-fg-light)', fontSize:12, display:'flex', alignItems:'center', gap:5, flexShrink:0, transition:'all .15s' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Effacer
                </button>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:12, color:'var(--a-fg-mid)' }}>Supprimer ?</span>
                  <button onClick={handleDeleteConversation} style={{ padding:'5px 12px', borderRadius:8, border:'none', background:'var(--a-red)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{ padding:'5px 10px', borderRadius:8, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:12, cursor:'pointer' }}>
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div style={S.messages}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--a-fg-light)', fontSize:13, marginTop:40 }}>
                  Aucun message avec cet élève pour l'instant.
                </div>
              )}
              {messages.map(m => {
                const mine = m.sender_role === 'enseignant';
                const isBroadcast = !!m.broadcast_id;
                if (isBroadcast) {
                  return (
                    <div key={m.id} style={{ display:'flex', justifyContent:'flex-start' }}>
                      <div>
                        <div style={S.broadcastBubble}>
                          <div style={S.broadcastBadge}>📢 ANNONCE CLASSE</div>
                          {m.contenu}
                        </div>
                        <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:3 }}>{fmtTime(m.created_at)}</div>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={m.id} style={S.bubbleRow(mine)}>
                    <div style={S.bubbleWrap(mine)}>
                      <div style={S.bubble(mine)}>{m.contenu}</div>
                      <div style={S.bubbleTime(mine)}>{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {actionError && <p style={{ color:'#ff453a', fontSize:13, margin:'0 14px 4px' }}>{actionError}</p>}
            <div style={S.inputRow}>
              <textarea
                style={S.textarea}
                placeholder="Écrire un message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button style={S.sendBtn(!text.trim() || sending)} onClick={handleSend} disabled={!text.trim() || sending}>
                {sending ? '…' : 'Envoyer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
