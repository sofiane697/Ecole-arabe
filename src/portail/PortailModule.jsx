import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchModulesEleve, fetchNiveauxEleve, fetchNiveauxByThematiqueEleve,
  fetchThematiquesEleve, fetchAllThematiquesEleve, fetchEleveNiveauScolaireId, fetchContenusEleve, fetchQCMEleve,
  fetchProgression, saveProgression,
} from './supabasePortail';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function getEleveId() {
  try { return JSON.parse(sessionStorage.getItem('eleve_user'))?.id; } catch { return null; }
}
function getEleveNiveauScolaireId() {
  try { return JSON.parse(sessionStorage.getItem('eleve_user'))?.niveau_scolaire_id ?? null; } catch { return null; }
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CARD_PASTELS = [
  { bg:'#DAEEFF', btnGrad:'linear-gradient(135deg,#7EC8E3,#5BA8D4)', btnShadow:'rgba(91,168,212,0.3)' },
  { bg:'#D5F5E3', btnGrad:'linear-gradient(135deg,#7DCFA0,#5BA87A)', btnShadow:'rgba(91,168,122,0.3)' },
  { bg:'#FADBD8', btnGrad:'linear-gradient(135deg,#F4A896,#E8806D)', btnShadow:'rgba(232,128,109,0.3)' },
  { bg:'#FEF9E7', btnGrad:'linear-gradient(135deg,#F7D070,#F0B429)', btnShadow:'rgba(240,180,41,0.3)' },
];

const S = {
  // Thématiques grid — cartes à largeur fixe (auto-fill)
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  card: (palette) => ({ background: palette ? palette.bg : 'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', overflow:'hidden', cursor:'pointer', transition:'transform .2s var(--p-ease-out), box-shadow .2s' }),
  cardImg: { width:'100%', height:140, objectFit:'cover', display:'block' },
  cardImgContainer: (bg) => ({ width:'100%', height:140, background: bg || 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)', display:'flex', alignItems:'center', justifyContent:'center' }),
  cardImgPlaceholder: { fontSize:40, opacity:.4 },
  cardBody: { padding:20 },
  cardTitle: { fontSize:17, fontWeight:700, color:'var(--p-fg)', margin:'0 0 6px' },
  cardDesc: { fontSize:13, color:'var(--p-fg-mid)', margin:'0 0 16px', lineHeight:1.5 },
  progressBar: { height:8, borderRadius:4, background:'rgba(0,0,0,0.12)', overflow:'hidden' },
  progressFill: (pct) => ({ height:'100%', borderRadius:4, background:'#ffffff', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', width:`${pct}%`, transition:'width .6s var(--p-ease-out)' }),
  progressText: { display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:'var(--p-fg-mid)' },
  btn: (palette) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'none', background: palette ? palette.btnGrad : 'var(--p-gold)', boxShadow: palette ? `0 4px 12px ${palette.btnShadow}` : 'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16, transition:'opacity .2s, transform .15s' }),
  btnCompleted: (palette) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'none', background: palette ? palette.btnGrad : 'var(--p-green)', boxShadow: palette ? `0 4px 12px ${palette.btnShadow}` : 'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16, opacity:0.75 }),
  moduleHeader: { marginBottom:28 },
  moduleTitle: { fontSize:24, fontWeight:700, color:'var(--p-fg)', margin:'0 0 6px' },
  moduleDesc: { fontSize:14, color:'var(--p-fg-mid)' },
  // Niveaux view (stepper)
  layout: { display:'grid', gridTemplateColumns:'260px 1fr', gap:0, minHeight:'calc(100vh - 100px)', border:'1px solid var(--p-border)', borderRadius:'var(--p-radius)', overflow:'hidden', background:'var(--p-bg-card)' },
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
  main: { padding:28, overflowY:'auto' },
  backBtn: { display:'inline-flex', alignItems:'center', gap:6, color:'var(--p-fg-mid)', fontSize:13, fontWeight:500, cursor:'pointer', marginBottom:20, background:'none', border:'none', padding:0 },
  sectionTitle: { fontSize:20, fontWeight:700, color:'var(--p-fg)', marginBottom:6 },
  sectionDesc: { fontSize:14, color:'var(--p-fg-mid)', marginBottom:24 },
  contentCard: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', marginBottom:16, overflow:'hidden' },
  contentHeader: { display:'flex', alignItems:'center', gap:10, padding:'14px 18px', borderBottom:'1px solid var(--p-border)' },
  contentType: (c) => ({ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c }),
  contentTitle: { fontSize:14, fontWeight:600, color:'var(--p-fg)' },
  videoFrame: { width:'100%', aspectRatio:'16/9', border:'none', borderRadius:'0 0 var(--p-radius) var(--p-radius)' },
  textContent: { padding:'16px 18px', fontSize:14, color:'var(--p-fg)', lineHeight:1.7 },
  qcmBtn: { display:'inline-flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:980, border:'none', background:'var(--p-gold)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:24 },
  qcmCard: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', padding:24, marginBottom:16 },
  qcmQ: { fontSize:15, fontWeight:600, color:'var(--p-fg)', marginBottom:14 },
  qcmNum: { fontSize:12, color:'var(--p-fg-light)', marginBottom:6 },
  choiceLabel: (selected, correct, showResult) => ({
    display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:'var(--p-radius-sm)',
    border: `1px solid ${showResult ? (correct ? 'var(--p-green)' : selected ? 'var(--p-red)' : 'var(--p-border)') : selected ? 'var(--p-gold)' : 'var(--p-border)'}`,
    background: showResult ? (correct ? 'rgba(48,209,88,.08)' : selected ? 'rgba(255,69,58,.06)' : 'transparent') : selected ? 'rgba(191,138,48,.06)' : 'transparent',
    cursor: showResult ? 'default' : 'pointer', marginBottom:6, transition:'all .2s', color:'var(--p-fg)', fontSize:14,
  }),
  choiceRadio: (selected) => ({
    width:18, height:18, borderRadius:'50%', border: `2px solid ${selected ? 'var(--p-gold)' : 'var(--p-border)'}`,
    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  }),
  choiceRadioDot: { width:10, height:10, borderRadius:'50%', background:'var(--p-gold)' },
  result: (passed) => ({ textAlign:'center', padding:32, background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', marginTop:24 }),
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

const FUN_TITLE_KEYFRAMES = `
@keyframes funModTitleIn {
  0%   { opacity:0; transform:translateY(-18px) scale(0.92); }
  60%  { transform:translateY(4px) scale(1.02); }
  80%  { transform:translateY(-2px) scale(0.99); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes funModBubble {
  0%,100% { transform:translateY(0); opacity:.7; }
  50%      { transform:translateY(-5px); opacity:1; }
}
`;
const FUN_LETTER_COLORS = ['#7EC8E3', '#7DCFA0', '#F4A896', '#F7D070'];

function FunModuleTitle({ text }) {
  return (
    <>
      <style>{FUN_TITLE_KEYFRAMES}</style>
      <div style={{
        fontFamily:"'Nunito','Inter',sans-serif",
        marginBottom: 8,
        animation: 'funModTitleIn 0.75s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <span style={{ fontSize:40, fontWeight:900, letterSpacing:2, display:'inline-flex', flexWrap:'wrap', gap:0 }}>
          {text.split('').map((char, i) => (
            <span key={i} style={{
              color: char === ' ' ? 'inherit' : FUN_LETTER_COLORS[i % FUN_LETTER_COLORS.length],
              textShadow: char === ' ' ? 'none' : `0 3px 10px ${FUN_LETTER_COLORS[i % FUN_LETTER_COLORS.length]}55`,
              display: 'inline-block',
              whiteSpace: 'pre',
            }}>{char}</span>
          ))}
        </span>
        <div style={{ display:'flex', gap:5, marginTop:6, paddingLeft:2 }}>
          {['#7EC8E3','#7DCFA0','#F4A896','#F7D070','#7EC8E3','#F4A896'].map((c, i) => (
            <span key={i} style={{
              color: c, fontSize:[8,11,7,10,9,8][i],
              animation:`funModBubble ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`,
              display:'inline-block',
            }}>●</span>
          ))}
        </div>
      </div>
    </>
  );
}

const MODULE_FADE_KEYFRAMES = `
@keyframes moduleBgFloat {
  0%,100% { opacity:0.12; transform:scale(1) rotate(var(--rot,0deg)); }
  50%      { opacity:0.22; transform:scale(1.06) translateY(-10px) rotate(var(--rot,0deg)); }
}
`;

const MODULE_BG_LETTERS = [
  // Zone gauche
  { l:'ب', size:'80px', top:'6%',  left:'2%',  color:'#F4A896', dur:'8s',  delay:'0s',   rot:'-8deg'  },
  { l:'ك', size:'72px', top:'30%', left:'3%',  color:'#7EC8E3', dur:'9s',  delay:'2s',   rot:'-5deg'  },
  { l:'ن', size:'68px', top:'58%', left:'1%',  color:'#7DCFA0', dur:'10s', delay:'4s',   rot:'6deg'   },
  { l:'ل', size:'65px', top:'82%', left:'2%',  color:'#F7D070', dur:'7s',  delay:'1s',   rot:'15deg'  },
  // Zone droite
  { l:'ر', size:'78px', top:'7%',  left:'88%', color:'#7DCFA0', dur:'9s',  delay:'1.8s', rot:'12deg'  },
  { l:'م', size:'65px', top:'28%', left:'85%', color:'#F7D070', dur:'8s',  delay:'0.6s', rot:'9deg'   },
  { l:'ص', size:'74px', top:'52%', left:'90%', color:'#F4A896', dur:'10s', delay:'3s',   rot:'-10deg' },
  { l:'و', size:'68px', top:'76%', left:'86%', color:'#7EC8E3', dur:'7s',  delay:'2s',   rot:'7deg'   },
  // Zone haute
  { l:'ع', size:'70px', top:'3%',  left:'32%', color:'#F4A896', dur:'8s',  delay:'1.5s', rot:'-12deg' },
  { l:'ق', size:'64px', top:'4%',  left:'60%', color:'#F7D070', dur:'7s',  delay:'3.5s', rot:'-3deg'  },
  // Zone basse
  { l:'ح', size:'75px', top:'90%', left:'28%', color:'#7DCFA0', dur:'9s',  delay:'0.5s', rot:'4deg'   },
  { l:'ذ', size:'66px', top:'88%', left:'62%', color:'#F4A896', dur:'8s',  delay:'2.5s', rot:'-6deg'  },
];

function ModuleBgLetters() {
  return (
    <>
      <style>{MODULE_FADE_KEYFRAMES}</style>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        {MODULE_BG_LETTERS.map((l, i) => (
          <span key={i} className="portail-module-bg-letter" style={{
            position:'absolute', top:l.top, left:l.left,
            fontSize:l.size, color:l.color,
            fontFamily:"'Scheherazade New', serif", fontWeight:700,
            userSelect:'none', willChange:'opacity, transform',
            '--rot': l.rot,
            animation:`moduleBgFloat ${l.dur} ease-in-out ${l.delay} infinite`,
          }}>{l.l}</span>
        ))}
      </div>
    </>
  );
}

const TYPE_COLORS = { video: '#ff453a', pdf: '#0a84ff', texte: '#30d158', word: '#2b579a', ppt: '#c43e1c' };
const TYPE_LABELS = { video: '▶ Vidéo', texte: '📝 Texte', word: '📃 Word', ppt: '📊 PowerPoint' };
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

// ─── Composant principal — routeur intelligent ────────────────────────────────
export default function PortailModule() {
  const { id, moduleId, thId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Route /portail/module/:moduleId/thematique/:thId → vue niveaux pour une thématique
  if (thId) {
    const thematiqueTitle = location.state?.titre || 'Thématique';
    return (
      <NiveauxView
        fetchId={thId}
        byThematique={true}
        stepperTitle={thematiqueTitle}
        onBack={() => navigate(`/portail/module/${moduleId}`)}
      />
    );
  }

  // Route /portail/module/:id → dispatcher
  return <ModuleEntryView moduleId={id} />;
}

// ─── Dispatcher : thématiques ou niveaux directs ──────────────────────────────
function ModuleEntryView({ moduleId }) {
  const navigate = useNavigate();
  const [thematiques, setThematiques] = useState(null);
  const [moduleHasThematiques, setModuleHasThematiques] = useState(false);
  const [module_, setModule_] = useState(null);
  const [niveauxMap, setNiveauxMap] = useState({});
  const [progression, setProgression] = useState([]);
  const eleveId = getEleveId();

  useEffect(() => {
    (async () => {
      // Toujours vérifier en DB pour détecter un changement de classe depuis l'admin
      let niveauScolaireId = getEleveNiveauScolaireId();
      if (eleveId) {
        const freshId = await fetchEleveNiveauScolaireId(eleveId).catch(() => niveauScolaireId);
        if (freshId !== niveauScolaireId) {
          niveauScolaireId = freshId;
          try {
            const user = JSON.parse(sessionStorage.getItem('eleve_user') || '{}');
            user.niveau_scolaire_id = freshId;
            sessionStorage.setItem('eleve_user', JSON.stringify(user));
          } catch {}
        }
      }

      const [allThs, filteredThs, mods] = await Promise.all([
        fetchAllThematiquesEleve(moduleId),
        fetchThematiquesEleve(moduleId, niveauScolaireId),
        fetchModulesEleve(),
      ]);
      setModule_(mods.find(m => String(m.id) === String(moduleId)) || null);
      setModuleHasThematiques(allThs.length > 0);
      setThematiques(filteredThs);
      if (filteredThs.length > 0) {
        const [prog, ...nivArrays] = await Promise.all([
          fetchProgression(eleveId),
          ...filteredThs.map(th => fetchNiveauxByThematiqueEleve(th.id)),
        ]);
        setProgression(prog);
        const map = {};
        filteredThs.forEach((th, i) => { map[th.id] = nivArrays[i]; });
        setNiveauxMap(map);
      }
    })().catch(console.error);
  }, [moduleId, eleveId]);

  if (thematiques === null) return <div style={S.empty}>Chargement...</div>;

  // Le module n'a aucune thématique → vue niveaux directe
  if (!moduleHasThematiques) {
    return (
      <NiveauxView
        fetchId={moduleId}
        byThematique={false}
        stepperTitle={module_?.titre || ''}
        onBack={() => navigate('/portail')}
      />
    );
  }

  // Le module a des thématiques mais aucune accessible → message
  if (thematiques.length === 0) {
    return (
      <div>
        <button style={S.backBtn} onClick={() => navigate('/portail')}>
          <IconBack /> Retour aux cours
        </button>
        {module_ && (
          <div style={S.moduleHeader}>
            <h2 style={S.moduleTitle}>{module_.titre}</h2>
          </div>
        )}
        <div style={S.empty}>Aucune thématique disponible pour votre niveau.</div>
      </div>
    );
  }

  // Vue thématiques (page intermédiaire)
  return (
    <div>
      <ModuleBgLetters />
      <button style={S.backBtn} onClick={() => navigate('/portail')}>
        <IconBack /> Retour aux cours
      </button>

      {module_ && (
        <div style={S.moduleHeader}>
          <h1 style={{ fontSize:25, fontWeight:800, color:'var(--p-fg)', margin:'0 0 8px', letterSpacing:'-0.3px', lineHeight:1.2 }}>
            {module_.titre}
          </h1>
          {module_.description && <p style={S.moduleDesc}>{module_.description}</p>}
        </div>
      )}

      <div style={S.grid}>
        {thematiques.map((th, index) => {
          const palette = CARD_PASTELS[index % CARD_PASTELS.length];
          const nivs = niveauxMap[th.id] || [];
          const total = nivs.length;
          const reussis = nivs.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
          const pct = total > 0 ? Math.round((reussis / total) * 100) : 0;
          const completed = total > 0 && pct >= 100;
          const started = reussis > 0;

          return (
            <div key={th.id} style={S.card(palette)}
              onClick={() => navigate(`/portail/module/${moduleId}/thematique/${th.id}`, { state: { titre: th.titre } })}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${palette.btnShadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {th.image_url ? (
                <img src={th.image_url} alt={th.titre} style={S.cardImg} />
              ) : (
                <div style={S.cardImgContainer(palette.bg)}>
                  <span style={S.cardImgPlaceholder}>📂</span>
                </div>
              )}
              <div style={S.cardBody}>
                <h3 style={S.cardTitle}>{th.titre}</h3>
                {th.description && <p style={S.cardDesc}>{th.description}</p>}
                {total > 0 && (
                  <>
                    <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>
                    <div style={S.progressText}>
                      <span>{reussis} / {total} niveaux</span>
                      <span style={{ color:'var(--p-fg-mid)' }}>{pct}%</span>
                    </div>
                  </>
                )}
                <button style={completed ? S.btnCompleted(palette) : S.btn(palette)}>
                  {completed ? '✓ Terminé' : started ? 'Continuer' : 'Commencer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue niveaux + contenu + QCM (logique extraite de l'ancien PortailModule) ─
function NiveauxView({ fetchId, byThematique, stepperTitle, onBack }) {
  const [niveaux, setNiveaux]           = useState([]);
  const [progression, setProgressionState] = useState([]);
  const [selNiveau, setSelNiveau]       = useState(null);
  const [contenus, setContenus]         = useState([]);
  const [questions, setQuestions]       = useState([]);
  const [showQCM, setShowQCM]           = useState(false);
  const [answers, setAnswers]           = useState({});
  const [showResult, setShowResult]     = useState(false);
  const [score, setScore]               = useState(0);
  const [loading, setLoading]           = useState(true);
  // Set des IDs de niveaux qui possèdent au moins une question QCM
  const [niveauxWithQCM, setNiveauxWithQCM] = useState(new Set());
  const eleveId = getEleveId();

  const loadData = useCallback(async () => {
    try {
      const [nivs, prog] = await Promise.all([
        byThematique ? fetchNiveauxByThematiqueEleve(fetchId) : fetchNiveauxEleve(fetchId),
        fetchProgression(eleveId),
      ]);

      // Vérifier en parallèle quels niveaux ont un QCM
      const qcmResults = await Promise.all(nivs.map(n => fetchQCMEleve(n.id)));
      const withQCM = new Set(nivs.filter((_, i) => qcmResults[i].length > 0).map(n => n.id));

      setNiveaux(nivs);
      setProgressionState(prog);
      setNiveauxWithQCM(withQCM);

      // Sélectionner le premier niveau accessible non encore réussi
      // (un niveau sans QCM ne bloque pas le suivant → on cherche le premier "utile")
      const isUnlockedLocal = (index) => {
        if (index === 0) return true;
        const prevId = nivs[index - 1].id;
        if (!withQCM.has(prevId)) return true; // pas de QCM → débloqué
        return prog.some(p => p.niveau_id === prevId && p.reussi);
      };
      const firstTarget = nivs.find((n, i) => isUnlockedLocal(i) && !prog.some(p => p.niveau_id === n.id && p.reussi));
      setSelNiveau(firstTarget || nivs[0] || null);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [fetchId, byThematique, eleveId]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selNiveau) return;
    setShowQCM(false); setShowResult(false); setAnswers({});
    (async () => {
      try {
        const [c, q] = await Promise.all([fetchContenusEleve(selNiveau.id), fetchQCMEleve(selNiveau.id)]);
        setContenus(c); setQuestions(q);
      } catch(e) { console.error(e); }
    })();
  }, [selNiveau]);

  const isUnlocked = (niv, index) => {
    if (index === 0) return true;
    const prevId = niveaux[index - 1].id;
    // Si le niveau précédent n'a pas de QCM → débloqué automatiquement
    if (!niveauxWithQCM.has(prevId)) return true;
    // Si le niveau précédent a un QCM → il doit être réussi
    return progression.some(p => p.niveau_id === prevId && p.reussi);
  };
  const isPassed = (nivId) => progression.some(p => p.niveau_id === nivId && p.reussi);
  const getProgForNiveau = (nivId) => progression.find(p => p.niveau_id === nivId);

  const handleSubmitQCM = async () => {
    const correct = questions.filter((q, i) => {
      const correctSet = Array.isArray(q.reponse_correcte) ? q.reponse_correcte : [q.reponse_correcte];
      const selected = answers[i] || [];
      return correctSet.length === selected.length && correctSet.every(v => selected.includes(v));
    }).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= (selNiveau.score_requis || 80);
    setScore(pct); setShowResult(true);
    try {
      await saveProgression(eleveId, selNiveau.id, pct, passed);
      setProgressionState(await fetchProgression(eleveId));
    } catch(e) { console.error(e); }
  };

  const handleNextLevel = () => {
    const idx = niveaux.findIndex(n => n.id === selNiveau.id);
    if (idx < niveaux.length - 1) setSelNiveau(niveaux[idx + 1]);
  };

  if (loading) return <div style={S.empty}>Chargement...</div>;

  return (
    <div>
      <ModuleBgLetters />
      <button style={S.backBtn} onClick={onBack}>
        <IconBack /> Retour
      </button>

      <div className="portail-module-layout">
        {/* ─── Stepper ─── */}
        <div className="portail-module-stepper">
          <div className="portail-stepper-title" style={S.stepperTitle}>{stepperTitle}</div>
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
                    <div style={S.stepScore}>Score : {prog.score}% · {prog.tentatives} tentative{prog.tentatives > 1 ? 's' : ''}</div>
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
              {selNiveau.image_url && (
                <img src={selNiveau.image_url} alt={selNiveau.titre}
                  style={{ width:'100%', height:180, objectFit:'cover', borderRadius:'var(--p-radius)', marginBottom:20, display:'block' }} />
              )}
              <h2 style={S.sectionTitle}>{selNiveau.titre}</h2>
              {selNiveau.description && <p style={S.sectionDesc}>{selNiveau.description}</p>}
              {contenus.length === 0 && <div style={S.empty}>Aucun contenu disponible pour ce niveau.</div>}
              {contenus.map(c => (
                <div key={c.id} style={S.contentCard}>
                  {c.type !== 'pdf' && (
                    <div style={S.contentHeader}>
                      <span style={S.contentType(TYPE_COLORS[c.type] || '#aaa')}>{TYPE_LABELS[c.type] || c.type}</span>
                      <span style={S.contentTitle}>{c.titre}</span>
                    </div>
                  )}
                  {c.type === 'video' && getYouTubeId(c.contenu) && (
                    <iframe style={S.videoFrame} src={`https://www.youtube.com/embed/${getYouTubeId(c.contenu)}`}
                      title={c.titre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  )}
                  {c.type === 'pdf' && (
                    <div style={{ padding:'14px 18px' }}>
                      <a href={c.contenu} target="_blank" rel="noreferrer" style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'14px 18px', borderRadius:'var(--p-radius-sm)',
                        background:'rgba(10,132,255,0.06)', border:'1px solid rgba(10,132,255,0.18)', textDecoration:'none', gap:12,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                          <span style={{ fontSize:32, flexShrink:0 }}>📄</span>
                          <div>
                            <div style={{ fontSize:14, fontWeight:600, color:'var(--p-fg)' }}>{c.titre}</div>
                            <div style={{ fontSize:12, color:'var(--p-fg-mid)', marginTop:2 }}>Appuyez pour ouvrir le document</div>
                          </div>
                        </div>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  )}
                  {c.type === 'texte' && (
                    <div
                      className="portail-rich-text"
                      style={S.textContent}
                      {...(c.contenu?.startsWith('<')
                        ? { dangerouslySetInnerHTML: { __html: c.contenu } }
                        : { children: c.contenu }
                      )}
                    />
                  )}
                  {(c.type === 'word' || c.type === 'ppt') && (
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(c.contenu)}`}
                      style={{
                        width: '100%',
                        border: 'none',
                        borderRadius: '0 0 var(--p-radius) var(--p-radius)',
                        ...(c.type === 'ppt'
                          ? { aspectRatio: '16/9' }
                          : { height: '600px' }),
                      }}
                      title={c.titre}
                      allowFullScreen
                    />
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
                      <div key={ci} style={S.choiceLabel(selected, false, false)}
                        onClick={() => {
                          const prev = answers[qi] || [];
                          setAnswers({ ...answers, [qi]: selected ? prev.filter(v => v !== ci) : [...prev, ci] });
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
                <button style={{ ...S.qcmBtn, opacity: questions.some((_, qi) => !(answers[qi] || []).length) ? .5 : 1 }}
                  disabled={questions.some((_, qi) => !(answers[qi] || []).length)}
                  onClick={handleSubmitQCM}>
                  Valider mes réponses
                </button>
              </div>
            </>
          ) : showResult ? (
            <div style={S.result(score >= (selNiveau.score_requis || 80))}>
              <div style={S.resultIcon}>{score >= (selNiveau.score_requis || 80) ? '🎉' : '😔'}</div>
              <div style={S.resultTitle(score >= (selNiveau.score_requis || 80))}>
                {score >= (selNiveau.score_requis || 80) ? 'Félicitations !' : 'Pas encore...'}
              </div>
              <div style={S.resultScore}>Vous avez obtenu <strong>{score}%</strong> (requis : {selNiveau.score_requis || 80}%)</div>
              <div>
                {score >= (selNiveau.score_requis || 80) ? (
                  <>
                    <p style={{ color:'var(--p-fg-mid)', fontSize:14, marginBottom:16 }}>Le niveau suivant est maintenant débloqué !</p>
                    {niveaux.indexOf(selNiveau) < niveaux.length - 1 ? (
                      <button style={S.resultBtn(true)} onClick={handleNextLevel}>Passer au niveau suivant →</button>
                    ) : (
                      <button style={S.resultBtn(true)} onClick={onBack}>Terminé ! ✓</button>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ color:'var(--p-fg-mid)', fontSize:14, marginBottom:16 }}>Révisez le contenu et réessayez !</p>
                    <button style={S.resultBtn(false)} onClick={() => { setShowQCM(false); setShowResult(false); }}>Revoir le cours</button>
                    <button style={S.resultBtn(true)} onClick={() => { setShowQCM(true); setShowResult(false); setAnswers({}); }}>Réessayer le QCM</button>
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
