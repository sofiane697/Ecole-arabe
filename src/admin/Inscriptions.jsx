import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { usePageAnimation } from '../shared/usePageAnimation';
import {
  fetchPreinscriptions, updatePreinscriptionStatut, markPreinscriptionViewed,
} from './supabaseAdmin';
import { emitInscriptionsChanged } from './adminEvents';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';

const STATUT_NEXT = { nouveau: 'contacté', contacté: 'inscrit' }; // 'inscrit' = dernier palier
const STATUT_CFG  = {
  nouveau:  { label: 'Non traité', cls: 'badge-nouveau',  icon: '●', color: 'var(--a-yellow)' },
  contacté: { label: 'Traité',     cls: 'badge-contacte', icon: '◐', color: 'var(--a-blue)' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit',  icon: '✓', color: 'var(--a-green)' },
  refusé:   { label: 'Refusé',   cls: 'badge-refuse',   icon: '✕', color: 'var(--a-red)' },
};
const PROGRESS_STEPS = ['nouveau', 'contacté', 'inscrit'];

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
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtreStat, setFiltreStat] = useState('nouveau');
  const [filtrePublic, setFiltrePublic] = useState('tous');
  const [selected,   setSelected]   = useState(null); // préinscription ouverte dans le sheet

  const pageRef    = useRef(null);
  const overlayRef = useRef(null);
  const sheetRef   = useRef(null);
  const closingRef = useRef(false); // garde anti double-fermeture
  usePageAnimation(pageRef, [loading]);

  useEffect(() => {
    fetchPreinscriptions().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Ouverture animée du sheet (overlay fade + panneau qui monte du bas). Verrouille
  // le scroll de fond. Respecte prefers-reduced-motion.
  useLayoutEffect(() => {
    if (!selected || !overlayRef.current || !sheetRef.current) return;
    closingRef.current = false;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
      gsap.fromTo(
        sheetRef.current,
        { yPercent: reduce ? 0 : 100, opacity: reduce ? 0 : 1 },
        { yPercent: 0, opacity: 1, duration: reduce ? 0.25 : 0.45, ease: 'power3.out' }
      );
    });
    return () => { ctx.revert(); document.body.style.overflow = prevOverflow; };
  }, [selected?.id]);

  // Fermeture animée puis démontage. Garde contre les double-clics (croix/overlay).
  const closeSheet = useCallback(() => {
    if (closingRef.current) return;
    const overlay = overlayRef.current, sheet = sheetRef.current;
    const finish = () => setSelected(null);
    if (!overlay || !sheet) { finish(); return; }
    closingRef.current = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tl = gsap.timeline({ onComplete: finish });
    if (reduce) {
      tl.to(overlay, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    } else {
      tl.to(sheet, { yPercent: 100, duration: 0.35, ease: 'power3.in' })
        .to(overlay, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '-=0.2');
    }
  }, []);

  // Échap ferme le sheet.
  useEffect(() => {
    if (!selected) return;
    const handler = (e) => { if (e.key === 'Escape') closeSheet(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, closeSheet]);

  const openInscription = (insc) => {
    setSelected(insc);
    if (insc.statut === 'nouveau' && !insc.viewed_at) {
      setData(prev => prev.map(i => i.id === insc.id ? { ...i, viewed_at: new Date().toISOString() } : i));
      markPreinscriptionViewed(insc.id).then(() => emitInscriptionsChanged()).catch(() => {});
    }
  };

  const setStatut = async (id, current, next) => {
    setData(prev => prev.map(i => i.id === id ? { ...i, statut: next } : i));
    if (selected?.id === id) setSelected(prev => ({ ...prev, statut: next }));
    try {
      await updatePreinscriptionStatut(id, next);
      emitInscriptionsChanged();
    } catch {
      setData(prev => prev.map(i => i.id === id ? { ...i, statut: current } : i));
      if (selected?.id === id) setSelected(prev => ({ ...prev, statut: current }));
    }
  };

  const filtered = data.filter(i => {
    const okStat = filtreStat === 'tous' || i.statut === filtreStat;
    const okPublic = filtrePublic === 'tous'
      || (filtrePublic === 'enfant' ? i.est_enfant : !i.est_enfant);
    return okStat && okPublic;
  });

  const countByStatut = (s) => data.filter(i => i.statut === s).length;
  const getInitials = (p, n) => `${(p || '')[0] || ''}${(n || '')[0] || ''}`.toUpperCase();

  const calcAge = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date(), born = new Date(dateStr);
    let age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
    return age >= 0 ? age : null;
  };
  const formatDateNaissance = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  const formatDate = (dateStr) => {
    const d = new Date(dateStr), now = new Date();
    const hours = Math.floor((now - d) / 3600000), days = Math.floor((now - d) / 86400000);
    if (hours < 1) return "À l'instant";
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };
  const formatFullDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return <div className="text-center p-16 text-a-fg-light">Chargement des préinscriptions...</div>;
  }

  // Toutes les demandes dans une seule liste, triées par nom (puis prénom).
  const sorted = [...filtered].sort((a, b) =>
    (a.eleve_nom || '').localeCompare(b.eleve_nom || '', 'fr', { sensitivity: 'base' })
    || (a.eleve_prenom || '').localeCompare(b.eleve_prenom || '', 'fr', { sensitivity: 'base' })
  );

  return (
    <div ref={pageRef}>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-subtitle">Gérez les demandes de préinscription et leur avancement</p>
        </div>
      </div>

      {/* Stats mini (filtre statut) */}
      <div className="insc-stats">
        {[
          { key: 'nouveau',  label: 'Non traitées', count: countByStatut('nouveau'), color: 'var(--a-yellow)' },
          { key: 'contacté', label: 'Traitées',     count: countByStatut('contacté'),color: 'var(--a-blue)' },
          { key: 'inscrit',  label: 'Inscrites',    count: countByStatut('inscrit'), color: 'var(--a-green)' },
          { key: 'refusé',   label: 'Refusées',     count: countByStatut('refusé'),  color: 'var(--a-red)' },
          { key: 'tous',     label: 'Toutes',       count: data.length,              color: 'var(--a-fg-mid)' },
        ].map(s => (
          <button key={s.key}
            className={`insc-stat ${filtreStat === s.key ? 'active' : ''}`}
            onClick={() => setFiltreStat(s.key)}>
            <span className="insc-stat-count" style={{ color: s.color }}>{s.count}</span>
            <span className="insc-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Filtre type */}
      <div className="insc-filters">
        <select className="admin-filter-select" value={filtrePublic} onChange={e => setFiltrePublic(e.target.value)}>
          <option value="tous">Tous les publics</option>
          <option value="enfant">Enfant</option>
          <option value="adulte">Adulte</option>
        </select>
        <span className="insc-filter-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Liste unique, triée par nom */}
      {sorted.length === 0 ? (
        <div className="insc-empty"><IconUsers /><p>Aucune préinscription trouvée</p></div>
      ) : (
        <div className="insc-block">
          <div className="insc-block-list insc-block-list--single">
            {sorted.map((i) => {
              const s = STATUT_CFG[i.statut] || { label: i.statut, cls: '', color: 'var(--a-fg-mid)' };
              return (
                <div key={i.id} className="insc-item" onClick={() => openInscription(i)}>
                  <div className="insc-item-avatar">{getInitials(i.eleve_prenom, i.eleve_nom)}</div>
                  <div className="insc-item-main">
                    <div className="insc-item-row1">
                      <span className="insc-item-name">{fmtPrenom(i.eleve_prenom)} {fmtNom(i.eleve_nom)}</span>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="insc-item-desc">
                      <span className="insc-desc-matiere">{i.matiere}</span>
                      <span className={`insc-desc-public ${i.est_enfant ? 'is-enfant' : 'is-adulte'}`}>
                        {i.est_enfant ? 'Enfant' : 'Adulte'}
                      </span>
                    </div>
                    <div className="insc-item-meta">
                      <span className="insc-item-price">
                        {i.type === 'devis' ? 'Devis sur mesure' : (i.formule_prix != null ? `${i.formule_prix} €` : 'Formule')}
                      </span>
                      <span className="insc-item-dot" aria-hidden="true">·</span>
                      <span>{formatDate(i.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom sheet (détail + avancement) */}
      {selected && (() => {
        const i = selected;
        const s = STATUT_CFG[i.statut] || { label: i.statut, cls: '', color: 'var(--a-fg-mid)' };
        const next = STATUT_NEXT[i.statut];
        const nextCfg = next ? STATUT_CFG[next] : null;
        const age = calcAge(i.eleve_date_naissance);
        const crumbs = Array.isArray(i.parcours) ? i.parcours : [];
        return (
          <div className="insc-sheet-overlay" ref={overlayRef} onClick={closeSheet}>
            <div className="insc-sheet" ref={sheetRef} onClick={e => e.stopPropagation()}>
              <button className="insc-sheet-close" onClick={closeSheet} aria-label="Fermer le panneau">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* En-tête */}
              <div className="insc-sheet-header">
                <div className="insc-detail-avatar">{getInitials(i.eleve_prenom, i.eleve_nom)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="insc-sheet-title">{fmtPrenom(i.eleve_prenom)} {fmtNom(i.eleve_nom)}</div>
                  <div className="insc-sheet-sub">
                    {i.est_enfant ? 'Enfant' : 'Adulte'}
                    {age != null && ` — ${age} ans`}
                    {i.eleve_date_naissance && ` (né(e) le ${formatDateNaissance(i.eleve_date_naissance)})`}
                  </div>
                </div>
                <span className={`badge ${s.cls}`}>{s.icon} {s.label}</span>
              </div>

              <div className="insc-sheet-body">
                {/* Colonne gauche : parcours + demande + contact */}
                <div className="insc-sheet-col">
                  {crumbs.length > 0 && (
                    <>
                      <p className="insc-detail-section-title">Parcours choisi</p>
                      <p className="insc-detail-path">
                        {crumbs.map((c, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="insc-detail-path-sep"> › </span>}
                            {idx === crumbs.length - 1 ? <b>{c}</b> : c}
                          </React.Fragment>
                        ))}
                      </p>
                    </>
                  )}

                  <p className="insc-detail-section-title">Demande</p>
                  <div className="insc-detail-grid">
                    {i.type === 'tarif' ? (
                      <>
                        <div className="insc-detail-field">
                          <span className="insc-detail-field-label">Formule</span>
                          <span className="insc-detail-field-value">{i.formule_nom || i.matiere || '—'}</span>
                        </div>
                        <div className="insc-detail-field">
                          <span className="insc-detail-field-label">Tarif</span>
                          <span className="insc-detail-field-value">{i.formule_prix != null ? `${i.formule_prix} €` : '—'}</span>
                        </div>
                        {i.formule_rythme && (
                          <div className="insc-detail-field">
                            <span className="insc-detail-field-label">Rythme</span>
                            <span className="insc-detail-field-value">{i.formule_rythme}</span>
                          </div>
                        )}
                        {Array.isArray(i.disponibilites) && i.disponibilites.length > 0 && (
                          <div className="insc-detail-field">
                            <span className="insc-detail-field-label">Disponibilités</span>
                            <span className="insc-detail-field-value">{i.disponibilites.join(' · ')}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="insc-detail-field">
                          <span className="insc-detail-field-label">Type</span>
                          <span className="insc-detail-field-value">Devis sur mesure</span>
                        </div>
                        {i.devis_sujet && (
                          <div className="insc-detail-field">
                            <span className="insc-detail-field-label">Sujet</span>
                            <span className="insc-detail-field-value">{i.devis_sujet}</span>
                          </div>
                        )}
                        {i.devis_besoin && (
                          <div className="insc-detail-field">
                            <span className="insc-detail-field-label">Besoin exprimé</span>
                            <span className="insc-detail-field-value insc-detail-field-text">{i.devis_besoin}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <p className="insc-detail-section-title">{i.est_enfant ? 'Parent (responsable)' : 'Contact'}</p>
                  <div className="insc-detail-grid">
                    {(i.contact_prenom || i.contact_nom) && (
                      <div className="insc-detail-field">
                        <span className="insc-detail-field-label">Nom</span>
                        <span className="insc-detail-field-value">{fmtPrenom(i.contact_prenom)} {fmtNom(i.contact_nom)}</span>
                      </div>
                    )}
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Téléphone</span>
                      <span className="insc-detail-field-value">
                        <a href={`tel:${i.contact_telephone}`} className="text-a-blue no-underline">{i.contact_telephone}</a>
                      </span>
                    </div>
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Email</span>
                      <span className="insc-detail-field-value">
                        <a href={`mailto:${i.contact_email}`} className="text-a-blue no-underline">{i.contact_email}</a>
                      </span>
                    </div>
                    <div className="insc-detail-field">
                      <span className="insc-detail-field-label">Reçue le</span>
                      <span className="insc-detail-field-value insc-detail-field-date">
                        <IconClock /> {formatFullDate(i.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Colonne droite : avancement + actions + conversion (à venir) */}
                <div className="insc-sheet-col">
                  <p className="insc-detail-section-title">Avancement</p>
                  {i.statut === 'refusé' ? (
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.2)]">
                      <span className="text-a-red text-base">✕</span>
                      <span className="text-a-red font-semibold text-sm">Préinscription refusée</span>
                    </div>
                  ) : (
                    <div className="insc-progress">
                      {PROGRESS_STEPS.map((step, idx) => {
                        const cfg = STATUT_CFG[step];
                        const currentIdx = PROGRESS_STEPS.indexOf(i.statut);
                        const isDone = idx <= currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <React.Fragment key={step}>
                            <div className={`insc-progress-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                              <div className="insc-progress-dot" style={{ borderColor: isDone ? cfg.color : 'var(--a-border)', background: isDone ? cfg.color : 'transparent' }}>
                                {isDone && <span className="text-white text-[0.6rem]">✓</span>}
                              </div>
                              <span className="insc-progress-label" style={{ color: isDone ? cfg.color : 'var(--a-fg-light)' }}>{cfg.label}</span>
                            </div>
                            {idx < PROGRESS_STEPS.length - 1 && (
                              <div className="insc-progress-line" style={{ background: idx < currentIdx ? cfg.color : 'var(--a-border)' }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  <div className="insc-detail-actions">
                    {i.statut === 'refusé' ? (
                      <button className="msg-action-primary" onClick={() => setStatut(i.id, i.statut, 'nouveau')}>
                        Remettre en traitement <IconArrow />
                      </button>
                    ) : (
                      <>
                        {nextCfg && (
                          <button className="msg-action-primary" onClick={() => setStatut(i.id, i.statut, next)}>
                            Passer à : {nextCfg.label} <IconArrow />
                          </button>
                        )}
                        <button className="msg-action-danger" onClick={() => setStatut(i.id, i.statut, 'refusé')}>
                          ✕ Refuser
                        </button>
                      </>
                    )}
                  </div>

                  {/* Conversion élève/parent : prévue, branchée plus tard */}
                  <div className="insc-sheet-soon">
                    <span className="insc-sheet-soon-title">↪ Créer l'élève + le parent</span>
                    <span>Disponible prochainement.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
