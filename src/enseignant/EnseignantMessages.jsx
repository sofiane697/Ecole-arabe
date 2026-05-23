import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  getEnseignantUser, fetchTousLesElevesEnseignant, fetchMesClasses,
  fetchChatMessages, sendChatMessage, markMessagesReadEnseignant, fetchUnreadCountParEleve,
  deleteConversation, sendGroupMessage, fetchBroadcastsClasse,
  updateBroadcast, deleteBroadcast,
} from './supabaseEnseignant';
import { Flourish, Diamond } from '../shared/Ornaments';
import EleveAvatar from '../shared/EleveAvatar';

// ── Palette Coupole v1 ──────────────────────────────────────────────────────
const C = {
  bg:        '#F2EEDF',
  paper:     '#FBFAF1',
  ink:       '#1E2317',
  ink2:      '#3F4A33',
  ink3:      '#7A876A',
  gold:      '#8A6B1F',
  goldLight: '#C09844',
  goldSoft:  '#DCBC6E',
  rule:      'rgba(138,107,31,0.18)',
  ruleSoft:  'rgba(138,107,31,0.10)',
};

const BROADCAST_MAX = 2000;

function ini(e) {
  return `${(e?.prenom || '')[0] || ''}${(e?.nom || '')[0] || ''}`.toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function fmtDayShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return fmtTime(iso);
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function frenchLongDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function dayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "AUJOURD'HUI";
  const yest = new Date(now); yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'HIER';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
}

// ── Icons ──
const IconSearch = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconClip = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);
const IconCalendar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconTrash = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);
const IconEdit = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantMessages() {
  const user = getEnseignantUser();
  const enseignantId = user?.id;

  const [classes,    setClasses]    = useState([]);
  const [eleves,     setEleves]     = useState(null);
  const [search,     setSearch]     = useState('');
  const [sideTab,    setSideTab]    = useState('all');
  const [selEleve,   setSelEleve]   = useState(null);
  const [selClasse,  setSelClasse]  = useState(null);
  const [messages,   setMessages]   = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [text,       setText]       = useState('');
  const [sending,    setSending]    = useState(false);
  const [unreadMap,  setUnreadMap]  = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError,   setActionError]   = useState('');
  const [editingBroadcast,      setEditingBroadcast]      = useState(null);
  const [editText,              setEditText]              = useState('');
  const [confirmDeleteBroadcast, setConfirmDeleteBroadcast] = useState(null);
  const bottomRef = useRef(null);
  const pollRef   = useRef(null);

  // ── Load data ──
  useEffect(() => {
    if (!enseignantId) return;
    fetchMesClasses(enseignantId).then(setClasses).catch(() => setClasses([]));
    fetchTousLesElevesEnseignant(enseignantId).then(async (list) => {
      setEleves(list);
      const map = {};
      await Promise.all(list.map(async e => {
        map[e.id] = await fetchUnreadCountParEleve(e.id, enseignantId).catch(() => 0);
      }));
      setUnreadMap(map);
    }).catch(() => { setEleves([]); });
  }, [enseignantId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, broadcasts]);

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
    setSending(true); setActionError('');
    try {
      if (selClasse) {
        await sendGroupMessage(enseignantId, selClasse.id, text.trim());
        setText(''); await loadBroadcasts();
      } else if (selEleve) {
        await sendChatMessage(selEleve.id, enseignantId, text.trim(), 'enseignant');
        setText(''); await loadMessages();
      }
    } catch (e) { setActionError(e.message || "Erreur lors de l'envoi."); }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDeleteConversation = async () => {
    if (!selEleve || !enseignantId) return;
    try {
      await deleteConversation(selEleve.id, enseignantId);
      setMessages([]); setConfirmDelete(false);
    } catch (e) { setActionError(e.message || 'Erreur.'); }
  };

  const selectEleve  = (e) => { setSelClasse(null); setSelEleve(e); };
  const selectClasse = (c) => { setSelEleve(null); setSelClasse(c); setBroadcasts([]); };

  const startEditBroadcast = (b) => {
    setActionError(''); setEditingBroadcast(b); setEditText(b.contenu);
    setConfirmDeleteBroadcast(null);
  };
  const saveEditBroadcast = async () => {
    if (!editingBroadcast || !editText.trim()) return;
    setActionError('');
    try {
      await updateBroadcast(enseignantId, editingBroadcast.broadcast_id, editText.trim());
      setEditingBroadcast(null); setEditText(''); await loadBroadcasts();
    } catch (e) { setActionError(e.message || 'Erreur.'); }
  };
  const handleDeleteBroadcast = async (broadcastId) => {
    setActionError('');
    try {
      await deleteBroadcast(enseignantId, broadcastId);
      setConfirmDeleteBroadcast(null); await loadBroadcasts();
    } catch (e) { setActionError(e.message || 'Erreur.'); }
  };

  // ── Filtre / recherche ──
  const filteredEleves = (eleves || []).filter(e => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${e.prenom} ${e.nom}`.toLowerCase().includes(q) || (e.identifiant || '').toLowerCase().includes(q);
  });

  const totalUnread = Object.values(unreadMap).reduce((s, n) => s + (n || 0), 0);

  const showParents   = sideTab === 'all' || sideTab === 'parents';
  const showDirection = sideTab === 'all' || sideTab === 'direction';

  const today = new Date();
  const todayStr = frenchLongDate(today);

  if (eleves === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: C.ink3, fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic' }}>
        Chargement…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif", color: C.ink, padding: '24px 32px 32px' }}>

      {/* ═══ Page header ═══ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Flourish size={28} />
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
              Conversations en cours
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 38, fontWeight: 500, lineHeight: 1.05,
            color: C.ink, margin: 0, letterSpacing: '-0.015em',
          }}>
            <em style={{ color: C.gold, fontWeight: 500 }}>Messages</em> & correspondance
          </h1>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 6 }}>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14, color: C.ink2 }}>
            {todayStr}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: totalUnread > 0 ? C.gold : C.ink3, textTransform: 'uppercase', marginTop: 4 }}>
            {totalUnread > 0 ? `${totalUnread} non lu${totalUnread > 1 ? 's' : ''}` : 'Tout lu'}
          </div>
        </div>
      </div>

      {/* ═══ Big card 2 colonnes ═══ */}
      <div style={{
        display: 'flex',
        background: C.paper, borderRadius: 20,
        border: `1px solid ${C.rule}`,
        height: 'calc(100vh - 200px)', minHeight: 540, overflow: 'hidden',
      }}>

        {/* ── Colonne gauche ── */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: `1px solid ${C.rule}`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'rgba(242,238,223,0.4)',
        }}>
          {/* Search */}
          <div style={{ padding: '16px 16px 10px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.ink3 }}>
                <IconSearch />
              </span>
              <input
                placeholder="Rechercher une conversation…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '9px 14px 9px 36px', borderRadius: 999,
                  border: `1px solid ${C.rule}`, background: C.paper, color: C.ink,
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', fontStyle: 'italic',
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ display: 'inline-flex', background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 999, padding: 3 }}>
              {[
                { key: 'all',       label: 'Tous'      },
                { key: 'parents',   label: 'Parents'   },
                { key: 'direction', label: 'Direction' },
              ].map(t => {
                const active = sideTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setSideTab(t.key)}
                    style={{
                      padding: '6px 14px', borderRadius: 999, border: 'none',
                      background: active ? C.gold : 'transparent',
                      color: active ? C.paper : C.ink3,
                      fontSize: 12, fontWeight: active ? 700 : 600,
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Classes (Direction) */}
            {showDirection && classes.map(c => {
              const active = selClasse?.id === c.id;
              return (
                <ConvItem
                  key={`c-${c.id}`}
                  active={active}
                  onClick={() => selectClasse(c)}
                  avatar={<InitialsAvatar text="DR" size={36} />}
                  name="Direction"
                  subtitle={`Classe ${c.nom}`}
                  preview="Annonces & communications collectives"
                />
              );
            })}

            {/* Élèves (Parents) */}
            {showParents && filteredEleves.length === 0 && (
              <div style={{ padding: '20px 16px', fontSize: 13, color: C.ink3, textAlign: 'center', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic' }}>
                {(eleves || []).length === 0 ? 'Aucun élève.' : 'Aucun résultat.'}
              </div>
            )}
            {showParents && filteredEleves.map(e => {
              const unread = unreadMap[e.id] || 0;
              const active = selEleve?.id === e.id;
              return (
                <ConvItem
                  key={e.id}
                  active={active}
                  onClick={() => selectEleve(e)}
                  avatar={
                    <EleveAvatar
                      eleve={e}
                      size={36}
                      variant="enseignant"
                      fallbackStyle={{
                        background: C.ink, color: C.goldLight,
                        fontWeight: 700, letterSpacing: '0.5px',
                      }}
                    />
                  }
                  name={(e.nom || '').toUpperCase()}
                  subtitle={`${e.prenom} · ${(e.classes?.nom || e.classe_nom || '').trim()}`}
                  unread={unread}
                />
              );
            })}
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Empty state */}
          {!selEleve && !selClasse && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
            }}>
              <Flourish size={42} />
              <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontStyle: 'italic', color: C.ink3, margin: 0 }}>
                Sélectionnez une conversation
              </p>
            </div>
          )}

          {/* ── Class broadcast view ── */}
          {selClasse && (
            <BroadcastView
              classe={selClasse}
              broadcasts={broadcasts}
              editingBroadcast={editingBroadcast}
              editText={editText}
              setEditText={setEditText}
              startEditBroadcast={startEditBroadcast}
              saveEditBroadcast={saveEditBroadcast}
              cancelEditBroadcast={() => { setEditingBroadcast(null); setEditText(''); }}
              confirmDeleteBroadcast={confirmDeleteBroadcast}
              setConfirmDeleteBroadcast={setConfirmDeleteBroadcast}
              handleDeleteBroadcast={handleDeleteBroadcast}
              actionError={actionError}
              text={text}
              setText={setText}
              handleSend={handleSend}
              handleKeyDown={handleKeyDown}
              sending={sending}
              bottomRef={bottomRef}
            />
          )}

          {/* ── Individual chat view ── */}
          {selEleve && (
            <ChatView
              eleve={selEleve}
              messages={messages}
              text={text}
              setText={setText}
              handleSend={handleSend}
              handleKeyDown={handleKeyDown}
              sending={sending}
              actionError={actionError}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              handleDeleteConversation={handleDeleteConversation}
              bottomRef={bottomRef}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Composant : ligne de conversation dans la liste
   ═════════════════════════════════════════════════════════════════════════ */
function InitialsAvatar({ text, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: C.ink, color: C.goldLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.30), fontWeight: 700, letterSpacing: '0.5px',
    }}>
      {text}
    </div>
  );
}

function ConvItem({ active, onClick, avatar, name, subtitle, preview, unread, time }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', cursor: 'pointer',
        background: active ? 'rgba(138,107,31,0.10)' : 'transparent',
        borderLeft: `3px solid ${active ? C.gold : 'transparent'}`,
        borderBottom: `1px solid ${C.ruleSoft}`,
        transition: 'background 0.12s',
      }}
    >
      {avatar}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{
            flex: 1, minWidth: 0,
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 15, fontWeight: 500, color: C.ink,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </span>
          {time && (
            <span style={{ fontSize: 11, color: C.ink3, flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              {time}
            </span>
          )}
        </div>
        {subtitle && (
          <div style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic', fontSize: 12, color: C.gold,
            marginTop: 1,
          }}>
            {subtitle}
          </div>
        )}
        {preview && (
          <div style={{
            fontSize: 12, color: C.ink3, lineHeight: 1.4,
            marginTop: 4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {preview}
          </div>
        )}
        {unread > 0 && (
          <div style={{
            marginTop: 6,
            display: 'inline-flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold }} />
            <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', color: C.gold, textTransform: 'uppercase' }}>
              {unread} non lu{unread > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Composant : vue chat individuel (élève / parent)
   ═════════════════════════════════════════════════════════════════════════ */
function ChatView({ eleve, messages, text, setText, handleSend, handleKeyDown, sending, actionError, confirmDelete, setConfirmDelete, handleDeleteConversation, bottomRef }) {
  // Group messages by day for date separators
  const grouped = [];
  let lastDay = '';
  messages.forEach(m => {
    const day = m.created_at ? new Date(m.created_at).toDateString() : '';
    if (day !== lastDay) {
      grouped.push({ kind: 'sep', label: dayLabel(m.created_at), id: `sep-${day}` });
      lastDay = day;
    }
    grouped.push({ kind: 'msg', m });
  });

  return (
    <>
      {/* Header */}
      <div style={{
        padding: '16px 22px', borderBottom: `1px solid ${C.rule}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <EleveAvatar
          eleve={eleve}
          size={40}
          variant="enseignant"
          fallbackStyle={{
            background: C.ink, color: C.goldLight,
            fontWeight: 700, letterSpacing: '0.5px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 500, color: C.ink }}>
            {(eleve.nom || '').toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: C.gold, marginTop: 1 }}>
            {eleve.prenom} · {(eleve.classes?.nom || eleve.classe_nom || '').trim()} · parent
          </div>
        </div>
        {!confirmDelete ? (
          <>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 999,
                border: `1px solid ${C.rule}`, background: 'transparent',
                color: C.ink2, fontSize: 12.5, cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 500,
              }}
              title="Programmer un rendez-vous"
            >
              <IconCalendar />
              Programmer un rendez-vous
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              title="Effacer la conversation"
              style={{
                background: 'transparent', border: `1px solid ${C.rule}`,
                borderRadius: 999, padding: '7px 10px', cursor: 'pointer',
                color: C.ink3, display: 'inline-flex', alignItems: 'center',
              }}
            >
              <IconTrash />
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: C.ink3, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>Supprimer ?</span>
            <button onClick={handleDeleteConversation} style={{ padding: '6px 14px', borderRadius: 999, border: 'none', background: '#8B3A1F', color: C.paper, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Confirmer</button>
            <button onClick={() => setConfirmDelete(false)} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Annuler</button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'rgba(242,238,223,0.25)',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: C.ink3, fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14, marginTop: 60 }}>
            Aucun message avec cet élève.
          </div>
        )}
        {grouped.map((g) => {
          if (g.kind === 'sep') {
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 4px', justifyContent: 'center' }}>
                <span style={{ color: C.goldSoft, display: 'inline-flex' }}><Diamond size={6} /></span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
                  {g.label}
                </span>
                <span style={{ color: C.goldSoft, display: 'inline-flex' }}><Diamond size={6} /></span>
              </div>
            );
          }
          const m = g.m;
          const mine        = m.sender_role === 'enseignant';
          const isBroadcast = !!m.broadcast_id;
          if (isBroadcast) {
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '11px 16px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(138,107,31,0.08)',
                    border: `1px solid rgba(138,107,31,0.22)`,
                    color: C.ink, fontSize: 13.5, lineHeight: 1.55,
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: C.gold, marginBottom: 5, letterSpacing: '0.15em' }}>ANNONCE CLASSE</div>
                    {m.contenu}
                  </div>
                  <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>
                    {fmtTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  padding: '11px 16px',
                  borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: mine ? C.ink : C.paper,
                  color:      mine ? C.paper : C.ink,
                  border:     mine ? 'none' : `1px solid ${C.rule}`,
                  fontSize: 13.5, lineHeight: 1.55,
                }}>
                  {m.contenu}
                </div>
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>
                  {fmtDayShort(m.created_at) === 'hier' ? `hier · ${fmtTime(m.created_at)}` : fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {actionError && <p style={{ fontSize: 13, margin: '0 22px 4px', color: '#8B3A1F' }}>{actionError}</p>}
      <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.rule}`, display: 'flex', gap: 12, alignItems: 'center', background: C.paper }}>
        <button
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: C.ink3, padding: 8, display: 'inline-flex', borderRadius: 999,
          }}
          title="Joindre un fichier"
        >
          <IconClip />
        </button>
        <input
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 999,
            border: `1px solid ${C.rule}`, background: C.bg, color: C.ink,
            fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', fontStyle: 'italic',
          }}
          placeholder="Écrire une réponse…"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            padding: '11px 24px', borderRadius: 10, border: 'none',
            background: (!text.trim() || sending) ? C.rule : C.gold,
            color:      (!text.trim() || sending) ? C.ink3 : C.paper,
            fontSize: 13.5, fontWeight: 600,
            cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {sending ? 'Envoi…' : <>Envoyer <span style={{ fontSize: 16 }}>→</span></>}
        </button>
      </div>
    </>
  );
}

/* ═════════════════════════════════════════════════════════════════════════
   Composant : vue broadcast classe
   ═════════════════════════════════════════════════════════════════════════ */
function BroadcastView({
  classe, broadcasts,
  editingBroadcast, editText, setEditText, startEditBroadcast, saveEditBroadcast, cancelEditBroadcast,
  confirmDeleteBroadcast, setConfirmDeleteBroadcast, handleDeleteBroadcast,
  actionError, text, setText, handleSend, handleKeyDown, sending, bottomRef,
}) {
  return (
    <>
      <div style={{
        padding: '16px 22px', borderBottom: `1px solid ${C.rule}`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <InitialsAvatar text="DR" size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 500, color: C.ink }}>
            Direction
          </div>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: C.gold, marginTop: 1 }}>
            Annonce à la classe {classe.nom}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: 'rgba(242,238,223,0.25)',
      }}>
        {broadcasts.length === 0 && (
          <div style={{ textAlign: 'center', color: C.ink3, fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 14, marginTop: 60 }}>
            Aucune annonce envoyée à cette classe.
          </div>
        )}
        {broadcasts.map(m => {
          const isEditing = editingBroadcast?.broadcast_id === m.broadcast_id;
          const askDelete = confirmDeleteBroadcast === m.broadcast_id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '78%' }}>
                <div style={{
                  padding: '12px 16px', borderRadius: '14px 14px 14px 4px',
                  background: 'rgba(138,107,31,0.08)',
                  border: `1px solid rgba(138,107,31,0.22)`,
                  color: C.ink, fontSize: 13.5, lineHeight: 1.55,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.gold, letterSpacing: '0.15em' }}>
                      ANNONCE CLASSE
                    </span>
                    <div style={{ flex: 1 }} />
                    {!isEditing && !askDelete && (
                      <>
                        <button onClick={() => startEditBroadcast(m)} title="Modifier" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.ink3, padding: 4, borderRadius: 6, display: 'flex' }}>
                          <IconEdit />
                        </button>
                        <button onClick={() => setConfirmDeleteBroadcast(m.broadcast_id)} title="Supprimer" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.ink3, padding: 4, borderRadius: 6, display: 'flex' }}>
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value.slice(0, BROADCAST_MAX))}
                        rows={3} autoFocus
                        style={{
                          width: '100%', padding: '8px 10px', borderRadius: 10,
                          border: `1px solid ${C.gold}`, background: C.paper,
                          color: C.ink, fontSize: 13, outline: 'none',
                          resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                      {actionError && <div style={{ marginTop: 6, fontSize: 12, color: '#8B3A1F' }}>{actionError}</div>}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
                        <button onClick={cancelEditBroadcast} style={{ padding: '5px 14px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                        <button onClick={saveEditBroadcast} disabled={!editText.trim()} style={{ padding: '5px 14px', borderRadius: 999, border: 'none', fontSize: 12, fontWeight: 600, background: editText.trim() ? C.gold : C.rule, color: editText.trim() ? C.paper : C.ink3, cursor: editText.trim() ? 'pointer' : 'not-allowed' }}>Enregistrer</button>
                      </div>
                    </>
                  ) : (
                    <div>{m.contenu}</div>
                  )}
                </div>
                {askDelete && (
                  <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 10, background: 'rgba(139,58,31,0.08)', border: '1px solid rgba(139,58,31,0.3)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ flex: 1, color: C.ink, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>Supprimer cette annonce ?</span>
                    <button onClick={() => handleDeleteBroadcast(m.broadcast_id)} style={{ padding: '4px 12px', borderRadius: 999, border: 'none', background: '#8B3A1F', color: C.paper, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Confirmer</button>
                    <button onClick={() => setConfirmDeleteBroadcast(null)} style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.ink3, marginTop: 4, fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif" }}>
                  {fmtTime(m.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {actionError && !editingBroadcast && <p style={{ fontSize: 13, margin: '0 22px 4px', color: '#8B3A1F' }}>{actionError}</p>}
      <div style={{ padding: '14px 18px', borderTop: `1px solid ${C.rule}`, display: 'flex', gap: 12, alignItems: 'center', background: C.paper }}>
        <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.ink3, padding: 8, display: 'inline-flex', borderRadius: 999 }} title="Joindre un fichier">
          <IconClip />
        </button>
        <input
          style={{
            flex: 1, padding: '11px 16px', borderRadius: 999,
            border: `1px solid ${C.rule}`, background: C.bg, color: C.ink,
            fontSize: 13.5, outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', fontStyle: 'italic',
          }}
          placeholder={`Annoncer à la classe ${classe.nom}…`}
          value={text}
          onChange={e => setText(e.target.value.slice(0, BROADCAST_MAX))}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            padding: '11px 24px', borderRadius: 10, border: 'none',
            background: (!text.trim() || sending) ? C.rule : C.gold,
            color:      (!text.trim() || sending) ? C.ink3 : C.paper,
            fontSize: 13.5, fontWeight: 600,
            cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {sending ? 'Envoi…' : <>Envoyer <span style={{ fontSize: 16 }}>→</span></>}
        </button>
      </div>
    </>
  );
}
