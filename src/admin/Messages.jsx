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

const IconPhone = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMailSmall = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
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
      <div className="text-center p-16 text-a-fg-light">
        Chargement des messages...
      </div>
    );
  }

  return (
    <>
      {/* Stats */}
      <div className="msg-stats">
        {[
          {
            key: 'total', label: 'Total', value: data.length,
            iconBg: 'rgba(140,138,158,0.12)', iconColor: 'var(--a-fg-mid)',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
            valueColor: 'var(--a-fg)',
          },
          {
            key: 'nonlu', label: 'Non lus', value: nonLus,
            iconBg: nonLus > 0 ? 'rgba(240,85,85,0.12)' : 'rgba(140,138,158,0.1)',
            iconColor: nonLus > 0 ? 'var(--a-red)' : 'var(--a-fg-mid)',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
            valueColor: nonLus > 0 ? 'var(--a-red)' : 'var(--a-fg-mid)',
          },
          {
            key: 'today', label: "Aujourd'hui", value: todayCount,
            iconBg: todayCount > 0 ? 'rgba(var(--a-gold-rgb),0.12)' : 'rgba(140,138,158,0.1)',
            iconColor: todayCount > 0 ? 'var(--a-gold)' : 'var(--a-fg-mid)',
            icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
            valueColor: todayCount > 0 ? 'var(--a-gold)' : 'var(--a-fg-mid)',
          },
        ].map(s => (
          <div key={s.key} className="msg-stat">
            <div className="msg-stat-icon" style={{ background: s.iconBg, color: s.iconColor }}>{s.icon}</div>
            <div className="msg-stat-text">
              <span className="msg-stat-value" style={{ color: s.valueColor }}>{s.value}</span>
              <span className="msg-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar filtres + recherche */}
      <div className="msg-toolbar">
        <div className="msg-toolbar-left">
          <div className="msg-filter-pill">
            {[
              { key: 'tous',  label: 'Tous',    count: data.length },
              { key: 'nonlu', label: 'Non lus', count: nonLus },
              { key: 'lu',    label: 'Lus',     count: data.length - nonLus },
            ].map(f => (
              <button
                key={f.key}
                className={`msg-filter-opt${filtreLu === f.key ? ' active' : ''}`}
                onClick={() => { setFiltreLu(f.key); setPage(0); }}
              >
                {f.label}
                <span className="msg-filter-badge">{f.count}</span>
              </button>
            ))}
          </div>
          <select className="msg-course-select" value={filtreCours} onChange={e => { setFiltreCours(e.target.value); setPage(0); }}>
            <option value="tous">Tous les cours</option>
            {COURS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="msg-search-wrap">
          <span className="msg-search-icon"><IconSearch /></span>
          <input
            className="msg-search-input"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Rechercher…"
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
                  <div className="mb-1">
                    <span className="inline-block text-[0.68rem] font-semibold px-2 py-[2px] rounded-full"
                      style={{ background: cStyle.bg, color: cStyle.color }}>
                      {getCoursLabel(m.cours)}
                    </span>
                  </div>
                  <div className="msg-item-preview">{(m.message || '').slice(0, 90)}{(m.message || '').length > 90 ? '…' : ''}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(m); }}
                  aria-label="Supprimer"
                  className="a-action-icon-btn"
                  style={{ flexShrink:0, alignSelf:'center' }}
                  onMouseEnter={e => { e.currentTarget.style.color='var(--a-red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color=''; }}
                >
                  <IconTrash />
                </button>
              </div>
            );
          })}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-a-border mt-2">
              <button
                disabled={safePage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="px-3.5 py-1.5 rounded-full border border-a-border bg-a-bg-card text-xs font-semibold"
                style={{ color: safePage === 0 ? 'var(--a-fg-light)' : 'var(--a-fg)', cursor: safePage === 0 ? 'default' : 'pointer', opacity: safePage === 0 ? 0.5 : 1 }}
              >← Précédent</button>
              <span className="text-xs text-a-fg-mid font-semibold">Page {safePage + 1} / {totalPages}</span>
              <button
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                className="px-3.5 py-1.5 rounded-full border border-a-border bg-a-bg-card text-xs font-semibold"
                style={{ color: safePage >= totalPages - 1 ? 'var(--a-fg-light)' : 'var(--a-fg)', cursor: safePage >= totalPages - 1 ? 'default' : 'pointer', opacity: safePage >= totalPages - 1 ? 0.5 : 1 }}
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
              key={selected?.id}
              className="msg-reader-content max-h-[calc(100vh-220px)] overflow-y-auto"
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
                  <div className="msg-reader-contacts">
                    {selected.email && (
                      <a
                        href={`mailto:${selected.email}`}
                        className="msg-reader-contact"
                        title={`Envoyer un email à ${selected.email}`}
                      >
                        <IconMailSmall />
                        <span className="truncate">{selected.email}</span>
                      </a>
                    )}
                    {selected.telephone && (
                      <a
                        href={`tel:${selected.telephone.replace(/\s/g, '')}`}
                        className="msg-reader-contact"
                        title={`Appeler ${selected.telephone}`}
                      >
                        <IconPhone />
                        <span>{selected.telephone}</span>
                      </a>
                    )}
                  </div>
                </div>
                <span className="text-[0.7rem] font-semibold px-2.5 py-[3px] rounded-full shrink-0"
                  style={{
                    background: selected.lu ? 'rgba(48,209,88,.12)' : 'rgba(255,69,58,.12)',
                    color: selected.lu ? 'var(--a-green)' : 'var(--a-red)',
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
                      <span className="text-[0.7rem] font-semibold px-2 py-[2px] rounded-full"
                        style={{ background: cStyle.bg, color: cStyle.color }}>
                        {selected.cours || 'Renseignement'}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Corps du message */}
              <div className="msg-reader-body">
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
                  className="msg-action-secondary text-a-red border-[rgba(255,69,58,.3)]"
                  onClick={() => handleDelete(selected)}
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
