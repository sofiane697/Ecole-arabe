import React, { useState, useEffect, useCallback } from 'react';
import {
  adminFetchParentsPaginated, adminCreateParentStandalone,
  adminUpdateParent, adminDeleteParent,
  adminFetchElevesOfParent, adminUnlinkParentEleve,
  adminResetParentPassword, adminLinkParentEleve,
  fetchEleves, fetchAllClasses,
} from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import { generateIdentifiant, generateTempPassword, normalizeTelephone, formatFoyer, safeMailtoHref, safeTelHref, getParentInitials } from './adminUtils';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';
import { motion, staggerContainer, fadeUp } from '../animations';

const PAGE_SIZE = 25;

// ─── Icônes ─────────────────────────────────────────────────────────────────
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconKey   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IconBack  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconSearch = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconLink  = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const IconUnlink = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 17 5-5"/><path d="m7 21 1-1"/><path d="M16 4 15 5"/><path d="m11.41 8.59 5.17 5.17a3 3 0 1 0 4.24-4.24L15.83 4.34"/><path d="M8.17 15.66 2.88 10.37a3 3 0 1 1 4.24-4.24l5.17 5.17"/></svg>;
const IconUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ─── Classes Tailwind réutilisables (mêmes que Enseignants.jsx) ─────────────
const CLS = {
  page:         'min-h-full',
  header:       'a-section-header',
  headerLeft:   'a-section-meta',
  addBtn:       'a-add-btn',
  grid:         'ens-grid',
  card:         'a-card',
  cardTop:      'a-card-head',
  avatar:       'a-avatar',
  name:         'a-card-name',
  sub:          'a-card-sub',
  sectionLabel: 'a-card-section-label',
  empty:        'a-empty',
  overlay:      'a-modal-overlay',
  modal:        'a-modal',
  modalTitle:   'a-modal-title',
  field:        'a-modal-field',
  label:        'a-modal-label',
  input:        'a-modal-input',
  btnRow:       'a-modal-btns',
  btnCancel:    'a-modal-btn-cancel',
  btnSave:      'a-modal-btn-save',
  actions:      'a-card-actions',
};

// ─── Composant principal ───────────────────────────────────────────────────
export default function Parents() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(0);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // parent détail
  const [modal, setModal]     = useState(null);   // 'create' | null
  const [confirm, setConfirm] = useState(null);
  const [createResult, setCreateResult] = useState(null);
  const [resetResult, setResetResult]   = useState(null);

  // Source unique de vérité pour le fetch : helper réutilisable par le useEffect
  // (initial + changement de search/page) ET les handlers post-action (create/delete).
  // Le compteur `reloadTick` permet à n'importe quel appelant de re-déclencher
  // le useEffect sans dupliquer la logique de fetch.
  const [reloadTick, setReloadTick] = useState(0);
  const reload = useCallback(() => setReloadTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminFetchParentsPaginated({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE })
      .then(data => {
        if (cancelled) return;
        setRows(data || []);
        setTotal(data && data.length > 0 ? Number(data[0].total_count || 0) : 0);
      })
      .catch(() => { if (!cancelled) { setRows([]); setTotal(0); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, page, reloadTick]);

  // Debounce recherche
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreated = (result) => {
    setCreateResult(result);
    setModal(null);
    reload();
  };

  const handleDelete = async (p) => {
    try {
      await adminDeleteParent(p.id);
      setConfirm(null);
      reload();
    } catch (e) {
      // Forme fonctionnelle : évite la stale closure si plusieurs clics rapides.
      setConfirm(prev => prev ? { ...prev, error: e.message } : null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Modals globaux (createResult / resetResult) rendus au niveau racine pour
  // rester visibles aussi bien en vue liste qu'en vue détail.
  const globalModals = (
    <>
      {createResult && (
        <CredentialsModal result={createResult} onClose={() => setCreateResult(null)} kind="create" />
      )}
      {resetResult && (
        <CredentialsModal result={resetResult} onClose={() => setResetResult(null)} kind="reset" />
      )}
    </>
  );

  if (selected) {
    return (
      <>
        <ParentDetail
          parent={selected}
          onBack={() => { setSelected(null); reload(); }}
          onChanged={reload}
          onResetResult={setResetResult}
        />
        {globalModals}
      </>
    );
  }

  return (
    <motion.div className={CLS.page} variants={staggerContainer} initial="initial" animate="animate">
      <motion.div className={CLS.header} variants={fadeUp}>
        <div className={CLS.headerLeft}>
          <span>{total} parent{total > 1 ? 's' : ''}</span>
        </div>
        <button className={CLS.addBtn} onClick={() => setModal('create')}>
          <IconPlus /> Nouveau parent
        </button>
      </motion.div>

      {/* Recherche */}
      <motion.div variants={fadeUp} className="a-search-wrap" style={{ marginBottom: '1.75rem' }}>
        <span className="a-search-icon"><IconSearch /></span>
        <input
          className="a-search-input"
          placeholder="Rechercher par nom, email, téléphone ou identifiant…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </motion.div>

      {loading ? null : rows.length === 0 ? (
        <motion.div variants={fadeUp} className={CLS.empty}>
          {search ? 'Aucun parent trouvé pour cette recherche.' : 'Aucun parent enregistré. Créez-en un avec le bouton ci-dessus.'}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className={CLS.grid} style={{ gap: '1.25rem' }}>
          {rows.map(p => (
            <ParentCard
              key={p.id}
              parent={p}
              onOpen={() => setSelected(p)}
              onDelete={() => setConfirm({ parent: p })}
            />
          ))}
        </motion.div>
      )}

      {pageCount > 1 && (
        <div className="a-pagination">
          <button className="a-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Précédent</button>
          <span className="a-page-info">{page + 1} / {pageCount}</span>
          <button className="a-page-btn" disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>Suivant →</button>
        </div>
      )}

      {modal === 'create' && (
        <CreateParentModal onClose={() => setModal(null)} onCreated={handleCreated} />
      )}

      {globalModals}

      {confirm && (
        <ConfirmModal
          title="Supprimer ce parent ?"
          message={
            <>
              <p className="mb-2">Cette action est irréversible.</p>
              {confirm.error && <p className="text-a-red">{confirm.error}</p>}
            </>
          }
          confirmLabel="Supprimer"
          danger
          onConfirm={() => handleDelete(confirm.parent)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </motion.div>
  );
}

// ─── Carte parent (liste) — design "editorial refined" ──────────────────────
// La carte entière est cliquable (onOpen). Les actions internes (bouton
// supprimer, liens email/tel) font `stopPropagation` pour ne pas déclencher
// l'ouverture. Le bouton supprimer est fantôme (opacity 0 au repos, visible
// au hover) pour ne pas dominer visuellement.
function ParentCard({ parent, onOpen, onDelete }) {
  const label     = formatFoyer(parent) || '—';
  const enfants   = Array.isArray(parent.enfants) ? parent.enfants : [];
  const nbEnfants = enfants.length;
  const initials  = getParentInitials(parent);
  const mailHref  = safeMailtoHref(parent.email);
  const telHref   = safeTelHref(parent.telephone);
  const isInactif = parent.actif === false;
  const needsPwdChange = parent.must_change_password;

  // Affichage compact prénom + nom formatés pour la ligne d'aperçu
  // ex: "Sofiane JOUDI · Lina JOUDI · Yasmine JOUDI"
  const enfantsPreview = enfants.slice(0, 3)
    .map(e => `${fmtPrenom(e.prenom || '')} ${fmtNom(e.nom || '')}`.trim())
    .filter(Boolean)
    .join(' · ');
  const enfantsExtra   = nbEnfants > 3 ? ` · +${nbEnfants - 3}` : '';

  return (
    <div
      className="parent-card"
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ouvrir la fiche de ${label}`}
    >
      {/* Hairline dorée révélée au hover */}
      <span className="parent-card-accent" aria-hidden="true" />

      {/* ─── Header : avatar + identité + bouton fantôme supprimer ─── */}
      <div className="parent-card-head">
        <div className="parent-card-avatar" aria-hidden="true">
          <span>{initials}</span>
        </div>

        <div className="parent-card-identity">
          <div className="parent-card-name" title={label}>{label}</div>
          <div className="parent-card-meta">
            <span className="parent-card-ident">{parent.identifiant}</span>
            {isInactif && (
              <>
                <span className="parent-card-sep" aria-hidden="true" />
                <span className="parent-card-status inactif" title="Compte désactivé — le parent ne peut pas se connecter">
                  <span className="parent-card-status-dot" aria-hidden="true" />
                  Inactif
                </span>
              </>
            )}
            {!isInactif && needsPwdChange && (
              <>
                <span className="parent-card-sep" aria-hidden="true" />
                <span className="parent-card-status warn" title="Doit changer son mdp à la prochaine connexion">
                  <span className="parent-card-status-dot" aria-hidden="true" />
                  Mdp temporaire
                </span>
              </>
            )}
          </div>
        </div>

        <button
          className="parent-card-ghost-btn"
          onClick={e => { e.stopPropagation(); if (nbEnfants === 0) onDelete(); }}
          disabled={nbEnfants > 0}
          aria-label={nbEnfants > 0 ? 'Impossible de supprimer : détachez d\'abord les enfants' : `Supprimer ${label}`}
          title={nbEnfants > 0 ? 'Détachez d\'abord les enfants' : 'Supprimer'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      {/* ─── Contacts : icône + texte tronqué, cliquable, stopPropagation ─── */}
      <div className="parent-card-contacts">
        {parent.email ? (
          mailHref ? (
            <a
              className="parent-card-contact"
              href={mailHref}
              onClick={e => e.stopPropagation()}
              title={parent.email}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="m3 7 9 6 9-6"/>
              </svg>
              <span>{parent.email}</span>
            </a>
          ) : (
            <span className="parent-card-contact" title={parent.email}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="m3 7 9 6 9-6"/>
              </svg>
              <span>{parent.email}</span>
            </span>
          )
        ) : null}

        {parent.telephone && (
          telHref ? (
            <a
              className="parent-card-contact"
              href={telHref}
              onClick={e => e.stopPropagation()}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{parent.telephone}</span>
            </a>
          ) : (
            <span className="parent-card-contact">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>{parent.telephone}</span>
            </span>
          )
        )}
      </div>

      {/* ─── Enfants : zone teintée + stack d'avatars overlap (façon Linear) ─── */}
      <div className={`parent-card-enfants${nbEnfants === 0 ? ' empty' : ''}`}>
        {nbEnfants === 0 ? (
          <div className="parent-card-enfants-empty-row">
            <span className="parent-card-enfants-empty-dot" aria-hidden="true" />
            <span>Aucun enfant rattaché</span>
          </div>
        ) : (
          <>
            <div className="parent-card-enfants-header">
              <div className="parent-card-enfants-stack" aria-hidden="true">
                {enfants.slice(0, 4).map((e, i) => {
                  const chip = ((e.prenom || '')[0] || '') + ((e.nom || '')[0] || '');
                  return (
                    <span key={e.eleve_id} className="parent-card-eleve-chip" style={{ zIndex: 5 - i }}>
                      {chip.toUpperCase() || '?'}
                    </span>
                  );
                })}
                {nbEnfants > 4 && (
                  <span className="parent-card-eleve-chip more" style={{ zIndex: 0 }}>
                    +{nbEnfants - 4}
                  </span>
                )}
              </div>
              <span className="parent-card-enfants-count">
                {nbEnfants} enfant{nbEnfants > 1 ? 's' : ''}
              </span>
            </div>
            <div className="parent-card-enfants-names" title={enfants.map(e => `${fmtPrenom(e.prenom)} ${fmtNom(e.nom)}`).join(', ')}>
              {enfantsPreview}{enfantsExtra}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Fiche détail d'un parent ──────────────────────────────────────────────
function ParentDetail({ parent: initialParent, onBack, onChanged, onResetResult }) {
  const [parent, setParent] = useState(initialParent);
  const [enfants, setEnfants] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    pere_nom: parent.pere_nom || '', pere_prenom: parent.pere_prenom || '',
    mere_nom: parent.mere_nom || '', mere_prenom: parent.mere_prenom || '',
    email: parent.email || '', telephone: parent.telephone || '',
    actif: parent.actif !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [linkModal, setLinkModal] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [unlinkConfirm, setUnlinkConfirm] = useState(null);

  const reloadEnfants = useCallback(async () => {
    try { setEnfants(await adminFetchElevesOfParent(parent.id)); }
    catch { setEnfants([]); }
  }, [parent.id]);

  useEffect(() => { reloadEnfants(); }, [reloadEnfants]);

  const handleSave = async () => {
    setSaving(true); setError('');
    // Normalisation UNE SEULE FOIS → payload envoyé à la RPC ET état local
    // cohérent (sinon l'affichage diverge de la DB tant qu'on ne recharge pas).
    // La RPC appelle aussi normalize_phone côté SQL (idempotent).
    const normalized = {
      pere_nom:    fmtNom(form.pere_nom) || null,
      pere_prenom: fmtPrenom(form.pere_prenom) || null,
      mere_nom:    fmtNom(form.mere_nom) || null,
      mere_prenom: fmtPrenom(form.mere_prenom) || null,
      email:       form.email.trim(),
      telephone:   normalizeTelephone(form.telephone),
      actif:       form.actif,
    };
    try {
      await adminUpdateParent(parent.id, normalized);
      setParent(prev => ({ ...prev, ...normalized }));
      setEditMode(false);
      onChanged?.();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const handleReset = async () => {
    const newPwd = generateTempPassword();
    try {
      await adminResetParentPassword(parent.id, newPwd);
      onResetResult?.({ identifiant: parent.identifiant, tempPassword: newPwd, foyerLabel: formatFoyer(parent) });
      setResetConfirm(false);
    } catch (e) { setError(e.message); }
  };

  const handleUnlink = async (eleveId) => {
    try {
      await adminUnlinkParentEleve(parent.id, eleveId);
      setUnlinkConfirm(null);
      reloadEnfants();
      onChanged?.();
    } catch (e) { setError(e.message); }
  };

  const foyerLabel = formatFoyer(parent) || '—';
  const pereLine = (parent.pere_prenom || parent.pere_nom)
    ? `${fmtPrenom(parent.pere_prenom || '')} ${fmtNom(parent.pere_nom || '')}`.trim()
    : '';
  const mereLine = (parent.mere_prenom || parent.mere_nom)
    ? `${fmtPrenom(parent.mere_prenom || '')} ${fmtNom(parent.mere_nom || '')}`.trim()
    : '';
  const mailHref = safeMailtoHref(parent.email);
  const telHref  = safeTelHref(parent.telephone);

  return (
    <motion.div className="parent-detail" variants={staggerContainer} initial="initial" animate="animate">

      {/* ─── Breadcrumb ── */}
      <motion.button className="parent-detail-back" onClick={onBack} variants={fadeUp}>
        <IconBack /> <span>Retour à la liste</span>
      </motion.button>

      {/* ─── Hero header : avatar XL + identité + actions ─── */}
      <motion.section className="parent-detail-hero" variants={fadeUp}>
        <span className="parent-detail-hero-accent" aria-hidden="true" />

        <div className="parent-detail-hero-avatar" aria-hidden="true">
          <span>{getParentInitials(parent)}</span>
        </div>

        <div className="parent-detail-hero-identity">
          <h2 className="parent-detail-hero-name">{foyerLabel}</h2>
          <div className="parent-detail-hero-meta">
            <span className="parent-detail-hero-ident">{parent.identifiant}</span>
            {parent.actif === false && (
              <span className="parent-detail-chip inactif" title="Compte désactivé — le parent ne peut pas se connecter">
                <span className="parent-detail-chip-dot" aria-hidden="true" /> Inactif
              </span>
            )}
            {parent.must_change_password && parent.actif !== false && (
              <span className="parent-detail-chip warn" title="Le parent doit changer son mot de passe à la prochaine connexion">
                <span className="parent-detail-chip-dot" aria-hidden="true" /> Mdp temporaire
              </span>
            )}
          </div>
        </div>

        {!editMode && (
          <div className="parent-detail-hero-actions">
            <button className="parent-detail-action-btn gold" onClick={() => setEditMode(true)} aria-label="Modifier le parent">
              <IconEdit /> <span>Modifier</span>
            </button>
            <button className="parent-detail-action-btn blue" onClick={() => setResetConfirm(true)} aria-label="Réinitialiser le mot de passe">
              <IconKey /> <span>Reset mdp</span>
            </button>
          </div>
        )}
      </motion.section>

      {error && (
        <motion.div className="parent-detail-error" variants={fadeUp}>
          <span aria-hidden="true">✕</span>
          <span>{error}</span>
        </motion.div>
      )}

      {/* ─── Coordonnées ─── */}
      <motion.section className="parent-detail-section" variants={fadeUp}>
        <header className="parent-detail-section-head">
          <h3 className="parent-detail-section-title">Coordonnées</h3>
        </header>

        {editMode ? (
          <div className="parent-detail-edit-form">
            <div className="parent-detail-edit-grid">
              <div className={CLS.field}>
                <label className={CLS.label}>Prénom du père</label>
                <input className={CLS.input} value={form.pere_prenom} onChange={e => setForm(f => ({ ...f, pere_prenom: e.target.value }))} placeholder="Jean" />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Nom du père</label>
                <input className={CLS.input} value={form.pere_nom} onChange={e => setForm(f => ({ ...f, pere_nom: e.target.value }))} placeholder="Dupont" />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Prénom de la mère</label>
                <input className={CLS.input} value={form.mere_prenom} onChange={e => setForm(f => ({ ...f, mere_prenom: e.target.value }))} placeholder="Marie" />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Nom de la mère</label>
                <input className={CLS.input} value={form.mere_nom} onChange={e => setForm(f => ({ ...f, mere_nom: e.target.value }))} placeholder="Dupont" />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Email</label>
                <input type="email" className={CLS.input} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className={CLS.field}>
                <label className={CLS.label}>Téléphone</label>
                <input type="tel" className={CLS.input} value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
              </div>
            </div>

            <label className="parent-detail-edit-toggle">
              <input type="checkbox" checked={form.actif} onChange={e => setForm(f => ({ ...f, actif: e.target.checked }))} />
              <span>
                <strong>Compte actif</strong>
                <span className="block text-[12px] font-normal text-a-fg-mid mt-0.5">
                  {form.actif ? 'Le parent peut se connecter au portail' : 'Connexion désactivée'}
                </span>
              </span>
            </label>

            <div className={CLS.btnRow}>
              <button className={CLS.btnCancel} onClick={() => setEditMode(false)} disabled={saving}>Annuler</button>
              <button className={CLS.btnSave} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <dl className="parent-detail-fields">
            <div className="parent-detail-field">
              <dt>Père</dt>
              <dd>{pereLine || <em className="parent-detail-empty-inline">non renseigné</em>}</dd>
            </div>
            <div className="parent-detail-field">
              <dt>Mère</dt>
              <dd>{mereLine || <em className="parent-detail-empty-inline">non renseignée</em>}</dd>
            </div>
            <div className="parent-detail-field">
              <dt>Email</dt>
              <dd>
                {mailHref
                  ? <a href={mailHref} className="parent-detail-link">{parent.email}</a>
                  : (parent.email || <em className="parent-detail-empty-inline">—</em>)}
              </dd>
            </div>
            <div className="parent-detail-field">
              <dt>Téléphone</dt>
              <dd>
                {telHref
                  ? <a href={telHref} className="parent-detail-link">{parent.telephone}</a>
                  : (parent.telephone || <em className="parent-detail-empty-inline">—</em>)}
              </dd>
            </div>
          </dl>
        )}
      </motion.section>

      {/* ─── Enfants rattachés ─── */}
      <motion.section className="parent-detail-section" variants={fadeUp}>
        <header className="parent-detail-section-head">
          <h3 className="parent-detail-section-title">
            Enfants rattachés
            <span className="parent-detail-section-count">{enfants.length}</span>
          </h3>
          <button className="parent-detail-attach-btn" onClick={() => setLinkModal(true)}>
            <IconLink /> <span>Rattacher un élève</span>
          </button>
        </header>

        {enfants.length === 0 ? (
          <div className="parent-detail-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            <p>Aucun élève rattaché à ce parent</p>
            <span>Cliquez sur « Rattacher un élève » pour créer un lien.</span>
          </div>
        ) : (
          <ul className="parent-detail-eleves">
            {enfants.map(e => {
              const prenomFmt = fmtPrenom(e.prenom || '');
              const nomFmt    = fmtNom(e.nom || '');
              const initials  = (((e.prenom || '')[0] || '') + ((e.nom || '')[0] || '')).toUpperCase() || '?';
              return (
                <li key={e.eleve_id} className="parent-detail-eleve">
                  <div className="parent-detail-eleve-avatar" aria-hidden="true">
                    <span>{initials}</span>
                  </div>
                  <div className="parent-detail-eleve-info">
                    <div className="parent-detail-eleve-name">
                      {prenomFmt} {nomFmt}
                    </div>
                    <div className="parent-detail-eleve-meta">
                      <span className="parent-detail-eleve-classe">
                        {e.classe_nom || 'Sans classe'}
                      </span>
                      <span className="parent-detail-sep-dot" aria-hidden="true" />
                      <span className="parent-detail-eleve-lien">
                        {e.lien || 'parents'}
                      </span>
                      {e.actif === false && (
                        <>
                          <span className="parent-detail-sep-dot" aria-hidden="true" />
                          <span className="parent-detail-eleve-inactif">élève inactif</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    className="parent-detail-detach-btn"
                    onClick={() => setUnlinkConfirm(e)}
                    title={`Détacher ${prenomFmt} ${nomFmt} du parent`}
                    aria-label={`Détacher ${prenomFmt} ${nomFmt}`}
                  >
                    <IconUnlink />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>

      {linkModal && (
        <LinkEleveModal
          parent={parent}
          existingEleveIds={enfants.map(e => e.eleve_id)}
          onClose={() => setLinkModal(false)}
          onLinked={() => { setLinkModal(false); reloadEnfants(); onChanged?.(); }}
        />
      )}

      {resetConfirm && (
        <ConfirmModal
          title="Réinitialiser le mot de passe ?"
          message="Un nouveau mot de passe temporaire sera généré. Le parent devra le changer à sa prochaine connexion."
          confirmLabel="Réinitialiser"
          danger={false}
          icon="warn"
          onConfirm={handleReset}
          onCancel={() => setResetConfirm(false)}
        />
      )}

      {unlinkConfirm && (
        <ConfirmModal
          title={`Détacher ${fmtPrenom(unlinkConfirm.prenom || '')} ${fmtNom(unlinkConfirm.nom || '')} ?`}
          message="Le parent ne verra plus les informations scolaires de cet enfant. Le compte parent reste actif."
          confirmLabel="Détacher"
          danger
          onConfirm={() => handleUnlink(unlinkConfirm.eleve_id)}
          onCancel={() => setUnlinkConfirm(null)}
        />
      )}
    </motion.div>
  );
}

// ─── Modal création parent standalone ──────────────────────────────────────
function CreateParentModal({ onClose, onCreated }) {
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
      // Identifiant basé sur le parent principal (père si présent, sinon mère)
      const principalPrenom = has_pere ? pere_prenom : mere_prenom;
      const principalNom    = has_pere ? pere_nom    : mere_nom;
      const identifiant = generateIdentifiant(principalPrenom, principalNom).toLowerCase();
      const tempPassword = generateTempPassword();

      await adminCreateParentStandalone({
        identifiant,
        password: tempPassword,
        pere_nom:    has_pere ? fmtNom(pere_nom) : null,
        pere_prenom: has_pere ? fmtPrenom(pere_prenom) : null,
        mere_nom:    has_mere ? fmtNom(mere_nom) : null,
        mere_prenom: has_mere ? fmtPrenom(mere_prenom) : null,
        email:       email.trim(),
        telephone:   normalizeTelephone(telephone),
      });

      const foyerLabel = formatFoyer({
        pere_nom:    has_pere ? fmtNom(pere_nom) : null,
        pere_prenom: has_pere ? fmtPrenom(pere_prenom) : null,
        mere_nom:    has_mere ? fmtNom(mere_nom) : null,
        mere_prenom: has_mere ? fmtPrenom(mere_prenom) : null,
      });
      onCreated({ identifiant, tempPassword, foyerLabel });
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className={CLS.overlay} onClick={onClose}>
      <div className={CLS.modal} onClick={e => e.stopPropagation()}>
        <div className={CLS.modalTitle}>Nouveau parent</div>

        <div className="flex gap-2 mb-3">
          <ParentToggle active={has_pere} onClick={() => setHasPere(v => !v)} label="Père" />
          <ParentToggle active={has_mere} onClick={() => setHasMere(v => !v)} label="Mère" />
        </div>

        {has_pere && (
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className={CLS.field}>
              <label className={CLS.label}>Prénom du père</label>
              <input className={CLS.input} value={pere_prenom} onChange={e => setPerePrenom(e.target.value)} placeholder="Jean" />
            </div>
            <div className={CLS.field}>
              <label className={CLS.label}>Nom du père</label>
              <input className={CLS.input} value={pere_nom} onChange={e => setPereNom(e.target.value)} placeholder="Dupont" />
            </div>
          </div>
        )}

        {has_mere && (
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className={CLS.field}>
              <label className={CLS.label}>Prénom de la mère</label>
              <input className={CLS.input} value={mere_prenom} onChange={e => setMerePrenom(e.target.value)} placeholder="Marie" />
            </div>
            <div className={CLS.field}>
              <label className={CLS.label}>Nom de la mère</label>
              <input className={CLS.input} value={mere_nom} onChange={e => setMereNom(e.target.value)} placeholder="Dupont" />
            </div>
          </div>
        )}

        <div className={CLS.field}>
          <label className={CLS.label}>Email</label>
          <input type="email" className={CLS.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@exemple.com" />
        </div>
        <div className={CLS.field}>
          <label className={CLS.label}>Téléphone</label>
          <input type="tel" className={CLS.input} value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+33 6 12 34 56 78" />
        </div>

        {error && <div className="mb-2 px-3 py-2 rounded-lg text-sm text-a-red bg-[rgba(240,85,85,0.08)] border border-[rgba(240,85,85,0.28)]">{error}</div>}

        <div className="text-xs text-a-fg-mid mb-3">
          Le compte pourra être rattaché à un ou plusieurs élèves ensuite (depuis la fiche du parent ou la fiche d'un élève).
        </div>

        <div className={CLS.btnRow}>
          <button className={CLS.btnCancel} onClick={onClose} disabled={loading}>Annuler</button>
          <button className={CLS.btnSave} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Création…' : 'Créer le parent'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal rattachement d'un élève à un parent existant ─────────────────────
function LinkEleveModal({ parent, existingEleveIds, onClose, onLinked }) {
  const [allEleves, setAllEleves] = useState([]);
  const [classes, setClasses]     = useState([]);
  const [search, setSearch]       = useState('');
  const [linking, setLinking]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([fetchEleves(), fetchAllClasses()])
      .then(([el, cl]) => { setAllEleves(el); setClasses(cl); })
      .catch(() => {});
  }, []);

  const classeNom = (id) => classes.find(c => c.id === id)?.nom;
  const excluded = new Set(existingEleveIds);
  const q = search.trim().toLowerCase();
  const filtered = allEleves
    .filter(e => !excluded.has(e.id))
    .filter(e => !q || `${e.prenom} ${e.nom}`.toLowerCase().includes(q) || (e.identifiant || '').toLowerCase().includes(q))
    .slice(0, 25);

  const handleLink = async (eleve) => {
    setLinking(true); setError('');
    try {
      await adminLinkParentEleve(parent.id, eleve.id, 'parents');
      onLinked();
    } catch (e) { setError(e.message); setLinking(false); }
  };

  return (
    <div className={CLS.overlay} onClick={onClose}>
      <div className={CLS.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className={CLS.modalTitle}>Rattacher un élève à ce parent</div>

        <div className="a-search-wrap mb-3">
          <span className="a-search-icon"><IconSearch /></span>
          <input
            className="a-search-input"
            placeholder="Rechercher par nom ou identifiant élève…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="mb-2 px-3 py-2 rounded-lg text-sm text-a-red bg-[rgba(240,85,85,0.08)] border border-[rgba(240,85,85,0.28)]">{error}</div>}

        {filtered.length === 0 ? (
          <div className="text-sm text-a-fg-mid italic p-4 text-center">
            {q ? 'Aucun élève trouvé.' : 'Commencez à taper un nom d\'élève…'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
            {filtered.map(e => (
              <button
                key={e.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-a-bg border border-a-border hover:border-a-gold cursor-pointer text-left transition-colors"
                onClick={() => handleLink(e)}
                disabled={linking}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="a-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                    {((e.prenom || '')[0] || '') + ((e.nom || '')[0] || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-a-fg truncate">{e.prenom} {e.nom}</div>
                    <div className="text-xs text-a-fg-mid">
                      <span className="font-a-mono">{e.identifiant}</span>
                      {e.classe_id && <> · {classeNom(e.classe_id) || '—'}</>}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-a-gold flex items-center gap-1"><IconLink /> Rattacher</span>
              </button>
            ))}
          </div>
        )}

        <div className={CLS.btnRow}>
          <button className={CLS.btnCancel} onClick={onClose} disabled={linking}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal identifiants créés / reset ──────────────────────────────────────
function CredentialsModal({ result, onClose, kind }) {
  const [pwdVisible, setPwdVisible] = useState(true);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); setPwdVisible(false); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const title = kind === 'reset' ? 'Mot de passe réinitialisé' : 'Compte parent créé';

  return (
    <div className={CLS.overlay} onClick={onClose}>
      <div className={CLS.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="text-center mb-4">
          <div className="text-[40px] mb-2">{kind === 'reset' ? '🔑' : '✅'}</div>
          <div className={CLS.modalTitle}>{title}</div>
          {result.foyerLabel && <div className="text-sm text-a-fg-mid mt-1">{result.foyerLabel}</div>}
        </div>

        <div className="bg-a-bg rounded-lg p-4 mb-3">
          <div className="mb-3">
            <div className="text-[11px] uppercase font-bold text-a-fg-light tracking-wider mb-1">Identifiant</div>
            <div className="text-lg font-extrabold text-a-gold font-a-mono tracking-wide">{result.identifiant}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold text-a-fg-light tracking-wider mb-1">
              Mot de passe provisoire
              {pwdVisible && <span className="ml-2 text-a-fg-mid font-normal text-[10px] normal-case">masqué dans {countdown}s</span>}
            </div>
            <div
              className="text-lg font-extrabold text-a-red font-a-mono tracking-wide cursor-pointer"
              onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}
            >
              {pwdVisible ? result.tempPassword : <span className="text-sm text-a-fg-mid font-normal font-sans">●●●●●●●● (cliquer pour afficher)</span>}
            </div>
          </div>
        </div>

        <div className="text-xs text-a-fg-mid mb-3 leading-relaxed">
          ⚠️ <strong>Notez ces identifiants</strong> — le mot de passe provisoire ne sera plus visible après fermeture.
          Le parent devra le changer à sa première connexion.
        </div>

        <div className={CLS.btnRow}>
          <button className={CLS.btnSave} onClick={onClose}>J'ai noté, fermer</button>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Père/Mère (chip) ───────────────────────────────────────────────
function ParentToggle({ active, onClick, label }) {
  return (
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
      <span
        className="inline-flex items-center justify-center rounded-full"
        style={{
          width: 16, height: 16,
          border: active ? 'none' : '1.5px solid var(--a-border)',
          background: active ? 'var(--a-gold)' : 'transparent',
          color: '#fff',
        }}
      >
        {active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5.5 L4 7.5 L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      {label}
    </button>
  );
}

