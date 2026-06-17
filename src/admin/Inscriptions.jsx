import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { usePageAnimation } from '../shared/usePageAnimation';
import {
  fetchPreinscriptions, updatePreinscriptionStatut, markPreinscriptionViewed,
  createEleve, updateEleve, updateEleveNiveauScolaire, fetchAllClasses,
  fetchEleveIdParIdentifiant, adminLinkPreinscriptionEleve, adminUpdatePreinscriptionNote,
} from './supabaseAdmin';
import { generateIdentifiant, generateTempPassword } from './adminUtils';
import { emptyBloc, checkDuplicatesOnSubmit, processParentBlocs } from './parentsLogic';
import { emitInscriptionsChanged } from './adminEvents';
import { fmtPrenom, fmtNom } from '../shared/nameUtils';

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

/**
 * Conversion d'une préinscription ADULTE en compte étudiant + affectation à une
 * classe. Génère identifiant + mot de passe, crée le compte (profils_eleves),
 * affecte la classe (et le niveau scolaire dérivé), passe la demande à « Inscrit »
 * et envoie l'e-mail de bienvenue. Pas de parent (adulte majeur).
 */
function ConvertAdulte({ inscription: i, classes, onConverted }) {
  const [open,     setOpen]     = useState(false);
  const [classeId, setClasseId] = useState('');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState(null);

  // Compte créé → récapitulatif identifiants (compte inactif, demande « Traité »).
  if (result) {
    return (
      <div className="insc-convert insc-convert-done">
        <span className="insc-sheet-soon-title">✓ Étudiant créé (inactif){result.classeNom ? ` — ${result.classeNom}` : ''}</span>
        <div className="insc-convert-creds">
          <div><span>Identifiant</span><strong>{result.identifiant}</strong></div>
          <div><span>Mot de passe</span><strong>{result.tempPassword}</strong></div>
        </div>
        <span className="insc-convert-mail">Active le compte dans « Gestion des étudiants » pour passer la demande en « Inscrit ».</span>
      </div>
    );
  }

  // Déjà converti (compte rattaché) : statut selon l'avancement.
  if (i.eleve_id) {
    return (
      <div className="insc-convert insc-sheet-soon">
        <span className="insc-sheet-soon-title">✓ Étudiant {i.statut === 'inscrit' ? 'activé (inscrit)' : 'créé — à activer'}</span>
        <span>{i.statut === 'inscrit'
          ? 'Le compte est actif et la demande est inscrite.'
          : 'Compte créé (inactif). Active-le dans « Gestion des étudiants » pour l’inscrire.'}</span>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!classeId) { setError('Choisis une classe.'); return; }
    setBusy(true); setError('');
    try {
      const prenom = fmtPrenom(i.eleve_prenom);
      const nom    = fmtNom(i.eleve_nom);
      const idLogin = generateIdentifiant(prenom, nom).toLowerCase();
      const tempPwd = generateTempPassword();

      const created = await createEleve(nom, prenom, idLogin, tempPwd);
      const eleveId = created?.id ?? await fetchEleveIdParIdentifiant(idLogin);
      if (!eleveId) throw new Error('Compte créé mais introuvable.');

      // Compte créé INACTIF : l'activation le fera passer en « inscrit ».
      const patch = { classe_id: classeId, est_adulte: true, actif: false };
      if (i.contact_email)      patch.email_contact  = i.contact_email;
      if (i.contact_telephone)  patch.telephone      = i.contact_telephone;
      if (i.eleve_date_naissance) patch.date_naissance = i.eleve_date_naissance;
      await updateEleve(eleveId, patch);

      const classe = classes.find(c => c.id === classeId);
      await updateEleveNiveauScolaire(eleveId, classe?.niveau_id || null);

      // Rattache la préinscription + passe à « Traité » (contacté).
      await adminLinkPreinscriptionEleve(i.id, eleveId);
      onConverted(eleveId);

      setResult({ identifiant: idLogin, tempPassword: tempPwd, classeNom: classe?.nom });
    } catch (e) {
      setError(e.message || "Erreur lors de la création de l'étudiant.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="insc-convert">
        <button className="msg-action-primary" onClick={() => setOpen(true)}>
          ↪ Créer l'étudiant <IconArrow />
        </button>
      </div>
    );
  }

  return (
    <div className="insc-convert">
      <p className="insc-detail-section-title">Affecter à une classe</p>
      <select
        className="admin-filter-select insc-convert-select"
        value={classeId}
        onChange={e => { setClasseId(e.target.value); setError(''); }}
        disabled={busy}
      >
        <option value="">— Choisir une classe —</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
      {error && <p className="insc-convert-error">{error}</p>}
      <div className="insc-detail-actions">
        <button className="msg-action-primary" onClick={handleCreate} disabled={busy || !classeId}>
          {busy ? 'Création…' : 'Créer et affecter'} <IconArrow />
        </button>
        <button className="insc-convert-cancel" onClick={() => { setOpen(false); setError(''); }} disabled={busy}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/**
 * Conversion d'une préinscription ENFANT en compte élève + un responsable (parent),
 * avec affectation à une classe. Crée l'élève, crée/rattache le parent (anti-doublon
 * par email/téléphone), passe la demande à « Inscrit » et envoie l'e-mail de bienvenue
 * (identifiants élève + parent).
 */
function ConvertEnfant({ inscription: i, classes, onConverted }) {
  const [open,     setOpen]     = useState(false);
  const [classeId, setClasseId] = useState('');
  const [lien,     setLien]     = useState('pere'); // le responsable est père ou mère
  const [pPrenom,  setPPrenom]  = useState(fmtPrenom(i.contact_prenom || ''));
  const [pNom,     setPNom]     = useState(fmtNom(i.contact_nom || ''));
  const [pEmail,   setPEmail]   = useState(i.contact_email || '');
  const [pTel,     setPTel]     = useState(i.contact_telephone || '');
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');
  const [result,   setResult]   = useState(null);

  if (result) {
    const p = result.parent;
    return (
      <div className="insc-convert insc-convert-done">
        <span className="insc-sheet-soon-title">✓ Élève créé (inactif){result.classeNom ? ` — ${result.classeNom}` : ''}</span>
        <div className="insc-convert-creds">
          <div><span>Élève · identifiant</span><strong>{result.identifiant}</strong></div>
          <div><span>Élève · mot de passe</span><strong>{result.tempPassword}</strong></div>
        </div>
        {p && p.kind === 'created' && (
          <div className="insc-convert-creds">
            <div><span>Parent · identifiant</span><strong>{p.identifiant}</strong></div>
            <div><span>Parent · mot de passe</span><strong>{p.password}</strong></div>
          </div>
        )}
        {p && p.kind === 'linked'  && <span className="insc-convert-mail">↪ Rattaché au compte parent existant ({p.identifiant}).</span>}
        {p && p.kind === 'failed'  && <span className="insc-convert-error">⚠ Élève créé, mais parent non enregistré : {p.error}</span>}
        <span className="insc-convert-mail">Active le compte dans « Gestion des élèves » pour passer la demande en « Inscrit ».</span>
      </div>
    );
  }

  if (i.eleve_id) {
    return (
      <div className="insc-convert insc-sheet-soon">
        <span className="insc-sheet-soon-title">✓ Élève {i.statut === 'inscrit' ? 'activé (inscrit)' : 'créé — à activer'}</span>
        <span>{i.statut === 'inscrit'
          ? 'Le compte est actif et la demande est inscrite.'
          : 'Compte créé (inactif). Active-le dans « Gestion des élèves » pour l’inscrire.'}</span>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!classeId) { setError('Choisis une classe.'); return; }
    if (!pPrenom.trim() || !pNom.trim()) { setError('Renseigne le nom et le prénom du responsable.'); return; }
    if (!pEmail.trim() && !pTel.trim()) { setError('Renseigne un e-mail ou un téléphone pour le responsable.'); return; }
    setBusy(true); setError('');
    try {
      const prenom = fmtPrenom(i.eleve_prenom);
      const nom    = fmtNom(i.eleve_nom);
      const idLogin = generateIdentifiant(prenom, nom).toLowerCase();
      const tempPwd = generateTempPassword();

      const created = await createEleve(nom, prenom, idLogin, tempPwd);
      const eleveId = created?.id ?? await fetchEleveIdParIdentifiant(idLogin);
      if (!eleveId) throw new Error('Compte créé mais introuvable.');

      // Compte créé INACTIF : l'activation le fera passer en « inscrit ».
      const patch = { classe_id: classeId, actif: false };
      if (i.contact_email)        patch.email_contact  = i.contact_email;
      if (i.eleve_date_naissance) patch.date_naissance = i.eleve_date_naissance;
      await updateEleve(eleveId, patch);

      const classe = classes.find(c => c.id === classeId);
      await updateEleveNiveauScolaire(eleveId, classe?.niveau_id || null);

      // Responsable → bloc parent. Anti-doublon : si un parent existe déjà
      // (même e-mail/téléphone), on le rattache au lieu d'en créer un second.
      const isPere = lien === 'pere';
      let bloc = {
        ...emptyBloc(),
        has_pere: isPere,  pere_nom: isPere ? fmtNom(pNom) : '',  pere_prenom: isPere ? fmtPrenom(pPrenom) : '',
        has_mere: !isPere, mere_nom: !isPere ? fmtNom(pNom) : '', mere_prenom: !isPere ? fmtPrenom(pPrenom) : '',
        email: pEmail.trim(), telephone: pTel.trim(), lien: 'parents',
      };
      const { refreshedBlocs } = await checkDuplicatesOnSubmit([bloc]);
      bloc = refreshedBlocs[0];
      if (bloc.matchedParent) bloc.useExisting = true;

      const pResults = await processParentBlocs(eleveId, [bloc]);

      // Rattache la préinscription + passe à « Traité » (contacté).
      await adminLinkPreinscriptionEleve(i.id, eleveId);
      onConverted(eleveId);

      setResult({ identifiant: idLogin, tempPassword: tempPwd, classeNom: classe?.nom, email: i.contact_email, parent: pResults[0] || null });
    } catch (e) {
      setError(e.message || "Erreur lors de la création de l'élève.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div className="insc-convert">
        <button className="msg-action-primary" onClick={() => setOpen(true)}>
          ↪ Créer l'élève + le parent <IconArrow />
        </button>
      </div>
    );
  }

  return (
    <div className="insc-convert">
      <p className="insc-detail-section-title">Affecter à une classe</p>
      <select
        className="admin-filter-select insc-convert-select"
        value={classeId}
        onChange={e => { setClasseId(e.target.value); setError(''); }}
        disabled={busy}
      >
        <option value="">— Choisir une classe —</option>
        {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>

      <p className="insc-detail-section-title">Responsable légal</p>
      <div className="insc-convert-seg">
        <button type="button" className={lien === 'pere' ? 'is-active' : ''} onClick={() => setLien('pere')} disabled={busy}>Père</button>
        <button type="button" className={lien === 'mere' ? 'is-active' : ''} onClick={() => setLien('mere')} disabled={busy}>Mère</button>
      </div>
      <div className="insc-convert-row">
        <input className="insc-convert-input" placeholder="Prénom" value={pPrenom} onChange={e => setPPrenom(e.target.value)} disabled={busy} />
        <input className="insc-convert-input" placeholder="Nom" value={pNom} onChange={e => setPNom(e.target.value)} disabled={busy} />
      </div>
      <div className="insc-convert-row">
        <input className="insc-convert-input" type="email" placeholder="E-mail" value={pEmail} onChange={e => setPEmail(e.target.value)} disabled={busy} />
        <input className="insc-convert-input" placeholder="Téléphone" value={pTel} onChange={e => setPTel(e.target.value)} disabled={busy} />
      </div>

      {error && <p className="insc-convert-error">{error}</p>}
      <div className="insc-detail-actions">
        <button className="msg-action-primary" onClick={handleCreate} disabled={busy || !classeId}>
          {busy ? 'Création…' : 'Créer et affecter'} <IconArrow />
        </button>
        <button className="insc-convert-cancel" onClick={() => { setOpen(false); setError(''); }} disabled={busy}>
          Annuler
        </button>
      </div>
    </div>
  );
}

/** Observations administratives (notes internes) sur une préinscription. */
function ObservationSection({ inscription: i, onSaved }) {
  const [note,  setNote]  = useState(i.admin_note || '');
  const [busy,  setBusy]  = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = note.trim() !== (i.admin_note || '');

  const handleSave = async () => {
    setBusy(true); setSaved(false);
    try {
      const v = note.trim();
      await adminUpdatePreinscriptionNote(i.id, v);
      onSaved(v);
      setSaved(true);
    } catch { /* non bloquant */ }
    finally { setBusy(false); }
  };

  return (
    <>
      <p className="insc-detail-section-title">Observations</p>
      <textarea
        className="insc-note-textarea"
        placeholder="Notes internes : rappels, échanges téléphoniques, particularités…"
        value={note}
        onChange={e => { setNote(e.target.value); setSaved(false); }}
        rows={4}
      />
      <div className="insc-note-actions">
        <button className="msg-action-primary" onClick={handleSave} disabled={busy || !dirty}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && !dirty && <span className="insc-note-saved">✓ Enregistré</span>}
      </div>
    </>
  );
}

export default function Inscriptions() {
  const [data,       setData]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtreStat, setFiltreStat] = useState('nouveau');
  const [filtrePublic, setFiltrePublic] = useState('tous');
  const [selected,   setSelected]   = useState(null); // préinscription ouverte dans le sheet
  const [classes,    setClasses]    = useState([]);   // classes pour l'affectation (conversion adulte)
  const [pdfLoading, setPdfLoading] = useState(false);

  const pageRef    = useRef(null);
  const overlayRef = useRef(null);
  const sheetRef   = useRef(null);
  const closingRef = useRef(false); // garde anti double-fermeture
  usePageAnimation(pageRef, [loading]);

  useEffect(() => {
    fetchPreinscriptions().then(setData).catch(() => {}).finally(() => setLoading(false));
    fetchAllClasses().then(setClasses).catch(() => {});
  }, []);

  // Conversion : la demande passe à « Traité » (contacté) et est liée au compte
  // créé (eleve_id) — la RPC est déjà faite par les composants Convert*. Maj locale
  // + notif sidebar. (L'inscription définitive se fera à l'activation du compte.)
  const markConverted = useCallback((id, eleveId) => {
    setData(prev => prev.map(x => x.id === id ? { ...x, statut: 'contacté', eleve_id: eleveId } : x));
    setSelected(prev => (prev && prev.id === id ? { ...prev, statut: 'contacté', eleve_id: eleveId } : prev));
    emitInscriptionsChanged();
  }, []);

  // Maj locale de l'observation après enregistrement (pas d'impact sur les badges).
  const markNote = useCallback((id, note) => {
    setData(prev => prev.map(x => x.id === id ? { ...x, admin_note: note } : x));
    setSelected(prev => (prev && prev.id === id ? { ...prev, admin_note: note } : prev));
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

  // Export PDF de la fiche de pré-inscription (toutes les infos + observations).
  const exportInscriptionPDF = async (i) => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentW = pageW - margin * 2;
      const GOLD = [191, 138, 48], DARK = [50, 40, 30], MID = [110, 95, 75], WHITE = [255, 255, 255];

      // En-tête
      doc.setFillColor(...GOLD); doc.rect(0, 0, pageW, 24, 'F');
      doc.setTextColor(...WHITE); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('FICHE PRÉINSCRIPTION', margin, 11);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Educamoov — ENT', margin, 18);
      const dateGen = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      doc.setFontSize(8); doc.text(`Généré le ${dateGen}`, pageW - margin, 18, { align: 'right' });

      let y = 33;
      const ensure = (h) => { if (y + h > pageH - 14) { doc.addPage(); y = 18; } };
      const section = (title) => {
        ensure(12);
        doc.setFillColor(...GOLD); doc.rect(margin, y - 3.5, 2.4, 5, 'F');
        doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5);
        doc.text(title, margin + 5, y);
        y += 7;
      };
      const row = (label, value) => {
        const v = (value == null || value === '') ? '—' : String(value);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...MID);
        const lines = doc.splitTextToSize(v, contentW - 44);
        ensure(Math.max(6, lines.length * 4.6));
        doc.text(label, margin + 2, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK);
        doc.text(lines, margin + 44, y);
        y += Math.max(6, lines.length * 4.6);
      };

      // Apprenant
      section('Apprenant');
      row('Nom', fmtNom(i.eleve_nom || ''));
      row('Prénom', fmtPrenom(i.eleve_prenom || ''));
      row('Public', i.est_enfant ? 'Enfant' : 'Adulte');
      const age = calcAge(i.eleve_date_naissance);
      row('Date de naissance', i.eleve_date_naissance
        ? `${formatDateNaissance(i.eleve_date_naissance)}${age != null ? ` (${age} ans)` : ''}` : '—');
      y += 2;

      // Demande
      section('Demande');
      const crumbs = (Array.isArray(i.parcours) ? i.parcours : []).filter((c, idx) => idx !== 0 && c !== 'Enfant' && c !== 'Adulte');
      if (crumbs.length) row('Parcours', crumbs.join(' › '));
      if (i.type === 'tarif') {
        row('Formule', i.formule_nom || i.matiere || '—');
        row('Tarif', i.formule_prix != null ? `${i.formule_prix} €` : '—');
        if (i.formule_rythme) row('Rythme', i.formule_rythme);
        if (Array.isArray(i.disponibilites) && i.disponibilites.length) row('Disponibilités', i.disponibilites.join(' · '));
      } else {
        row('Type', 'Devis sur mesure');
        if (i.devis_sujet)  row('Sujet', i.devis_sujet);
        if (i.devis_besoin) row('Besoin', i.devis_besoin);
      }
      y += 2;

      // Contact / Responsable
      section(i.est_enfant ? 'Responsable' : 'Contact');
      if (i.contact_prenom || i.contact_nom) row('Nom', `${fmtPrenom(i.contact_prenom)} ${fmtNom(i.contact_nom)}`);
      row('Téléphone', i.contact_telephone);
      row('Email', i.contact_email);
      y += 2;

      // Suivi
      section('Suivi');
      row('Statut', (STATUT_CFG[i.statut] || {}).label || i.statut);
      row('Reçue le', formatFullDate(i.created_at));
      y += 2;

      // Observations
      section('Observations');
      const note = (i.admin_note || '').trim();
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...DARK);
      const noteLines = doc.splitTextToSize(note || 'Aucune observation.', contentW - 4);
      ensure(noteLines.length * 4.8);
      doc.text(noteLines, margin + 2, y);

      // Pied de page
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...MID);
      doc.text('Educamoov — Document confidentiel', margin, pageH - 6);

      doc.save(`preinscription-${(fmtNom(i.eleve_nom) || 'fiche').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch { /* génération best-effort */ }
    finally { setPdfLoading(false); }
  };

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

      {/* Filtre public (Enfant / Adulte) */}
      <div className="insc-filters">
        <div className="cls-seg" role="tablist">
          {[['tous', 'Tous'], ['enfant', 'Enfant'], ['adulte', 'Adulte']].map(([v, l]) => (
            <button key={v} type="button" role="tab"
              className={filtrePublic === v ? 'is-active' : ''}
              onClick={() => setFiltrePublic(v)}>
              {l}
            </button>
          ))}
        </div>
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
              // Chemin du pack : format › matière › module (sans le pôle ni le public).
              const crumbs = (Array.isArray(i.parcours) ? i.parcours : [])
                .filter((c, idx) => idx !== 0 && c !== 'Enfant' && c !== 'Adulte');
              if (i.formule_nom && crumbs[crumbs.length - 1] !== i.formule_nom) crumbs.push(i.formule_nom);
              const packPath = crumbs.length ? crumbs.join(' › ') : i.matiere;
              return (
                <div key={i.id} className="insc-item" onClick={() => openInscription(i)}>
                  <div className="insc-item-avatar">{getInitials(i.eleve_prenom, i.eleve_nom)}</div>
                  <div className="insc-item-main">
                    <div className="insc-item-row1">
                      <span className="insc-item-name">{fmtPrenom(i.eleve_prenom)} {fmtNom(i.eleve_nom)}</span>
                      <span className={`badge ${s.cls}`}>{s.label}</span>
                    </div>
                    <div className="insc-item-desc">
                      <span className="insc-desc-matiere">{packPath}</span>
                    </div>
                    <div className="insc-item-meta">
                      <span className="insc-item-price">
                        {i.type === 'devis' ? 'Devis sur mesure' : (i.formule_prix != null ? `${i.formule_prix} €` : 'Formule')}
                      </span>
                      <span className="insc-item-dot" aria-hidden="true">·</span>
                      <span>{formatDate(i.created_at)}</span>
                      {i.admin_note && <span className="insc-item-note" title="Observation présente" aria-label="Observation présente">📝</span>}
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

                  <ObservationSection inscription={i} onSaved={(note) => markNote(i.id, note)} />

                  <button className="insc-pdf-btn" onClick={() => exportInscriptionPDF(i)} disabled={pdfLoading}>
                    ⤓ {pdfLoading ? 'Génération…' : 'Télécharger la fiche PDF'}
                  </button>
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

                  {/* Conversion en compte d'abord : adulte = créer l'étudiant ;
                      enfant = créer l'élève + le parent. Masqué si refusé. */}
                  {i.statut === 'refusé' ? null : i.est_enfant ? (
                    <ConvertEnfant inscription={i} classes={classes} onConverted={(eleveId) => markConverted(i.id, eleveId)} />
                  ) : (
                    <ConvertAdulte inscription={i} classes={classes} onConverted={(eleveId) => markConverted(i.id, eleveId)} />
                  )}

                  {/* Refuser (ou remettre en traitement si déjà refusé) — en dessous. */}
                  <div className="insc-detail-actions">
                    {i.statut === 'refusé' ? (
                      <button className="msg-action-primary" onClick={() => setStatut(i.id, i.statut, 'nouveau')}>
                        Remettre en traitement <IconArrow />
                      </button>
                    ) : (
                      <button className="msg-action-danger" onClick={() => setStatut(i.id, i.statut, 'refusé')}>
                        ✕ Refuser
                      </button>
                    )}
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
