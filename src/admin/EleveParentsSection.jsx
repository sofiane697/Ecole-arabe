// ─── Section réutilisable « Parents rattachés » à afficher dans la fiche élève
// Utilise les RPC admin_fetch_parents_of_eleve / admin_unlink_parent_eleve
// et le modal AttachParentModal pour la recherche-d'abord / création-si-besoin.
import React, { useState, useEffect, useCallback } from 'react';
import {
  adminFetchParentsOfEleve, adminUnlinkParentEleve, adminLinkParentEleve,
  adminFetchParentsPaginated, adminCreateParentStandalone,
} from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import { generateIdentifiant, generateTempPassword, normalizeTelephone, formatFoyer, getParentInitials } from './adminUtils';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';

const IconPlus   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconUnlink = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 17 5-5"/><path d="M16 4 15 5"/><path d="m11.41 8.59 5.17 5.17a3 3 0 1 0 4.24-4.24L15.83 4.34"/><path d="M8.17 15.66 2.88 10.37a3 3 0 1 1 4.24-4.24l5.17 5.17"/></svg>;
const IconLink   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

// Libellés conviviaux pour le champ `lien` de parent_eleves.
const LIEN_OPTIONS = [
  { value: 'parents',     label: 'Parents' },
  { value: 'tuteur',      label: 'Tuteur légal' },
  { value: 'grand-parent',label: 'Grand-parent' },
  { value: 'autre',       label: 'Autre' },
];
function formatLien(lien) {
  const opt = LIEN_OPTIONS.find(o => o.value === lien);
  return opt ? opt.label : lien;
}

export default function EleveParentsSection({ eleveId, onChanged }) {
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState(null);

  const reload = useCallback(async () => {
    if (!eleveId) return;
    setLoading(true);
    try { setParents(await adminFetchParentsOfEleve(eleveId)); }
    catch { setParents([]); }
    finally { setLoading(false); }
  }, [eleveId]);

  // Au montage / changement d'élève : fetch avec flag cancelled pour ignorer
  // les résultats tardifs si l'admin navigue vers un autre élève entre-temps.
  useEffect(() => {
    if (!eleveId) return;
    let cancelled = false;
    setLoading(true);
    adminFetchParentsOfEleve(eleveId)
      .then(data => { if (!cancelled) setParents(data || []); })
      .catch(() => { if (!cancelled) setParents([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [eleveId]);

  const handleUnlink = async (parent) => {
    try {
      await adminUnlinkParentEleve(parent.id, eleveId);
      setUnlinkConfirm(null);
      reload();
      onChanged?.();
    } catch (e) {
      // Forme fonctionnelle : évite la stale closure.
      setUnlinkConfirm(prev => prev ? { ...prev, error: e.message } : null);
    }
  };

  return (
    <section className="parent-detail-section" style={{ marginTop: '1.75rem', marginBottom: '1.75rem' }}>
      <header className="parent-detail-section-head">
        <h3 className="parent-detail-section-title">
          Parents rattachés
          <span className="parent-detail-section-count">{parents.length}</span>
        </h3>
        <button className="parent-detail-attach-btn" onClick={() => setAttachModalOpen(true)}>
          <IconPlus /> <span>Ajouter un parent</span>
        </button>
      </header>

      {loading ? null : parents.length === 0 ? (
        <div className="parent-detail-empty">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          <p>Aucun parent rattaché à cet élève</p>
          <span>Cliquez sur « Ajouter un parent » pour rechercher un parent existant ou en créer un nouveau.</span>
        </div>
      ) : (
        <ul className="parent-detail-eleves">
          {parents.map(p => {
            const label    = formatFoyer(p) || '—';
            const initials = getParentInitials(p);
            const lienLabel = p.lien && p.lien !== 'parents' ? formatLien(p.lien) : null;
            return (
              <li key={p.id} className="parent-detail-eleve">
                <div className="parent-detail-eleve-avatar parent-variant" aria-hidden="true">
                  <span>{initials}</span>
                </div>
                <div className="parent-detail-eleve-info">
                  <div className="parent-detail-eleve-name" title={label}>
                    {label}
                  </div>
                  <div className="parent-detail-eleve-meta">
                    <span className="parent-detail-eleve-ident">{p.identifiant}</span>
                    {p.email && (
                      <>
                        <span className="parent-detail-sep-dot" aria-hidden="true" />
                        <span className="parent-detail-eleve-email">{p.email}</span>
                      </>
                    )}
                    {lienLabel && (
                      <>
                        <span className="parent-detail-sep-dot" aria-hidden="true" />
                        <span className="parent-detail-eleve-lien-chip">{lienLabel}</span>
                      </>
                    )}
                    {p.actif === false && (
                      <>
                        <span className="parent-detail-sep-dot" aria-hidden="true" />
                        <span className="parent-detail-eleve-inactif">Compte inactif</span>
                      </>
                    )}
                    {p.must_change_password && p.actif !== false && (
                      <>
                        <span className="parent-detail-sep-dot" aria-hidden="true" />
                        <span className="parent-detail-eleve-warn">Mdp temporaire</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="parent-detail-detach-btn"
                  onClick={() => setUnlinkConfirm(p)}
                  title={`Détacher ${label} de l'élève (n'efface pas le compte parent)`}
                  aria-label={`Détacher ${label}`}
                >
                  <IconUnlink />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {attachModalOpen && (
        <AttachParentModal
          eleveId={eleveId}
          existingParentIds={parents.map(p => p.id)}
          onClose={() => setAttachModalOpen(false)}
          onLinked={() => { setAttachModalOpen(false); reload(); onChanged?.(); }}
        />
      )}

      {unlinkConfirm && (
        <ConfirmModal
          title="Détacher ce parent de l'élève ?"
          message={(
            <>
              <p className="mb-1">Le parent ne verra plus les informations de cet élève au portail.</p>
              <p className="mb-0">Son compte reste actif et rattaché à ses éventuels autres enfants.</p>
              {unlinkConfirm.error && <p className="text-a-red mt-2">{unlinkConfirm.error}</p>}
            </>
          )}
          confirmLabel="Détacher"
          danger
          onConfirm={() => handleUnlink(unlinkConfirm)}
          onCancel={() => setUnlinkConfirm(null)}
        />
      )}
    </section>
  );
}

// ─── Modal : recherche parent existant OU création d'un nouveau ────────────
function AttachParentModal({ eleveId, existingParentIds, onClose, onLinked }) {
  const [mode, setMode]         = useState('search'); // 'search' | 'create'
  const [lien, setLien]         = useState('parents');
  const [search, setSearch]     = useState('');
  const [results, setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking]   = useState(false);
  const [error, setError]       = useState('');

  // Debounce recherche + filtrage cross-render stable via join des ids
  // (sinon `new Set(...)` serait recréé à chaque render et relancerait le useEffect en boucle).
  const existingIdsKey = (existingParentIds || []).join(',');
  useEffect(() => {
    if (mode !== 'search') return;
    const q = search.trim();
    if (q.length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await adminFetchParentsPaginated({ search: q, limit: 10, offset: 0 });
        if (cancelled) return;
        const excluded = new Set(existingIdsKey ? existingIdsKey.split(',') : []);
        setResults((data || []).filter(p => !excluded.has(p.id)));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, mode, existingIdsKey]);

  const handleLink = async (parentId) => {
    setLinking(true); setError('');
    try {
      await adminLinkParentEleve(parentId, eleveId, lien);
      onLinked();
    } catch (e) {
      setError(e.message); setLinking(false);
    }
  };

  return (
    <div className="a-modal-overlay" onClick={onClose}>
      <div className="a-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="a-modal-title">
          {mode === 'search' ? 'Rattacher un parent' : 'Créer un nouveau parent'}
        </div>

        <div className="a-modal-field mb-3">
          <label className="a-modal-label">Type de lien</label>
          <select
            className="a-modal-input cursor-pointer"
            value={lien}
            onChange={e => setLien(e.target.value)}
          >
            {LIEN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {mode === 'search' ? (
          <>
            <div className="a-search-wrap mb-3">
              <span className="a-search-icon"><IconSearch /></span>
              <input
                className="a-search-input"
                placeholder="Rechercher par nom, email, téléphone ou identifiant…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            {error && <div className="mb-2 px-3 py-2 rounded-lg text-sm text-a-red bg-[rgba(240,85,85,0.08)] border border-[rgba(240,85,85,0.28)]">{error}</div>}

            <div className="max-h-[45vh] overflow-y-auto flex flex-col gap-1.5 mb-3">
              {search.trim().length < 2 ? (
                <div className="text-sm text-a-fg-mid italic p-4 text-center">
                  Tapez au moins 2 caractères pour rechercher un parent existant…
                </div>
              ) : searching ? (
                <div className="text-sm text-a-fg-mid italic p-4 text-center">Recherche…</div>
              ) : results.length === 0 ? (
                <div className="text-sm text-a-fg-mid italic p-4 text-center">
                  Aucun parent trouvé pour « {search} ».
                </div>
              ) : (
                results.map(p => {
                  const label = formatFoyer(p) || '—';
                  const initials = getParentInitials(p);
                  const nbEnfants = Array.isArray(p.enfants) ? p.enfants.length : 0;
                  return (
                    <button
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-a-bg border border-a-border hover:border-a-gold cursor-pointer text-left transition-colors"
                      onClick={() => handleLink(p.id)}
                      disabled={linking}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="a-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-a-fg truncate">{label}</div>
                          <div className="text-xs text-a-fg-mid truncate">
                            <span className="font-a-mono">{p.identifiant}</span>
                            {p.email && <> · {p.email}</>}
                            {nbEnfants > 0 && <> · {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''}</>}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-a-gold flex items-center gap-1 flex-shrink-0"><IconLink /> Rattacher</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-a-border pt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-a-fg-mid">Aucun résultat ne correspond ?</span>
              <button
                className="a-action-btn gold"
                onClick={() => setMode('create')}
                disabled={linking}
              >
                <IconPlus /> Créer un nouveau parent
              </button>
            </div>

            <div className="a-modal-btns">
              <button className="a-modal-btn-cancel" onClick={onClose} disabled={linking}>Fermer</button>
            </div>
          </>
        ) : (
          <CreateAndLinkForm
            eleveId={eleveId}
            lien={lien}
            onBack={() => setMode('search')}
            onCancel={onClose}
            onCreated={onLinked}
          />
        )}
      </div>
    </div>
  );
}

// ─── Formulaire de création + rattachement automatique ─────────────────────
function CreateAndLinkForm({ eleveId, lien = 'parents', onBack, onCancel, onCreated }) {
  const [has_pere, setHasPere] = useState(true);
  const [has_mere, setHasMere] = useState(true);
  const [pere_nom, setPereNom] = useState('');
  const [pere_prenom, setPerePrenom] = useState('');
  const [mere_nom, setMereNom] = useState('');
  const [mere_prenom, setMerePrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!has_pere && !has_mere) { setError('Renseigne au moins un parent (père ou mère).'); return; }
    if (has_pere && (!pere_nom.trim() || !pere_prenom.trim())) { setError('Nom et prénom du père requis.'); return; }
    if (has_mere && (!mere_nom.trim() || !mere_prenom.trim())) { setError('Nom et prénom de la mère requis.'); return; }
    if (!email.trim()) { setError('Email requis.'); return; }
    if (!telephone.trim()) { setError('Téléphone requis.'); return; }

    setLoading(true);
    try {
      const principalPrenom = has_pere ? pere_prenom : mere_prenom;
      const principalNom    = has_pere ? pere_nom    : mere_nom;
      const identifiant = generateIdentifiant(principalPrenom, principalNom).toLowerCase();
      const tempPassword = generateTempPassword();

      const parentId = await adminCreateParentStandalone({
        identifiant,
        password: tempPassword,
        pere_nom:    has_pere ? fmtNom(pere_nom) : null,
        pere_prenom: has_pere ? fmtPrenom(pere_prenom) : null,
        mere_nom:    has_mere ? fmtNom(mere_nom) : null,
        mere_prenom: has_mere ? fmtPrenom(mere_prenom) : null,
        email:       email.trim(),
        telephone:   normalizeTelephone(telephone),
      });

      // Rattachement immédiat à l'élève courant avec le lien choisi en amont
      await adminLinkParentEleve(parentId, eleveId, lien);
      onCreated();
    } catch (e) {
      setError(e.message); setLoading(false);
    }
  };

  const chip = (active, onClick, label) => (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-semibold transition-colors"
      style={{
        borderColor: active ? 'var(--a-gold)' : 'var(--a-border)',
        background: active ? 'rgba(191,138,48,0.09)' : 'var(--a-bg)',
        color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="flex gap-2 mb-3">
        {chip(has_pere, () => setHasPere(v => !v), 'Père')}
        {chip(has_mere, () => setHasMere(v => !v), 'Mère')}
      </div>

      {has_pere && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="a-modal-field">
            <label className="a-modal-label">Prénom du père</label>
            <input className="a-modal-input" value={pere_prenom} onChange={e => setPerePrenom(e.target.value)} placeholder="Jean" />
          </div>
          <div className="a-modal-field">
            <label className="a-modal-label">Nom du père</label>
            <input className="a-modal-input" value={pere_nom} onChange={e => setPereNom(e.target.value)} placeholder="Dupont" />
          </div>
        </div>
      )}

      {has_mere && (
        <div className="grid grid-cols-2 gap-3 mb-2">
          <div className="a-modal-field">
            <label className="a-modal-label">Prénom de la mère</label>
            <input className="a-modal-input" value={mere_prenom} onChange={e => setMerePrenom(e.target.value)} placeholder="Marie" />
          </div>
          <div className="a-modal-field">
            <label className="a-modal-label">Nom de la mère</label>
            <input className="a-modal-input" value={mere_nom} onChange={e => setMereNom(e.target.value)} placeholder="Dupont" />
          </div>
        </div>
      )}

      <div className="a-modal-field">
        <label className="a-modal-label">Email</label>
        <input type="email" className="a-modal-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@exemple.com" />
      </div>
      <div className="a-modal-field">
        <label className="a-modal-label">Téléphone</label>
        <input type="tel" className="a-modal-input" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+33 6 12 34 56 78" />
      </div>

      {error && <div className="mb-2 px-3 py-2 rounded-lg text-sm text-a-red bg-[rgba(240,85,85,0.08)] border border-[rgba(240,85,85,0.28)]">{error}</div>}

      <div className="text-xs text-a-fg-mid mb-3">
        Le compte parent sera créé et automatiquement rattaché à cet élève.
      </div>

      <div className="a-modal-btns">
        <button className="a-modal-btn-cancel" onClick={onBack} disabled={loading}>← Retour à la recherche</button>
        <button className="a-modal-btn-cancel" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className="a-modal-btn-save" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Création…' : 'Créer & rattacher'}
        </button>
      </div>
    </>
  );
}
