import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchEnseignants, createEnseignant, updateEnseignant, deleteEnseignant,
  fetchEnseignantClasses, setEnseignantClasses,
  fetchAllClasses, fetchNiveauxScolaires,
  adminCreateEnseignantAccount, adminResetEnseignantPassword,
} from './supabaseAdmin';
import ConfirmModal from './ConfirmModal';
import { generateIdentifiant, generateTempPassword } from './adminUtils';
import { motion, staggerContainer, fadeUp, cardHover } from '../animations';

// ─── Formatage des noms ──────────────────────────────────────────────────────
const PAGE_SIZE = 25;
const fmtPrenom = (s) => s.trim() ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s;
const fmtNom    = (s) => s.trim().toUpperCase();

// ─── Icônes ───────────────────────────────────────────────────────────────────
const IconPlus  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconEdit  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: 'min-h-full',
  header: 'a-section-header',
  headerLeft: 'a-section-meta',
  addBtn: 'a-add-btn',
  grid: 'ens-grid',
  card: 'a-card',
  cardTop: 'a-card-head',
  avatar: 'a-avatar',
  name: 'a-card-name',
  sub: 'a-card-sub',
  badge: (actif) => ({ display:'inline-block', padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(52,212,114,.15)' : 'rgba(240,85,85,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)', border: `1px solid ${actif ? 'rgba(52,212,114,.25)' : 'rgba(240,85,85,.25)'}` }),
  classesSection: 'a-card-section',
  classesLabel: 'a-card-section-label',
  classesTags: 'a-tags',
  classeTag: 'a-tag blue',
  noClasse: 'a-tag none',
  actions: 'a-card-actions',
  empty: 'a-empty',
  overlay: 'a-modal-overlay',
  modal: 'a-modal',
  modalTitle: 'a-modal-title',
  field: 'a-modal-field',
  label: 'a-modal-label',
  input: 'a-modal-input',
  select: 'a-modal-input',
  btnRow: 'a-modal-btns',
  btnCancel: 'a-modal-btn-cancel',
  btnSave: 'a-modal-btn-save',
  sectionLabel: 'a-card-section-label',
  niveauGroup: 'mb-3.5',
  niveauGroupName: 'text-xs font-bold mb-1.5',
  checkboxRow: 'flex flex-wrap gap-2',
  checkboxLabel: (checked) => ({ display:'flex', alignItems:'center', gap:6, cursor:'pointer', background: checked ? 'rgba(85,150,247,.1)' : 'var(--a-bg)', border:`1px solid ${checked ? 'var(--a-blue)' : 'var(--a-border)'}`, borderRadius:'var(--a-radius-sm)', padding:'4px 10px', fontSize:13, transition:'all .15s', userSelect:'none', color:'var(--a-fg)' }),
};

// ─── Composant principal ───────────────────────────────────────────────────────
export default function Enseignants() {
  const [enseignants, setEnseignants] = useState([]);
  const [classesMap, setClassesMap]   = useState({}); // enseignantId → [classeId, ...]
  const [allClasses, setAllClasses]   = useState([]);
  const [niveaux, setNiveaux]         = useState([]);
  const [modal, setModal]             = useState(null); // null | { type:'add'|'edit', data? }
  const [confirm, setConfirm]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [page, setPage]               = useState(0);
  const [result, setResult]           = useState(null); // { prenom, nom, identifiant, tempPassword }
  const [resetResult, setResetResult] = useState(null);
  const [pwdVisible, setPwdVisible]         = useState(true);
  const [countdown, setCountdown]           = useState(30);
  const [resetPwdVisible, setResetPwdVisible] = useState(true);
  const [resetCountdown, setResetCountdown]   = useState(30);

  const load = useCallback(async () => {
    try {
      const [ens, cls, nvx] = await Promise.all([fetchEnseignants(), fetchAllClasses(), fetchNiveauxScolaires()]);
      setEnseignants(ens);
      setAllClasses(cls);
      setNiveaux(nvx);
      // Charger les classes de chaque enseignant
      const map = {};
      await Promise.all(ens.map(async (e) => {
        try { map[e.id] = await fetchEnseignantClasses(e.id); } catch { map[e.id] = []; }
      }));
      setClassesMap(map);
    } catch(e) {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!result) return;
    setPwdVisible(true);
    setCountdown(30);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setPwdVisible(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    if (!resetResult) return;
    setResetPwdVisible(true);
    setResetCountdown(30);
    const interval = setInterval(() => {
      setResetCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); setResetPwdVisible(false); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resetResult]);

  const handleSave = async (data, selectedClasseIds) => {
    setError('');
    const NOM_REGEX = /^[a-zA-Zàâäéèêëïîôùûüœæ\s'\-]{1,50}$/;
    if (!NOM_REGEX.test(data.prenom.trim())) {
      setError('Le prénom contient des caractères non autorisés.');
      return;
    }
    if (!NOM_REGEX.test(data.nom.trim())) {
      setError('Le nom contient des caractères non autorisés.');
      return;
    }
    setLoading(true);
    try {
      const cleanPrenom = fmtPrenom(data.prenom);
      const cleanNom    = fmtNom(data.nom);
      let ensId;
      if (data.id) {
        await updateEnseignant(data.id, { nom: cleanNom, prenom: cleanPrenom, email: data.email, telephone: data.telephone, actif: data.actif });
        ensId = data.id;
      } else {
        const created = await createEnseignant({ nom: cleanNom, prenom: cleanPrenom, email: data.email || null, telephone: data.telephone || null, actif: true });
        ensId = created.id;
        // Créer le compte auth avec identifiant + mot de passe provisoire
        const identifiant = generateIdentifiant(cleanPrenom, cleanNom);
        const tempPassword = generateTempPassword();
        await adminCreateEnseignantAccount(ensId, identifiant, tempPassword);
        setResult({ prenom: cleanPrenom, nom: cleanNom, identifiant: identifiant.toUpperCase(), tempPassword });
      }
      await setEnseignantClasses(ensId, selectedClasseIds);
      await load();
      setModal(null);
    } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
    setLoading(false);
  };

  const handleResetPassword = (ens) => {
    setConfirm({
      title: 'Réinitialiser le mot de passe ?',
      message: <span>Un nouveau mot de passe provisoire sera généré pour <strong>{ens.prenom} {ens.nom}</strong>.</span>,
      onConfirm: async () => {
        setConfirm(null);
        const tempPwd = generateTempPassword();
        try {
          await adminResetEnseignantPassword(ens.id, tempPwd);
          setResetResult({ prenom: ens.prenom, nom: ens.nom, identifiant: (ens.identifiant || '').toUpperCase(), tempPassword: tempPwd });
        } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
      },
    });
  };

  const handleDelete = (ens) => {
    setConfirm({
      title: 'Supprimer cet enseignant ?',
      message: <span>L'enseignant <strong>{ens.prenom} {ens.nom}</strong> sera supprimé définitivement. Ses assignations de classes seront également supprimées.</span>,
      onConfirm: async () => {
        setConfirm(null);
        try { await deleteEnseignant(ens.id); await load(); } catch(e) { setError(e.message || 'Une erreur est survenue.'); }
      },
    });
  };

  return (
    <div className={S.page}>
      <div className={S.header}>
        <div className={S.headerLeft}>
          <span className="a-section-count">{enseignants.length} enseignant{enseignants.length > 1 ? 's' : ''}</span>
        </div>
        <button className={S.addBtn} onClick={() => setModal({ type:'add' })}>
          <IconPlus /> Ajouter un enseignant
        </button>
      </div>

      {error && <p style={{ color:'var(--a-red)', fontSize:13, marginBottom:12 }}>{error}</p>}

      {enseignants.length === 0 ? (
        <div className={S.empty}>Aucun enseignant créé.<br />Commencez par ajouter le premier enseignant.</div>
      ) : (() => {
        const totalPages = Math.max(1, Math.ceil(enseignants.length / PAGE_SIZE));
        const safePage   = Math.min(page, totalPages - 1);
        const paginated  = enseignants.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        return (<>
        <motion.div className={S.grid} variants={staggerContainer} initial="hidden" animate="visible" key={safePage}>
          {paginated.map(ens => {
            const initiales = (fmtPrenom(ens.prenom || '')?.[0] || '') + (fmtNom(ens.nom || '')?.[0] || '');
            const classeIds = classesMap[ens.id] || [];
            const classeObjs = allClasses.filter(c => classeIds.includes(c.id));
            return (
              <motion.div key={ens.id} className={S.card}
                variants={fadeUp}
                {...cardHover}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div className={S.cardTop}>
                  <div className={S.avatar}>{initiales}</div>
                  <div className="flex-1 min-w-0">
                    <div className={S.name}>{fmtPrenom(ens.prenom || '')} {fmtNom(ens.nom || '')}</div>
                    <div className={S.sub}>{ens.email || ens.telephone || '—'}</div>
                    <span style={S.badge(ens.actif)}>{ens.actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>

                <div className={S.classesSection}>
                  <div className={S.classesLabel}>Classes assignées</div>
                  <div className={S.classesTags}>
                    {classeObjs.length > 0
                      ? classeObjs.map(c => <span key={c.id} className={S.classeTag}>{c.nom}</span>)
                      : <span className={S.noClasse}>Aucune classe assignée</span>
                    }
                  </div>
                </div>

                {ens.identifiant && (
                  <div className="a-mono-id">
                    ID : {ens.identifiant.toUpperCase()}
                  </div>
                )}

                <div className={S.actions}>
                  <button className="a-action-btn blue" onClick={() => setModal({ type:'edit', data: ens })}>
                    <IconEdit /> Modifier
                  </button>
                  <button className="a-action-btn gold" onClick={() => handleResetPassword(ens)}>
                    🔑 Reset MDP
                  </button>
                  <button className="a-action-btn red" onClick={() => handleDelete(ens)}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        {totalPages > 1 && (
          <div className="a-pagination">
            <button className="a-page-btn" disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>← Précédent</button>
            <span className="a-page-info">Page {safePage + 1} / {totalPages}</span>
            <button className="a-page-btn" disabled={safePage >= totalPages - 1} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}>Suivant →</button>
          </div>
        )}
        </>); })()}

      {modal && (
        <EnseignantModal
          data={modal.data}
          allClasses={allClasses}
          niveaux={niveaux}
          initialClasseIds={modal.data ? (classesMap[modal.data.id] || []) : []}
          loading={loading}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}

      {/* ─── Modal résultat création ─── */}
      {result && (
        <div className={S.overlay} onClick={() => setResult(null)}>
          <div className={S.modal} style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🎓</div>
              <div className={S.modalTitle}>Compte enseignant créé</div>
            </div>
            <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'1.25rem', marginBottom:'1rem' }}>
              <div style={{ marginBottom:'0.875rem' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Enseignant</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{result.prenom} {result.nom}</div>
              </div>
              <div style={{ marginBottom:'0.875rem' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Identifiant</div>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{result.identifiant}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                  Mot de passe provisoire
                  {pwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {countdown}s</span>}
                </div>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em', cursor: pwdVisible ? 'default' : 'pointer' }}
                  onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}>
                  {pwdVisible ? result.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400, fontFamily:'inherit' }}>●●●●●●●● (cliquer pour afficher)</span>}
                </div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--a-fg-mid)', marginBottom:'1rem', lineHeight:1.6 }}>
              ⚠️ <strong>Notez ces identifiants.</strong> Le mot de passe provisoire ne sera plus visible après fermeture.
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <button className={S.btnSave} onClick={() => {
                navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
                alert('Copié !');
              }}>📋 Copier</button>
              <button style={{ padding:'8px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => {
                const msg = encodeURIComponent(`🕌 Institut As-Safaa — Portail Enseignant\n\nBonjour ${result.prenom},\n\nVoici vos identifiants :\n\n👤 Identifiant : ${result.identifiant}\n🔑 Mot de passe : ${result.tempPassword}\n\n📱 ${window.location.origin}/enseignant/login\n\n⚠️ Changez votre mot de passe à la première connexion.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>💬 WhatsApp</button>
              <button className={S.btnCancel} onClick={() => setResult(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal résultat reset MDP ─── */}
      {resetResult && (
        <div className={S.overlay} onClick={() => setResetResult(null)}>
          <div className={S.modal} style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
              <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>🔑</div>
              <div className={S.modalTitle}>Nouveau mot de passe généré</div>
            </div>
            <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:'1.25rem', marginBottom:'1rem' }}>
              <div style={{ marginBottom:'0.875rem' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Enseignant</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{resetResult.prenom} {resetResult.nom}</div>
              </div>
              <div style={{ marginBottom:'0.875rem' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Identifiant</div>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em' }}>{resetResult.identifiant}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                  Nouveau mot de passe provisoire
                  {resetPwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {resetCountdown}s</span>}
                </div>
                <div style={{ fontSize:'1.3rem', fontWeight:800, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:'0.06em', cursor: resetPwdVisible ? 'default' : 'pointer' }}
                  onClick={() => { if (!resetPwdVisible) { setResetPwdVisible(true); setResetCountdown(10); } }}>
                  {resetPwdVisible ? resetResult.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400, fontFamily:'inherit' }}>●●●●●●●● (cliquer pour afficher)</span>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <button className={S.btnSave} onClick={() => {
                navigator.clipboard.writeText(`Identifiant : ${resetResult.identifiant}\nMot de passe : ${resetResult.tempPassword}`);
                alert('Copié !');
              }}>📋 Copier</button>
              <button style={{ padding:'8px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }} onClick={() => {
                const msg = encodeURIComponent(`🕌 Institut As-Safaa — Portail Enseignant\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/enseignant/login\n\n⚠️ Changez votre mot de passe à la connexion.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>💬 WhatsApp</button>
              <button className={S.btnCancel} onClick={() => setResetResult(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal création / modification ────────────────────────────────────────────
function EnseignantModal({ data, allClasses, niveaux, initialClasseIds, loading, onClose, onSave }) {
  const [nom, setNom]           = useState(data?.nom || '');
  const [prenom, setPrenom]     = useState(data?.prenom || '');
  const [email, setEmail]       = useState(data?.email || '');
  const [telephone, setTel]     = useState(data?.telephone || '');
  const [actif, setActif]       = useState(data?.actif !== undefined ? data.actif : true);
  const [classeIds, setClasseIds] = useState(initialClasseIds);

  const toggleClasse = (id) => {
    setClasseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Grouper les classes par niveau
  const classesByNiveau = niveaux.map(nv => ({
    niveau: nv,
    classes: allClasses.filter(c => c.niveau_id === nv.id),
  })).filter(g => g.classes.length > 0);

  const classesOrphelines = allClasses.filter(c => !niveaux.some(nv => nv.id === c.niveau_id));

  return (
    <div className={S.overlay} onClick={onClose}>
      <div className={S.modal} onClick={e => e.stopPropagation()}>
        <div className={S.modalTitle}>{data ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</div>

        <div className="flex gap-3">
          <div className={`${S.field} flex-1`}>
            <label htmlFor="ens_prenom" className={S.label}>Prénom *</label>
            <input id="ens_prenom" className={S.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Ex: Sofiane" autoFocus />
          </div>
          <div className={`${S.field} flex-1`}>
            <label htmlFor="ens_nom" className={S.label}>Nom *</label>
            <input id="ens_nom" className={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Dupont" />
          </div>
        </div>

        <div className={S.field}>
          <label htmlFor="ens_email" className={S.label}>Email</label>
          <input id="ens_email" className={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.fr" />
        </div>

        <div className="flex gap-3">
          <div className={`${S.field} flex-1`}>
            <label htmlFor="ens_telephone" className={S.label}>Téléphone</label>
            <input id="ens_telephone" className={S.input} value={telephone} onChange={e => setTel(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          {data && (
            <div className={`${S.field} flex-1`}>
              <label htmlFor="ens_statut" className={S.label}>Statut</label>
              <select id="ens_statut" className={S.select} value={actif ? 'true' : 'false'} onChange={e => setActif(e.target.value === 'true')}>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
          )}
        </div>

        {/* Assignation des classes */}
        <div className={S.field}>
          <label className={S.sectionLabel}>Classes assignées</label>

          {allClasses.length === 0 && (
            <div className="text-[13px] text-a-fg-mid italic">
              Aucune classe disponible. Créez d'abord des classes dans "Gestion des classes".
            </div>
          )}

          {classesByNiveau.map(({ niveau, classes }) => (
            <div key={niveau.id} className={S.niveauGroup}>
              <div className={S.niveauGroupName} style={{ color:'var(--a-fg)' }}>{niveau.nom}</div>
              <div className={S.checkboxRow}>
                {classes.map(c => (
                  <label key={c.id} style={S.checkboxLabel(classeIds.includes(c.id))}>
                    <input type="checkbox" checked={classeIds.includes(c.id)} onChange={() => toggleClasse(c.id)} className="cursor-pointer accent-[var(--a-blue)]" />
                    {c.nom}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {classesOrphelines.length > 0 && (
            <div className={S.niveauGroup}>
              <div className={S.niveauGroupName} style={{ color:'var(--a-fg)' }}>Autres</div>
              <div className={S.checkboxRow}>
                {classesOrphelines.map(c => (
                  <label key={c.id} style={S.checkboxLabel(classeIds.includes(c.id))}>
                    <input type="checkbox" checked={classeIds.includes(c.id)} onChange={() => toggleClasse(c.id)} className="cursor-pointer accent-[var(--a-blue)]" />
                    {c.nom}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={S.btnRow}>
          <button className={S.btnCancel} onClick={onClose}>Annuler</button>
          <button
            className={S.btnSave}
            style={{ opacity: (!nom.trim() || !prenom.trim() || loading) ? .5 : 1 }}
            disabled={!nom.trim() || !prenom.trim() || loading}
            onClick={() => onSave({ id: data?.id, nom: nom.trim(), prenom: prenom.trim(), email: email.trim(), telephone: telephone.trim(), actif }, classeIds)}
          >
            {loading ? '...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
