import React, { useState, useEffect, useCallback } from 'react';
import { getEnseignantUser, fetchMesClasses, fetchElevesDeClasse, fetchDevoirsClasse, createDevoir, updateDevoir, deleteDevoir } from './supabaseEnseignant';
import { Flourish } from '../shared/Ornaments';

const C = {
  bg:       '#F2EEDF',
  paper:    '#FBFAF1',
  ink:      '#1E2317',
  ink2:     '#3F4A33',
  ink3:     '#7A876A',
  gold:     '#8A6B1F',
  goldSoft: '#DCBC6E',
  rule:     'rgba(138,107,31,0.18)',
  ruleSoft: 'rgba(138,107,31,0.10)',
};

const JOURS_SHORT = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const MOIS_SHORT  = ['jan','fév','mar','avr','mai','juin','juil','août','sep','oct','nov','déc'];
const MOIS_LONG   = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function countdown(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now) / 86400000);
  if (diff < 0) return `il y a ${Math.abs(diff)} j`;
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'demain';
  return `dans ${diff} jours`;
}
function isPast(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr); d.setHours(0,0,0,0);
  const now = new Date(); now.setHours(0,0,0,0);
  return d < now;
}

const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconChev = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function EnseignantDevoirs() {
  const user = getEnseignantUser();
  const [classes,    setClasses]    = useState([]);
  const [devoirs,    setDevoirs]    = useState([]);
  const [elevesMap,  setElevesMap]  = useState({});
  const [filter,     setFilter]     = useState('encours'); // encours | termines | tous
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const [fTitre,  setFTitre]  = useState('');
  const [fDesc,   setFDesc]   = useState('');
  const [fDate,   setFDate]   = useState('');
  const [fClasse, setFClasse] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const cls = await fetchMesClasses(user.id);
      setClasses(cls);
      const [allDevoirs, elvResults] = await Promise.all([
        Promise.all(cls.map(c => fetchDevoirsClasse(c.id))).then(r => r.flat()),
        Promise.all(cls.map(c => fetchElevesDeClasse(c.id).then(e => [c.id, e]))),
      ]);
      setDevoirs(allDevoirs);
      setElevesMap(Object.fromEntries(elvResults));
    } catch {}
    setLoading(false);
  }, [user?.id]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setFTitre(''); setFDesc(''); setFDate('');
    setFClasse(classes[0]?.id || '');
    setModal({ mode: 'create' });
  };
  const openEdit = (d) => {
    setFTitre(d.titre); setFDesc(d.description || '');
    setFDate(d.date_limite); setFClasse(d.classe_id);
    setModal({ mode: 'edit', devoir: d });
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
      await load(); setModal(null);
    } catch {}
    setSaving(false);
  };
  const handleDelete = async () => {
    if (!confirmDel) return;
    try { await deleteDevoir(confirmDel.id, user.id); await load(); setConfirmDel(null); } catch {}
  };

  // Filtered devoirs sorted by date
  const filtered = devoirs.filter(d => {
    if (filter === 'encours') return !d.date_limite || !isPast(d.date_limite);
    if (filter === 'termines') return d.date_limite && isPast(d.date_limite);
    return true;
  }).sort((a, b) => new Date(a.date_limite || '9999') - new Date(b.date_limite || '9999'));

  const counts = {
    encours:  devoirs.filter(d => !d.date_limite || !isPast(d.date_limite)).length,
    termines: devoirs.filter(d => d.date_limite && isPast(d.date_limite)).length,
    tous:     devoirs.length,
  };

  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const semaine = `Semaine ${Math.ceil(new Date().getDate() / 7)} · Trimestre 3`;

  const inputStyle = {
    width: '100%', background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 12,
    padding: '9px 13px', fontFamily: "'Manrope',sans-serif", fontSize: 13, color: C.ink,
    outline: 'none', boxSizing: 'border-box',
  };
  const modalOverlay = {
    position: 'fixed', inset: 0, background: 'rgba(30,35,23,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  };

  return (
    <div style={{ padding: '32px 40px 48px', minHeight: '100%', background: C.bg, fontFamily: "'Manrope',system-ui,sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Flourish size={26} />
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.ink3 }}>
              Travaux donnés
            </span>
          </div>
          <h1 style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 500, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
            <em style={{ fontStyle: 'italic', color: C.gold }}>Devoirs</em> à rendre
          </h1>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 6 }}>
          <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 12.5, color: C.ink2 }}>{today}</div>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginTop: 3 }}>
            {semaine}
          </div>
        </div>
      </div>

      {/* ── Toolbar : filtres + bouton ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{
          display: 'inline-flex',
          background: C.paper,
          border: `1px solid ${C.rule}`,
          borderRadius: 999,
          padding: 3,
        }}>
          {[
            { k: 'encours',  l: 'En cours' },
            { k: 'termines', l: 'Terminés' },
            { k: 'tous',     l: 'Tous' },
          ].map(({ k, l }) => {
            const active = filter === k;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                style={{
                  padding: '6px 16px', borderRadius: 999,
                  border: 'none',
                  background: active ? C.gold : 'transparent',
                  color: active ? C.paper : C.ink3,
                  fontFamily: "'Manrope',sans-serif", fontSize: 12,
                  fontWeight: active ? 700 : 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {l}
                <span style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: active ? C.goldSoft : C.gold,
                }}>
                  {counts[k]}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10,
            border: 'none', background: C.gold, color: C.paper,
            fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <IconPlus /> Nouveau devoir
        </button>
      </div>

      {/* ── Liste des devoirs ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 16, color: C.ink3 }}>
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 18, color: C.ink3 }}>
          Aucun devoir dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(d => {
            const cl = classes.find(c => c.id === d.classe_id);
            const eleves = elevesMap[d.classe_id] || [];
            const past = isPast(d.date_limite);
            const count = countdown(d.date_limite);
            const date = d.date_limite ? new Date(d.date_limite) : null;
            const dayStr = date ? JOURS_SHORT[date.getDay()] : '—';
            const dayNum = date ? date.getDate() : '—';
            const monStr = date ? MOIS_SHORT[date.getMonth()].toUpperCase() : '';
            const isOwn = d.enseignant_id === user.id;

            return (
              <div
                key={d.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  background: C.paper, borderRadius: 16, border: `1px solid ${C.rule}`,
                  padding: '14px 18px', opacity: past ? 0.7 : 1,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = `0 2px 12px rgba(138,107,31,0.08)`}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Bloc date calendrier */}
                <div style={{
                  flexShrink: 0, width: 56, borderRadius: 12, background: C.bg,
                  border: `1px solid ${C.ruleSoft}`, padding: '7px 0', textAlign: 'center',
                }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3 }}>
                    {dayStr}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 22, fontWeight: 700, color: C.ink, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                    {dayNum}
                  </div>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3 }}>
                    {monStr}
                  </div>
                </div>

                {/* Info devoir */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink3, marginBottom: 3 }}>
                    {cl?.nom || '—'}
                    {d.description && <> · <span style={{ fontWeight: 600 }}>{d.description.substring(0, 30)}</span></>}
                    {' · '}
                    <span style={{ color: past ? C.ink3 : C.gold, fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 17, fontWeight: 500, color: C.ink, letterSpacing: '-0.005em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d.titre}
                  </div>
                  {!isOwn && d.enseignants && (
                    <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 11, color: C.ink3, marginTop: 2 }}>
                      par {d.enseignants.prenom} {d.enseignants.nom}
                    </div>
                  )}
                </div>

                {/* Rendus (nb élèves) */}
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 60 }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink3, marginBottom: 2 }}>
                    Élèves
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 600, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {eleves.length}
                  </div>
                </div>

                {/* Bouton action */}
                {isOwn && (
                  <button
                    onClick={() => openEdit(d)}
                    style={{
                      flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                      border: `1px solid ${C.rule}`, background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: C.ink3, cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; e.currentTarget.style.borderColor = C.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink3; e.currentTarget.style.borderColor = C.rule; }}
                  >
                    <IconChev />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal création / édition ── */}
      {modal && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: C.paper, borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, border: `1px solid ${C.rule}` }}>
            <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 22, fontWeight: 500, color: C.ink, marginBottom: 20 }}>
              {modal.mode === 'create' ? 'Nouveau devoir' : 'Modifier le devoir'}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>Titre *</label>
              <input style={inputStyle} value={fTitre} onChange={e => setFTitre(e.target.value)} placeholder="Ex : Révisions chapitre 3" autoFocus />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: "'Manrope',sans-serif" }} value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Instructions, pages à lire…" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>Classe *</label>
                <select style={inputStyle} value={fClasse} onChange={e => setFClasse(e.target.value)} disabled={modal.mode === 'edit'}>
                  <option value="">— Choisir —</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginBottom: 6 }}>Date limite *</label>
                <input type="date" style={inputStyle} value={fDate} onChange={e => setFDate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
              <div>
                {modal.mode === 'edit' && modal.devoir?.enseignant_id === user.id && (
                  <button
                    onClick={() => { setConfirmDel(modal.devoir); setModal(null); }}
                    style={{ padding: '9px 16px', borderRadius: 999, border: 'none', background: 'rgba(179,64,64,0.1)', color: '#b34040', fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setModal(null)} style={{ padding: '9px 20px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving || !fTitre.trim() || !fDate || !fClasse} style={{ padding: '9px 22px', borderRadius: 999, border: 'none', background: C.ink, color: C.paper, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !fTitre.trim() || !fDate || !fClasse ? 0.5 : 1 }}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ── */}
      {confirmDel && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setConfirmDel(null); }}>
          <div style={{ background: C.paper, borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, border: `1px solid ${C.rule}`, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 20, fontWeight: 500, color: C.ink, marginBottom: 10 }}>Supprimer ce devoir ?</div>
            <p style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 14, color: C.ink2, marginBottom: 24 }}>
              « {confirmDel.titre} » sera supprimé définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDel(null)} style={{ padding: '9px 20px', borderRadius: 999, border: `1px solid ${C.rule}`, background: 'transparent', color: C.ink2, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleDelete} style={{ padding: '9px 22px', borderRadius: 999, border: 'none', background: '#b34040', color: '#fff', fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
