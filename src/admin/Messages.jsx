import React, { useState, useEffect } from 'react';
import { fetchMessages, updateMessageLu, deleteMessage } from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence, panelVariants } from '../animations';

const COURS = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];
const PAGE_SIZE = 25;

const IconReply = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
  </svg>
);

const IconMail = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const IconBook = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const COURSE_COLORS = {
  'Débutant':     { bg: 'rgba(48,209,88,.12)',  color: '#30d158' },
  'Intermédiaire':{ bg: 'rgba(10,132,255,.12)', color: '#0a84ff' },
  'Avancé':       { bg: 'rgba(191,138,48,.12)', color: '#bf8a30' },
  'Lecture':      { bg: 'rgba(94,92,230,.12)',  color: '#5e5ce6' },
  'Renseignement':{ bg: 'rgba(152,152,157,.12)',color: '#98989d' },
};

function getCourseStyle(cours) {
  if (!cours) return COURSE_COLORS['Renseignement'];
  for (const [key, style] of Object.entries(COURSE_COLORS)) {
    if (cours.includes(key)) return style;
  }
  return COURSE_COLORS['Renseignement'];
}

function getCoursLabel(cours) {
  if (!cours) return 'Renseignement';
  return cours.split('—')[0].trim();
}

export default function Messages() {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtreLu,    setFiltreLu]    = useState('tous');
  const [filtreCours, setFiltreCours] = useState('tous');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [selected,    setSelected]    = useState(null);
  const [confirm,     setConfirm]     = useState(null);

  useEffect(() => {
    fetchMessages()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayCount = data.filter(m => {
    const d = new Date(m.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const nonLus = data.filter(m => !m.lu).length;

  const filtered = data.filter(m => {
    const okLu    = filtreLu    === 'tous' || (filtreLu === 'nonlu' ? !m.lu : m.lu);
    const okCours = filtreCours === 'tous' || m.cours === filtreCours;
    const q = search.toLowerCase();
    const okSearch = !q || `${m.prenom} ${m.nom}`.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
    return okLu && okCours && okSearch;
  });

  const toggleLu = async (id) => {
    const msg = data.find(m => m.id === id);
    if (!msg) return;
    const newLu = !msg.lu;
    setData(prev => prev.map(m => m.id === id ? { ...m, lu: newLu } : m));
    if (selected?.id === id) setSelected(prev => ({ ...prev, lu: newLu }));
    try {
      await updateMessageLu(id, newLu);
    } catch {
      setData(prev => prev.map(m => m.id === id ? { ...m, lu: !newLu } : m));
    }
  };

  const handleSelect = async (msg) => {
    setSelected(msg);
    if (!msg.lu) {
      setData(prev => prev.map(m => m.id === msg.id ? { ...m, lu: true } : m));
      setSelected({ ...msg, lu: true });
      try { await updateMessageLu(msg.id, true); } catch {}
    }
  };

  const handleDelete = (msg) => {
    setConfirm({
      title: 'Supprimer ce message ?',
      message: <span>Le message de <strong>{msg.prenom} {msg.nom}</strong> sera supprimé définitivement.</span>,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteMessage(msg.id);
          setData(prev => prev.filter(m => m.id !== msg.id));
          if (selected?.id === msg.id) setSelected(null);
        } catch(e) { alert(e.message); }
      },
    });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatFullDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getInitials = (prenom, nom) =>
    `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'4rem', color:'var(--a-fg-light)' }}>
        Chargement des messages...
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-subtitle">
            {nonLus > 0
              ? `${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}`
              : 'Tous les messages ont été lus'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[
          { label:'Total',    value: data.length,  color:'var(--a-fg-mid)' },
          { label:'Non lus',  value: nonLus,        color: nonLus > 0 ? 'var(--a-red)' : 'var(--a-fg-mid)' },
          { label:"Aujourd'hui", value: todayCount, color: todayCount > 0 ? 'var(--a-gold)' : 'var(--a-fg-mid)' },
        ].map(s => (
          <div key={s.label} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'8px 16px', borderRadius:980,
            background:'var(--a-bg-card)', border:'1px solid var(--a-border)',
            fontSize:12,
          }}>
            <span style={{ fontSize:18, fontWeight:700, color:s.color, lineHeight:1 }}>{s.value}</span>
            <span style={{ color:'var(--a-fg-light)', fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="msg-filters">
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', flex:1 }}>
          <div className="msg-filter-tabs">
            {[
              { key: 'tous',  label: 'Tous',     count: data.length },
              { key: 'nonlu', label: 'Non lus',  count: nonLus },
              { key: 'lu',    label: 'Lus',      count: data.length - nonLus },
            ].map(f => (
              <button
                key={f.key}
                className={`msg-filter-tab ${filtreLu === f.key ? 'active' : ''}`}
                onClick={() => { setFiltreLu(f.key); setPage(0); }}
              >
                {f.label}
                <span className="msg-filter-tab-count">{f.count}</span>
              </button>
            ))}
          </div>
          <select className="admin-filter-select" value={filtreCours} onChange={e => { setFiltreCours(e.target.value); setPage(0); }}
            style={{ maxWidth:220 }}>
            <option value="tous">Tous les cours</option>
            {COURS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Recherche */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--a-fg-light)', pointerEvents:'none', display:'flex' }}>
            <IconSearch />
          </span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
            style={{
              paddingLeft:32, paddingRight:12, paddingTop:7, paddingBottom:7,
              border:'1px solid var(--a-border)', borderRadius:980,
              background:'var(--a-bg-card)', color:'var(--a-fg)',
              fontSize:12, outline:'none', width:180, boxSizing:'border-box',
              fontFamily:'inherit',
            }}
          />
        </div>
      </div>

      {/* Layout liste + panneau */}
      <div className="msg-layout">

        {/* Liste des messages */}
        <div className="msg-list">
          {filtered.length === 0 ? (
            <div className="msg-empty">
              <IconMail />
              <p>{search ? `Aucun résultat pour « ${search} »` : 'Aucun message trouvé'}</p>
            </div>
          ) : (() => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            const safePage   = Math.min(page, totalPages - 1);
            const paginated  = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
            return (<>{paginated.map(m => {
            const cStyle = getCourseStyle(m.cours);
            return (
              <div
                key={m.id}
                className={`msg-item ${!m.lu ? 'unread' : ''} ${selected?.id === m.id ? 'selected' : ''}`}
                onClick={() => handleSelect(m)}
              >
                <div className="msg-item-avatar">
                  {getInitials(m.prenom, m.nom)}
                  {!m.lu && <span className="msg-item-dot" />}
                </div>
                <div className="msg-item-content">
                  <div className="msg-item-top">
                    <span className="msg-item-name">{m.prenom} {m.nom}</span>
                    <span className="msg-item-time" title={formatFullDate(m.created_at)}>{formatDate(m.created_at)}</span>
                  </div>
                  <div style={{ marginBottom:'0.25rem' }}>
                    <span style={{
                      display:'inline-block', fontSize:'0.68rem', fontWeight:600,
                      padding:'2px 8px', borderRadius:980,
                      background: cStyle.bg, color: cStyle.color,
                    }}>
                      {getCoursLabel(m.cours)}
                    </span>
                  </div>
                  <div className="msg-item-preview">{(m.message || '').slice(0, 90)}{(m.message || '').length > 90 ? '…' : ''}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(m); }}
                  aria-label="Supprimer"
                  style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer', color:'var(--a-fg-light)', padding:'4px 6px', borderRadius:6, opacity:0.6, transition:'opacity .15s, color .15s', alignSelf:'center' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.color='var(--a-red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity='0.6'; e.currentTarget.style.color='var(--a-fg-light)'; }}
                >
                  <IconTrash />
                </button>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, padding:'16px 0', borderTop:'1px solid var(--a-border)', marginTop:8 }}>
              <button
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                style={{ padding:'6px 14px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-card)', color: safePage === 0 ? 'var(--a-fg-light)' : 'var(--a-fg)', fontSize:12, fontWeight:600, cursor: safePage === 0 ? 'default' : 'pointer', opacity: safePage === 0 ? 0.5 : 1 }}
              >← Précédent</button>
              <span style={{ fontSize:12, color:'var(--a-fg-mid)', fontWeight:600 }}>Page {safePage + 1} / {totalPages}</span>
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                style={{ padding:'6px 14px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-card)', color: safePage >= totalPages - 1 ? 'var(--a-fg-light)' : 'var(--a-fg)', fontSize:12, fontWeight:600, cursor: safePage >= totalPages - 1 ? 'default' : 'pointer', opacity: safePage >= totalPages - 1 ? 0.5 : 1 }}
              >Suivant →</button>
            </div>
          )}
          </>); })()}
        </div>

        {/* Panneau de lecture */}
        <div className="msg-reader">
          {!selected ? (
            <div className="msg-reader-empty">
              <div className="msg-reader-empty-icon">
                <IconMail />
              </div>
              <p className="msg-reader-empty-title">Aucun message sélectionné</p>
              <p className="msg-reader-empty-sub">Cliquez sur un message pour le lire</p>
            </div>
          ) : (
            <motion.div
              className="msg-reader-content"
              key={selected?.id}
              style={{ maxHeight:'calc(100vh - 220px)', overflowY:'auto' }}
              variants={panelVariants}
              initial="hidden" animate="visible" exit="exit"
            >
              {/* Header */}
              <div className="msg-reader-header">
                <div className="msg-reader-avatar">
                  {getInitials(selected.prenom, selected.nom)}
                </div>
                <div className="msg-reader-sender">
                  <span className="msg-reader-name">{selected.prenom} {selected.nom}</span>
                  <span className="msg-reader-email">{selected.email}</span>
                </div>
                <span style={{
                  fontSize:'0.7rem', fontWeight:600, padding:'3px 10px', borderRadius:980,
                  background: selected.lu ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.12)',
                  color: selected.lu ? 'var(--a-green)' : 'var(--a-red)',
                  flexShrink:0,
                }}>
                  {selected.lu ? '✓ Lu' : '● Non lu'}
                </span>
              </div>

              <div className="msg-reader-sep" />

              {/* Métadonnées */}
              <div className="msg-reader-metas">
                <div className="msg-reader-meta">
                  <IconClock />
                  <span title={formatFullDate(selected.created_at)}>{formatDate(selected.created_at)}</span>
                </div>
                <div className="msg-reader-meta">
                  <IconBook />
                  {(() => {
                    const cStyle = getCourseStyle(selected.cours);
                    return (
                      <span style={{
                        fontSize:'0.7rem', fontWeight:600, padding:'2px 8px', borderRadius:980,
                        background: cStyle.bg, color: cStyle.color,
                      }}>
                        {selected.cours || 'Renseignement'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Corps du message */}
              <div style={{
                background:'var(--a-bg)',
                border:'1px solid var(--a-border)',
                borderLeft:'3px solid var(--a-gold)',
                borderRadius:'0 var(--a-radius-sm) var(--a-radius-sm) 0',
                padding:'1.3rem 1.4rem',
                fontSize:'0.92rem',
                lineHeight:1.8,
                color:'var(--a-fg)',
                marginBottom:'1.5rem',
                whiteSpace:'pre-wrap',
              }}>
                {selected.message}
              </div>

              {/* Actions */}
              <div className="msg-reader-actions">
                <a
                  className="msg-action-primary"
                  href={`mailto:${selected.email}?subject=Institut As-Safaa — Réponse à votre message`}
                >
                  <IconReply /> Répondre par email
                </a>
                <button
                  className="msg-action-secondary"
                  onClick={() => toggleLu(selected.id)}
                >
                  {selected.lu ? 'Marquer non lu' : 'Marquer comme lu'}
                </button>
                <button
                  className="msg-action-secondary"
                  onClick={() => handleDelete(selected)}
                  style={{ color:'var(--a-red)', borderColor:'rgba(255,69,58,.3)' }}
                >
                  <IconTrash /> Supprimer
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
