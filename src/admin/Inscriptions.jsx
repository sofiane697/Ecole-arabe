import React, { useState, useEffect, useRef } from 'react';
import { motion, panelVariants } from '../animations';
import { usePageAnimation } from '../shared/usePageAnimation';
import {
  fetchInscriptions, updateInscriptionStatut,
  fetchAllClasses,
  updateInscriptionEleveId, fetchEleveById,
  updateEleveActif, updateEleve, updateEleveNiveauScolaire,
  createEleve, fetchEleveIdParIdentifiant,
  markInscriptionViewed,
} from './supabaseAdmin';
import { dispatchPostCreationEmails } from './parentsMail';
import { generateIdentifiant, generateTempPassword } from './adminUtils';
import { emptyBloc, isBlocUtilisable, processParentBlocs, checkDuplicatesOnSubmit } from './parentsLogic';
import ParentsSection, { ParentResults } from './ParentsSection';
import EleveParentsSection from './EleveParentsSection';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';
import { safeMailtoHref } from './adminUtils';
import { emitInscriptionsChanged } from './adminEvents';

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
  const [convertForm,    setConvertForm]    = useState({ classeId: '', emailContact: '', telephone: '', dateNaissance: '' });
  const [convertLoading,   setConvertLoading]   = useState(false);
  const [convertError,     setConvertError]     = useState('');
  const [convertResult,    setConvertResult]    = useState(null);
  const [linkedEleve,      setLinkedEleve]      = useState(null);
  const [activating,       setActivating]       = useState(false);
  const [mailEnvoye,       setMailEnvoye]       = useState(null); // email destinataire ou false

  // ─── Section Parents (wizard de conversion) ─────────────────────────────
  // `addParentsNow` : toggle pour rendre l'étape optionnelle. Par défaut false
  // — le workflow recommandé est de convertir l'élève puis rattacher les
  // parents depuis sa fiche ou la page Parents.
  const [addParentsNow, setAddParentsNow] = useState(false);
  const [parentsMode,   setParentsMode]   = useState('ensemble'); // 'ensemble' | 'separes'
  const [parentsBlocs,  setParentsBlocs]  = useState([emptyBloc()]);
  const [parentResults, setParentResults] = useState([]); // [{kind:'created'|'linked', label, identifiant, password?}]
  const pageRef = useRef(null);
  usePageAnimation(pageRef, [loading]);

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
    setAddParentsNow(false);
    setParentsMode('ensemble');
    setParentsBlocs([emptyBloc()]);
    setParentResults([]);
    setConvertForm({
      classeId: '',
      emailContact: insc.email || '',
      telephone: insc.telephone || '',
      dateNaissance: insc.date_naissance ? insc.date_naissance.slice(0, 10) : '',
    });
    if (insc.eleve_id) {
      const eleve = await fetchEleveById(insc.eleve_id);
      setLinkedEleve(eleve);
    } else {
      setLinkedEleve(null);
    }
    // Marquer comme "consultée" si c'est une nouvelle inscription non encore vue
    if (insc.statut === 'nouveau') {
      markInscriptionViewed(insc.id).then(() => emitInscriptionsChanged()).catch(() => {});
    }
  };

  const avancerStatut = async (id, currentStatut) => {
    const next = STATUT_NEXT[currentStatut];
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: next } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: next }));
    try {
      await updateInscriptionStatut(id, next);
      emitInscriptionsChanged();
    } catch (err) {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: currentStatut } : i));
    }
  };

  const refuserInscription = async (id, currentStatut) => {
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refuse' } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refuse' }));
    try {
      await updateInscriptionStatut(id, 'refuse');
      emitInscriptionsChanged();
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
      emitInscriptionsChanged();
    } catch (err) {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: 'refuse' } : i));
      if (selected?.id === id) setSelected(prev => ({ ...prev, statut: 'refuse' }));
    }
  };

  const handleConvertToEleve = async () => {
    setConvertLoading(true);
    setConvertError('');
    try {
      // Validation nom/prénom (aligné sur Eleves.jsx : bloque caractères suspects)
      const NOM_REGEX = /^[a-zA-Zàâäéèêëïîôùûüœæ\s'\-]{1,50}$/;
      if (!NOM_REGEX.test((selected.prenom || '').trim())) {
        throw new Error('Le prénom contient des caractères non autorisés.');
      }
      if (!NOM_REGEX.test((selected.nom || '').trim())) {
        throw new Error('Le nom contient des caractères non autorisés.');
      }
      if (!convertForm.dateNaissance) {
        throw new Error("Renseigne la date de naissance de l'élève avant conversion.");
      }

      // Majorité : élève ≥ 18 ans → les comptes parents deviennent optionnels.
      const age     = calcAge(convertForm.dateNaissance);
      const isMajor = age !== null && age >= 18;

      // Parents : obligatoires uniquement si mineur ET addParentsNow coché.
      const skipParents  = isMajor || !addParentsNow;
      const blocsValides = skipParents ? [] : parentsBlocs.filter(isBlocUtilisable);
      if (!skipParents && blocsValides.length === 0) {
        throw new Error("Renseigne au moins un parent (père ou mère) avec email ou téléphone, ou décoche « Ajouter les parents maintenant ».");
      }

      // Dernier check duplicate avant création (au cas où onBlur n'a pas eu lieu)
      if (!skipParents) {
        const { refreshedBlocs, needsReview } = await checkDuplicatesOnSubmit(parentsBlocs);
        if (needsReview) {
          setParentsBlocs(refreshedBlocs);
          throw new Error("Un parent existant correspond à un bloc. Utilise la bannière jaune pour le rattacher, ou modifie email/téléphone pour créer un nouveau compte.");
        }
      }

      // 1. Créer l'élève : noms formatés + identifiant en minuscules (login case-insensitive)
      const identifiant = generateIdentifiant(selected.prenom, selected.nom);
      const idLogin     = identifiant.toLowerCase();
      const password    = generateTempPassword();
      const cleanNom    = fmtNom(selected.nom);
      const cleanPrenom = fmtPrenom(selected.prenom);
      const newEleve = await createEleve(cleanNom, cleanPrenom, idLogin, password);
      const eleveId = newEleve.id ?? await fetchEleveIdParIdentifiant(idLogin);
      if (!eleveId) throw new Error('Compte élève créé mais ID introuvable — réessayez.');

      // Patch unique : actif:false + classe + téléphone + email + date (un seul appel réseau)
      await updateEleve(eleveId, {
        actif:          false,
        classe_id:      convertForm.classeId             || null,
        telephone:      convertForm.telephone.trim()     || null,
        email_contact:  convertForm.emailContact.trim()  || null,
        date_naissance: convertForm.dateNaissance        || null,
      });

      // Synchronise le niveau scolaire depuis la classe (cf. Eleves.jsx) — sinon
      // le filtrage des modules côté portail élève est incorrect.
      if (convertForm.classeId) {
        const niveauScolaireId = classes.find(c => c.id === convertForm.classeId)?.niveau_id || null;
        await updateEleveNiveauScolaire(eleveId, niveauScolaireId);
      }

      await updateInscriptionEleveId(selected.id, eleveId);

      // 2. Créer / rattacher les parents (bloc par bloc, reporting partiel si un échoue).
      const results = await processParentBlocs(eleveId, blocsValides);

      // Email envoyé uniquement à l'activation, pas ici (élève inactif à ce stade)

      const eleveComplet = { id: eleveId, nom: cleanNom, prenom: cleanPrenom, actif: false };
      setConvertResult({ identifiant, idLogin, password });
      setParentResults(results);
      setLinkedEleve(eleveComplet);
      setSelected(prev => ({ ...prev, statut: 'converti', eleve_id: eleveId, nom: cleanNom, prenom: cleanPrenom }));
      setData(prev => prev.map(i => i.id === selected.id
        ? { ...i, statut: 'converti', eleve_id: eleveId, nom: cleanNom, prenom: cleanPrenom } : i));
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
    const classeNom = classes.find(c => c.id === convertForm.classeId)?.nom ?? '';

    const emailContact = convertForm.emailContact.trim();
    dispatchPostCreationEmails({
      contactEmail:      emailContact || null,
      // Formatage défensif : immunise contre une mutation manquée de `selected`.
      elevePrenom:       fmtPrenom(selected.prenom),
      eleveNom:          fmtNom(selected.nom),
      // Envoyer l'identifiant en minuscules : le formulaire de login lowercase l'input
      // avant l'appel RPC, donc la casse stockée en DB doit l'être aussi.
      eleveIdentifiant:  convertResult?.idLogin ?? convertResult?.identifiant?.toLowerCase(),
      eleveTempPassword: convertResult?.password,
      classeNom,
      parentResults,
      // welcome uniquement si on a bien un email ET un résultat de conversion
      sendWelcome:       Boolean(emailContact && convertResult),
    });
    setMailEnvoye(emailContact && convertResult ? emailContact : false);

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
      <div className="text-center p-16 text-a-fg-light">
        Chargement des inscriptions...
      </div>
    );
  }

  return (
    <div ref={pageRef}>
      <div className="admin-page-header">
        <div>
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
              <motion.div
                className="insc-detail-content"
                key={selected.id}
                variants={panelVariants}
                initial="hidden" animate="visible" exit="exit"
              >
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
                        <a href={`tel:${selected.telephone}`} className="text-a-blue no-underline">{selected.telephone}</a>
                      </span>
                    </div>
                  )}
                  {selected.email && (
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Email</span>
                      <span className="insc-detail-field-value">
                        <a href={`mailto:${selected.email}`} className="text-a-blue no-underline">{selected.email}</a>
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
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.2)]">
                    <span className="text-a-red text-base">✕</span>
                    <span className="text-a-red font-semibold text-sm">Inscription refusée</span>
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
                              {isDone && <span className="text-white text-[0.6rem]">✓</span>}
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
                        className="msg-action-danger"
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
                      <p className="insc-convert-title">Créer le compte élève + parents</p>

                      <label className="insc-convert-label">
                        1. Assigner une classe
                        {selected.cours && (
                          <span className="ml-2 text-[11px] font-normal text-a-fg-light">
                            (cours souhaité : {selected.cours})
                          </span>
                        )}
                      </label>
                      <select
                        className="insc-convert-select"
                        value={convertForm.classeId}
                        onChange={e => setConvertForm(f => ({ ...f, classeId: e.target.value }))}
                      >
                        <option value="">— Sans classe pour l'instant —</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                      </select>

                      <label className="insc-convert-label mt-4">2. Date de naissance</label>
                      <input
                        type="date"
                        className="insc-convert-select"
                        max={new Date().toISOString().split('T')[0]}
                        value={convertForm.dateNaissance}
                        onChange={e => setConvertForm(f => ({ ...f, dateNaissance: e.target.value }))}
                      />

                      <label className="insc-convert-label mt-4">3. Téléphone</label>
                      <input
                        type="tel"
                        className="insc-convert-select"
                        placeholder="+33 6 12 34 56 78"
                        value={convertForm.telephone}
                        onChange={e => setConvertForm(f => ({ ...f, telephone: e.target.value }))}
                      />

                      <label className="insc-convert-label mt-4">
                        4. Email de contact (identifiants envoyés à cette adresse)
                      </label>
                      <input
                        type="email"
                        className="insc-convert-select"
                        placeholder="email@exemple.com (laisser vide = pas d'envoi)"
                        value={convertForm.emailContact}
                        onChange={e => setConvertForm(f => ({ ...f, emailContact: e.target.value }))}
                      />

                      {/* Section Parents (optionnelle, toggle) */}
                      <label className="insc-convert-label mt-4">5. Parents</label>
                      <label
                        className="flex items-start gap-3 p-3 rounded-lg cursor-pointer text-[13px] mb-2 transition-all duration-150"
                        style={{
                          background: addParentsNow ? 'rgba(191,138,48,0.08)' : 'var(--a-bg)',
                          border: `1px solid ${addParentsNow ? 'rgba(191,138,48,0.35)' : 'var(--a-border)'}`,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={addParentsNow}
                          onChange={e => setAddParentsNow(e.target.checked)}
                          className="w-[15px] h-[15px] mt-0.5 cursor-pointer flex-shrink-0"
                          style={{ accentColor: 'var(--a-gold)' }}
                        />
                        <span className="flex-1" style={{ color: addParentsNow ? 'var(--a-gold)' : 'var(--a-fg)' }}>
                          <strong>Ajouter les parents maintenant</strong>
                          <span className="block text-[12px] font-normal mt-0.5 text-a-fg-mid">
                            {addParentsNow
                              ? 'Renseignez les parents ci-dessous.'
                              : 'Vous pourrez les rattacher plus tard depuis la fiche de l\'élève ou la page Parents.'}
                          </span>
                        </span>
                      </label>

                      {addParentsNow && (
                        <ParentsSection
                          mode={parentsMode}
                          blocs={parentsBlocs}
                          onChange={({ mode, blocs }) => {
                            setParentsMode(mode);
                            setParentsBlocs(blocs);
                          }}
                        />
                      )}

                      {convertError && <p className="insc-convert-error">{convertError}</p>}
                      <button
                        className="insc-convert-btn"
                        disabled={convertLoading}
                        onClick={handleConvertToEleve}
                      >
                        {convertLoading ? 'Création en cours…' : (addParentsNow ? '✓ Créer élève + parent(s)' : '✓ Créer l\'élève')}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Identifiants générés ── */}
                {convertResult && (
                  <div className="insc-creds-box">
                    <p className="insc-creds-title">✓ Compte élève créé</p>
                    <p className="insc-creds-row">Identifiant : <strong>{convertResult.identifiant}</strong></p>
                    <p className="insc-creds-row">Mot de passe provisoire : <strong>{convertResult.password}</strong></p>
                  </div>
                )}

                {/* ── Résultats parents (créés, rattachés ou échoués) ── */}
                <ParentResults results={parentResults} />

                {/* ── Gestion parents de l'élève converti (rattacher/détacher) ── */}
                {linkedEleve && (
                  <EleveParentsSection eleveId={linkedEleve.id} />
                )}

                {/* ── Banner activation (compte pas encore actif) ── */}
                {linkedEleve && !linkedEleve.actif && (
                  <div className="insc-status-card pending">
                    <span className="insc-status-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </span>
                    <div className="insc-status-body">
                      <div className="insc-status-title">Compte en attente d'activation</div>
                      <div className="insc-status-desc">
                        Le compte est créé mais l'élève ne peut pas encore se connecter.
                      </div>
                    </div>
                    <button
                      className="insc-status-cta"
                      disabled={activating}
                      onClick={handleActivateEleve}
                    >
                      {activating ? 'Activation…' : "Activer l'accès"}
                    </button>
                  </div>
                )}

                {/* ── Compte actif ── */}
                {linkedEleve && linkedEleve.actif && (
                  <div className="insc-status-card success">
                    <span className="insc-status-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                    <div className="insc-status-body">
                      <div className="insc-status-title">Élève actif</div>
                      <div className="insc-status-desc">L'accès au portail est ouvert.</div>
                    </div>
                  </div>
                )}

                {/* ── Mail envoyé avec identifiants ── */}
                {mailEnvoye && (() => {
                  const href = safeMailtoHref(mailEnvoye);
                  return (
                    <div className="insc-status-card success">
                      <span className="insc-status-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </span>
                      <div className="insc-status-body">
                        <div className="insc-status-title">Identifiants envoyés par email</div>
                        <div className="insc-status-desc">
                          {href ? (
                            <a href={href} className="insc-status-link">{mailEnvoye}</a>
                          ) : (
                            <span className="insc-status-mono">{mailEnvoye}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Pas d'email de contact ── */}
                {mailEnvoye === false && (
                  <div className="insc-status-card warn">
                    <span className="insc-status-icon" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </span>
                    <div className="insc-status-body">
                      <div className="insc-status-title">Aucun email de contact</div>
                      <div className="insc-status-desc">
                        Transmettez les identifiants manuellement au parent (vive voix, SMS ou note papier).
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

