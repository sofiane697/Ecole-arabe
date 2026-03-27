import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchModulesEleve, fetchNiveauxEleve, fetchContenusEleve, fetchQCMEleve, fetchProgression, saveProgression } from './supabasePortail';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  layout: { display:'grid', gridTemplateColumns:'260px 1fr', gap:0, minHeight:'calc(100vh - 100px)', border:'1px solid var(--p-border)', borderRadius:'var(--p-radius)', overflow:'hidden', background:'var(--p-bg-card)' },
  // Stepper
  stepper: { borderRight:'1px solid var(--p-border)', padding:'20px 0', overflowY:'auto' },
  stepperTitle: { fontSize:11, fontWeight:700, color:'var(--p-fg-light)', textTransform:'uppercase', letterSpacing:'1.2px', padding:'0 20px 12px' },
  step: (active, locked) => ({
    display:'flex', alignItems:'center', gap:12, padding:'12px 20px',
    cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? .4 : 1,
    background: active ? 'rgba(191,138,48,.08)' : 'transparent',
    borderLeft: active ? '3px solid var(--p-gold)' : '3px solid transparent',
    transition:'all .2s',
  }),
  stepIcon: (passed, active) => ({
    width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, flexShrink:0,
    background: passed ? 'var(--p-green)' : active ? 'var(--p-gold)' : 'var(--p-bg-card)',
    color: passed || active ? '#fff' : 'var(--p-fg-mid)',
    border: !passed && !active ? '1px solid var(--p-border)' : 'none',
  }),
  stepTitle: (active) => ({ fontSize:13, fontWeight: active ? 600 : 400, color: active ? 'var(--p-fg)' : 'var(--p-fg-mid)' }),
  stepScore: { fontSize:11, color:'var(--p-fg-light)', marginTop:2 },
  // Contenu
  main: { padding:28, overflowY:'auto' },
  backBtn: { display:'inline-flex', alignItems:'center', gap:6, color:'var(--p-fg-mid)', fontSize:13, fontWeight:500, cursor:'pointer', marginBottom:20, background:'none', border:'none', padding:0 },
  sectionTitle: { fontSize:20, fontWeight:700, color:'var(--p-fg)', marginBottom:6 },
  sectionDesc: { fontSize:14, color:'var(--p-fg-mid)', marginBottom:24 },
  contentCard: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', marginBottom:16, overflow:'hidden' },
  contentHeader: { display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--p-border)' },
  contentType: (c) => ({ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c }),
  contentTitle: { fontSize:14, fontWeight:600, color:'var(--p-fg)' },
  videoFrame: { width:'100%', aspectRatio:'16/9', border:'none', borderRadius:'0 0 var(--p-radius) var(--p-radius)' },
  pdfLink: { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 18px', color:'var(--p-blue)', fontSize:14, fontWeight:500, textDecoration:'none' },
  textContent: { padding:'16px 18px', fontSize:14, color:'var(--p-fg)', lineHeight:1.7 },
  // QCM
  qcmBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:980, border:'none', background:'var(--p-gold)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:24 },
  qcmCard: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', padding:24, marginBottom:16 },
  qcmQ: { fontSize:15, fontWeight:600, color:'var(--p-fg)', marginBottom:14 },
  qcmNum: { fontSize:12, color:'var(--p-fg-light)', marginBottom:6 },
  choiceLabel: (selected, correct, showResult) => ({
    display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--p-radius-sm)',
    border: `1px solid ${showResult ? (correct ? 'var(--p-green)' : selected ? 'var(--p-red)' : 'var(--p-border)') : selected ? 'var(--p-gold)' : 'var(--p-border)'}`,
    background: showResult ? (correct ? 'rgba(48,209,88,.08)' : selected ? 'rgba(255,69,58,.06)' : 'transparent') : selected ? 'rgba(191,138,48,.06)' : 'transparent',
    cursor: showResult ? 'default' : 'pointer', marginBottom:6, transition:'all .2s',
    color:'var(--p-fg)', fontSize:14,
  }),
  choiceRadio: (selected) => ({
    width:18, height:18, borderRadius:'50%', border: `2px solid ${selected ? 'var(--p-gold)' : 'var(--p-border)'}`,
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }),
  choiceRadioDot: { width:10, height:10, borderRadius:'50%', background:'var(--p-gold)' },
  // Résultat
  result: (passed) => ({
    textAlign:'center', padding:32, background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', marginTop:24,
  }),
  resultIcon: { fontSize:48, marginBottom:12 },
  resultTitle: (passed) => ({ fontSize:22, fontWeight:700, color: passed ? 'var(--p-green)' : 'var(--p-red)', marginBottom:8 }),
  resultScore: { fontSize:16, color:'var(--p-fg-mid)', marginBottom:20 },
  resultBtn: (primary) => ({
    padding:'11px 24px', borderRadius:980, border: primary ? 'none' : '1px solid var(--p-border)',
    background: primary ? 'var(--p-gold)' : 'transparent',
    color: primary ? '#fff' : 'var(--p-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer', margin:'0 6px',
  }),
  locked: { textAlign:'center', padding:'60px 20px', color:'var(--p-fg-mid)' },
  lockedIcon: { fontSize:48, marginBottom:12 },
  empty: { textAlign:'center', padding:'60px 20px', color:'var(--p-fg-mid)', fontSize:14 },
};

const TYPE_COLORS = { video: '#ff453a', pdf: '#0a84ff', texte: '#30d158' };

export default function PortailModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [module_, setModule] = useState(null);
  const [niveaux, setNiveaux] = useState([]);
  const [progression, setProgressionState] = useState([]);
  const [selNiveau, setSelNiveau] = useState(null);
  const [contenus, setContenus] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showQCM, setShowQCM] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Récupérer l'ID élève ────────────────────────────────────────────
  const eleveId = (() => {
    try { return JSON.parse(sessionStorage.getItem('eleve_user'))?.id; } catch { return null; }
  })();

  // ─── Chargement initial ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [mods, nivs, prog] = await Promise.all([
        fetchModulesEleve(),
        fetchNiveauxEleve(id),
        fetchProgression(eleveId),
      ]);
      const mod = mods.find(m => String(m.id) === String(id));
      setModule(mod || null);
      setNiveaux(nivs);
      setProgressionState(prog);
      // Sélectionner le premier niveau non réussi, ou le premier
      const firstUnpassed = nivs.find(n => !prog.some(p => p.niveau_id === n.id && p.reussi));
      setSelNiveau(firstUnpassed || nivs[0] || null);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Charger contenu quand on sélectionne un niveau ──────────────────
  useEffect(() => {
    if (!selNiveau) return;
    setShowQCM(false);
    setShowResult(false);
    setAnswers({});
    (async () => {
      try {
        const [c, q] = await Promise.all([
          fetchContenusEleve(selNiveau.id),
          fetchQCMEleve(selNiveau.id),
        ]);
        setContenus(c);
        setQuestions(q);
      } catch(e) { console.error(e); }
    })();
  }, [selNiveau]);

  // ─── Vérifier si un niveau est débloqué ──────────────────────────────
  const isUnlocked = (niv, index) => {
    if (index === 0) return true;
    const prevNiv = niveaux[index - 1];
    return progression.some(p => p.niveau_id === prevNiv.id && p.reussi);
  };

  const isPassed = (nivId) => progression.some(p => p.niveau_id === nivId && p.reussi);
  const getProgForNiveau = (nivId) => progression.find(p => p.niveau_id === nivId);

  // ─── Soumission QCM ─────────────────────────────────────────────────
  const handleSubmitQCM = async () => {
    const correct = questions.filter((q, i) => {
      const correctSet = Array.isArray(q.reponse_correcte) ? q.reponse_correcte : [q.reponse_correcte];
      const selected = answers[i] || [];
      return correctSet.length === selected.length && correctSet.every(v => selected.includes(v));
    }).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= (selNiveau.score_requis || 80);
    setScore(pct);
    setShowResult(true);

    const existingProg = getProgForNiveau(selNiveau.id);
    const tentatives = (existingProg?.tentatives || 0) + 1;

    try {
      await saveProgression(eleveId, selNiveau.id, pct, passed);
      // Recharger la progression
      const newProg = await fetchProgression(eleveId);
      setProgressionState(newProg);
    } catch(e) { console.error(e); }
  };

  const handleRetry = () => {
    setShowQCM(true);
    setShowResult(false);
    setAnswers({});
  };

  const handleNextLevel = () => {
    const currentIdx = niveaux.findIndex(n => n.id === selNiveau.id);
    if (currentIdx < niveaux.length - 1) {
      setSelNiveau(niveaux[currentIdx + 1]);
    }
  };

  if (loading) return <div style={S.empty}>Chargement...</div>;
  if (!module_) return <div style={S.empty}>Module introuvable.</div>;

  return (
    <div>
      <button style={S.backBtn} onClick={() => navigate('/portail')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour aux cours
      </button>

      <div className="portail-module-layout">
        {/* ─── Stepper gauche ─── */}
        <div className="portail-module-stepper">
          <div className="portail-stepper-title" style={S.stepperTitle}>{module_.titre}</div>
          {niveaux.map((n, i) => {
            const unlocked = isUnlocked(n, i);
            const passed = isPassed(n.id);
            const active = selNiveau?.id === n.id;
            const prog = getProgForNiveau(n.id);

            return (
              <div key={n.id} style={S.step(active, !unlocked)} onClick={() => unlocked && setSelNiveau(n)}>
                <div style={S.stepIcon(passed, active)}>
                  {passed ? '✓' : !unlocked ? '🔒' : n.ordre}
                </div>
                <div>
                  <div style={S.stepTitle(active)}>{n.titre}</div>
                  {prog?.score != null && (
                    <div style={S.stepScore}>
                      Score : {prog.score}% · {prog.tentatives} tentative{prog.tentatives > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── Contenu principal ─── */}
        <div className="portail-module-main">
          {selNiveau && !isUnlocked(selNiveau, niveaux.indexOf(selNiveau)) ? (
            <div style={S.locked}>
              <div style={S.lockedIcon}>🔒</div>
              <div style={{ fontSize:18, fontWeight:600, color:'var(--p-fg)', marginBottom:8 }}>Niveau verrouillé</div>
              <p>Réussissez le niveau précédent pour débloquer celui-ci.</p>
            </div>
          ) : selNiveau && !showQCM && !showResult ? (
            <>
              <h2 style={S.sectionTitle}>{selNiveau.titre}</h2>
              {selNiveau.description && <p style={S.sectionDesc}>{selNiveau.description}</p>}

              {contenus.length === 0 && <div style={S.empty}>Aucun contenu disponible pour ce niveau.</div>}

              {contenus.map(c => (
                <div key={c.id} style={S.contentCard}>
                  <div style={S.contentHeader}>
                    <span style={S.contentType(TYPE_COLORS[c.type] || '#aaa')}>{c.type === 'video' ? '▶ Vidéo' : c.type === 'pdf' ? '📄 PDF' : '📝 Texte'}</span>
                    <span style={S.contentTitle}>{c.titre}</span>
                  </div>
                  {c.type === 'video' && getYouTubeId(c.contenu) && (
                    <iframe
                      style={S.videoFrame}
                      src={`https://www.youtube.com/embed/${getYouTubeId(c.contenu)}`}
                      title={c.titre}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  {c.type === 'pdf' && (
                    <a href={c.contenu} target="_blank" rel="noreferrer" style={S.pdfLink}>
                      📄 Ouvrir le PDF — {c.titre}
                    </a>
                  )}
                  {c.type === 'texte' && (
                    <div style={S.textContent}>{c.contenu}</div>
                  )}
                </div>
              ))}

              {questions.length > 0 && !isPassed(selNiveau.id) && (
                <button style={S.qcmBtn} onClick={() => { setShowQCM(true); setAnswers({}); }}>
                  📝 Passer le QCM ({questions.length} question{questions.length > 1 ? 's' : ''})
                </button>
              )}

              {isPassed(selNiveau.id) && (
                <div style={{ ...S.result(true), marginTop:24, padding:20 }}>
                  <span style={{ color:'var(--p-green)', fontWeight:600, fontSize:14 }}>✅ Niveau réussi — Score : {getProgForNiveau(selNiveau.id)?.score}%</span>
                </div>
              )}
            </>
          ) : showQCM && !showResult ? (
            /* ─── QCM ─── */
            <>
              <h2 style={S.sectionTitle}>QCM — {selNiveau.titre}</h2>
              <p style={S.sectionDesc}>Répondez à toutes les questions. Score requis : {selNiveau.score_requis || 80}%</p>

              {questions.map((q, qi) => (
                <div key={q.id} style={S.qcmCard}>
                  <div style={S.qcmNum}>Question {qi + 1} / {questions.length}</div>
                  <div style={S.qcmQ}>{q.question}</div>
                  {(q.choix || []).map((ch, ci) => {
                    const selected = (answers[qi] || []).includes(ci);
                    return (
                      <div key={ci}
                        style={S.choiceLabel(selected, false, false)}
                        onClick={() => {
                          const prev = answers[qi] || [];
                          const next = selected ? prev.filter(v => v !== ci) : [...prev, ci];
                          setAnswers({ ...answers, [qi]: next });
                        }}>
                        <div style={{ ...S.choiceRadio(selected), borderRadius:4 }}>
                          {selected && <div style={{ ...S.choiceRadioDot, borderRadius:2 }} />}
                        </div>
                        <span>{ch}</span>
                      </div>
                    );
                  })}
                </div>
              ))}

              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button style={S.resultBtn(false)} onClick={() => setShowQCM(false)}>← Retour au cours</button>
                <button
                  style={{ ...S.qcmBtn, opacity: questions.some((_, qi) => !(answers[qi] || []).length) ? .5 : 1 }}
                  disabled={questions.some((_, qi) => !(answers[qi] || []).length)}
                  onClick={handleSubmitQCM}>
                  Valider mes réponses
                </button>
              </div>
            </>
          ) : showResult ? (
            /* ─── Résultat ─── */
            <div style={S.result(score >= (selNiveau.score_requis || 80))}>
              <div style={S.resultIcon}>{score >= (selNiveau.score_requis || 80) ? '🎉' : '😔'}</div>
              <div style={S.resultTitle(score >= (selNiveau.score_requis || 80))}>
                {score >= (selNiveau.score_requis || 80) ? 'Félicitations !' : 'Pas encore...'}
              </div>
              <div style={S.resultScore}>
                Vous avez obtenu <strong>{score}%</strong> (requis : {selNiveau.score_requis || 80}%)
              </div>
              <div>
                {score >= (selNiveau.score_requis || 80) ? (
                  <>
                    <p style={{ color:'var(--p-fg-mid)', fontSize:14, marginBottom:16 }}>
                      Le niveau suivant est maintenant débloqué !
                    </p>
                    {niveaux.indexOf(selNiveau) < niveaux.length - 1 ? (
                      <button style={S.resultBtn(true)} onClick={handleNextLevel}>
                        Passer au niveau suivant →
                      </button>
                    ) : (
                      <button style={S.resultBtn(true)} onClick={() => navigate('/portail')}>
                        Module terminé ! ✓
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ color:'var(--p-fg-mid)', fontSize:14, marginBottom:16 }}>
                      Révisez le contenu et réessayez !
                    </p>
                    <button style={S.resultBtn(false)} onClick={() => { setShowQCM(false); setShowResult(false); }}>
                      Revoir le cours
                    </button>
                    <button style={S.resultBtn(true)} onClick={handleRetry}>
                      Réessayer le QCM
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
