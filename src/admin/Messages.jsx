import React, { useState, useEffect } from 'react';
import { fetchMessages, updateMessageLu } from './supabaseAdmin';

const COURS = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];

const IconReply = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
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
    // Mise à jour optimiste
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
    // Marquer automatiquement comme lu à l'ouverture
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

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'4rem', color:'var(--a-fg-light)' }}>
        Chargement des messages…
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
      <div className="admin-filters">
        <select className="admin-filter-select" value={filtreLu} onChange={e => setFiltreLu(e.target.value)}>
          <option value="tous">Tous</option>
          <option value="nonlu">Non lus</option>
          <option value="lu">Lus</option>
        </select>

        <select className="admin-filter-select" value={filtreCours} onChange={e => setFiltreCours(e.target.value)}>
          <option value="tous">Tous les cours</option>
          {COURS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <span className="admin-filter-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Layout tableau + panneau */}
      <div className="admin-msg-layout">

        {/* Tableau */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Expéditeur</th>
                <th>Email</th>
                <th>Cours</th>
                <th>Date</th>
                <th>Lu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign:'center', padding:'2rem', color:'var(--a-fg-light)' }}>
                    Aucun message trouvé
                  </td>
                </tr>
              ) : filtered.map(m => {
                const date = new Date(m.created_at).toLocaleDateString('fr-FR');
                return (
                  <tr
                    key={m.id}
                    className={!m.lu ? 'admin-msg-row-unread' : ''}
                    onClick={() => handleSelect(m)}
                    style={{ background: selected?.id === m.id ? 'var(--a-bg-hover)' : '' }}
                  >
                    <td style={{ width:'8px', paddingRight:0 }}>
                      {!m.lu && (
                        <span style={{
                          display:'inline-block', width:'7px', height:'7px',
                          borderRadius:'50%', background:'var(--a-red)'
                        }}/>
                      )}
                    </td>
                    <td><strong>{m.prenom} {m.nom}</strong></td>
                    <td className="muted">{m.email}</td>
                    <td className="muted">{(m.cours || '').split('—')[0].trim()}</td>
                    <td className="muted">{date}</td>
                    <td>
                      <span className={`badge ${m.lu ? 'badge-lu' : 'badge-nonlu'}`}>
                        {m.lu ? '✓ Lu' : '● Non lu'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panneau de lecture */}
        <div className="admin-msg-panel">
          {!selected ? (
            <div className="admin-msg-panel-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity:0.3, marginBottom:'0.75rem' }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <p>Sélectionnez un message<br/>pour le lire</p>
            </div>
          ) : (
            <>
              <p className="admin-section-title" style={{ marginBottom:'1rem' }}>
                Message de {selected.prenom} {selected.nom}
              </p>
              <div className="admin-msg-meta">
                <strong>{selected.prenom} {selected.nom}</strong>{' '}
                &lt;{selected.email}&gt;<br/>
                Cours : {selected.cours}<br/>
                Date : {new Date(selected.created_at).toLocaleDateString('fr-FR')}
              </div>
              <div className="admin-msg-body">{selected.message}</div>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                <a
                  className="admin-reply-btn"
                  href={`mailto:${selected.email}?subject=École Al-Nour — Réponse à votre message`}
                >
                  <IconReply /> Répondre par email
                </a>
                <button
                  className="admin-status-btn"
                  style={{ padding:'0.5rem 0.9rem' }}
                  onClick={() => toggleLu(selected.id)}
                >
                  {selected.lu ? 'Marquer non lu' : 'Marquer comme lu'}
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
