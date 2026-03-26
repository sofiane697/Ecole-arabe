import React, { useState, useEffect } from 'react';
import { fetchMessages, updateMessageLu } from './supabaseAdmin';

const COURS = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];

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

export default function Messages() {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtreLu,    setFiltreLu]    = useState('tous');
  const [filtreCours, setFiltreCours] = useState('tous');
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    fetchMessages()
      .then(setData)
      .catch(err => console.error('Erreur:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(m => {
    const okLu    = filtreLu    === 'tous'  || (filtreLu === 'nonlu' ? !m.lu : m.lu);
    const okCours = filtreCours === 'tous'  || m.cours === filtreCours;
    return okLu && okCours;
  });

  const toggleLu = async (id) => {
    const msg = data.find(m => m.id === id);
    if (!msg) return;
    const newLu = !msg.lu;
    setData(prev => prev.map(m => m.id === id ? { ...m, lu: newLu } : m));
    if (selected?.id === id) setSelected(prev => ({ ...prev, lu: newLu }));
    try {
      await updateMessageLu(id, newLu);
    } catch (err) {
      console.error('Erreur:', err);
      setData(prev => prev.map(m => m.id === id ? { ...m, lu: !newLu } : m));
    }
  };

  const handleSelect = async (msg) => {
    setSelected(msg);
    if (!msg.lu) {
      setData(prev => prev.map(m => m.id === msg.id ? { ...m, lu: true } : m));
      setSelected({ ...msg, lu: true });
      try {
        await updateMessageLu(msg.id, true);
      } catch (err) {
        console.error('Erreur:', err);
      }
    }
  };

  const nonLus = data.filter(m => !m.lu).length;

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

  const getInitials = (prenom, nom) => {
    return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
  };

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
          <p className="admin-page-title">Messages</p>
          <p className="admin-page-subtitle">
            {nonLus > 0
              ? `${nonLus} message${nonLus > 1 ? 's' : ''} non lu${nonLus > 1 ? 's' : ''}`
              : 'Tous les messages ont été lus'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="msg-filters">
        <div className="msg-filter-tabs">
          {[
            { key: 'tous', label: 'Tous', count: data.length },
            { key: 'nonlu', label: 'Non lus', count: nonLus },
            { key: 'lu', label: 'Lus', count: data.length - nonLus },
          ].map(f => (
            <button
              key={f.key}
              className={`msg-filter-tab ${filtreLu === f.key ? 'active' : ''}`}
              onClick={() => setFiltreLu(f.key)}
            >
              {f.label}
              <span className="msg-filter-tab-count">{f.count}</span>
            </button>
          ))}
        </div>
        <select className="admin-filter-select" value={filtreCours} onChange={e => setFiltreCours(e.target.value)}>
          <option value="tous">Tous les cours</option>
          {COURS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Layout liste + panneau */}
      <div className="msg-layout">

        {/* Liste des messages */}
        <div className="msg-list">
          {filtered.length === 0 ? (
            <div className="msg-empty">
              <IconMail />
              <p>Aucun message trouvé</p>
            </div>
          ) : filtered.map(m => (
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
                  <span className="msg-item-time">{formatDate(m.created_at)}</span>
                </div>
                <div className="msg-item-course">{(m.cours || 'Renseignement').split('—')[0].trim()}</div>
                <div className="msg-item-preview">{(m.message || '').slice(0, 80)}{(m.message || '').length > 80 ? '...' : ''}</div>
              </div>
            </div>
          ))}
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
            <div className="msg-reader-content">
              {/* Header */}
              <div className="msg-reader-header">
                <div className="msg-reader-avatar">
                  {getInitials(selected.prenom, selected.nom)}
                </div>
                <div className="msg-reader-sender">
                  <span className="msg-reader-name">{selected.prenom} {selected.nom}</span>
                  <span className="msg-reader-email">{selected.email}</span>
                </div>
                <span className={`badge ${selected.lu ? 'badge-lu' : 'badge-nonlu'}`}>
                  {selected.lu ? '✓ Lu' : '● Non lu'}
                </span>
              </div>

              <div className="msg-reader-sep" />

              {/* Métadonnées */}
              <div className="msg-reader-metas">
                <div className="msg-reader-meta">
                  <IconClock />
                  <span>{formatFullDate(selected.created_at)}</span>
                </div>
                <div className="msg-reader-meta">
                  <IconBook />
                  <span>{selected.cours || 'Renseignement'}</span>
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
                  href={`mailto:${selected.email}?subject=École Al-Nour — Réponse à votre message`}
                >
                  <IconReply /> Répondre par email
                </a>
                <button
                  className="msg-action-secondary"
                  onClick={() => toggleLu(selected.id)}
                >
                  {selected.lu ? 'Marquer non lu' : 'Marquer comme lu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
