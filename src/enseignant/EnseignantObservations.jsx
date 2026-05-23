import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchObservationsClasse, createObservation, deleteObservation,
} from './supabaseEnseignant';
import { Flourish, Diamond } from '../shared/Ornaments';
import EleveAvatar from '../shared/EleveAvatar';

// ── Palette Coupole v1 ──────────────────────────────────────────────────────
const C = {
  bg:        '#F2EEDF',
  paper:     '#FBFAF1',
  ink:       '#1E2317',
  ink2:      '#3F4A33',
  ink3:      '#7A876A',
  gold:      '#8A6B1F',
  goldLight: '#C09844',
  goldSoft:  '#DCBC6E',
  rule:      'rgba(138,107,31,0.18)',
  ruleSoft:  'rgba(138,107,31,0.10)',
};

const TYPES = {
  progression:  { label: 'positive'  },
  comportement: { label: 'à suivre'  },
  general:      { label: 'note'      },
};

const FILTERS = [
  { key: 'all',          label: 'Toutes',    type: null           },
  { key: 'progression',  label: 'Positives', type: 'progression'  },
  { key: 'comportement', label: 'À suivre',  type: 'comportement' },
  { key: 'general',      label: 'Notes',     type: 'general'      },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function ini(e) {
  return `${(e?.prenom || '')[0] || ''}${(e?.nom || '')[0] || ''}`.toUpperCase();
}

function frenchLongDate(d) {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function frenchShortDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function weekNumber(d) {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

function trimestre(d) {
  const m = d.getMonth() + 1;
  if (m >= 9)  return 1;     // Sept-Déc
  if (m <= 3)  return 2;     // Jan-Mar
  return 3;                  // Avr-Août
}

// Découpe contenu en titre court (avant 1er ". ") + corps (le reste).
function splitContent(contenu) {
  if (!contenu) return { title: '', body: '' };
  const trimmed = contenu.trim();
  const idx = trimmed.search(/[.!?]\s/);
  if (idx === -1 || idx > 80) {
    if (trimmed.length <= 70) return { title: trimmed, body: '' };
    return { title: trimmed.slice(0, 65).trim() + '…', body: trimmed };
  }
  return {
    title: trimmed.slice(0, idx).trim(),
    body:  trimmed.slice(idx + 1).trim(),
  };
}

// Tags rapides à partir du contenu (mots-clés simples).
function deriveTags(contenu, type) {
  const keywords = {
    'Lecture':      /lectur/i,
    'Mémorisation': /mémoris|sourate|coran/i,
    'Grammaire':    /grammair|accord|conjug/i,
    'Comportement': /comportement|disciplin|attitude/i,
    'Suivi parent': /parent|famille|maison/i,
    'À encourager': /encourag|félicit|bravo/i,
    'Volontaire':   /volontair|propos|spontan/i,
    'Progrès':      /progrès|amélior|avanc/i,
  };
  const tags = [];
  for (const [tag, re] of Object.entries(keywords)) {
    if (re.test(contenu)) tags.push(tag);
    if (tags.length >= 2) break;
  }
  if (tags.length === 0) {
    if (type === 'progression')  tags.push('À encourager');
    if (type === 'comportement') tags.push('Comportement');
    if (type === 'general')      tags.push('Note');
  }
  return tags;
}

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantObservations() {
  const user = getEnseignantUser();

  const [classes,      setClasses]      = useState([]);
  const [selClasse,    setSelClasse]    = useState(null);
  const [eleves,       setEleves]       = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // Modal
  const [modal,      setModal]      = useState(false);
  const [editingObs, setEditingObs] = useState(null);
  const [modalEleve, setModalEleve] = useState(null);
  const [modalType,  setModalType]  = useState('progression');
  const [modalText,  setModalText]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [modalErr,   setModalErr]   = useState('');
  const [eleveQ,     setEleveQ]     = useState('');

  // ── Load classes ──
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesClasses(user.id)
      .then(cls => { setClasses(cls); if (cls.length) setSelClasse(cls[0].id); else setLoading(false); })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadData = useCallback(async (classeId) => {
    if (!classeId) return;
    setLoading(true);
    try {
      const [elevs, obs] = await Promise.all([
        fetchElevesDeClasse(classeId),
        fetchObservationsClasse(classeId),
      ]);
      setEleves(elevs);
      setObservations(obs);
    } catch {}
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { if (selClasse) loadData(selClasse); }, [selClasse, loadData]);

  // ── Computed ──
  const filtered = observations.filter(o =>
    activeFilter === 'all' || o.type === activeFilter
  );
  const getEleve  = (id) => eleves.find(e => e.id === id) || { prenom: '?', nom: '' };
  const getClasse = (id) => classes.find(c => c.id === id);

  const filterCounts = FILTERS.map(f => ({
    ...f,
    count: f.type ? observations.filter(o => o.type === f.type).length : observations.length,
  }));

  const filteredEleves = eleveQ.trim()
    ? eleves.filter(e => `${e.prenom} ${e.nom}`.toLowerCase().includes(eleveQ.toLowerCase()))
    : eleves;

  // ── Modal helpers ──
  const openNew = () => {
    setEditingObs(null); setModalEleve(null); setModalType('progression');
    setModalText(''); setModalErr(''); setEleveQ(''); setModal('new');
  };
  const openEdit = (obs) => {
    setEditingObs(obs); setModalEleve(getEleve(obs.eleve_id));
    setModalType(obs.type); setModalText(obs.contenu);
    setModalErr(''); setEleveQ(''); setModal('edit');
  };
  const closeModal = () => { setModal(false); setSaving(false); };

  const handleSave = async () => {
    if (!modalEleve || !modalText.trim()) return;
    setSaving(true); setModalErr('');
    try {
      if (modal === 'edit' && editingObs) {
        await deleteObservation(editingObs.id, user.id);
      }
      const obs = await createObservation({
        enseignant_id: user.id,
        eleve_id:      modalEleve.id,
        classe_id:     selClasse,
        contenu:       modalText.trim(),
        type:          modalType,
      });
      if (modal === 'edit') {
        setObservations(prev => [obs, ...prev.filter(o => o.id !== editingObs.id)]);
      } else {
        setObservations(prev => [obs, ...prev]);
      }
      closeModal();
    } catch (e) { setModalErr(e.message || 'Erreur.'); }
    setSaving(false);
  };

  // ── Top-right meta ──
  const today = new Date();
  const dateStr = frenchLongDate(today);
  const wkNum   = weekNumber(today);
  const triNum  = trimestre(today);

  // ── Render ──
  return (
    <div style={{ fontFamily: "'Manrope', system-ui, sans-serif", color: C.ink, padding: '24px 32px 40px' }}>

      {/* ═══ Page header (kicker au-dessus, meta à droite) ═══ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Flourish size={28} />
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
              Carnet d'observations
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: 38, fontWeight: 500, lineHeight: 1.05,
            color: C.ink, margin: 0, letterSpacing: '-0.015em',
          }}>
            <em style={{ color: C.gold, fontWeight: 500 }}>Observations</em> & remarques
          </h1>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 6 }}>
          <div style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontStyle: 'italic', fontSize: 14, color: C.ink2,
          }}>
            {dateStr}
          </div>
          <div style={{
            fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em',
            color: C.ink3, textTransform: 'uppercase', marginTop: 4,
          }}>
            Semaine {wkNum} · Trimestre {triNum}
          </div>
        </div>
      </div>

      {/* ═══ Filter bar ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        {filterCounts.map(f => {
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                padding: active ? '8px 18px' : '8px 12px',
                borderRadius: active ? '60px 60px 12px 12px' : '999px',
                border: 'none',
                background: active ? C.ink : 'transparent',
                color: active ? C.paper : C.ink2,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 13, fontWeight: active ? 700 : 600,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}
            >
              {f.label}
              <span style={{
                fontFamily: "'Newsreader', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 13, fontWeight: 500,
                color: active ? C.goldSoft : C.gold,
              }}>
                {f.count}
              </span>
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button
          onClick={openNew}
          style={{
            padding: '10px 22px',
            borderRadius: '60px 60px 12px 12px',
            border: 'none', background: C.gold, color: C.paper,
            fontFamily: "'Manrope', sans-serif",
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: -2 }}>+</span>
          Nouvelle observation
        </button>
      </div>

      {/* ═══ Content ═══ */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.ink3 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.ink3, fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 16 }}>
          Aucune observation dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {filtered.map(obs => {
            const eleve    = getEleve(obs.eleve_id);
            const typeInfo = TYPES[obs.type] || TYPES.general;
            const isOwn    = obs.enseignant_id === user?.id;
            const classe   = getClasse(obs.classe_id);
            const { title, body } = splitContent(obs.contenu);
            const tags = deriveTags(obs.contenu, obs.type);

            return (
              <div
                key={obs.id}
                style={{
                  background: C.paper, borderRadius: 20,
                  padding: '20px 22px 18px', position: 'relative',
                  border: `1px solid ${C.rule}`,
                }}
              >
                {/* Diamond marker top-right */}
                <span style={{ position: 'absolute', top: 14, right: 14, color: C.goldSoft }}>
                  <Diamond size={8} />
                </span>

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingRight: 18 }}>
                  <EleveAvatar
                    eleve={eleve}
                    size={34}
                    variant="enseignant"
                    fallbackStyle={{
                      background: C.ink, color: C.goldLight,
                      fontWeight: 700, letterSpacing: '0.5px',
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontFamily: "'Newsreader', Georgia, serif",
                        fontSize: 16, fontWeight: 500, color: C.ink,
                      }}>
                        {eleve.prenom} <span style={{ textTransform: 'uppercase' }}>{eleve.nom}</span>
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10, color: C.gold, fontWeight: 600,
                      }}>
                        {classe?.nom || ''}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Newsreader', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: 12, color: C.gold,
                      marginTop: 2,
                    }}>
                      {typeInfo.label} · {frenchShortDate(obs.created_at)}
                    </div>
                  </div>
                </div>

                {/* Quote title */}
                <p style={{
                  fontFamily: "'Newsreader', Georgia, serif",
                  fontSize: 17, fontWeight: 500,
                  color: C.ink, lineHeight: 1.35, margin: '0 0 10px',
                }}>
                  «&nbsp;{title}&nbsp;»
                </p>

                {/* Body */}
                {body && (
                  <p style={{
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 13, lineHeight: 1.55,
                    color: C.ink2, margin: '0 0 16px',
                  }}>
                    {body}
                  </p>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: body ? 0 : 8 }}>
                  {tags.map(t => (
                    <span
                      key={t}
                      style={{
                        padding: '4px 12px', borderRadius: 999,
                        border: `1px solid ${C.rule}`,
                        fontFamily: "'Newsreader', Georgia, serif",
                        fontStyle: 'italic',
                        fontSize: 12, color: C.ink3,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  <div style={{ flex: 1 }} />
                  {isOwn && (
                    <button
                      onClick={() => openEdit(obs)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: "'Newsreader', Georgia, serif",
                        fontSize: 13, fontStyle: 'italic', color: C.gold,
                        padding: '2px 4px',
                      }}
                    >
                      Modifier →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ Modal ═══ */}
      {modal && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            background: 'rgba(30,35,23,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.paper, borderRadius: 20, border: `1px solid ${C.rule}`,
              padding: '28px 28px 24px', maxWidth: 520, width: '90%',
              boxShadow: '0 20px 60px rgba(30,35,23,0.2)',
              maxHeight: '90vh', overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Flourish size={24} />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.22em', color: C.ink3, textTransform: 'uppercase' }}>
                {modal === 'edit' ? "Modifier l'observation" : 'Nouvelle observation'}
              </span>
            </div>
            <h2 style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: 24, fontWeight: 500, color: C.ink,
              margin: '0 0 20px', letterSpacing: '-0.01em',
            }}>
              {modal === 'edit' ? <><em style={{ color: C.gold }}>Modifier</em> l'observation</> : <><em style={{ color: C.gold }}>Nouvelle</em> observation</>}
            </h2>

            {/* Élève */}
            {modal === 'new' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 8 }}>Élève</div>
                <input
                  placeholder="Rechercher un élève…"
                  value={eleveQ}
                  onChange={e => setEleveQ(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 14px', borderRadius: 999,
                    border: `1px solid ${C.rule}`, background: C.bg, color: C.ink,
                    fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', marginBottom: 8,
                  }}
                />
                <div style={{ maxHeight: 140, overflowY: 'auto', border: `1px solid ${C.rule}`, borderRadius: 14, background: C.bg }}>
                  {filteredEleves.map(e => (
                    <div
                      key={e.id}
                      onClick={() => { setModalEleve(e); setEleveQ(`${e.prenom} ${e.nom}`); }}
                      style={{
                        padding: '9px 14px', cursor: 'pointer', fontSize: 13,
                        background: modalEleve?.id === e.id ? 'rgba(138,107,31,0.10)' : 'transparent',
                        color:      modalEleve?.id === e.id ? C.gold : C.ink,
                        fontWeight: modalEleve?.id === e.id ? 700 : 400,
                      }}
                    >
                      {e.prenom} <span style={{ textTransform: 'uppercase' }}>{e.nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {modal === 'edit' && modalEleve && (
              <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(138,107,31,0.08)', borderRadius: 14, border: `1px solid ${C.rule}` }}>
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15, color: C.ink }}>
                  {modalEleve.prenom} <span style={{ textTransform: 'uppercase' }}>{modalEleve.nom}</span>
                </span>
              </div>
            )}

            {/* Type */}
            <div style={{ fontSize: 10.5, fontWeight: 600, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 8 }}>Type</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {Object.entries(TYPES).map(([k, v]) => {
                const active = modalType === k;
                return (
                  <button
                    key={k}
                    onClick={() => setModalType(k)}
                    style={{
                      padding: active ? '7px 16px' : '7px 14px',
                      borderRadius: active ? '60px 60px 12px 12px' : 999,
                      cursor: 'pointer',
                      border: active ? 'none' : `1px solid ${C.rule}`,
                      background: active ? C.ink : 'transparent',
                      color: active ? C.paper : C.ink2,
                      fontSize: 12, fontWeight: 600,
                      fontFamily: "'Manrope', sans-serif",
                      textTransform: 'capitalize',
                    }}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>

            {/* Textarea */}
            <div style={{ fontSize: 10.5, fontWeight: 600, color: C.ink3, textTransform: 'uppercase', letterSpacing: '0.22em', marginBottom: 8 }}>Observation</div>
            <textarea
              value={modalText}
              onChange={e => setModalText(e.target.value)}
              placeholder="Rédigez votre observation, appréciation ou remarque ici…"
              rows={4}
              style={{
                width: '100%', borderRadius: 14, border: `1px solid ${C.rule}`,
                background: C.bg, color: C.ink,
                fontSize: 14, lineHeight: 1.6, padding: 14,
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                fontFamily: "'Newsreader', Georgia, serif",
              }}
            />

            {modalErr && <p style={{ color: '#8B3A1F', fontSize: 12, margin: '8px 0 0' }}>{modalErr}</p>}

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                onClick={closeModal}
                style={{
                  padding: '9px 20px', borderRadius: 999,
                  border: `1px solid ${C.rule}`, background: 'transparent',
                  color: C.ink2, fontSize: 13, cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif", fontWeight: 600,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !modalEleve || !modalText.trim()}
                style={{
                  padding: '10px 22px', borderRadius: '60px 60px 12px 12px', border: 'none',
                  background: (saving || !modalEleve || !modalText.trim()) ? C.rule : C.gold,
                  color:      (saving || !modalEleve || !modalText.trim()) ? C.ink3 : C.paper,
                  fontSize: 13, fontWeight: 600,
                  cursor: (saving || !modalEleve || !modalText.trim()) ? 'not-allowed' : 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                {saving ? 'Enregistrement…' : modal === 'edit' ? 'Modifier' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
