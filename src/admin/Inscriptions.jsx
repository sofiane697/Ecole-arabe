import React, { useState, useEffect } from 'react';
import { fetchInscriptions, updateInscriptionStatut } from './supabaseAdmin';

const COURS = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];

const STATUT_NEXT = { nouveau: 'contacté', contacté: 'inscrit', inscrit: 'nouveau' };
const STATUT_CFG  = {
  nouveau:  { label: 'Nouveau',  cls: 'badge-nouveau',  icon: '●', color: 'var(--a-yellow)' },
  contacté: { label: 'Contacté', cls: 'badge-contacte', icon: '◐', color: 'var(--a-blue)' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit',  icon: '✓', color: 'var(--a-green)' },
  refusé:   { label: 'Refusé',   cls: 'badge-refuse',   icon: '✕', color: 'var(--a-red)' },
};

const IconUsers = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);

const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function Inscriptions() {
  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtreStat,  setFiltreStat]  = useState('tous');
  const [filtreCours, setFiltreCours] = useState('tous');
  const [selected,    setSelected]    = useState(null);

  useEffect(() => {
    fetchInscriptions()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(i => {
    const okStat  = filtreStat  === 'tous' || i.statut === filtreStat;
    const okCours = filtreCours === 'tous' || i.cours  === filtreCours;
    return okStat && okCours;
  });

  const avancerStatut = async (id, currentStatut) => {
    const next = STATUT_NEXT[currentStatut];
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: next } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: next }));
    try {
      await updateInscriptionStatut(id, next);
    } catch (err) {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: currentStatut } : i));
    }
  };

  const refuserInscription = async (id, currentStatut) => {
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refusé' } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refusé' }));
    try {
      await updateInscriptionStatut(id, 'refusé');
    } catch (err) {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: currentStatut } : i));
      if (selected?.id === id) setSelected(prev => ({ ...prev, statut: currentStatut }));
    }
  };

  const reinitialiserInscription = async (id) => {
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'nouveau' } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'nouveau' }));
    try {
      await updateInscriptionStatut(id, 'nouveau');
    } catch (err) {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refusé' } : i));
      if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refusé' }));
    }
  };

  const countByStatut = (s) => data.filter(i => i.statut === s).length;

  const getInitials = (prenom, nom) => {
    return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatFullDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'4rem', color:'var(--a-fg-light)' }}>
        Chargement des inscriptions...
      </div>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-title">Pré-inscriptions</p>
          <p className="admin-page-subtitle">Gérez les demandes d'inscription et leur avancement</p>
        </div>
      </div>

      {/* Stats mini */}
      <div className="insc-stats">
        {[
          { key: 'tous',     label: 'Tous',      count: data.length,           color: 'var(--a-fg-mid)' },
          { key: 'nouveau',  label: 'Nouveaux',   count: countByStatut('nouveau'),  color: 'var(--a-yellow)' },
          { key: 'contacté', label: 'Contactés',  count: countByStatut('contacté'), color: 'var(--a-blue)' },
          { key: 'inscrit',  label: 'Inscrits',   count: countByStatut('inscrit'),  color: 'var(--a-green)' },
          { key: 'refusé',   label: 'Refusés',    count: countByStatut('refusé'),   color: 'var(--a-red)' },
        ].map(s => (
          <button
            key={s.key}
            className={`insc-stat ${filtreStat === s.key ? 'active' : ''}`}
            onClick={() => setFiltreStat(s.key)}
          >
            <span className="insc-stat-count" style={{ color: s.color }}>{s.count}</span>
            <span className="insc-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Filtre cours */}
      <div className="insc-filters">
        <select className="admin-filter-select" value={filtreCours} onChange={e => setFiltreCours(e.target.value)}>
          <option value="tous">Tous les cours</option>
          {COURS.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="insc-filter-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Layout liste + détail */}
      <div className="insc-layout">

        {/* Liste */}
        <div className="insc-list">
          {filtered.length === 0 ? (
            <div className="insc-empty">
              <IconUsers />
              <p>Aucune inscription trouvée</p>
            </div>
          ) : filtered.map(i => {
            const s = STATUT_CFG[i.statut] || { label: i.statut, cls: '', color: 'var(--a-fg-mid)' };
            return (
              <div
                key={i.id}
                className={`insc-item ${selected?.id === i.id ? 'selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                <div className="insc-item-avatar">
                  {getInitials(i.prenom, i.nom)}
                </div>
                <div className="insc-item-content">
                  <div className="insc-item-top">
                    <span className="insc-item-name">{i.prenom} {i.nom}</span>
                    <span className="insc-item-time">{formatDate(i.created_at)}</span>
                  </div>
                  <div className="insc-item-course">{(i.cours || '').split('—')[0].trim()}</div>
                  <div className="insc-item-bottom">
                    <span className="insc-item-info">{i.age} ans</span>
                    <span className="insc-item-sep">·</span>
                    <span className="insc-item-info">
                      {i.annees_pratique === 0 ? 'Débutant' : `${i.annees_pratique} an${i.annees_pratique > 1 ? 's' : ''} de pratique`}
                    </span>
                  </div>
                </div>
                <span className={`badge ${s.cls}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        {/* Panneau détail */}
        <div className="insc-detail">
          {!selected ? (
            <div className="insc-detail-empty">
              <div className="insc-detail-empty-icon">
                <IconUsers />
              </div>
              <p className="insc-detail-empty-title">Aucun élève sélectionné</p>
              <p className="insc-detail-empty-sub">Cliquez sur une inscription pour voir les détails</p>
            </div>
          ) : (() => {
            const s = STATUT_CFG[selected.statut] || { label: selected.statut, cls: '', color: 'var(--a-fg-mid)' };
            const next = STATUT_NEXT[selected.statut] || 'nouveau';
            const nextCfg = STATUT_CFG[next] || { label: next };
            return (
              <div className="insc-detail-content">
                {/* Header */}
                <div className="insc-detail-header">
                  <div className="insc-detail-avatar">
                    {getInitials(selected.prenom, selected.nom)}
                  </div>
                  <div className="insc-detail-sender">
                    <span className="insc-detail-name">{selected.prenom} {selected.nom}</span>
                    <span className="insc-detail-sub">{selected.age} ans</span>
                  </div>
                  <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
                </div>

                <div className="insc-detail-sep" />

                {/* Infos */}
                <div className="insc-detail-grid">
                  <div className="insc-detail-field">
                    <span className="insc-detail-field-label">Cours souhaité</span>
                    <span className="insc-detail-field-value">{selected.cours}</span>
                  </div>
                  <div className="insc-detail-field">
                    <span className="insc-detail-field-label">Expérience</span>
                    <span className="insc-detail-field-value">
                      {selected.annees_pratique === 0 ? 'Aucune (débutant)' : `${selected.annees_pratique} an${selected.annees_pratique > 1 ? 's' : ''} de pratique`}
                    </span>
                  </div>
                  <div className="insc-detail-field">
                    <span className="insc-detail-field-label">Date d'inscription</span>
                    <span className="insc-detail-field-value insc-detail-field-date">
                      <IconClock /> {formatFullDate(selected.created_at)}
                    </span>
                  </div>
                </div>

                <div className="insc-detail-sep" />

                {/* Progression statut */}
                <p className="insc-detail-section-title">Progression</p>
                {selected.statut === 'refusé' ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'rgba(255,69,58,0.08)', borderRadius:10, border:'1px solid rgba(255,69,58,0.2)' }}>
                    <span style={{ color:'var(--a-red)', fontSize:16 }}>✕</span>
                    <span style={{ color:'var(--a-red)', fontWeight:600, fontSize:14 }}>Inscription refusée</span>
                  </div>
                ) : (
                  <div className="insc-progress">
                    {['nouveau', 'contacté', 'inscrit'].map((step, idx) => {
                      const stepCfg = STATUT_CFG[step];
                      const steps = ['nouveau', 'contacté', 'inscrit'];
                      const currentIdx = steps.indexOf(selected.statut);
                      const isDone = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <React.Fragment key={step}>
                          <div className={`insc-progress-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                            <div className="insc-progress-dot" style={{ borderColor: isDone ? stepCfg.color : 'var(--a-border)', background: isDone ? stepCfg.color : 'transparent' }}>
                              {isDone && <span style={{ color: '#fff', fontSize: '0.6rem' }}>✓</span>}
                            </div>
                            <span className="insc-progress-label" style={{ color: isDone ? stepCfg.color : 'var(--a-fg-light)' }}>{stepCfg.label}</span>
                          </div>
                          {idx < 2 && (
                            <div className="insc-progress-line" style={{ background: idx < currentIdx ? stepCfg.color : 'var(--a-border)' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="insc-detail-actions">
                  {selected.statut === 'refusé' ? (
                    <button
                      className="msg-action-primary"
                      onClick={() => reinitialiserInscription(selected.id)}
                    >
                      Remettre en traitement <IconArrow />
                    </button>
                  ) : (
                    <>
                      <button
                        className="msg-action-primary"
                        onClick={() => avancerStatut(selected.id, selected.statut)}
                      >
                        Passer à : {nextCfg.label} <IconArrow />
                      </button>
                      <button
                        style={{ marginTop:8, width:'100%', padding:'9px 16px', borderRadius:980, border:'1px solid var(--a-red)', background:'transparent', color:'var(--a-red)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
                        onClick={() => refuserInscription(selected.id, selected.statut)}
                      >
                        ✕ Refuser l'inscription
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
