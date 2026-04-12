import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getEnseignantUser, fetchTousLesElevesEnseignant,
  fetchChatMessages, sendChatMessage, markMessagesReadEnseignant, fetchUnreadCountParEleve,
  deleteConversation,
} from './supabaseEnseignant';

const fmtPrenom = (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : '';
const fmtNom    = (s) => s ? s.trim().toUpperCase() : '';
const initiales = (prenom, nom) => `${(prenom||'')[0]||''}${(nom||'')[0]||''}`.toUpperCase();

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
  search:     { padding:'10px 14px', borderBottom:'1px solid var(--a-border)' },
  searchInput:{ width:'100%', padding:'8px 12px', borderRadius:20, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none', boxSizing:'border-box' },
  eleveList:  { flex:1, overflowY:'auto' },
  eleveItem:  (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: active ? 'rgba(191,138,48,.1)' : 'transparent', borderBottom:'1px solid var(--a-border)', transition:'background .15s' }),
  eleveAvatar:{ width:36, height:36, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  eleveName:  { fontSize:13, fontWeight:600, color:'var(--a-fg)' },
  eleveId:    { fontSize:11, color:'var(--a-fg-light)', fontFamily:'monospace', marginTop:1 },
  badge:      { marginLeft:'auto', background:'var(--a-red)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20, flexShrink:0 },
  // Zone chat
  chat:       { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  chatHeader: { padding:'12px 18px', borderBottom:'1px solid var(--a-border)', display:'flex', alignItems:'center', gap:12 },
  chatAvatar: { width:36, height:36, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 },
  chatName:   { fontSize:14, fontWeight:700, color:'var(--a-fg)' },
  chatSub:    { fontSize:11, color:'var(--a-fg-light)', fontFamily:'monospace' },
  messages:   { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:8 },
  bubbleRow:  (mine) => ({ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }),
  bubble:     (mine) => ({
    maxWidth:'68%', padding:'10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: mine ? 'var(--a-gold)' : 'var(--a-bg)',
    color: mine ? '#fff' : 'var(--a-fg)',
    fontSize:13, lineHeight:1.5,
    border: mine ? 'none' : '1px solid var(--a-border)',
    wordBreak:'break-word',
  }),
  bubbleTime: (mine) => ({ fontSize:11, color: mine ? 'rgba(255,255,255,.6)' : 'var(--a-fg-light)', marginTop:3, textAlign: mine ? 'right' : 'left' }),
  inputRow:   { padding:'10px 14px', borderTop:'1px solid var(--a-border)', display:'flex', gap:8, alignItems:'flex-end' },
  textarea:   { flex:1, padding:'9px 13px', borderRadius:16, border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:13, outline:'none', resize:'none', minHeight:38, maxHeight:100, boxSizing:'border-box', fontFamily:'inherit', lineHeight:1.5 },
  sendBtn:    (disabled) => ({ padding:'9px 18px', borderRadius:16, border:'none', background: disabled ? 'var(--a-border)' : 'var(--a-gold)', color: disabled ? 'var(--a-fg-light)' : '#fff', fontSize:13, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink:0, transition:'background .2s' }),
  empty:      { flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--a-fg-light)', fontSize:14, gap:10 },
};

export default function EnseignantMessages() {
  const user = getEnseignantUser();
  const enseignantId = user?.id;

  const [eleves, setEleves]       = useState(null);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [selEleve, setSelEleve]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [sending, setSending]         = useState(false);
  const [unreadMap, setUnreadMap]     = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError]     = useState('');
  const bottomRef                 = useRef(null);
  const pollRef                   = useRef(null);

  // Charger tous les élèves + badge non-lus
  useEffect(() => {
    if (!enseignantId) return;
    fetchTousLesElevesEnseignant(enseignantId).then(async (list) => {
      setEleves(list);
      setFiltered(list);
      // Badge non-lus par élève
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!enseignantId || !selEleve) return;
    try {
      const msgs = await fetchChatMessages(selEleve.id, enseignantId);
      setMessages(msgs || []);
      await markMessagesReadEnseignant(selEleve.id, enseignantId);
      setUnreadMap(prev => ({ ...prev, [selEleve.id]: 0 }));
    } catch {}
  }, [enseignantId, selEleve]);

  useEffect(() => {
    if (!selEleve) return;
    setConfirmDelete(false);
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [selEleve, loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !selEleve) return;
    setSending(true);
    setActionError('');
    try {
      await sendChatMessage(selEleve.id, enseignantId, text.trim(), 'enseignant');
      setText('');
      await loadMessages();
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

  if (eleves === null) return <div style={{ padding:32, color:'var(--a-fg-mid)' }}>Chargement…</div>;

  return (
    <div style={S.page}>
      {/* Colonne élèves */}
      <div style={S.sidebar}>
        <div style={S.sideTitle}>Mes élèves</div>
        <div style={S.search}>
          <input
            style={S.searchInput}
            placeholder="Rechercher un élève…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={S.eleveList}>
          {filtered.length === 0 && (
            <div style={{ padding:'20px 16px', fontSize:13, color:'var(--a-fg-light)', textAlign:'center' }}>
              {eleves.length === 0 ? 'Aucun élève dans vos classes.' : 'Aucun résultat.'}
            </div>
          )}
          {filtered.map(e => {
            const unread = unreadMap[e.id] || 0;
            const active = selEleve?.id === e.id;
            return (
              <div key={e.id} style={S.eleveItem(active)} onClick={() => setSelEleve(e)}>
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
        {!selEleve ? (
          <div style={S.empty}>
            <span style={{ fontSize:40 }}>💬</span>
            <span>Sélectionnez un élève pour voir la conversation</span>
          </div>
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
                return (
                  <div key={m.id} style={S.bubbleRow(mine)}>
                    <div>
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
