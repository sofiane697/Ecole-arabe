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

/* ── Tailwind class strings for static styles ── */
const cls = {
  page:          'flex overflow-hidden rounded-[var(--a-radius)] border border-[var(--a-border)] bg-[var(--a-bg-card)]',
  sidebar:       'w-[280px] shrink-0 border-r border-[var(--a-border)] flex flex-col overflow-hidden',
  sideTitle:     'px-[18px] py-[14px] text-[11px] font-bold text-[var(--a-fg-light)] uppercase tracking-[.5px] border-b border-[var(--a-border)]',
  sideSubTitle:  'px-[18px] pt-3 pb-1.5 text-[11px] font-bold text-[var(--a-fg-light)] uppercase tracking-[.5px]',
  search:        'px-3.5 py-2.5 border-b border-[var(--a-border)]',
  searchInput:   'w-full px-3 py-2 rounded-[20px] border border-[var(--a-border)] bg-[var(--a-bg-input)] text-[var(--a-fg)] text-[13px] outline-none box-border',
  listWrap:      'flex-1 overflow-y-auto',
  eleveAvatar:   'w-9 h-9 rounded-full bg-[var(--a-gold)] text-white flex items-center justify-center text-[13px] font-bold shrink-0',
  classeIcon:    'w-9 h-9 rounded-[10px] flex items-center justify-center text-lg shrink-0',
  eleveName:     'text-[13px] font-semibold text-[var(--a-fg)]',
  eleveId:       'text-[11px] text-[var(--a-fg-light)] font-[var(--a-font-mono)] mt-px',
  badge:         'ml-auto bg-[var(--a-red)] text-white text-[11px] font-bold px-[7px] py-0.5 rounded-[20px] shrink-0',
  chat:          'flex-1 flex flex-col overflow-hidden',
  chatHeader:    'px-[18px] py-3 border-b border-[var(--a-border)] flex items-center gap-3',
  chatAvatar:    'w-9 h-9 rounded-full bg-[var(--a-gold)] text-white flex items-center justify-center text-[13px] font-bold shrink-0',
  chatName:      'text-sm font-bold text-[var(--a-fg)]',
  chatSub:       'text-[11px] text-[var(--a-fg-light)] font-[var(--a-font-mono)]',
  messages:      'flex-1 overflow-y-auto p-4 flex flex-col gap-2',
  broadcastBubble: 'px-4 py-3 rounded-[14px] text-[var(--a-fg)] text-[13px] leading-normal break-words max-w-[85%]',
  broadcastBadge:'text-[11px] font-bold text-[var(--a-gold)] mb-1.5 tracking-[.3px]',
  inputRow:      'px-3.5 py-2.5 border-t border-[var(--a-border)] flex gap-2 items-end',
  textarea:      'flex-1 px-[13px] py-[9px] rounded-2xl border border-[var(--a-border)] bg-[var(--a-bg-input)] text-[var(--a-fg)] text-[13px] outline-none resize-none min-h-[38px] max-h-[100px] box-border font-[inherit] leading-normal',
  empty:         'flex-1 flex flex-col items-center justify-center text-[var(--a-fg-light)] text-sm gap-2.5',
};

/* ── Remaining dynamic-only styles ── */
const S = {
  page:       { height:'calc(100vh - 130px)', gap:0 },
  eleveItem:  (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: active ? 'rgba(191,138,48,.1)' : 'transparent', borderBottom:'1px solid var(--a-border)', transition:'background .15s' }),
  classeItem: (active) => ({ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer', background: active ? 'rgba(191,138,48,.15)' : 'transparent', borderBottom:'1px solid var(--a-border)', transition:'background .15s', width:'100%', textAlign:'left', border:'none', color:'var(--a-fg)' }),
  classeIcon: { background:'rgba(191,138,48,.15)', color:'var(--a-gold)' },
  broadcastBubble: { background:'rgba(191,138,48,.12)', border:'1px solid rgba(191,138,48,.35)' },
  bubble:     (mine) => ({
    padding:'10px 14px', borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    background: mine ? 'var(--a-gold)' : 'var(--a-bg)',
    color: mine ? '#fff' : 'var(--a-fg)',
    fontSize:13, lineHeight:1.5,
    border: mine ? 'none' : '1px solid var(--a-border)',
    wordBreak:'break-word',
  }),
  bubbleRow:  (mine) => ({ display:'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }),
  bubbleWrap: (mine) => ({ maxWidth:'68%', display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start' }),
  bubbleTime: (mine) => ({ fontSize:11, color: mine ? 'rgba(255,255,255,.6)' : 'var(--a-fg-light)', marginTop:3, textAlign: mine ? 'right' : 'left' }),
  sendBtn:    (disabled) => ({ padding:'9px 18px', borderRadius:16, border:'none', background: disabled ? 'var(--a-border)' : 'var(--a-gold)', color: disabled ? 'var(--a-fg-light)' : '#fff', fontSize:13, fontWeight:700, cursor: disabled ? 'not-allowed' : 'pointer', flexShrink:0, transition:'background .2s' }),
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

  if (eleves === null) return <div className="p-8 text-[var(--a-fg-mid)]">Chargement…</div>;

  return (
    <div className={cls.page} style={S.page}>
      {/* Colonne gauche */}
      <div className={cls.sidebar}>
        <div className={cls.sideTitle}>Messages</div>

        {classes.length === 1 && (
          <>
            <div className={cls.sideSubTitle}>Mes classes</div>
            <div>
              {classes.map(c => (
                <button
                  key={c.id}
                  style={S.classeItem(selClasse?.id === c.id)}
                  onClick={() => selectClasse(c)}
                >
                  <div className={cls.classeIcon} style={S.classeIcon}>📢</div>
                  <div className="flex-1 min-w-0">
                    <div className={cls.eleveName}>{c.nom}</div>
                    <div className={cls.eleveId}>Annonce à la classe</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {classes.length > 1 && (
          <>
            <div className={cls.sideSubTitle}>Annonce à une classe</div>
            <div className="px-3.5 pt-2 pb-3 border-b border-[var(--a-border)] relative" ref={classeDropdownRef}>
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
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[15px] shrink-0" style={{ background:'rgba(191,138,48,.18)', color:'var(--a-gold)' }}>📢</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-[var(--a-fg-light)] tracking-[.5px] uppercase mb-px">
                    {selClasse ? 'Classe sélectionnée' : 'Annoncer à…'}
                  </div>
                  <div className="text-[13px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: selClasse ? 'var(--a-fg)' : 'var(--a-fg-light)' }}>
                    {selClasse ? selClasse.nom : 'Choisir une classe'}
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--a-fg-light)] shrink-0 transition-transform duration-200" style={{ transform: classeDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {classeDropdownOpen && (
                <div className="absolute top-full left-3.5 right-3.5 z-20 mt-1 bg-[var(--a-bg-card)] border border-[var(--a-border)] rounded-[10px] max-h-[260px] overflow-y-auto p-1" style={{ boxShadow:'0 8px 24px rgba(0,0,0,.18)' }}>
                  {selClasse && (
                    <button
                      type="button"
                      onClick={() => { setSelClasse(null); setBroadcasts([]); setClasseDropdownOpen(false); }}
                      className="w-full text-left px-2.5 py-2 text-xs text-[var(--a-fg-light)] bg-transparent border-none rounded-md cursor-pointer font-[inherit]"
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
                        className="w-full flex items-center gap-2.5 px-2.5 py-[9px] rounded-md cursor-pointer border-none font-[inherit] text-left transition-colors duration-100"
                        style={{ background: active ? 'rgba(191,138,48,.15)' : 'transparent' }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--a-bg)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0" style={{ background: active ? 'var(--a-gold)' : 'rgba(191,138,48,.15)', color: active ? '#fff' : 'var(--a-gold)' }}>📢</div>
                        <div className="flex-1 text-[13px] text-[var(--a-fg)]" style={{ fontWeight: active ? 700 : 500 }}>{c.nom}</div>
                        {active && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--a-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <div className={cls.sideSubTitle}>Mes élèves</div>
        <div className={cls.search}>
          <input
            className={cls.searchInput}
            placeholder="Rechercher un élève…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={cls.listWrap}>
          {filtered.length === 0 && (
            <div className="px-4 py-5 text-[13px] text-[var(--a-fg-light)] text-center">
              {eleves.length === 0 ? 'Aucun élève dans vos classes.' : 'Aucun résultat.'}
            </div>
          )}
          {filtered.map(e => {
            const unread = unreadMap[e.id] || 0;
            const active = selEleve?.id === e.id;
            return (
              <div key={e.id} style={S.eleveItem(active)} onClick={() => selectEleve(e)}>
                <div className={cls.eleveAvatar}>{initiales(e.prenom, e.nom)}</div>
                <div className="flex-1 min-w-0">
                  <div className={cls.eleveName}>{fmtPrenom(e.prenom)} {fmtNom(e.nom)}</div>
                  <div className={cls.eleveId}>{(e.identifiant || '').toUpperCase()}</div>
                </div>
                {unread > 0 && <span className={cls.badge}>{unread}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Zone chat */}
      <div className={cls.chat}>
        {!selEleve && !selClasse ? (
          <div className={cls.empty}>
            <span className="text-[40px]">💬</span>
            <span>Sélectionnez un élève ou une classe pour commencer</span>
          </div>
        ) : selClasse ? (
          <>
            <div className={cls.chatHeader}>
              <div className={cls.classeIcon} style={{ ...S.classeIcon, width:36, height:36 }}>📢</div>
              <div className="flex-1">
                <div className={cls.chatName}>Annonce à la classe « {selClasse.nom} »</div>
                <div className={cls.chatSub}>Message diffusé à tous les élèves de la classe (lecture seule)</div>
              </div>
            </div>

            <div className={cls.messages}>
              {broadcasts.length === 0 && (
                <div className="text-center text-[var(--a-fg-light)] text-[13px] mt-10">
                  Aucune annonce envoyée à cette classe pour l'instant.
                </div>
              )}
              {broadcasts.map(m => {
                const isEditing = editingBroadcast?.broadcast_id === m.broadcast_id;
                const askDelete = confirmDeleteBroadcast === m.broadcast_id;
                return (
                  <div key={m.id} className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className={cls.broadcastBubble} style={{ ...S.broadcastBubble, maxWidth:'100%' }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className={cls.broadcastBadge}>📢 ANNONCE CLASSE</div>
                          <div className="flex-1" />
                          {!isEditing && !askDelete && (
                            <>
                              <button
                                onClick={() => startEditBroadcast(m)}
                                title="Modifier"
                                className="bg-transparent border-none cursor-pointer text-[var(--a-fg-light)] p-1 rounded-md flex items-center"
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--a-gold)'; e.currentTarget.style.background = 'rgba(191,138,48,.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--a-fg-light)'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button
                                onClick={() => askDeleteBroadcast(m.broadcast_id)}
                                title="Supprimer"
                                className="bg-transparent border-none cursor-pointer text-[var(--a-fg-light)] p-1 rounded-md flex items-center"
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
                              className="w-full px-2.5 py-2 rounded-lg border border-[var(--a-gold)] bg-[var(--a-bg-card)] text-[var(--a-fg)] text-[13px] outline-none resize-y box-border font-[inherit] leading-normal"
                            />
                            {isEditing && actionError && (
                              <div className="mt-1.5 px-[9px] py-1.5 rounded-[7px] text-[var(--a-red)] text-xs" style={{ background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.35)' }}>
                                ⚠ {actionError}
                              </div>
                            )}
                            <div className="flex gap-1.5 mt-1.5 justify-between items-center">
                              <span className="text-[11px]" style={{ color: editText.length > BROADCAST_MAX * 0.9 ? 'var(--a-red)' : 'var(--a-fg-light)' }}>
                                {editText.length} / {BROADCAST_MAX}
                              </span>
                              <div className="flex gap-1.5">
                              <button onClick={() => { setEditingBroadcast(null); setEditText(''); }} className="px-3 py-[5px] rounded-[7px] border border-[var(--a-border)] bg-transparent text-[var(--a-fg-mid)] text-xs cursor-pointer">Annuler</button>
                              <button onClick={saveEditBroadcast} disabled={!editText.trim()} className="px-3.5 py-[5px] rounded-[7px] border-none text-xs font-semibold" style={{ background: editText.trim() ? 'var(--a-gold)' : 'var(--a-border)', color: editText.trim() ? '#fff' : 'var(--a-fg-light)', cursor: editText.trim() ? 'pointer' : 'not-allowed' }}>Enregistrer</button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>{m.contenu}</div>
                        )}
                      </div>
                      {askDelete && (
                        <div className="mt-1.5">
                          <div className="px-2.5 py-2 rounded-lg flex items-center gap-2 text-xs" style={{ background:'rgba(255,69,58,.08)', border:'1px solid rgba(255,69,58,.3)' }}>
                            <span className="flex-1 text-[var(--a-fg)]">Supprimer cette annonce pour tous les élèves ?</span>
                            <button onClick={() => handleDeleteBroadcast(m.broadcast_id)} className="px-2.5 py-1 rounded-md border-none bg-[var(--a-red)] text-white text-xs font-semibold cursor-pointer">Confirmer</button>
                            <button onClick={() => setConfirmDeleteBroadcast(null)} className="px-2.5 py-1 rounded-md border border-[var(--a-border)] bg-transparent text-[var(--a-fg-mid)] text-xs cursor-pointer">Annuler</button>
                          </div>
                          {actionError && (
                            <div className="mt-1.5 px-[9px] py-1.5 rounded-[7px] text-[var(--a-red)] text-xs" style={{ background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.35)' }}>
                              ⚠ {actionError}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-[11px] text-[var(--a-fg-light)] mt-[3px]">{fmtTime(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {actionError && <p className="text-[13px] mx-3.5 mb-1" style={{ color:'#ff453a' }}>{actionError}</p>}
            <div className={cls.inputRow} style={{ flexDirection:'column', alignItems:'stretch', gap:6 }}>
              <div className="flex gap-2 items-end">
                <textarea
                  className={cls.textarea}
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
              <div className="text-[11px] text-right pr-1" style={{ color: text.length > BROADCAST_MAX * 0.9 ? 'var(--a-red)' : 'var(--a-fg-light)' }}>
                {text.length} / {BROADCAST_MAX}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={cls.chatHeader}>
              <div className={cls.chatAvatar}>{initiales(selEleve.prenom, selEleve.nom)}</div>
              <div className="flex-1">
                <div className={cls.chatName}>{fmtPrenom(selEleve.prenom)} {fmtNom(selEleve.nom)}</div>
                <div className={cls.chatSub}>{(selEleve.identifiant || '').toUpperCase()}</div>
              </div>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="Effacer la conversation"
                  className="bg-transparent border border-[var(--a-border)] rounded-lg px-2.5 py-1.5 cursor-pointer text-[var(--a-fg-light)] text-xs flex items-center gap-[5px] shrink-0 transition-all duration-150"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Effacer
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-[var(--a-fg-mid)]">Supprimer ?</span>
                  <button onClick={handleDeleteConversation} className="px-3 py-[5px] rounded-lg border-none bg-[var(--a-red)] text-white text-xs font-semibold cursor-pointer">
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-[5px] rounded-lg border border-[var(--a-border)] bg-transparent text-[var(--a-fg-mid)] text-xs cursor-pointer">
                    Annuler
                  </button>
                </div>
              )}
            </div>

            <div className={cls.messages}>
              {messages.length === 0 && (
                <div className="text-center text-[var(--a-fg-light)] text-[13px] mt-10">
                  Aucun message avec cet élève pour l'instant.
                </div>
              )}
              {messages.map(m => {
                const mine = m.sender_role === 'enseignant';
                const isBroadcast = !!m.broadcast_id;
                if (isBroadcast) {
                  return (
                    <div key={m.id} className="flex justify-start">
                      <div>
                        <div className={cls.broadcastBubble} style={S.broadcastBubble}>
                          <div className={cls.broadcastBadge}>📢 ANNONCE CLASSE</div>
                          {m.contenu}
                        </div>
                        <div className="text-[11px] text-[var(--a-fg-light)] mt-[3px]">{fmtTime(m.created_at)}</div>
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

            {actionError && <p className="text-[13px] mx-3.5 mb-1" style={{ color:'#ff453a' }}>{actionError}</p>}
            <div className={cls.inputRow}>
              <textarea
                className={cls.textarea}
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
