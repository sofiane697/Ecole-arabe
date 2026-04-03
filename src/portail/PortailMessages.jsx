import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getEleveUser, fetchEnseignantsDeLEleve, fetchChatMessages, sendChatMessage, markMessagesReadEleve, fetchUnreadCountParEnseignant } from './supabasePortail';

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

export default function PortailMessages() {
  const user = getEleveUser();
  const eleveId = user?.id;
  const eleveNom = `${fmtPrenom(user?.prenom||'')} ${fmtNom(user?.nom||'')}`.trim();
  const eleveInitiales = initiales(user?.prenom||'', user?.nom||'');

  const [enseignants, setEnseignants] = useState(null);
  const [selEns, setSelEns]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [text, setText]               = useState('');
  const [sending, setSending]         = useState(false);
  const [unreadMap, setUnreadMap]     = useState({});
  const bottomRef                     = useRef(null);
  const pollRef                       = useRef(null);
  const textareaRef                   = useRef(null);

  useEffect(() => {
    if (!eleveId) return;
    fetchEnseignantsDeLEleve(eleveId).then(async (data) => {
      const list = data || [];
      setEnseignants(list);
      const map = {};
      await Promise.all(list.map(async ens => {
        map[ens.id] = await fetchUnreadCountParEnseignant(eleveId, ens.id).catch(() => 0);
      }));
      setUnreadMap(map);
    }).catch(() => setEnseignants([]));
  }, [eleveId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!eleveId || !selEns) return;
    try {
      const msgs = await fetchChatMessages(eleveId, selEns.id);
      setMessages(msgs || []);
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
    try {
      await sendChatMessage(eleveId, selEns.id, text.trim(), 'eleve');
      setText('');
      await loadMessages();
      textareaRef.current?.focus();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!eleveId) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:12, color:'var(--p-fg-light)' }}>
      <span style={{ fontSize:40 }}>🔒</span><span>Non connecté</span>
    </div>
  );

  if (enseignants === null) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--p-fg-light)' }}>
      Chargement…
    </div>
  );

  const grouped = groupByDay(messages);

  return (
    <div style={{ display:'flex', height:'calc(100vh - 160px)', overflow:'hidden', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', background:'var(--p-bg-card)', boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>

      {/* ── Colonne gauche ── */}
      <div style={{ width:270, flexShrink:0, borderRight:'1px solid var(--p-border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* En-tête sidebar */}
        <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid var(--p-border)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--p-fg)', marginBottom:2 }}>Messages</div>
          <div style={{ fontSize:12, color:'var(--p-fg-light)' }}>Contacte ton professeur</div>
        </div>

        {/* Liste enseignants */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {enseignants.length === 0 && (
            <div style={{ padding:'32px 18px', textAlign:'center', color:'var(--p-fg-light)', fontSize:13, lineHeight:1.7 }}>
              <div style={{ fontSize:32, marginBottom:10 }}>🎓</div>
              Aucun enseignant assigné à ta classe pour le moment.
            </div>
          )}
          {enseignants.map(ens => {
            const unread = unreadMap[ens.id] || 0;
            const active = selEns?.id === ens.id;
            const color  = avatarColor(ens.id);
            return (
              <div
                key={ens.id}
                onClick={() => setSelEns(ens)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'13px 16px',
                  cursor:'pointer', borderBottom:'1px solid var(--p-border)',
                  background: active
                    ? 'linear-gradient(90deg, rgba(91,168,122,.15) 0%, rgba(91,168,122,.04) 100%)'
                    : 'transparent',
                  borderLeft: active ? '3px solid var(--p-green, #5BA87A)' : '3px solid transparent',
                  transition:'all .15s',
                }}
              >
                <div style={{ width:42, height:42, borderRadius:'50%', background:`linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, flexShrink:0, boxShadow:`0 2px 8px ${color}44` }}>
                  {initiales(ens.prenom, ens.nom)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--p-fg)' }}>{fmtPrenom(ens.prenom)} {fmtNom(ens.nom)}</div>
                  <div style={{ fontSize:12, color:'var(--p-fg-light)', marginTop:1 }}>Enseignant</div>
                </div>
                {unread > 0 && (
                  <span style={{ background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:800, padding:'2px 8px', borderRadius:20, flexShrink:0, boxShadow:'0 1px 4px rgba(191,138,48,.4)' }}>
                    {unread}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Zone chat ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!selEns ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, color:'var(--p-fg-light)', padding:32 }}>
            <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--p-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>💬</div>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--p-fg)' }}>Tes messages</div>
            <div style={{ fontSize:13, textAlign:'center', maxWidth:240, lineHeight:1.6 }}>
              Sélectionne un enseignant à gauche pour démarrer ou voir une conversation.
            </div>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--p-border)', display:'flex', alignItems:'center', gap:12, background:'var(--p-bg-card)' }}>
              <div style={{ position:'relative' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg, ${avatarColor(selEns.id)} 0%, ${avatarColor(selEns.id)}bb 100%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700 }}>
                  {initiales(selEns.prenom, selEns.nom)}
                </div>
                <div style={{ position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%', background:'#30d158', border:'2px solid var(--p-bg-card)' }} />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--p-fg)' }}>{fmtPrenom(selEns.prenom)} {fmtNom(selEns.nom)}</div>
                <div style={{ fontSize:12, color:'var(--p-green, #5BA87A)', fontWeight:500 }}>En ligne</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 20px 8px', display:'flex', flexDirection:'column', gap:4, background:`var(--p-bg)` }}>
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
                  <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: mine ? 'flex-end' : 'flex-start', marginBottom:2 }}>
                    {/* Nom expéditeur si message du prof */}
                    {!mine && (
                      <div style={{ fontSize:11, fontWeight:600, color:'var(--p-fg-light)', marginBottom:3, marginLeft:44 }}>
                        {fmtPrenom(selEns.prenom)}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'flex-end', gap:8, flexDirection: mine ? 'row-reverse' : 'row' }}>
                      {/* Avatar */}
                      <div style={{ width:32, height:32, borderRadius:'50%', background: mine ? `linear-gradient(135deg, var(--p-gold) 0%, #d4a043 100%)` : `linear-gradient(135deg, ${avatarColor(selEns.id)} 0%, ${avatarColor(selEns.id)}bb 100%)`, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                        {mine ? eleveInitiales : initiales(selEns.prenom, selEns.nom)}
                      </div>
                      <div style={{ maxWidth:'62%' }}>
                        <div style={{
                          padding:'10px 14px',
                          borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: mine ? 'linear-gradient(135deg, var(--p-gold) 0%, #d4a043 100%)' : 'var(--p-bg-card)',
                          color: mine ? '#fff' : 'var(--p-fg)',
                          fontSize:14, lineHeight:1.55, wordBreak:'break-word',
                          border: mine ? 'none' : '1px solid var(--p-border)',
                          boxShadow: mine ? '0 2px 8px rgba(191,138,48,.25)' : '0 1px 3px rgba(0,0,0,.06)',
                        }}>
                          {m.contenu}
                        </div>
                        <div style={{ fontSize:11, color:'var(--p-fg-light)', marginTop:4, textAlign: mine ? 'right' : 'left', paddingLeft: mine ? 0 : 2, paddingRight: mine ? 2 : 0 }}>
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
            <div style={{ padding:'12px 16px', borderTop:'1px solid var(--p-border)', background:'var(--p-bg-card)' }}>
              <div style={{ display:'flex', alignItems:'flex-end', gap:10, background:'var(--p-bg)', borderRadius:24, border:'1px solid var(--p-border)', padding:'6px 6px 6px 16px', transition:'border-color .2s' }}>
                <textarea
                  ref={textareaRef}
                  placeholder="Écris ton message… (Entrée pour envoyer)"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  style={{ flex:1, background:'none', border:'none', outline:'none', resize:'none', fontSize:14, color:'var(--p-fg)', fontFamily:'inherit', lineHeight:1.5, maxHeight:100, padding:'4px 0', minHeight:24 }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  style={{
                    width:38, height:38, borderRadius:'50%', border:'none', flexShrink:0,
                    background: (!text.trim() || sending) ? 'var(--p-border)' : 'linear-gradient(135deg, var(--p-gold) 0%, #d4a043 100%)',
                    color: (!text.trim() || sending) ? 'var(--p-fg-light)' : '#fff',
                    cursor: (!text.trim() || sending) ? 'not-allowed' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .2s', boxShadow: (!text.trim() || sending) ? 'none' : '0 2px 8px rgba(191,138,48,.35)',
                  }}
                >
                  {sending
                    ? <div style={{ width:14, height:14, border:'2px solid currentColor', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
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
