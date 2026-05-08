import React, { useState, useEffect, useCallback } from 'react';
import { getEnseignantUser, fetchMesClasses, fetchDevoirsClasse, createDevoir, updateDevoir, deleteDevoir } from './supabaseEnseignant';
import { motion, tapScale } from '../animations';

// ─── Helpers calendrier ───────────────────────────────────────────────────────
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getDaysInMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDayLabel(year, month, day) {
  const d = new Date(year, month, day);
  return d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

function isToday(year, month, day) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

function isPast(year, month, day) {
  const t = new Date(); t.setHours(0,0,0,0);
  return new Date(year, month, day) < t;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = {
  page:         { minHeight:'100%', display:'flex', flexDirection:'column', gap:20 },
  topBar:       { display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 },
  classeTabs:   { display:'flex', gap:8, flexWrap:'wrap' },
  addBtn:       { display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' },
  calWrap:      { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', overflow:'hidden' },
  calHeader:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid var(--a-border)' },
  calTitle:     { fontFamily:'var(--a-font-display)', fontSize:16, fontWeight:700, color:'var(--a-fg)' },
  navBtn:       { background:'transparent', border:'1px solid var(--a-border)', borderRadius:8, padding:'6px 12px', color:'var(--a-fg-mid)', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center' },
  calGrid:      { display:'grid', gridTemplateColumns:'repeat(7,1fr)' },
  dayHead:      { textAlign:'center', padding:'10px 4px', fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--a-border)' },
  pill:         { display:'block', color:'var(--a-gold)', fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:6, marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%', lineHeight:1.4 },
  empty:        { textAlign:'center', padding:'80px 20px', color:'var(--a-fg-mid)' },
  panel:        { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:20, display:'flex', flexDirection:'column', gap:14 },
  panelTitle:   { fontFamily:'var(--a-font-display)', fontSize:15, fontWeight:700, color:'var(--a-fg)', marginBottom:2 },
  devoirCard:   { background:'var(--a-bg)', borderRadius:10, border:'1px solid var(--a-border)', padding:'12px 14px' },
  devoirTitre:  { fontSize:14, fontWeight:600, color:'var(--a-fg)', marginBottom:4 },
  devoirDesc:   { fontSize:13, color:'var(--a-fg-mid)', lineHeight:1.55 },
  devoirClasse: { fontSize:11, color:'var(--a-gold)', fontWeight:600, marginTop:6 },
  devoirActions:{ display:'flex', gap:8, marginTop:10 },
  panelAddBtn:  { display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:8, border:'1.5px dashed var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, cursor:'pointer', justifyContent:'center', marginTop:4 },
  overlay:      { position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:        { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', padding:28, width:'100%', maxWidth:480, border:'1px solid var(--a-border)', maxHeight:'90vh', overflowY:'auto' },
  modalTitle:   { fontFamily:'var(--a-font-display)', fontSize:17, fontWeight:700, color:'var(--a-fg)', marginBottom:20 },
  field:        { marginBottom:16 },
  label:        { display:'block', fontSize:11, fontWeight:700, color:'var(--a-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' },
  input:        { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--a-border)', background:'var(--a-bg)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box' },
  textarea:     { width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--a-border)', background:'var(--a-bg)', color:'var(--a-fg)', fontSize:14, outline:'none', boxSizing:'border-box', resize:'vertical', minHeight:80, fontFamily:'inherit' },
  btnRow:       { display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 },
  btnCancel:    { padding:'9px 20px', borderRadius:980, border:'1px solid var(--a-border)', background:'transparent', color:'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSave:      { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnDel:       { padding:'9px 20px', borderRadius:980, border:'none', background:'var(--a-red)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginRight:'auto' },
  loading:      { textAlign:'center', padding:'60px 20px', color:'var(--a-fg-mid)', fontSize:14 },
};

// Styles dynamiques
const S = {
  classeTab: (active) => ({
    padding:'7px 16px', borderRadius:980, border:`1.5px solid ${active ? 'var(--a-gold)' : 'var(--a-border)'}`,
    background: active ? 'rgba(191,138,48,.12)' : 'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer',
  }),
  dayCell: (today, past, selected) => ({
    minHeight:90, padding:'8px 6px', borderRight:'1px solid var(--a-border)', borderBottom:'1px solid var(--a-border)',
    cursor: past ? 'default' : 'pointer',
    background: selected ? 'rgba(191,138,48,.07)' : 'transparent',
    outline: today ? '2px solid var(--a-gold)' : 'none',
    outlineOffset: today ? '-2px' : '0',
    opacity: past ? 0.45 : 1,
    transition:'background .15s',
  }),
  dayNum: (today) => ({ fontSize:13, fontWeight: today ? 700 : 400, color: today ? 'var(--a-gold)' : 'var(--a-fg)', marginBottom:4 }),
  iconBtn: (color) => ({ padding:'5px 12px', borderRadius:6, border:`1px solid ${color}22`, background:`${color}12`, color, fontSize:12, cursor:'pointer', fontWeight:600 }),
  overlayBg: { background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' },
  pill: { background:'rgba(191,138,48,.18)' },
};

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconChevLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EnseignantDevoirs() {
  const user = getEnseignantUser();
  const [classes,    setClasses]    = useState([]);
  const [devoirs,    setDevoirs]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selClasse,  setSelClasse]  = useState(null);
  const [selDay,     setSelDay]     = useState(null);
  const [modal,      setModal]      = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [fTitre,  setFTitre]  = useState('');
  const [fDesc,   setFDesc]   = useState('');
  const [fDate,   setFDate]   = useState('');
  const [fClasse, setFClasse] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const cls = await fetchMesClasses(user.id);
      setClasses(cls);
      if (cls.length > 0 && !selClasse) setSelClasse(cls[0].id);
      const allDevoirs = await Promise.all(cls.map(c => fetchDevoirsClasse(c.id)));
      setDevoirs(allDevoirs.flat());
    } catch(e) {}
    setLoading(false);
  }, [user?.id]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelDay(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelDay(null);
  };

  const devoirsFiltres = selClasse ? devoirs.filter(d => d.classe_id === selClasse) : devoirs;

  const devoirsByDate = {};
  devoirsFiltres.forEach(d => {
    if (!devoirsByDate[d.date_limite]) devoirsByDate[d.date_limite] = [];
    devoirsByDate[d.date_limite].push(d);
  });

  const devoirsDuJour = selDay
    ? (devoirsByDate[toDateStr(selDay.year, selDay.month, selDay.day)] || [])
    : [];

  const openCreate = (dateStr) => {
    setFTitre(''); setFDesc('');
    setFDate(dateStr || (selDay ? toDateStr(selDay.year, selDay.month, selDay.day) : ''));
    setFClasse(selClasse || (classes[0]?.id || ''));
    setModal({ mode:'create' });
  };

  const openEdit = (devoir) => {
    setFTitre(devoir.titre); setFDesc(devoir.description || '');
    setFDate(devoir.date_limite); setFClasse(devoir.classe_id);
    setModal({ mode:'edit', devoir });
  };

  const handleSave = async () => {
    if (!fTitre.trim() || !fDate || !fClasse) return;
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await createDevoir({ enseignant_id: user.id, classe_id: fClasse, titre: fTitre.trim(), description: fDesc.trim() || null, date_limite: fDate });
      } else {
        await updateDevoir(modal.devoir.id, { titre: fTitre.trim(), description: fDesc.trim() || null, date_limite: fDate }, user.id);
      }
      await load();
      setModal(null);
    } catch(e) { alert(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDevoir(id, user.id);
      setConfirmDel(null);
      await load();
    } catch(e) { alert(e.message); }
  };

  if (loading) return <div style={C.loading}>Chargement...</div>;

  if (classes.length === 0) return (
    <div style={C.empty}>
      <div style={{ fontSize:52, marginBottom:16, opacity:.3 }}>📋</div>
      <div style={{ fontSize:18, fontWeight:600, color:'var(--a-fg)', marginBottom:8 }}>Aucune classe assignée</div>
      <p style={{ fontSize:14 }}>L'administrateur vous assignera des classes prochainement.</p>
    </div>
  );

  const days = getDaysInMonth(calYear, calMonth);

  return (
    <div style={C.page}>

      {/* ── Barre du haut ── */}
      <div style={C.topBar}>
        <div style={C.classeTabs}>
          {classes.map(c => (
            <motion.button key={c.id} style={S.classeTab(selClasse === c.id)} {...tapScale} onClick={() => { setSelClasse(c.id); setSelDay(null); }}>
              {c.nom}
            </motion.button>
          ))}
        </div>
        <motion.button style={C.addBtn} {...tapScale} onClick={() => openCreate('')}>
          <IconPlus /> Ajouter un devoir
        </motion.button>
      </div>

      {/* ── Calendrier + panneau latéral ── */}
      <div style={{ display:'grid', gap:16, alignItems:'start', gridTemplateColumns: selDay ? '1fr 300px' : '1fr' }}>

        {/* Calendrier */}
        <div style={C.calWrap}>
          <div style={C.calHeader}>
            <button style={C.navBtn} onClick={prevMonth}><IconChevLeft /></button>
            <span style={C.calTitle}>{MOIS[calMonth]} {calYear}</span>
            <button style={C.navBtn} onClick={nextMonth}><IconChevRight /></button>
          </div>
          <div style={C.calGrid}>
            {JOURS.map(j => <div key={j} style={C.dayHead}>{j}</div>)}
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} style={{ ...S.dayCell(false, false, false), background:'rgba(0,0,0,.02)', cursor:'default' }} />;
              const dateStr  = toDateStr(calYear, calMonth, day);
              const dayDvs   = devoirsByDate[dateStr] || [];
              const today_   = isToday(calYear, calMonth, day);
              const past_    = isPast(calYear, calMonth, day);
              const selected = selDay?.year === calYear && selDay?.month === calMonth && selDay?.day === day;
              return (
                <div key={day}
                  style={S.dayCell(today_, past_, selected)}
                  onClick={() => { if (!past_) setSelDay({ year: calYear, month: calMonth, day }); }}
                  onMouseEnter={e => { if (!past_) e.currentTarget.style.background = 'rgba(191,138,48,.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected ? 'rgba(191,138,48,.07)' : 'transparent'; }}>
                  <div style={S.dayNum(today_)}>{day}</div>
                  {dayDvs.map(d => (
                    <span key={d.id} style={{ ...C.pill, ...S.pill }} title={d.titre}>{d.titre}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau latéral */}
        {selDay && (
          <div style={C.panel}>
            <div>
              <div style={C.panelTitle}>{formatDayLabel(selDay.year, selDay.month, selDay.day)}</div>
              <div style={{ fontSize:12, color:'var(--a-fg-light)' }}>{devoirsDuJour.length} devoir{devoirsDuJour.length !== 1 ? 's' : ''}</div>
            </div>

            {devoirsDuJour.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--a-fg-light)', fontSize:13 }}>
                Aucun devoir ce jour
              </div>
            ) : (
              devoirsDuJour.map(d => {
                const cl = classes.find(c => c.id === d.classe_id);
                const isOwn = d.enseignant_id === user.id;
                return (
                  <div key={d.id} style={C.devoirCard}>
                    <div style={C.devoirTitre}>{d.titre}</div>
                    {d.description && <div style={C.devoirDesc}>{d.description}</div>}
                    {cl && <div style={C.devoirClasse}>📚 {cl.nom}</div>}
                    {!isOwn && d.enseignants && (
                      <div style={{ fontSize:11, color:'var(--a-fg-light)', marginTop:4, fontStyle:'italic' }}>
                        Par {d.enseignants.prenom} {d.enseignants.nom}
                      </div>
                    )}
                    {isOwn && (
                      <div style={C.devoirActions}>
                        <button style={S.iconBtn('var(--a-gold)')} onClick={() => openEdit(d)}>✏️ Modifier</button>
                        <button style={S.iconBtn('var(--a-red)')} onClick={() => setConfirmDel(d)}>🗑️ Supprimer</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button style={C.panelAddBtn} onClick={() => openCreate(toDateStr(selDay.year, selDay.month, selDay.day))}>
              <IconPlus /> Ajouter pour ce jour
            </button>
          </div>
        )}
      </div>

      {/* ── Modal création / édition ── */}
      {modal && (
        <div style={{ ...C.overlay, ...S.overlayBg }} onClick={() => setModal(null)}>
          <div style={C.modal} onClick={e => e.stopPropagation()}>
            <div style={C.modalTitle}>{modal.mode === 'create' ? '➕ Nouveau devoir' : '✏️ Modifier le devoir'}</div>

            <div style={C.field}>
              <label style={C.label}>Titre *</label>
              <input style={C.input} value={fTitre} onChange={e => setFTitre(e.target.value)} placeholder="Ex : Révisions chapitre 3" autoFocus />
            </div>

            <div style={C.field}>
              <label style={C.label}>Description</label>
              <textarea style={C.textarea} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Instructions, pages à lire..." />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={C.field}>
                <label style={C.label}>Classe *</label>
                <select style={{ ...C.input, opacity: modal.mode === 'edit' ? 0.6 : 1, cursor: modal.mode === 'edit' ? 'not-allowed' : 'auto' }} value={fClasse} onChange={e => setFClasse(e.target.value)} disabled={modal.mode === 'edit'} title={modal.mode === 'edit' ? "La classe d'un devoir existant ne peut pas être modifiée. Pour déplacer un devoir, supprimez-le et recréez-le dans la nouvelle classe." : undefined}>
                  <option value="">— Choisir —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div style={C.field}>
                <label style={C.label}>Date limite *</label>
                <input type="date" style={C.input} value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
            </div>

            <div style={C.btnRow}>
              {modal.mode === 'edit' && modal.devoir?.enseignant_id === user.id && (
                <button style={C.btnDel} onClick={() => { setConfirmDel(modal.devoir); setModal(null); }}>Supprimer</button>
              )}
              <button style={C.btnCancel} onClick={() => setModal(null)}>Annuler</button>
              <button style={{ ...C.btnSave, opacity: saving ? .6 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div style={{ ...C.overlay, ...S.overlayBg }} onClick={() => setConfirmDel(null)}>
          <div style={{ ...C.modal, maxWidth:380 }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🗑️</div>
              <div style={C.modalTitle}>Supprimer ce devoir ?</div>
              <p style={{ fontSize:14, color:'var(--a-fg-mid)' }}>« {confirmDel.titre} » sera supprimé définitivement.</p>
            </div>
            <div style={C.btnRow}>
              <button style={C.btnCancel} onClick={() => setConfirmDel(null)}>Annuler</button>
              <button style={C.btnDel} onClick={() => handleDelete(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
