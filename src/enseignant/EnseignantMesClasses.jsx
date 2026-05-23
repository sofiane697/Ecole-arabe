import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEnseignantUser,
  fetchMesClasses,
  fetchElevesDeClasse,
  fetchEvaluationsClasse,
  fetchDevoirsClasse,
  countDeclarationsEnseignant,
} from './supabaseEnseignant';
import { Flourish, Star8, Star5 } from '../shared/Ornaments';

/* ── Helpers ── */
function getSchoolYear() {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}–${y + 1}` : `${y - 1}–${y}`;
}

function relativeDate(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return 'aujourd\'hui';
  if (diff === 1) return 'hier';
  if (diff < 7) return `il y a ${diff} jours`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long' });
}

function nextDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function Stars({ filled = 0, total = 4 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: total }).map((_, i) => (
        <Star5 key={i} size={11} filled={i < filled} />
      ))}
    </span>
  );
}

/* ── Tokens visuels ── */
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

export default function EnseignantMesClasses() {
  const navigate = useNavigate();
  const user     = getEnseignantUser();

  const [classes,    setClasses]    = useState([]);
  const [elevesMap,  setElevesMap]  = useState({});
  const [evalsMap,   setEvalsMap]   = useState({});
  const [devoirsMap, setDevoirsMap] = useState({});
  const [declCount,  setDeclCount]  = useState(0);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const cls = await fetchMesClasses(user.id);
        setClasses(cls);
        const [elvR, evR, dvR, decl] = await Promise.all([
          Promise.all(cls.map(c => fetchElevesDeClasse(c.id).then(e => [c.id, e]).catch(() => [c.id, []]))),
          Promise.all(cls.map(c => fetchEvaluationsClasse(c.id).then(e => [c.id, e]).catch(() => [c.id, []]))),
          Promise.all(cls.map(c => fetchDevoirsClasse(c.id).then(d => [c.id, d]).catch(() => [c.id, []]))),
          countDeclarationsEnseignant(user.id).catch(() => 0),
        ]);
        setElevesMap(Object.fromEntries(elvR));
        setEvalsMap(Object.fromEntries(evR));
        setDevoirsMap(Object.fromEntries(dvR));
        setDeclCount(decl);
      } catch {}
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) return (
    <div style={{ padding: '60px 40px', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', color: C.ink3, fontSize: 16 }}>
      Chargement…
    </div>
  );

  const now          = new Date();
  const totalEleves  = Object.values(elevesMap).reduce((s, e) => s + e.length, 0);
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const notesSemaine = Object.values(evalsMap).flat().filter(e => new Date(e.date_evaluation || e.created_at) >= startOfWeek).length;
  const devoirsEnCours = Object.values(devoirsMap).flat().filter(d => !d.date_limite || new Date(d.date_limite) >= now).length;
  const today = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const STATS = [
    { label: 'Élèves au total',            value: totalEleves,    dark: false },
    { label: 'Notes saisies cette semaine', value: notesSemaine,   dark: false },
    { label: 'Devoirs en cours',            value: devoirsEnCours, dark: true  },
    { label: 'Retards à valider',           value: declCount,      dark: false },
  ];

  return (
    <div style={{ padding: '32px 40px 48px', minHeight: '100%', background: C.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          {/* Flourish + kicker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
            <Flourish size={26} />
            <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.ink3 }}>
              Vue d'ensemble
            </span>
          </div>
          {/* Titre */}
          <h1 style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 40, fontWeight: 500, color: C.ink, margin: 0, lineHeight: 1.05, letterSpacing: '-0.015em' }}>
            <em style={{ fontStyle: 'italic', color: C.gold }}>Mes</em> classes
          </h1>
        </div>
        {/* Date + meta */}
        <div style={{ textAlign: 'right', paddingTop: 6 }}>
          <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: C.ink2 }}>{today}</div>
          <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink3, marginTop: 3 }}>
            {classes.length} classe{classes.length !== 1 ? 's' : ''} · {totalEleves} élèves
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            background: s.dark ? C.ink : C.paper,
            borderRadius: 20,
            border: `1px solid ${s.dark ? C.ink : C.rule}`,
            padding: '16px 20px',
          }}>
            <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: s.dark ? C.goldSoft : C.ink3, marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 40, fontWeight: 500, color: s.dark ? C.goldLight : C.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink3 }}>
            Classes suivies
          </span>
          <span style={{ color: C.goldSoft, fontSize: 9 }}>•</span>
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 11, color: C.ink3 }}>
            année {getSchoolYear()}
          </span>
        </div>
      </div>

      {/* ── Grille classes ── */}
      {classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 18, color: C.ink3 }}>
          Aucune classe assignée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(classes.length, 3)}, 1fr)`, gap: 18 }}>
          {classes.map(c => {
            const eleves  = elevesMap[c.id]  || [];
            const evals   = evalsMap[c.id]   || [];
            const devoirs = devoirsMap[c.id] || [];

            const lastEval = [...evals].sort((a,b) => new Date(b.date_evaluation||b.created_at) - new Date(a.date_evaluation||a.created_at))[0];
            const nextDevoir = [...devoirs].filter(d => d.date_limite && new Date(d.date_limite) >= now).sort((a,b) => new Date(a.date_limite)-new Date(b.date_limite))[0];
            const devoirsActifs = devoirs.filter(d => !d.date_limite || new Date(d.date_limite) >= now).length;
            const levelLabel = c.niveaux_scolaires?.nom || c.niveau_scolaire_nom || '';

            return (
              <div key={c.id} style={{
                background: C.paper,
                borderRadius: '120px 120px 14px 14px',
                border: `1px solid ${C.rule}`,
                padding: '26px 22px 22px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Star8 ornement centré en haut */}
                <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)' }}>
                  <Star8 size={9} color={C.goldSoft} />
                </div>

                {/* En-tête carte */}
                <div style={{ textAlign: 'center', paddingTop: 14, marginBottom: 16 }}>
                  {levelLabel && (
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 8.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.ink3, marginBottom: 2 }}>
                      {levelLabel}
                    </div>
                  )}
                  <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 48, fontWeight: 500, color: C.ink, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {c.nom}
                  </div>
                  {c.description && (
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 12, color: C.ink3, marginTop: 3 }}>
                      {c.description}
                    </div>
                  )}
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: C.ruleSoft, marginBottom: 14 }} />

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
                  {[
                    { val: eleves.length,  lbl: 'Élèves'  },
                    { val: evals.length,   lbl: 'Notes'   },
                    { val: devoirsActifs,  lbl: 'Devoirs' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: C.ink, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                        {s.val}
                      </span>
                      <span style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ink2 }}>
                        {s.lbl}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Niveau moyen */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: C.ink2 }}>
                    Niveau moyen
                  </span>
                  <Stars filled={evals.length > 0 ? Math.min(3, Math.ceil(evals.length / 2)) : 0} />
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: C.ruleSoft, marginBottom: 14 }} />

                {/* Dernière activité */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.ink3, marginBottom: 5 }}>
                    Dernière activité
                  </div>
                  {lastEval ? (
                    <>
                      <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5, fontWeight: 500, color: C.ink, lineHeight: 1.35 }}>{lastEval.titre}</div>
                      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 12.5, color: C.gold, marginTop: 2 }}>
                        {relativeDate(lastEval.date_evaluation || lastEval.created_at)}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: C.ink3 }}>Aucune évaluation</div>
                  )}
                </div>

                {/* À venir */}
                <div style={{ flex: 1, marginBottom: 18 }}>
                  <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.ink3, marginBottom: 5 }}>
                    À venir
                  </div>
                  {nextDevoir ? (
                    <div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5, fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>
                      {nextDevoir.titre} <span style={{ fontStyle: 'italic', fontFamily: "'Newsreader', Georgia, serif", color: C.gold, fontWeight: 400 }}>— {nextDate(nextDevoir.date_limite)}</span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: C.ink3 }}>Aucun devoir prévu</div>
                  )}
                </div>

                {/* CTA */}
                <button
                  onClick={() => navigate(`/enseignant/classe/${c.id}`)}
                  style={{
                    width: '100%',
                    padding: '11px 20px',
                    borderRadius: 999,
                    border: 'none',
                    background: C.ink,
                    color: C.paper,
                    fontFamily: "'Manrope', sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Ouvrir la classe →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination dots */}
      {classes.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
          {classes.map((_, i) => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? C.ink : C.ruleSoft, display: 'inline-block' }} />
          ))}
        </div>
      )}
    </div>
  );
}
