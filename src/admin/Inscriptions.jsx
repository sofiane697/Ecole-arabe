import React, { useState, useEffect } from 'react';
import {
  fetchInscriptions, updateInscriptionStatut,
  fetchAllClasses,
  updateInscriptionEleveId, fetchEleveById,
  updateEleveActif, updateEleve,
  createEleve, sendWelcomeEmail, fetchEleveIdParIdentifiant,
} from './supabaseAdmin';
import { generateIdentifiant, generateTempPassword } from './adminUtils';

const COURS = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];

const STATUT_NEXT = { nouveau: 'contacté', contacté: 'inscrit', inscrit: 'nouveau' };
const STATUT_CFG  = {
  nouveau:  { label: 'Nouveau',  cls: 'badge-nouveau',  icon: '●', color: 'var(--a-yellow)' },
  contacté: { label: 'Contacté', cls: 'badge-contacte', icon: '◐', color: 'var(--a-blue)' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit',  icon: '✓', color: 'var(--a-green)' },
  refuse:   { label: 'Refusé',   cls: 'badge-refuse',   icon: '✕', color: 'var(--a-red)' },
  converti: { label: 'Converti', cls: 'badge-inscrit',  icon: '★', color: 'var(--a-green)' },
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
  const [data,             setData]             = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [filtreStat,       setFiltreStat]       = useState('tous');
  const [filtreCours,      setFiltreCours]      = useState('tous');
  const [selected,         setSelected]         = useState(null);
  const [classes,        setClasses]        = useState([]);
  const [convertForm,    setConvertForm]    = useState({ classeId: '' });
  const [convertLoading,   setConvertLoading]   = useState(false);
  const [convertError,     setConvertError]     = useState('');
  const [convertResult,    setConvertResult]    = useState(null);
  const [linkedEleve,      setLinkedEleve]      = useState(null);
  const [activating,       setActivating]       = useState(false);
  const [mailEnvoye,       setMailEnvoye]       = useState(null); // email destinataire ou false

  useEffect(() => {
    fetchInscriptions().then(setData).catch(() => {}).finally(() => setLoading(false));
    fetchAllClasses().then(setClasses).catch(() => {});
  }, []);

  const filtered = data.filter(i => {
    if (i.statut === 'converti') return false;
    const okStat  = filtreStat  === 'tous' || i.statut === filtreStat;
    const okCours = filtreCours === 'tous' || i.cours  === filtreCours;
    return okStat && okCours;
  });

  const selectInscription = async (insc) => {
    setSelected(insc);
    setConvertResult(null);
    setConvertError('');
    setMailEnvoye(null);
    if (insc.eleve_id) {
      const eleve = await fetchEleveById(insc.eleve_id);
      setLinkedEleve(eleve);
    } else {
      setLinkedEleve(null);
    }
  };

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
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refuse' } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refuse' }));
    try {
      await updateInscriptionStatut(id, 'refuse');
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
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refuse' } : i));
      if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refuse' }));
    }
  };

  const handleConvertToEleve = async () => {
    setConvertLoading(true);
    setConvertError('');
    try {
      const identifiant = generateIdentifiant(selected.prenom, selected.nom);
      const password    = generateTempPassword();

      const newEleve = await createEleve(selected.nom, selected.prenom, identifiant, password);

      // admin_create_user ne retourne pas toujours l'UUID → fallback par identifiant
      const eleveId = newEleve.id ?? await fetchEleveIdParIdentifiant(identifiant);
      if (!eleveId) throw new Error('Compte créé mais ID introuvable — réessayez.');

      await updateEleveActif(eleveId, false);

      await updateEleve(eleveId, {
        classe_id:      convertForm.classeId      || null,
        telephone:      selected.telephone        || null,
        email_contact:  selected.email            || null,
        date_naissance: selected.date_naissance   || null,
      });
      await updateInscriptionEleveId(selected.id, eleveId);

      // Email envoyé uniquement à l'activation, pas ici (élève inactif à ce stade)

      const eleveComplet = { id: eleveId, nom: selected.nom, prenom: selected.prenom, actif: false };
      setConvertResult({ identifiant, password });
      setLinkedEleve(eleveComplet);
      setSelected(prev => ({ ...prev, statut: 'converti', eleve_id: eleveId }));
      setData(prev => prev.map(i => i.id === selected.id
        ? { ...i, statut: 'converti', eleve_id: eleveId } : i));
    } catch (e) {
      setConvertError(e.message ?? 'Erreur lors de la conversion');
    } finally {
      setConvertLoading(false);
    }
  };

  const handleActivateEleve = async () => {
    setActivating(true);
    await updateEleveActif(linkedEleve.id, true);
    setLinkedEleve(prev => ({ ...prev, actif: true }));
    if (selected?.email && convertResult) {
      const classeNom = classes.find(c => c.id === convertForm.classeId)?.nom ?? '';
      sendWelcomeEmail({
        email:        selected.email,
        prenom:       selected.prenom,
        nom:          selected.nom,
        identifiant:  convertResult.identifiant,
        tempPassword: convertResult.password,
        classeNom,
      }).catch(() => {});
      setMailEnvoye(selected.email);
    } else {
      setMailEnvoye(false);
    }
    setActivating(false);
  };

  const countByStatut = (s) => data.filter(i => i.statut === s).length;

  const getInitials = (prenom, nom) => {
    return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
  };

  const calcAge = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date();
    const born  = new Date(dateStr);
    let age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
    return age >= 0 ? age : null;
  };

  const formatDateNaissance = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
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
          { key: 'refuse',   label: 'Refusés',    count: countByStatut('refuse'),   color: 'var(--a-red)' },
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
                onClick={() => selectInscription(i)}
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
                    <span className="insc-item-info">
                      {i.date_naissance ? `${calcAge(i.date_naissance)} ans` : i.age ? `${i.age} ans` : '—'}
                    </span>
                    <span className="insc-item-sep">·</span>
                    <span className="insc-item-info">
                      {i.annees_pratique === 0 ? 'Débutant' : `${i.annees_pratique} an${i.annees_pratique > 1 ? 's' : ''} de pratique`}
                    </span>
                    {i.telephone && <><span className="insc-item-sep">·</span><span className="insc-item-info">{i.telephone}</span></>}
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
                    <span className="insc-detail-sub">
                      {selected.date_naissance
                        ? `${calcAge(selected.date_naissance)} ans — né(e) le ${formatDateNaissance(selected.date_naissance)}`
                        : selected.age ? `${selected.age} ans` : '—'}
                    </span>
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
                  {selected.telephone && (
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Téléphone</span>
                      <span className="insc-detail-field-value">
                        <a href={`tel:${selected.telephone}`} style={{ color:'var(--a-blue)', textDecoration:'none' }}>{selected.telephone}</a>
                      </span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Email</span>
                      <span className="insc-detail-field-value">
                        <a href={`mailto:${selected.email}`} style={{ color:'var(--a-blue)', textDecoration:'none' }}>{selected.email}</a>
                      </span>
                    </div>
                  )}
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
                {selected.statut === 'refuse' ? (
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
                  {selected.statut === 'refuse' ? (
                    <button
                      className="msg-action-primary"
                      onClick={() => reinitialiserInscription(selected.id)}
                    >
                      Remettre en traitement <IconArrow />
                    </button>
                  ) : selected.statut === 'converti' ? null : (
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

                {/* ── Conversion : visible uniquement si statut = inscrit et pas encore converti ── */}
                {selected.statut === 'inscrit' && !selected.eleve_id && !linkedEleve && (
                  <>
                    <div className="insc-detail-sep" />
                    <div className="insc-convert-panel">
                      <p className="insc-convert-title">Créer le compte élève</p>
                      <label className="insc-convert-label">Assigner une classe</label>
                      <select
                        className="insc-convert-select"
                        value={convertForm.classeId}
                        onChange={e => setConvertForm(f => ({ ...f, classeId: e.target.value }))}
                      >
                        <option value="">— Sans classe pour l'instant —</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>
                      {convertError && <p className="insc-convert-error">{convertError}</p>}
                      <button
                        className="insc-convert-btn"
                        disabled={convertLoading}
                        onClick={handleConvertToEleve}
                      >
                        {convertLoading ? 'Création en cours…' : '✓ Créer le compte élève'}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Identifiants générés ── */}
                {convertResult && (
                  <div className="insc-creds-box">
                    <p className="insc-creds-title">✓ Compte créé — identifiants</p>
                    <p className="insc-creds-row">Identifiant : <strong>{convertResult.identifiant}</strong></p>
                    <p className="insc-creds-row">Mot de passe provisoire : <strong>{convertResult.password}</strong></p>
                  </div>
                )}

                {/* ── Banner activation ── */}
                {linkedEleve && !linkedEleve.actif && (
                  <div className="insc-activation-banner">
                    <span className="insc-activation-text">⏳ Compte en attente d'activation</span>
                    <button
                      className="insc-activation-btn"
                      disabled={activating}
                      onClick={handleActivateEleve}
                    >
                      {activating ? '…' : "Activer l'accès"}
                    </button>
                  </div>
                )}

                {/* ── Compte déjà actif ── */}
                {linkedEleve && linkedEleve.actif && (
                  <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(48,209,88,0.08)', border:'1px solid rgba(48,209,88,0.3)', borderRadius:8, fontSize:13, color:'var(--a-green)' }}>
                    ✅ Élève actif — accès portail ouvert
                  </div>
                )}

                {/* ── Indicateur email envoyé ── */}
                {mailEnvoye && (
                  <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(48,209,88,0.07)', border:'1px solid rgba(48,209,88,0.25)', borderRadius:8 }}>
                    <span style={{ fontSize:15 }}>✉️</span>
                    <span style={{ fontSize:12, color:'var(--a-green)', lineHeight:1.5 }}>
                      Mail envoyé avec les identifiants et mot de passe provisoire<br />
                      <strong style={{ fontFamily:'monospace' }}>{mailEnvoye}</strong>
                    </span>
                  </div>
                )}
                {mailEnvoye === false && (
                  <div style={{ marginTop:8, padding:'10px 14px', background:'rgba(255,159,10,0.08)', border:'1px solid rgba(255,159,10,0.3)', borderRadius:8, fontSize:12, color:'var(--a-yellow)' }}>
                    ⚠️ Aucun email de contact — transmettez les identifiants manuellement.
                  </div>
                )}

              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
