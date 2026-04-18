import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getEleveUser, fetchEnseignantsDeLEleve, fetchChatMessages, sendChatMessage, markMessagesReadEleve, fetchUnreadCountParEnseignant, fetchEnseignantsPresence, fetchBroadcastsEleve, markBroadcastsReadEleve, fetchUnreadBroadcastsCount } from './supabasePortail';

const fmtPrenom = (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : '';
const fmtNom    = (s) => s ? s.trim().toUpperCase() : '';
const initiales = (prenom, nom) => `${(prenom||'')[0]||''}${(nom||'')[0]||''}`.toUpperCase();

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) + ' · ' +
         d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
}

function fmtDateLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

// Regroupe les messages par jour pour afficher les séparateurs de date
function groupByDay(messages) {
  const groups = [];
  let lastDay = null;
  messages.forEach(m => {
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDay) { groups.push({ type:'date', label: fmtDateLabel(m.created_at) }); lastDay = day; }
    groups.push({ type:'msg', msg: m });
  });
  return groups;
}

const IconSend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const AVATAR_COLORS = ['#5BA87A','#bf8a30','#7B68EE','#20B2AA','#CD853F','#6495ED'];
const avatarColor = (id) => AVATAR_COLORS[(id || '').charCodeAt(0) % AVATAR_COLORS.length];

const PRESENCE = {
  en_ligne:      { label: 'En ligne',       color: '#30d158' },
  reunion:       { label: 'En réunion',     color: '#ff9f0a' },
  non_joignable: { label: 'Pas joignable',  color: '#ff453a' },
  deconnecte:    { label: 'Déconnecté(e)', color: '#636366' },
};
const getPresence = (statut) => PRESENCE[statut] || PRESENCE['deconnecte'];

export default function PortailMessages() {
  const user = getEleveUser();
  const eleveId = user?.id;
  const eleveNom = `${fmtPrenom(user?.prenom||'')} ${fmtNom(user?.nom||'')}`.trim();
  const eleveInitiales = initiales(user?.prenom||'', user?.nom||'');

  const [enseignants, setEnseignants] = useState(null);
  const [selEns, setSelEns]           = useState(null);
  const [viewBroadcasts, setViewBroadcasts] = useState(false);
  const [broadcasts, setBroadcasts]   = useState([]);
  const [unreadBroadcasts, setUnreadBroadcasts] = useState(0);
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState('');
  const [sending, setSending]         = useState(false);
  const [sendError, setSendError]     = useState('');
  const [unreadMap, setUnreadMap]     = useState({});
  const [presenceMap, setPresenceMap] = useState({});
  const bottomRef                     = useRef(null);
  const pollRef                       = useRef(null);
  const textareaRef                   = useRef(null);

  useEffect(() => {
    if (!eleveId) return;
    fetchEnseignantsDeLEleve(eleveId).then(async (data) => {
      const list = data || [];
      setEnseignants(list);
      // Initialiser la presence depuis les données déjà chargées
      const pm = {};
      list.forEach(e => { pm[e.id] = e.statut_presence || 'deconnecte'; });
      setPresenceMap(pm);
      const map = {};
      await Promise.all(list.map(async ens => {
        map[ens.id] = await fetchUnreadCountParEnseignant(eleveId, ens.id).catch(() => 0);
      }));
      setUnreadMap(map);
    }).catch(() => setEnseignants([]));
    fetchUnreadBroadcastsCount(eleveId).then(setUnreadBroadcasts).catch(() => {});
  }, [eleveId]);

  const loadBroadcasts = useCallback(async () => {
    if (!eleveId) return;
    try {
      const bs = await fetchBroadcastsEleve(eleveId);
      setBroadcasts(bs || []);
      if (viewBroadcasts) {
        await markBroadcastsReadEleve(eleveId);
        setUnreadBroadcasts(0);
      } else {
        setUnreadBroadcasts(await fetchUnreadBroadcastsCount(eleveId).catch(() => 0));
      }
    } catch {}
  }, [eleveId, viewBroadcasts]);

  useEffect(() => {
    if (!viewBroadcasts) return;
    loadBroadcasts();
    const t = setInterval(loadBroadcasts, 10000);
    return () => clearInterval(t);
  }, [viewBroadcasts, loadBroadcasts]);

  // Poll présence toutes les 30s
  useEffect(() => {
    if (!enseignants?.length) return;
    const ids = enseignants.map(e => e.id);
    const refresh = () => fetchEnseignantsPresence(ids).then(pm => setPresenceMap(pm)).catch(() => {});
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [enseignants]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!eleveId || !selEns) return;
    try {
      const msgs = await fetchChatMessages(eleveId, selEns.id);
      setMessages((msgs || []).filter(m => !m.broadcast_id));
      await markMessagesReadEleve(eleveId, selEns.id);
      setUnreadMap(prev => ({ ...prev, [selEns.id]: 0 }));
    } catch {}
  }, [eleveId, selEns]);

  useEffect(() => {
    if (!selEns) return;
    loadMessages();
    pollRef.current = setInterval(loadMessages, 5000);
    return () => clearInterval(pollRef.current);
  }, [selEns, loadMessages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !selEns) return;
    setSending(true);
    setSendError('');
    try {
      await sendChatMessage(eleveId, selEns.id, text.trim(), 'eleve');
      setText('');
      await loadMessages();
      textareaRef.current?.focus();
    } catch {
      setSendError('Message non envoyé. Vérifiez votre connexion.');
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!eleveId) return (
    <div className="flex flex-col items-center justify-center gap-3 text-p-fg-light" style={{ height:300 }}>
      <span className="text-[40px]">🔒</span><span>Non connecté</span>
    </div>
  );

  if (enseignants === null) return (
    <div className="flex items-center justify-center text-p-fg-light" style={{ height:300 }}>
      Chargement…
    </div>
  );

  const grouped = groupByDay(messages);
  const hasSelection = !!selEns || viewBroadcasts;
  const handleBack = () => { setSelEns(null); setViewBroadcasts(false); };

  return (
    <div
      className={`portail-msg-layout${hasSelection ? ' has-selection' : ''}`}
      style={{
        display:'flex', overflow:'hidden', height:'calc(100vh - 160px)',
        borderRadius:16, border:'1px solid var(--p-border)',
        background:'var(--p-bg-card)', boxShadow:'0 4px 32px rgba(0,0,0,.07)',
      }}
    >

      {/* ── Colonne gauche ── */}
      <div
        className="portail-msg-sidebar"
        style={{ width:270, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid var(--p-border)' }}
      >
        {/* En-tête sidebar */}
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--p-border)' }}>
          <div style={{ fontFamily:'var(--p-font-display)', fontSize:16, fontWeight:800, color:'var(--p-fg)', marginBottom:2 }}>Messages</div>
          <div style={{ fontSize:12, color:'var(--p-fg-light)' }}>Contacte ton professeur</div>
        </div>

        {/* Liste enseignants */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {/* Annonces épinglées */}
          <div
            onClick={() => { setViewBroadcasts(true); setSelEns(null); }}
            style={{
              display:'flex', alignItems:'center', gap:12, cursor:'pointer',
              padding:'13px 16px', borderBottom:'1px solid var(--p-border)',
              borderLeft: viewBroadcasts ? '3px solid var(--p-gold)' : '3px solid transparent',
              background: viewBroadcasts ? 'rgba(191,138,48,.08)' : 'transparent',
              transition:'background .15s',
            }}
          >
            <div style={{
              width:42, height:42, borderRadius:'50%', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
              background:'linear-gradient(135deg, var(--p-gold) 0%, #d4a043 100%)',
              boxShadow:'0 2px 8px rgba(191,138,48,.35)',
            }}>📢</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--p-fg)' }}>
                Annonces
                <span style={{ fontSize:9, fontWeight:800, color:'var(--p-gold)', border:'1px solid var(--p-gold)', borderRadius:3, padding:'1px 4px', letterSpacing:.5 }}>ÉPINGLÉ</span>
              </div>
              <div style={{ fontSize:11, color:'var(--p-fg-light)', marginTop:1 }}>Communiqués officiels</div>
            </div>
            {unreadBroadcasts > 0 && (
              <span style={{ background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:800, borderRadius:20, padding:'2px 8px', flexShrink:0 }}>
                {unreadBroadcasts}
              </span>
            )}
          </div>

          {enseignants.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 18px', color:'var(--p-fg-light)', fontSize:13, lineHeight:1.6 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🎓</div>
              Aucun enseignant assigné à ta classe.
            </div>
          )}
          {enseignants.map(ens => {
            const unread   = unreadMap[ens.id] || 0;
            const active   = selEns?.id === ens.id;
            const color    = avatarColor(ens.id);
            const presence = getPresence(presenceMap[ens.id]);
            return (
              <div
                key={ens.id}
                onClick={() => { setSelEns(ens); setViewBroadcasts(false); }}
                style={{
                  display:'flex', alignItems:'center', gap:12, cursor:'pointer',
                  padding:'13px 16px', borderBottom:'1px solid var(--p-border)',
                  borderLeft: active ? '3px solid var(--p-green, #5BA87A)' : '3px solid transparent',
                  background: active ? 'rgba(91,168,122,.08)' : 'transparent',
                  transition:'background .15s',
                }}
              >
                <div style={{ position:'relative', flexShrink:0 }}>
                  <div style={{
                    width:42, height:42, borderRadius:'50%', color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:15, fontWeight:700,
                    background:`linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
                    boxShadow:`0 2px 8px ${color}44`,
                  }}>
                    {initiales(ens.prenom, ens.nom)}
                  </div>
                  <div style={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', background:presence.color, border:'2px solid var(--p-bg-card)' }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--p-fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {fmtPrenom(ens.prenom)} {fmtNom(ens.nom)}
                  </div>
                  <div style={{ fontSize:11, marginTop:2, fontWeight:600, color:presence.color }}>● {presence.label}</div>
                </div>
                {unread > 0 && (
                  <span style={{ background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:800, borderRadius:20, padding:'2px 8px', flexShrink:0, boxShadow:'0 2px 6px rgba(191,138,48,.4)' }}>
                    {unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Zone chat ── */}
      <div className="portail-msg-chat" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {viewBroadcasts ? (
          <>
            {/* En-tête officiel */}
            <div className="relative flex items-center gap-3.5 overflow-hidden" style={{
              padding:'18px 24px 16px',
              borderBottom:'2px solid var(--p-gold)',
              background:'linear-gradient(180deg, #faf4e6 0%, #f6ecd5 100%)',
            }}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{
                backgroundImage:'repeating-linear-gradient(-45deg, var(--p-gold) 0 10px, #e8c36b 10px 20px)',
                opacity:.9,
              }} />
              <button className="portail-msg-back hidden items-center justify-center w-[34px] h-[34px] rounded-lg cursor-pointer shrink-0 mt-1.5" onClick={handleBack} aria-label="Retour" style={{ background:'rgba(255,255,255,.6)', border:'1px solid var(--p-gold)', color:'#6b5220' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div className="mt-1.5 w-[52px] h-[52px] rounded-full text-white flex items-center justify-center text-[22px] shrink-0" style={{
                background:'radial-gradient(circle at 30% 28%, #e8c36b, #bf8a30 68%)',
                boxShadow:'0 4px 14px rgba(191,138,48,.45), inset 0 -3px 6px rgba(0,0,0,.18)',
                border:'2px solid #fffaf0',
              }}>📢</div>
              <div className="mt-1.5 min-w-0">
                <div style={{
                  fontFamily:'"Playfair Display", "Cormorant Garamond", Georgia, serif',
                  fontSize:24, fontWeight:800, color:'#2d2008',
                  letterSpacing:0.3, lineHeight:1.05,
                }}>
                  Tableau d'annonces
                </div>
                <div className="flex items-center gap-2 uppercase mt-1.5" style={{
                  fontSize:10.5, fontWeight:700, letterSpacing:2.8,
                  color:'#8a6a28',
                }}>
                  <span className="w-4 h-px" style={{ background:'#8a6a28' }} />
                  Communiqués officiels · de tes professeurs
                </div>
              </div>
            </div>

            {/* Liste des communiqués */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-6" style={{
              padding:'28px 32px 36px',
              backgroundImage:`
                radial-gradient(ellipse at top, rgba(191,138,48,.06), transparent 55%),
                repeating-linear-gradient(0deg, rgba(191,138,48,.035) 0 1px, transparent 1px 30px)
              `,
              backgroundColor:'#fbf7ee',
            }}>
              {broadcasts.length === 0 ? (
                <div className="text-center mt-[70px]">
                  <div className="inline-block" style={{
                    padding:'26px 34px',
                    background:'#fffdf7',
                    border:'1px dashed var(--p-gold)',
                    fontFamily:'"Playfair Display", Georgia, serif',
                    fontStyle:'italic', fontSize:17, color:'#6b5220',
                    transform:'rotate(-1.4deg)',
                    boxShadow:'0 10px 28px rgba(58,42,16,.12)',
                  }}>
                    « Aucun communiqué à afficher pour le moment. »
                  </div>
                </div>
              ) : broadcasts.map((b, idx) => {
                const ens = b.enseignants || {};
                const num = String(broadcasts.length - idx).padStart(3, '0');
                const d = new Date(b.created_at);
                const day = d.getDate();
                const month = d.toLocaleDateString('fr-FR', { month:'short' }).toUpperCase().replace(/\./g,'');
                const year = d.getFullYear();
                const time = d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
                return (
                  <article key={b.id} className="relative overflow-hidden" style={{
                    background:'#fffdf7',
                    border:'1px solid rgba(191,138,48,.35)',
                    boxShadow:'0 14px 32px rgba(58,42,16,.08), 0 2px 0 #f3e6c6',
                  }}>
                    {/* Ruban à rayures */}
                    <div className="h-2.5" style={{
                      backgroundImage:'repeating-linear-gradient(-45deg, var(--p-gold) 0 8px, #e8c36b 8px 16px)',
                    }} />

                    {/* En-tête : date + numéro + sceau */}
                    <header className="flex items-stretch" style={{ borderBottom:'1px solid rgba(191,138,48,.22)' }}>
                      <div className="w-[92px] shrink-0 text-center flex flex-col items-center justify-center" style={{
                        background:'linear-gradient(180deg, #3a2a10 0%, #5b4218 100%)',
                        color:'#f6dea0',
                        padding:'14px 8px',
                        fontFamily:'"Playfair Display", Georgia, serif',
                        borderRight:'1px solid rgba(191,138,48,.25)',
                      }}>
                        <div style={{ fontSize:10, letterSpacing:2.5, fontWeight:700, opacity:.8 }}>{month}</div>
                        <div className="font-extrabold leading-none my-1" style={{ fontSize:34 }}>{day}</div>
                        <div style={{ fontSize:10, letterSpacing:2.5, opacity:.8 }}>{year}</div>
                      </div>
                      <div className="flex-1 min-w-0" style={{ padding:'14px 20px' }}>
                        <div className="flex items-center gap-2.5 flex-wrap uppercase" style={{
                          fontSize:10, letterSpacing:3, fontWeight:800,
                          color:'var(--p-gold)', textTransform:'uppercase',
                        }}>
                          <span>Communiqué N° {num}</span>
                          <span className="w-1 h-1 rounded-full bg-p-gold" />
                          <span style={{ color:'#8a6a28' }}>{time}</span>
                        </div>
                        <div className="mt-1.5" style={{
                          fontFamily:'"Playfair Display", Georgia, serif',
                          fontSize:20, fontWeight:700, color:'#2d2008', lineHeight:1.22,
                        }}>
                          À l'attention de la classe
                        </div>
                      </div>
                      <div className="w-[78px] shrink-0 flex items-center justify-center px-3">
                        <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-center uppercase leading-tight" style={{
                          background:'radial-gradient(circle at 35% 32%, #d18642, #8a3c14 75%)',
                          color:'#fbe8c2',
                          fontSize:9, fontWeight:800, letterSpacing:.6,
                          border:'2px solid #fbe8c2',
                          boxShadow:'0 3px 10px rgba(138,60,20,.35), inset 0 -2px 5px rgba(0,0,0,.28)',
                          transform:'rotate(-8deg)',
                          fontFamily:'"Playfair Display", Georgia, serif',
                        }}>
                          As-<br/>Safaa
                        </div>
                      </div>
                    </header>

                    {/* Corps du communiqué */}
                    <div className="relative" style={{ padding:'24px 32px 14px' }}>
                      <div className="absolute select-none pointer-events-none" style={{
                        left:14, top:4,
                        fontFamily:'"Playfair Display", Georgia, serif',
                        fontSize:76, color:'rgba(191,138,48,.18)',
                        lineHeight:0.8,
                      }}>"</div>
                      <div className="break-words whitespace-pre-wrap" style={{
                        fontFamily:'"Playfair Display", "Cormorant Garamond", Georgia, serif',
                        fontSize:17.5, color:'#2d2008', lineHeight:1.7,
                        padding:'0 4px 0 34px',
                      }}>
                        {b.contenu}
                      </div>
                    </div>

                    {/* Signature */}
                    <footer className="flex items-center justify-end gap-3 flex-wrap" style={{
                      padding:'12px 28px 18px',
                      borderTop:'1px dashed rgba(191,138,48,.28)',
                    }}>
                      <span className="uppercase font-bold" style={{ fontSize:10.5, letterSpacing:2.4, color:'#8a6a28' }}>
                        Transmis par
                      </span>
                      <span className="font-bold italic" style={{
                        fontFamily:'"Playfair Display", Georgia, serif',
                        fontSize:17, color:'#2d2008',
                      }}>
                        {fmtPrenom(ens.prenom) || '—'} {fmtNom(ens.nom)}
                      </span>
                    </footer>
                  </article>
                );
              })}
            </div>

            {/* Pied officiel */}
            <div className="flex items-center justify-center gap-3 text-center uppercase font-bold" style={{
              padding:'10px 20px',
              borderTop:'1px solid var(--p-gold)',
              background:'linear-gradient(180deg, #faf4e6 0%, #f6ecd5 100%)',
              fontSize:10.5, letterSpacing:2.8,
              color:'#8a6a28',
            }}>
              <span className="w-6 h-px" style={{ background:'#8a6a28' }} />
              Lecture seule · Panneau officiel
              <span className="w-6 h-px" style={{ background:'#8a6a28' }} />
            </div>
          </>
        ) : !selEns ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:32, color:'var(--p-fg-light)' }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--p-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:30 }}>💬</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--p-fg)', fontFamily:'var(--p-font-display)' }}>Tes messages</div>
            <div style={{ fontSize:13, textAlign:'center', maxWidth:240, lineHeight:1.6 }}>
              Sélectionne un enseignant à gauche pour démarrer une conversation.
            </div>
          </div>
        ) : (
          <>
            {/* Header chat */}
            {(() => {
              const presence = getPresence(presenceMap[selEns.id]);
              const color = avatarColor(selEns.id);
              return (
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'1px solid var(--p-border)', background:'var(--p-bg-card)' }}>
                  <button
                    className="portail-msg-back"
                    onClick={handleBack} aria-label="Retour"
                    style={{ display:'none', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:10, border:'1px solid var(--p-border)', background:'transparent', color:'var(--p-fg-mid)', cursor:'pointer', flexShrink:0 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:42, height:42, borderRadius:'50%', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, background:`linear-gradient(135deg, ${color} 0%, ${color}bb 100%)` }}>
                      {initiales(selEns.prenom, selEns.nom)}
                    </div>
                    <div style={{ position:'absolute', bottom:1, right:1, width:11, height:11, borderRadius:'50%', background:presence.color, border:'2px solid var(--p-bg-card)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:'var(--p-fg)' }}>{fmtPrenom(selEns.prenom)} {fmtNom(selEns.nom)}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:presence.color, marginTop:2 }}>● {presence.label}</div>
                  </div>
                </div>
              );
            })()}

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:4, padding:'20px 20px 8px', background:'var(--p-bg)' }}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--p-fg-light)', fontSize:13, marginTop:60, lineHeight:1.7 }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>👋</div>
                  Aucun message pour l'instant.<br/>Envoie le premier message à ton professeur !
                </div>
              )}
              {grouped.map((item, i) => {
                if (item.type === 'date') return (
                  <div key={`d-${i}`} style={{ display:'flex', alignItems:'center', gap:10, margin:'12px 0 8px' }}>
                    <div style={{ flex:1, height:1, background:'var(--p-border)' }} />
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--p-fg-light)', whiteSpace:'nowrap', padding:'0 4px' }}>{item.label}</span>
                    <div style={{ flex:1, height:1, background:'var(--p-border)' }} />
                  </div>
                );
                const m = item.msg;
                const mine = m.sender_role === 'eleve';
                return (
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', marginBottom:2, alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {!mine && (
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--p-fg-light)', marginBottom:3, marginLeft:42 }}>
                        {fmtPrenom(selEns.prenom)}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'flex-end', gap:8, flexDirection: mine ? 'row-reverse' : 'row' }}>
                      <div style={{
                        width:32, height:32, borderRadius:'50%', color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:11, fontWeight:700, flexShrink:0,
                        background: mine ? 'linear-gradient(135deg, var(--p-gold) 0%, #d4a043 100%)' : `linear-gradient(135deg, ${avatarColor(selEns.id)} 0%, ${avatarColor(selEns.id)}bb 100%)`,
                      }}>
                        {mine ? eleveInitiales : initiales(selEns.prenom, selEns.nom)}
                      </div>
                      <div style={{ maxWidth:'62%' }}>
                        <div style={{
                          fontSize:14, lineHeight:1.55, wordBreak:'break-word',
                          padding:'10px 14px',
                          borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: mine ? 'linear-gradient(135deg, var(--p-gold) 0%, #c89030 100%)' : 'var(--p-bg-card)',
                          color: mine ? '#fff' : 'var(--p-fg)',
                          border: mine ? 'none' : '1px solid var(--p-border)',
                          boxShadow: mine ? '0 3px 10px rgba(191,138,48,.25)' : '0 1px 4px rgba(0,0,0,.05)',
                        }}>
                          {m.contenu}
                        </div>
                        <div style={{ fontSize:11, color:'var(--p-fg-light)', marginTop:4, textAlign: mine ? 'right' : 'left', padding:'0 2px' }}>
                          {fmtTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Zone de saisie */}
            <div style={{ borderTop:'1px solid var(--p-border)', background:'var(--p-bg-card)', padding:'12px 16px' }}>
              {sendError && (
                <div style={{ marginBottom:8, padding:'8px 12px', borderRadius:10, background:'rgba(255,69,58,0.08)', border:'1px solid rgba(255,69,58,0.25)', color:'var(--p-red)', fontSize:12 }}>
                  {sendError}
                </div>
              )}
              <div style={{ display:'flex', alignItems:'flex-end', gap:10, background:'var(--p-bg)', borderRadius:24, border:'1px solid var(--p-border)', padding:'6px 6px 6px 16px' }}>
                <textarea
                  ref={textareaRef}
                  placeholder="Écris ton message… (Entrée pour envoyer)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{
                    flex:1, background:'transparent', border:'none', outline:'none',
                    resize:'none', fontSize:14, color:'var(--p-fg)', lineHeight:1.5,
                    fontFamily:'inherit', maxHeight:100, padding:'4px 0', minHeight:24,
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  style={{
                    width:38, height:38, borderRadius:'50%', border:'none', flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: (!text.trim() || sending) ? 'var(--p-border)' : 'linear-gradient(135deg, var(--p-gold) 0%, #c89030 100%)',
                    color: (!text.trim() || sending) ? 'var(--p-fg-light)' : '#fff',
                    cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
                    boxShadow: (!text.trim() || sending) ? 'none' : '0 3px 10px rgba(191,138,48,.35)',
                    transition:'all .2s',
                  }}
                >
                  {sending
                    ? <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid currentColor', borderTopColor:'transparent', animation:'spin .7s linear infinite' }} />
                    : <IconSend />
                  }
                </button>
              </div>
              <div style={{ fontSize:11, color:'var(--p-fg-light)', marginTop:6, textAlign:'center' }}>
                Maj+Entrée pour aller à la ligne
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
