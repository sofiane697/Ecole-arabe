import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchRetardsAbsences, createRetardAbsence, updateRetardAbsence, deleteRetardAbsence,
  fetchDeclarationsClasse, markDeclarationVueEnseignant,
} from './supabaseEnseignant';
import { todayISO } from '../shared/dateUtils';
import { Flourish } from '../shared/Ornaments';
import EleveAvatar from '../shared/EleveAvatar';

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

function todayStr() { return todayISO(); }
function initials(e) { return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase(); }
function fmtDate(str) {
  if (!str) return { day: '—', dow: '—', rel: '' };
  const d = new Date(str);
  const day = d.getDate();
  const dow = d.toLocaleDateString('fr-FR', { weekday:'short' }).replace('.','');
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  const rel = diffDays === 0 ? 'aujourd\'hui' : diffDays === 1 ? 'hier' : `il y a ${diffDays}j`;
  return { day, dow, rel };
}

export default function EnseignantAbsences() {
  const user = getEnseignantUser();
  const [classes,   setClasses]   = useState([]);
  const [selClasse, setSelClasse] = useState(null);
  const [eleves,    setEleves]    = useState([]);
  const [entries,   setEntries]   = useState([]);   // all records for this class
  const [statuts,   setStatuts]   = useState({});   // eleveId → { status, recordId }
  const [saving,    setSaving]    = useState({});    // eleveId → bool
  const [decls,     setDecls]     = useState([]);
  const [timeFilter, setTimeFilter] = useState('today');
  const [loading,   setLoading]   = useState(false);

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  const classeActive = classes.find(c => c.id === selClasse);

  useEffect(() => {
    if (!user?.id) return;
    fetchMesClasses(user.id)
      .then(cs => { setClasses(cs); if (cs.length > 0) setSelClasse(cs[0].id); })
      .catch(() => {});
  }, []); // eslint-disable-line

  const load = useCallback(async () => {
    if (!selClasse) return;
    setLoading(true);
    try {
      const [els, ents, dcls] = await Promise.all([
        fetchElevesDeClasse(selClasse),
        fetchRetardsAbsences(selClasse),
        fetchDeclarationsClasse(user.id, selClasse),
      ]);
      setEleves(els);
      setEntries(ents);
      setDecls(dcls || []);

      // Init statuts from today's records
      const todayRecs = ents.filter(e => e.date === todayStr());
      const map = {};
      els.forEach(el => {
        const rec = todayRecs.find(r => r.eleve_id === el.id);
        map[el.id] = rec
          ? { status: rec.type, recordId: rec.id, commentaire: rec.commentaire }
          : { status: 'present', recordId: null, commentaire: null };
      });
      setStatuts(map);
    } catch {
      setEleves([]); setEntries([]); setDecls([]);
    }
    setLoading(false);
  }, [selClasse]); // eslint-disable-line

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (eleveId, newStatus) => {
    const current = statuts[eleveId] || { status: 'present', recordId: null };
    if (current.status === newStatus) return;
    setSaving(s => ({ ...s, [eleveId]: true }));
    try {
      if (newStatus === 'present') {
        if (current.recordId) await deleteRetardAbsence(current.recordId, user.id);
        setStatuts(s => ({ ...s, [eleveId]: { status: 'present', recordId: null } }));
        setEntries(e => e.filter(r => r.id !== current.recordId));
      } else {
        if (current.recordId) {
          await updateRetardAbsence(current.recordId, { type: newStatus, date: todayStr() }, user.id);
          setStatuts(s => ({ ...s, [eleveId]: { ...s[eleveId], status: newStatus } }));
          setEntries(e => e.map(r => r.id === current.recordId ? { ...r, type: newStatus } : r));
        } else {
          const rec = await createRetardAbsence({
            enseignant_id: user.id, classe_id: selClasse,
            eleve_id: eleveId, type: newStatus, date: todayStr(),
          });
          const newId = rec?.id || null;
          setStatuts(s => ({ ...s, [eleveId]: { status: newStatus, recordId: newId } }));
          if (rec) setEntries(e => [rec, ...e]);
        }
      }
    } catch {}
    setSaving(s => ({ ...s, [eleveId]: false }));
  };

  // Historique filtered
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const historique = entries
    .filter(e => {
      const d = new Date(e.date);
      if (timeFilter === 'today') return e.date === todayStr();
      if (timeFilter === 'week') return d >= startOfWeek;
      return d >= startOfMonth;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const nbPresents = Object.values(statuts).filter(s => s.status === 'present').length;
  const nbRetards  = Object.values(statuts).filter(s => s.status === 'retard').length;
  const nbAbsents  = Object.values(statuts).filter(s => s.status === 'absence').length;

  const segItemStyle = (active) => ({
    padding: '6px 16px', borderRadius: 999,
    border: 'none',
    background: active ? C.gold : 'transparent',
    color: active ? C.paper : C.ink3,
    fontFamily: "'Manrope',sans-serif", fontSize: 12,
    fontWeight: active ? 700 : 600,
    cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ padding: '32px 40px 48px', minHeight: '100%', background: C.bg, fontFamily: "'Manrope',system-ui,sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Flourish size={26} />
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.ink3 }}>
              Pointage du jour
            </span>
          </div>
          <h1 style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 500, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
            <em style={{ fontStyle: 'italic', color: C.gold }}>Retards</em> &amp; absences
          </h1>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 6 }}>
          <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 12.5, color: C.ink2 }}>{today}</div>
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginTop: 3 }}>
            {new Date().toLocaleDateString('fr-FR',{weekday:'long'}).toUpperCase()} {nowTime}
          </div>
        </div>
      </div>

      {/* ── Barre : onglets classes + filtre temps ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 10 }}>
        <div style={{
          display: 'inline-flex',
          background: C.paper,
          border: `1px solid ${C.rule}`,
          borderRadius: 999,
          padding: 3,
        }}>
          {classes.map(c => (
            <button key={c.id} onClick={() => setSelClasse(c.id)} style={segItemStyle(selClasse === c.id)}>
              {c.nom}
            </button>
          ))}
        </div>
        <div style={{
          display: 'inline-flex',
          background: C.paper,
          border: `1px solid ${C.rule}`,
          borderRadius: 999,
          padding: 3,
        }}>
          {[
            { k: 'today', l: "Aujourd'hui" },
            { k: 'week',  l: 'Cette semaine' },
            { k: 'month', l: 'Ce mois' },
          ].map(({ k, l }) => {
            const active = timeFilter === k;
            return (
              <button key={k} onClick={() => setTimeFilter(k)} style={{
                padding: '6px 16px', borderRadius: 999,
                border: 'none',
                background: active ? C.gold : 'transparent',
                color: active ? C.paper : C.ink3,
                fontFamily: "'Manrope',sans-serif", fontSize: 12,
                fontWeight: active ? 700 : 600,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {l}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Corps principal (appel + historique) ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 16, color: C.ink3 }}>
          Chargement…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* ── Panneau Appel ── */}
          <div style={{ background: C.paper, borderRadius: 20, border: `1px solid ${C.rule}`, overflow: 'hidden' }}>
            {/* Header panneau */}
            <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${C.ruleSoft}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink3 }}>
                  Pointage · {classeActive?.nom || '…'}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: C.ink3 }}>
                  {nowTime}
                </span>
              </div>
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 26, fontWeight: 500, color: C.ink, lineHeight: 1.1, marginBottom: 14 }}>
                <em style={{ fontStyle: 'italic', color: C.gold }}>Appel</em> de ce matin
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  { val: nbPresents, lbl: 'Présents' },
                  { val: nbRetards,  lbl: 'Retard' },
                  { val: nbAbsents,  lbl: 'Absent' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {s.val}
                    </span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ink3 }}>
                      {s.lbl}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liste élèves */}
            {eleves.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 15, color: C.ink3 }}>
                Aucun élève dans cette classe.
              </div>
            ) : eleves.map((eleve, idx) => {
              const st = statuts[eleve.id] || { status: 'present' };
              const isSaving = saving[eleve.id];
              const declEleve = decls.find(d => d.eleve_id === eleve.id && !d.vue_enseignant);
              return (
                <div key={eleve.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px',
                  borderBottom: idx < eleves.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                  opacity: isSaving ? 0.6 : 1,
                }}>
                  {/* Avatar */}
                  <EleveAvatar
                    eleve={eleve}
                    size={40}
                    variant="enseignant"
                    fallbackStyle={{
                      background: '#1E2317', color: '#C09844',
                      fontWeight: 700, letterSpacing: '0.5px',
                    }}
                  />
                  {/* Nom + note déclaration */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 600, color: C.ink }}>
                      {eleve.prenom} <span style={{ textTransform: 'uppercase' }}>{eleve.nom}</span>
                    </div>
                    {declEleve ? (
                      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 11, color: C.gold, marginTop: 1 }}>
                        {declEleve.type === 'retard' ? 'retard signalé' : 'absence signalée'}{declEleve.motif ? ` — ${declEleve.motif}` : ''}
                      </div>
                    ) : st.status !== 'present' ? (
                      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 11, color: C.gold, marginTop: 1 }}>
                        {st.status === 'retard' ? 'retard enregistré' : 'absent'}
                        {st.commentaire ? ` — ${st.commentaire}` : ''}
                      </div>
                    ) : (
                      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 11, color: C.ink3, marginTop: 1 }}>
                        présent
                      </div>
                    )}
                  </div>
                  {/* Boutons P / R / A */}
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {[
                      { key: 'present', label: 'Présent' },
                      { key: 'retard',  label: 'Retard' },
                      { key: 'absence', label: 'Absent' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => handleStatus(eleve.id, key)}
                        disabled={isSaving}
                        style={{
                          padding: '5px 12px', borderRadius: 999,
                          border: `1px solid ${st.status === key ? C.ink : C.rule}`,
                          background: st.status === key ? C.ink : 'transparent',
                          color: st.status === key ? C.paper : C.ink3,
                          fontFamily: "'Manrope',sans-serif", fontSize: 11.5, fontWeight: 600,
                          cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Historique récent ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              <Flourish size={22} />
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink3 }}>
                Historique récent
              </span>
            </div>

            {historique.length === 0 ? (
              <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 14, color: C.ink3, textAlign: 'center', padding: '20px 0' }}>
                Aucune entrée sur cette période.
              </div>
            ) : historique.map((entry, idx) => {
              const { day, dow } = fmtDate(entry.date);
              const el = eleves.find(e => e.id === entry.eleve_id);
              const isRetard = entry.type === 'retard';
              return (
                <div key={entry.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  paddingBottom: 14, marginBottom: 14,
                  borderBottom: idx < historique.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                }}>
                  {/* Date */}
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 32 }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: C.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {day}
                    </div>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3, marginTop: 2 }}>
                      {dow}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, color: C.ink }}>
                      {el ? `${el.prenom} ${el.nom.toUpperCase()}` : '—'}
                      {' '}
                      <span style={{
                        fontSize: 9.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                        background: 'rgba(138,107,31,0.10)', color: C.gold,
                      }}>
                        {classeActive?.nom}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontStyle: 'italic', fontSize: 11.5, color: C.gold, marginTop: 2 }}>
                      {isRetard ? 'retard' : 'absence'}
                      {entry.commentaire ? ` — ${entry.commentaire}` : ''}
                    </div>
                    {/* Déclaration parent ? */}
                    {decls.find(d => d.eleve_id === entry.eleve_id) && (
                      <button
                        onClick={async () => {
                          const d = decls.find(x => x.eleve_id === entry.eleve_id && !x.vue_enseignant);
                          if (!d) return;
                          const ok = await markDeclarationVueEnseignant(user.id, d.id);
                          if (ok) {
                            setDecls(prev => prev.map(x => x.id === d.id ? { ...x, vue_enseignant: true } : x));
                            window.dispatchEvent(new CustomEvent('declaration-acknowledged'));
                          }
                        }}
                        style={{ marginTop: 4, fontSize: 10, color: C.gold, background: 'transparent', border: `1px solid ${C.rule}`, borderRadius: 999, padding: '2px 8px', cursor: 'pointer', fontFamily: "'Manrope',sans-serif", fontWeight: 600 }}
                      >
                        Valider préavis parent
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
