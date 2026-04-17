import React, { useState, useEffect, useCallback } from 'react';
import { getEnseignantUser, fetchMesClasses, fetchDevoirsClasse, createDevoir, updateDevoir, deleteDevoir } from './supabaseEnseignant';
import { motion, tapScale } from '../animations';

// ─── Helpers calendrier ───────────────────────────────────────────────────────
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function getDaysInMonth(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // lundi = 0
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
// Classes Tailwind pour les styles statiques
const C = {
  page:       'min-h-full flex flex-col gap-5',
  topBar:     'flex items-center justify-between flex-wrap gap-3',
  classeTabs: 'flex gap-2 flex-wrap',
  addBtn:     'inline-flex items-center gap-[7px] py-[9px] px-[18px] rounded-full border-none bg-a-gold text-white text-[13px] font-bold cursor-pointer whitespace-nowrap shadow-a-gold',
  calWrap:    'bg-a-bg-card rounded-a border border-a-border overflow-hidden',
  calHeader:  'flex items-center justify-between px-5 py-4 border-b border-a-border',
  calTitle:   'font-a-display text-base font-bold text-a-fg',
  navBtn:     'bg-transparent border border-a-border rounded-lg px-3 py-1.5 text-a-fg-mid cursor-pointer text-sm flex items-center',
  calGrid:    'grid grid-cols-7',
  dayHead:    'text-center py-2.5 px-1 text-[11px] font-bold text-a-fg-light uppercase tracking-[.5px] border-b border-a-border',
  pill:       'text-a-gold text-[11px] font-semibold py-[2px] px-[7px] rounded-[6px] mb-[3px] whitespace-nowrap overflow-hidden text-ellipsis max-w-full block leading-[1.4]',
  empty:      'text-center py-20 px-5 text-a-fg-mid',
  panel:      'bg-a-bg-card rounded-a border border-a-border p-5 flex flex-col gap-3.5',
  panelTitle: 'font-a-display text-[15px] font-bold text-a-fg mb-1',
  devoirCard: 'bg-a-bg rounded-a-sm border border-a-border py-3 px-3.5',
  devoirTitre:'text-sm font-semibold text-a-fg mb-1',
  devoirDesc: 'text-[13px] text-a-fg-mid leading-normal',
  devoirClasse:'text-[11px] text-a-gold font-semibold mt-1.5',
  devoirActions:'flex gap-2 mt-2.5',
  panelAddBtn:'flex items-center gap-1.5 py-[9px] px-3.5 rounded-lg border-[1.5px] border-dashed border-a-border bg-transparent text-a-fg-mid text-[13px] cursor-pointer justify-center mt-1',
  overlay:    'fixed inset-0 flex items-center justify-center z-[1000]',
  modal:      'bg-a-bg-card rounded-a p-7 w-full max-w-[480px] border border-a-border max-h-[90vh] overflow-y-auto',
  modalTitle: 'font-a-display text-[17px] font-bold text-a-fg mb-5',
  field:      'mb-4',
  label:      'block text-[11px] font-bold text-a-fg-mid mb-1.5 uppercase tracking-[.5px]',
  input:      'w-full py-2.5 px-3.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none box-border',
  textarea:   'w-full py-2.5 px-3.5 rounded-a-sm border border-a-border bg-a-bg-input text-a-fg text-sm outline-none box-border resize-y min-h-[80px]',
  btnRow:     'flex gap-2.5 justify-end mt-5',
  btnCancel:  'py-[9px] px-5 rounded-full border border-a-border bg-transparent text-a-fg-mid text-[13px] font-semibold cursor-pointer',
  btnSave:    'py-[9px] px-5 rounded-full border-none bg-a-gold text-white text-[13px] font-semibold cursor-pointer',
  btnDel:     'py-[9px] px-5 rounded-full border-none bg-a-red text-white text-[13px] font-semibold cursor-pointer mr-auto',
  loading:    'text-center p-[60px] text-a-fg-mid text-sm',
};

// Styles dynamiques (dépendent de paramètres JS)
const S = {
  classeTab: (active) => ({
    padding:'7px 16px', borderRadius:980, border:`1.5px solid ${active ? 'var(--a-gold)' : 'var(--a-border)'}`,
    background: active ? 'rgba(191,138,48,.12)' : 'transparent',
    color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer',
  }),
  dayCell: (today, past, selected, hasDevoirs) => ({
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
  overlay: { background:'rgba(0,0,0,.6)', backdropFilter:'blur(6px)' },
  pill: { background:'rgba(191,138,48,.18)' },
};

const IconPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconChevLeft  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const IconChevRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>;

// ─── Composant principal ──────────────────────────────────────────────────────
export default function EnseignantDevoirs() {
  const user = getEnseignantUser();
  const [classes,  setClasses]  = useState([]);
  const [devoirs,  setDevoirs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selClasse, setSelClasse] = useState(null);
  const [selDay,    setSelDay]    = useState(null); // { year, month, day }
  const [modal,     setModal]     = useState(null); // null | { mode:'create'|'edit', devoir? }
  const [saving,    setSaving]    = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  // Calendrier navigation
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Formulaire modal
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
      // Fetch devoirs de TOUTES les classes du prof (inclut ceux des autres profs)
      const allDevoirs = await Promise.all(cls.map(c => fetchDevoirsClasse(c.id)));
      setDevoirs(allDevoirs.flat());
    } catch(e) {}
    setLoading(false);
  }, [user?.id]);

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

  // Devoirs filtrés par classe sélectionnée
  const devoirsFiltres = selClasse ? devoirs.filter(d => d.classe_id === selClasse) : devoirs;

  // Index devoirs par date
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
        await updateDevoir(modal.devoir.id, { titre: fTitre.trim(), description: fDesc.trim() || null, date_limite: fDate, classe_id: fClasse }, user.id);
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

  if (loading) return <div className={C.loading}>Chargement...</div>;

  if (classes.length === 0) return (
    <div className={C.empty}>
      <div className="text-5xl mb-4 opacity-40">📋</div>
      <div className="text-lg font-semibold text-a-fg mb-2">Aucune classe assignée</div>
      <p className="text-sm">L'administrateur vous assignera des classes prochainement.</p>
    </div>
  );

  const days = getDaysInMonth(calYear, calMonth);

  return (
    <div className={C.page}>

      {/* ── Barre du haut ── */}
      <div className={C.topBar}>
        <div className={C.classeTabs}>
          {classes.map(c => (
            <motion.button key={c.id} style={S.classeTab(selClasse === c.id)} {...tapScale} onClick={() => { setSelClasse(c.id); setSelDay(null); }}>
              {c.nom}
            </motion.button>
          ))}
        </div>
        <motion.button className={C.addBtn} {...tapScale} onClick={() => openCreate('')}>
          <IconPlus /> Ajouter un devoir
        </motion.button>
      </div>

      {/* ── Calendrier + panneau latéral ── */}
      <div className="grid gap-4 items-start" style={{ gridTemplateColumns: selDay ? '1fr 300px' : '1fr' }}>

        {/* Calendrier */}
        <div className={C.calWrap}>
          <div className={C.calHeader}>
            <button className={C.navBtn} onClick={prevMonth}><IconChevLeft /></button>
            <span className={C.calTitle}>{MOIS[calMonth]} {calYear}</span>
            <button className={C.navBtn} onClick={nextMonth}><IconChevRight /></button>
          </div>
          <div className={C.calGrid}>
            {JOURS.map(j => <div key={j} className={C.dayHead}>{j}</div>)}
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} style={{ ...S.dayCell(false, false, false, false), background:'rgba(0,0,0,.02)', cursor:'default' }} />;
              const dateStr  = toDateStr(calYear, calMonth, day);
              const dayDvs   = devoirsByDate[dateStr] || [];
              const today_   = isToday(calYear, calMonth, day);
              const past_    = isPast(calYear, calMonth, day);
              const selected = selDay?.year === calYear && selDay?.month === calMonth && selDay?.day === day;
              return (
                <div key={day}
                  style={S.dayCell(today_, past_, selected, dayDvs.length > 0)}
                  onClick={() => { if (!past_) setSelDay({ year: calYear, month: calMonth, day }); }}
                  onMouseEnter={e => { if (!past_) e.currentTarget.style.background = 'rgba(191,138,48,.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected ? 'rgba(191,138,48,.07)' : 'transparent'; }}>
                  <div style={S.dayNum(today_)}>{day}</div>
                  {dayDvs.map(d => (
                    <span key={d.id} className={C.pill} style={S.pill} title={d.titre}>{d.titre}</span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panneau latéral */}
        {selDay && (
          <div className={C.panel}>
            <div>
              <div className={C.panelTitle}>{formatDayLabel(selDay.year, selDay.month, selDay.day)}</div>
              <div className="text-xs text-a-fg-light">{devoirsDuJour.length} devoir{devoirsDuJour.length !== 1 ? 's' : ''}</div>
            </div>

            {devoirsDuJour.length === 0 ? (
              <div className="text-center py-5 text-a-fg-light text-[13px]">
                Aucun devoir ce jour
              </div>
            ) : (
              devoirsDuJour.map(d => {
                const cl = classes.find(c => c.id === d.classe_id);
                const isOwn = d.enseignant_id === user.id;
                return (
                  <div key={d.id} className={C.devoirCard}>
                    <div className={C.devoirTitre}>{d.titre}</div>
                    {d.description && <div className={C.devoirDesc}>{d.description}</div>}
                    {cl && <div className={C.devoirClasse}>📚 {cl.nom}</div>}
                    {!isOwn && d.enseignants && (
                      <div className="text-[11px] text-a-fg-light mt-1 italic">
                        Par {d.enseignants.prenom} {d.enseignants.nom}
                      </div>
                    )}
                    {isOwn && (
                      <div className={C.devoirActions}>
                        <button style={S.iconBtn('var(--a-gold)')} onClick={() => openEdit(d)}>✏️ Modifier</button>
                        <button style={S.iconBtn('var(--a-red)')} onClick={() => setConfirmDel(d)}>🗑️ Supprimer</button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <button className={C.panelAddBtn} onClick={() => openCreate(toDateStr(selDay.year, selDay.month, selDay.day))}>
              <IconPlus /> Ajouter pour ce jour
            </button>
          </div>
        )}
      </div>

      {/* ── Modal création / édition ── */}
      {modal && (
        <div className={C.overlay} style={S.overlay} onClick={() => setModal(null)}>
          <div className={C.modal} onClick={e => e.stopPropagation()}>
            <div className={C.modalTitle}>{modal.mode === 'create' ? '➕ Nouveau devoir' : '✏️ Modifier le devoir'}</div>

            <div className={C.field}>
              <label className={C.label}>Titre *</label>
              <input className={C.input} value={fTitre} onChange={e => setFTitre(e.target.value)} placeholder="Ex : Révisions chapitre 3" autoFocus />
            </div>

            <div className={C.field}>
              <label className={C.label}>Description</label>
              <textarea className={C.textarea} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Instructions, pages à lire..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={C.field}>
                <label className={C.label}>Classe *</label>
                <select className={C.input} value={fClasse} onChange={e => setFClasse(e.target.value)}>
                  <option value="">— Choisir —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div className={C.field}>
                <label className={C.label}>Date limite *</label>
                <input type="date" className={C.input} value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
            </div>

            <div className={C.btnRow}>
              {modal.mode === 'edit' && modal.devoir?.enseignant_id === user.id && (
                <button className={C.btnDel} onClick={() => { setConfirmDel(modal.devoir); setModal(null); }}>Supprimer</button>
              )}
              <button className={C.btnCancel} onClick={() => setModal(null)}>Annuler</button>
              <button className={C.btnSave} style={{ opacity: saving ? .6 : 1 }} onClick={handleSave} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div className={C.overlay} style={S.overlay} onClick={() => setConfirmDel(null)}>
          <div className={`${C.modal} !max-w-[380px]`} onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🗑️</div>
              <div className={C.modalTitle}>Supprimer ce devoir ?</div>
              <p className="text-sm text-a-fg-mid">« {confirmDel.titre} » sera supprimé définitivement.</p>
            </div>
            <div className={C.btnRow}>
              <button className={C.btnCancel} onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className={C.btnDel} onClick={() => handleDelete(confirmDel.id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
