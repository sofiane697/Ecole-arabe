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
  page: { minHeight: '100%' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 },
  headerLeft: { display:'flex', flexDirection:'column', gap:4 },
  headerSub: { fontSize:13, color:'var(--a-fg-mid)' },
  addBtn: { display:'inline-flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 12px rgba(191,138,48,.3)' },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 },
  card: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:'20px', display:'flex', flexDirection:'column', gap:14, transition:'transform .2s, box-shadow .2s, border-color .2s' },
  cardTop: { display:'flex', alignItems:'center', gap:14 },
  avatar: { width:48, height:48, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:800, flexShrink:0, letterSpacing:'-0.5px' },
  name: { fontSize:16, fontWeight:700, color:'var(--a-fg)', lineHeight:1.2 },
  sub: { fontSize:12, color:'var(--a-fg-mid)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  badge: (actif) => ({ display:'inline-block', padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),
  classesSection: { paddingTop:14, borderTop:'1px solid var(--a-border)' },
  classesLabel: { fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 },
  classesTags: { display:'flex', flexWrap:'wrap', gap:6 },
  classeTag: { padding:'3px 10px', borderRadius:980, fontSize:12, fontWeight:600, background:'rgba(10,132,255,.12)', color:'var(--a-blue)', border:'1px solid rgba(10,132,255,.2)' },
  noClasse: { fontSize:12, color:'var(--a-fg-light)', fontStyle:'italic' },
  actions: { display:'flex', gap:8, marginTop:4 },
  actionBtn: (color) => ({ padding:'6px 14px', borderRadius:6, border:`1px solid ${color}22`, background:`${color}12`, color, fontSize:12, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontWeight:600, transition:'background .15s' }),
  empty: { textAlign:'center', padding:'60px 20px', color:'var(--a-fg-mid)', fontSize:14, lineHeight:2 },
  // Modal
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', padding:28, width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto', border:'1px solid var(--a-border)' },
  modalTitle: { fontFamily:'var(--a-font-display)', fontSize:18, fontWeight:700, color:'var(--a-fg)', marginBottom:20 },
  field: { marginBottom:16 },
  label: { display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.5px' },
  input: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  select: { width:'100%', padding:'10px 14px', borderRadius:'var(--a-radius-sm)', border:'1px solid var(--a-border)', background:'var(--a-bg-input)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  btnRow: { display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 },
  btnCancel: { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
  sectionLabel: { fontSize:12, fontWeight:700, color:'var(--a-fg-mid)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:10 },
  niveauGroup: { marginBottom:14 },
  niveauGroupName: { fontSize:12, fontWeight:700, color:'var(--a-fg)', marginBottom:6 },
  checkboxRow: { display:'flex', flexWrap:'wrap', gap:8 },
  checkboxLabel: (checked) => ({ display:'flex', alignItems:'center', gap:6, cursor:'pointer', background: checked ? 'rgba(10,132,255,.12)' : 'var(--a-bg)', border:`1px solid ${checked ? 'var(--a-blue)' : 'var(--a-border)'}`, borderRadius:'var(--a-radius-sm)', padding:'4px 10px', fontSize:13, transition:'all .15s', userSelect:'none', color:'var(--a-fg)' }),
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  btnCancel: { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave: { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' },
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
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.headerSub}>{enseignants.length} enseignant{enseignants.length > 1 ? 's' : ''}</div>
        </div>
        <button style={S.addBtn} onClick={() => setModal({ type:'add' })}>
          <IconPlus /> Ajouter un enseignant
        </button>
      </div>

      {error && <p style={{ color:'var(--a-red)', fontSize:13, marginBottom:12 }}>{error}</p>}

      {enseignants.length === 0 ? (
        <div style={S.empty}>Aucun enseignant créé.<br />Commencez par ajouter le premier enseignant.</div>
      ) : (() => {
        const totalPages = Math.max(1, Math.ceil(enseignants.length / PAGE_SIZE));
        const safePage   = Math.min(page, totalPages - 1);
        const paginated  = enseignants.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
        return (<>
        <motion.div style={S.grid} variants={staggerContainer} initial="hidden" animate="visible" key={safePage}>
          {paginated.map(ens => {
            const initiales = (fmtPrenom(ens.prenom || '')?.[0] || '') + (fmtNom(ens.nom || '')?.[0] || '');
            const classeIds = classesMap[ens.id] || [];
            const classeObjs = allClasses.filter(c => classeIds.includes(c.id));
            return (
              <motion.div key={ens.id} style={S.card}
                variants={fadeUp}
                {...cardHover}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 30px rgba(0,0,0,.15)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={S.cardTop}>
                  <div style={S.avatar}>{initiales}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={S.name}>{fmtPrenom(ens.prenom || '')} {fmtNom(ens.nom || '')}</div>
                    <div style={S.sub}>{ens.email || ens.telephone || '—'}</div>
                    <span style={S.badge(ens.actif)}>{ens.actif ? 'Actif' : 'Inactif'}</span>
                  </div>
                </div>

                <div style={S.classesSection}>
                  <div style={S.classesLabel}>Classes assignées</div>
                  <div style={S.classesTags}>
                    {classeObjs.length > 0
                      ? classeObjs.map(c => <span key={c.id} style={S.classeTag}>{c.nom}</span>)
                      : <span style={S.noClasse}>Aucune classe assignée</span>
                    }
                  </div>
                </div>

                {ens.identifiant && (
                  <div style={{ fontSize:12, color:'var(--a-fg-light)', fontFamily:'var(--a-font-mono)', letterSpacing:.5 }}>
                    ID : {ens.identifiant.toUpperCase()}
                  </div>
                )}

                <div style={S.actions}>
                  <button style={S.actionBtn('var(--a-blue)')} onClick={() => setModal({ type:'edit', data: ens })}>
                    <IconEdit /> Modifier
                  </button>
                  <button style={S.actionBtn('var(--a-gold)')} onClick={() => handleResetPassword(ens)}>
                    🔑 Reset MDP
                  </button>
                  <button style={S.actionBtn('var(--a-red)')} onClick={() => handleDelete(ens)}>
                    <IconTrash /> Supprimer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12, padding:'20px 0' }}>
            <button
              disabled={safePage === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              style={{ padding:'6px 14px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-card)', color: safePage === 0 ? 'var(--a-fg-light)' : 'var(--a-fg)', fontSize:12, fontWeight:600, cursor: safePage === 0 ? 'default' : 'pointer', opacity: safePage === 0 ? 0.5 : 1 }}
            >← Précédent</button>
            <span style={{ fontSize:12, color:'var(--a-fg-mid)', fontWeight:600 }}>Page {safePage + 1} / {totalPages}</span>
            <button
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              style={{ padding:'6px 14px', borderRadius:980, border:'1px solid var(--a-border)', background:'var(--a-bg-card)', color: safePage >= totalPages - 1 ? 'var(--a-fg-light)' : 'var(--a-fg)', fontSize:12, fontWeight:600, cursor: safePage >= totalPages - 1 ? 'default' : 'pointer', opacity: safePage >= totalPages - 1 ? 0.5 : 1 }}
            >Suivant →</button>
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
        <div style={S.overlay} onClick={() => setResult(null)}>
          <div style={{ ...S.modal, maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🎓</div>
              <div style={S.modalTitle}>Compte enseignant créé</div>
            </div>
            <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:20, marginBottom:16 }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Enseignant</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{result.prenom} {result.nom}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Identifiant</div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:1 }}>{result.identifiant}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>
                  Mot de passe provisoire
                  {pwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {countdown}s</span>}
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:1, cursor: pwdVisible ? 'default' : 'pointer' }}
                  onClick={() => { if (!pwdVisible) { setPwdVisible(true); setCountdown(10); } }}>
                  {pwdVisible ? result.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400 }}>●●●●●●●● (cliquer pour afficher)</span>}
                </div>
              </div>
            </div>
            <div style={{ fontSize:12, color:'var(--a-fg-mid)', lineHeight:1.6, marginBottom:16 }}>
              ⚠️ <strong>Notez ces identifiants.</strong> Le mot de passe provisoire ne sera plus visible après fermeture. L'enseignant devra le modifier à sa première connexion.
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <button style={{ ...S.btnSave, padding:'9px 16px', fontSize:12 }} onClick={() => {
                navigator.clipboard.writeText(`Identifiant : ${result.identifiant}\nMot de passe : ${result.tempPassword}`);
                alert('Copié !');
              }}>📋 Copier</button>
              <button style={{ padding:'9px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => {
                const msg = encodeURIComponent(`🕌 Institut As-Safaa — Portail Enseignant\n\nBonjour ${result.prenom},\n\nVoici vos identifiants :\n\n👤 Identifiant : ${result.identifiant}\n🔑 Mot de passe : ${result.tempPassword}\n\n📱 ${window.location.origin}/enseignant/login\n\n⚠️ Changez votre mot de passe à la première connexion.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>💬 WhatsApp</button>
              <button style={{ ...S.btnCancel, padding:'9px 16px', fontSize:12 }} onClick={() => setResult(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal résultat reset MDP ─── */}
      {resetResult && (
        <div style={S.overlay} onClick={() => setResetResult(null)}>
          <div style={{ ...S.modal, maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:20 }}>
              <div style={{ fontSize:36, marginBottom:8 }}>🔑</div>
              <div style={S.modalTitle}>Nouveau mot de passe généré</div>
            </div>
            <div style={{ background:'var(--a-bg)', borderRadius:'var(--a-radius-sm)', padding:20, marginBottom:16 }}>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Enseignant</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--a-fg)' }}>{resetResult.prenom} {resetResult.nom}</div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>Identifiant</div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--a-gold)', fontFamily:'var(--a-font-mono)', letterSpacing:1 }}>{resetResult.identifiant}</div>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:4 }}>
                  Nouveau mot de passe provisoire
                  {resetPwdVisible && <span style={{ marginLeft:8, color:'var(--a-fg-mid)', fontWeight:400, fontSize:10 }}>masqué dans {resetCountdown}s</span>}
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--a-red)', fontFamily:'var(--a-font-mono)', letterSpacing:1, cursor: resetPwdVisible ? 'default' : 'pointer' }}
                  onClick={() => { if (!resetPwdVisible) { setResetPwdVisible(true); setResetCountdown(10); } }}>
                  {resetPwdVisible ? resetResult.tempPassword : <span style={{ fontSize:13, color:'var(--a-fg-mid)', fontWeight:400 }}>●●●●●●●● (cliquer pour afficher)</span>}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <button style={{ ...S.btnSave, padding:'9px 16px', fontSize:12 }} onClick={() => {
                navigator.clipboard.writeText(`Identifiant : ${resetResult.identifiant}\nMot de passe : ${resetResult.tempPassword}`);
                alert('Copié !');
              }}>📋 Copier</button>
              <button style={{ padding:'9px 16px', borderRadius:980, border:'none', background:'#25D366', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }} onClick={() => {
                const msg = encodeURIComponent(`🕌 Institut As-Safaa — Portail Enseignant\n\nBonjour ${resetResult.prenom},\n\nVotre mot de passe a été réinitialisé :\n\n👤 Identifiant : ${resetResult.identifiant}\n🔑 Nouveau mot de passe : ${resetResult.tempPassword}\n\n📱 ${window.location.origin}/enseignant/login\n\n⚠️ Changez votre mot de passe à la connexion.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }}>💬 WhatsApp</button>
              <button style={{ ...S.btnCancel, padding:'9px 16px', fontSize:12 }} onClick={() => setResetResult(null)}>Fermer</button>
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
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>{data ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</div>

        <div style={{ display:'flex', gap:12 }}>
          <div style={{ ...S.field, flex:1 }}>
            <label htmlFor="ens_prenom" style={S.label}>Prénom *</label>
            <input id="ens_prenom" style={S.input} value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Ex: Sofiane" autoFocus />
          </div>
          <div style={{ ...S.field, flex:1 }}>
            <label htmlFor="ens_nom" style={S.label}>Nom *</label>
            <input id="ens_nom" style={S.input} value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex: Dupont" />
          </div>
        </div>

        <div style={S.field}>
          <label htmlFor="ens_email" style={S.label}>Email</label>
          <input id="ens_email" style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemple.fr" />
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <div style={{ ...S.field, flex:1 }}>
            <label htmlFor="ens_telephone" style={S.label}>Téléphone</label>
            <input id="ens_telephone" style={S.input} value={telephone} onChange={e => setTel(e.target.value)} placeholder="06 12 34 56 78" />
          </div>
          {data && (
            <div style={{ ...S.field, flex:1 }}>
              <label htmlFor="ens_statut" style={S.label}>Statut</label>
              <select id="ens_statut" style={S.select} value={actif ? 'true' : 'false'} onChange={e => setActif(e.target.value === 'true')}>
                <option value="true">Actif</option>
                <option value="false">Inactif</option>
              </select>
            </div>
          )}
        </div>

        {/* Assignation des classes */}
        <div style={S.field}>
          <label style={S.sectionLabel}>Classes assignées</label>

          {allClasses.length === 0 && (
            <div style={{ fontSize:13, color:'var(--a-fg-mid)', fontStyle:'italic' }}>
              Aucune classe disponible. Créez d'abord des classes dans "Gestion des classes".
            </div>
          )}

          {classesByNiveau.map(({ niveau, classes }) => (
            <div key={niveau.id} style={S.niveauGroup}>
              <div style={S.niveauGroupName}>{niveau.nom}</div>
              <div style={S.checkboxRow}>
                {classes.map(c => (
                  <label key={c.id} style={S.checkboxLabel(classeIds.includes(c.id))}>
                    <input type="checkbox" checked={classeIds.includes(c.id)} onChange={() => toggleClasse(c.id)} style={{ accentColor:'var(--a-blue)', cursor:'pointer' }} />
                    {c.nom}
                  </label>
                ))}
              </div>
            </div>
          ))}

          {classesOrphelines.length > 0 && (
            <div style={S.niveauGroup}>
              <div style={S.niveauGroupName}>Autres</div>
              <div style={S.checkboxRow}>
                {classesOrphelines.map(c => (
                  <label key={c.id} style={S.checkboxLabel(classeIds.includes(c.id))}>
                    <input type="checkbox" checked={classeIds.includes(c.id)} onChange={() => toggleClasse(c.id)} style={{ accentColor:'var(--a-blue)', cursor:'pointer' }} />
                    {c.nom}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={S.btnRow}>
          <button style={S.btnCancel} onClick={onClose}>Annuler</button>
          <button
            style={{ ...S.btnSave, opacity: (!nom.trim() || !prenom.trim() || loading) ? .5 : 1 }}
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
