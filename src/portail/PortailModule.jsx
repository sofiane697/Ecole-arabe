import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import {
  fetchModulesEleve, fetchNiveauxByThematiqueEleve,
  fetchThematiquesEleve, fetchAllThematiquesEleve, fetchEleveNiveauScolaireId, fetchContenusEleve, fetchQCMEleve,
  fetchProgression, saveProgression, fetchLeconsEleve, fetchNiveauxByLeconEleve, fetchQCMExistenceForNiveaux,
  fetchAllNiveauxForModuleEleve, fetchNiveauxParThematiquePourProgression,
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
  grid: 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5',
  card: (palette) => ({ background: palette ? palette.bg : 'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', overflow:'hidden', cursor:'pointer', transition:'transform .2s var(--p-ease-out), box-shadow .2s' }),
  cardImg: 'w-full h-[140px] object-cover block',
  cardImgContainer: (bg) => ({ width:'100%', height:140, background: bg || 'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)', display:'flex', alignItems:'center', justifyContent:'center' }),
  cardImgPlaceholder: 'text-[40px] opacity-40',
  cardBody: 'p-5',
  cardTitle: 'text-[17px] font-bold text-[#1a1a1a] mb-1.5 mt-0 mx-0',
  cardDesc: 'text-[13px] text-[rgba(0,0,0,0.58)] mb-4 mt-0 mx-0 leading-normal',
  progressBar: 'h-2 rounded bg-[rgba(0,0,0,0.12)] overflow-hidden',
  progressFill: (pct) => ({ height:'100%', borderRadius:4, background:'rgba(0,0,0,0.28)', width:`${pct}%`, transition:'width .6s var(--p-ease-out)' }),
  progressText: 'flex justify-between mt-2 text-xs text-[rgba(0,0,0,0.52)]',
  btn: (palette) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'none', background: palette ? palette.btnGrad : 'var(--p-gold)', boxShadow: palette ? `0 4px 12px ${palette.btnShadow}` : 'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16, transition:'opacity .2s, transform .15s' }),
  btnCompleted: (palette) => ({ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'none', background: palette ? palette.btnGrad : 'var(--p-green)', boxShadow: palette ? `0 4px 12px ${palette.btnShadow}` : 'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16, opacity:0.75 }),
  moduleHeader: 'mb-7',
  moduleTitle: 'font-p-display text-2xl font-bold text-p-fg mb-1.5 mt-0 mx-0',
  moduleDesc: 'text-sm text-p-fg-mid',
  // Niveaux view (stepper)
  layout: 'grid grid-cols-[260px_1fr] gap-0 min-h-[calc(100vh-100px)] border border-p-border rounded-p overflow-hidden bg-p-bg-card',
  stepperTitle: 'text-[11px] font-bold text-p-fg-light uppercase tracking-[1.2px] px-5 pb-3',
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
  stepScore: 'text-[11px] text-p-fg-light mt-0.5',
  main: 'p-7 overflow-y-auto',
  backBtn: 'inline-flex items-center gap-1.5 text-p-fg-mid text-[13px] font-medium cursor-pointer mb-5 bg-none border-none p-0',
  sectionTitle: 'font-p-display text-xl font-bold text-p-fg mb-1.5',
  sectionDesc: 'text-sm text-p-fg-mid mb-6',
  contentCard: 'bg-p-bg-card rounded-p border border-p-border mb-4 overflow-hidden',
  contentHeader: 'flex items-center gap-2.5 px-[18px] py-3.5 border-b border-p-border',
  contentType: (c) => ({ fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20, background:`${c}18`, color:c }),
  contentTitle: 'text-sm font-semibold text-p-fg',
  videoFrame: 'w-full aspect-video border-none rounded-b-p',
  textContent: 'px-[18px] py-4 text-sm text-p-fg leading-[1.7]',
  qcmBtn: 'inline-flex items-center gap-2 px-6 py-3 rounded-full border-none bg-p-gold text-white text-sm font-semibold cursor-pointer mt-6',
  qcmCard: 'bg-p-bg-card rounded-p border border-p-border p-6 mb-4',
  qcmQ: 'text-[15px] font-semibold text-p-fg mb-3.5',
  qcmNum: 'text-xs text-p-fg-light mb-1.5',
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
  choiceRadioDot: 'w-2.5 h-2.5 rounded-full bg-p-gold',
  result: (passed) => ({ textAlign:'center', padding:32, background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', marginTop:24 }),
  resultIcon: 'text-5xl mb-3',
  resultTitle: (passed) => ({ fontFamily:'var(--p-font-display)', fontSize:22, fontWeight:700, color: passed ? 'var(--p-green)' : 'var(--p-red)', marginBottom:8 }),
  resultScore: 'text-base text-p-fg-mid mb-5',
  resultBtn: (primary) => ({
    padding:'11px 24px', borderRadius:980, border: primary ? 'none' : '1px solid var(--p-border)',
    background: primary ? 'var(--p-gold)' : 'transparent',
    color: primary ? '#fff' : 'var(--p-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer', margin:'0 6px',
  }),
  locked: 'text-center px-5 py-[60px] text-p-fg-mid',
  lockedIcon: 'text-5xl mb-3',
  empty: 'text-center px-5 py-[60px] text-p-fg-mid text-sm',
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
      <div className="mb-2" style={{
        fontFamily:"'Nunito','Inter',sans-serif",
        animation: 'funModTitleIn 0.75s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <span className="text-[40px] font-black tracking-[2px] inline-flex flex-wrap gap-0">
          {text.split('').map((char, i) => (
            <span key={i} className="inline-block whitespace-pre" style={{
              color: char === ' ' ? 'inherit' : FUN_LETTER_COLORS[i % FUN_LETTER_COLORS.length],
              textShadow: char === ' ' ? 'none' : `0 3px 10px ${FUN_LETTER_COLORS[i % FUN_LETTER_COLORS.length]}55`,
            }}>{char}</span>
          ))}
        </span>
        <div className="flex gap-[5px] mt-1.5 pl-0.5">
          {['#7EC8E3','#7DCFA0','#F4A896','#F7D070','#7EC8E3','#F4A896'].map((c, i) => (
            <span key={i} className="inline-block" style={{
              color: c, fontSize:[8,11,7,10,9,8][i],
              animation:`funModBubble ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`,
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
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {MODULE_BG_LETTERS.map((l, i) => (
          <span key={i} className="portail-module-bg-letter absolute font-arabic font-bold select-none will-change-[opacity,transform]" style={{
            top:l.top, left:l.left,
            fontSize:l.size, color:l.color,
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
  const { id, moduleId, thId, leconId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Route /portail/module/:moduleId/thematique/:thId/lecon/:leconId → Mon cours
  if (leconId) {
    const leconTitle = location.state?.titre || 'Leçon';
    return (
      <NiveauxView
        fetchId={leconId}
        byLecon={true}
        stepperTitle={leconTitle}
        onBack={() => navigate(`/portail/module/${moduleId}/thematique/${thId}`, { state: location.state?.thState })}
      />
    );
  }

  // Route /portail/module/:moduleId/thematique/:thId → Mes Leçons
  if (thId) {
    const thematiqueTitle = location.state?.titre || 'Thématique';
    return (
      <LeconsEntryView
        thId={thId}
        moduleId={moduleId}
        thematiqueTitle={thematiqueTitle}
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
  const [qcmNiveauxIds, setQcmNiveauxIds] = useState(new Set());
  const eleveId = getEleveId();

  useEffect(() => {
    let cancelled = false;
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
      if (!cancelled) setModule_(mods.find(m => String(m.id) === String(moduleId)) || null);
      if (!cancelled) setModuleHasThematiques(allThs.length > 0);
      if (!cancelled) setThematiques(filteredThs);
      if (filteredThs.length > 0) {
        const [prog, ...nivArrays] = await Promise.all([
          fetchProgression(eleveId),
          ...filteredThs.map(th => fetchNiveauxParThematiquePourProgression(th.id)),
        ]);
        if (!cancelled) setProgression(prog);
        const map = {};
        filteredThs.forEach((th, i) => { map[th.id] = nivArrays[i]; });
        if (!cancelled) setNiveauxMap(map);
        const allNivIds = nivArrays.flat().map(n => n.id);
        if (allNivIds.length > 0) {
          const qcmIds = await fetchQCMExistenceForNiveaux(allNivIds);
          if (!cancelled) setQcmNiveauxIds(qcmIds);
        }
      }
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [moduleId, eleveId]);

  if (thematiques === null) return <div className={S.empty}>Chargement...</div>;

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
        <button className={S.backBtn} onClick={() => navigate('/portail')}>
          <IconBack /> Retour aux cours
        </button>
        {module_ && (
          <div className={S.moduleHeader}>
            <h2 className={S.moduleTitle}>{module_.titre}</h2>
          </div>
        )}
        <div className={S.empty}>Aucune thématique disponible pour votre niveau.</div>
      </div>
    );
  }

  // Vue thématiques (page intermédiaire)
  return (
    <div>
      <ModuleBgLetters />
      <button className={S.backBtn} onClick={() => navigate('/portail')}>
        <IconBack /> Retour aux cours
      </button>

      {module_ && (
        <div className={S.moduleHeader}>
          <h1 className="font-p-display text-[25px] font-extrabold text-p-fg mb-2 mt-0 mx-0 tracking-[-0.3px] leading-[1.2]">
            {module_.titre}
          </h1>
          {module_.description && <p className={S.moduleDesc}>{module_.description}</p>}
        </div>
      )}

      <div className={S.grid}>
        {thematiques.map((th, index) => {
          const palette = CARD_PASTELS[index % CARD_PASTELS.length];
          const nivs = niveauxMap[th.id] || [];
          const nivsAvecQCM = nivs.filter(n => qcmNiveauxIds.has(n.id));
          const total = nivsAvecQCM.length;
          const reussis = nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
          const pct = total > 0 ? Math.round((reussis / total) * 100) : 0;
          const completed = total > 0 && pct >= 100;
          const started = reussis > 0;

          return (
            <div key={th.id}
              style={S.card(palette)}
              onClick={() => navigate(`/portail/module/${moduleId}/thematique/${th.id}`, { state: { titre: th.titre } })}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${palette.btnShadow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {th.image_url ? (
                <img src={th.image_url} alt={th.titre} className={S.cardImg} />
              ) : (
                <div style={S.cardImgContainer(palette.bg)}>
                  <span className={S.cardImgPlaceholder}>📂</span>
                </div>
              )}
              <div className={S.cardBody}>
                <h3 className={S.cardTitle}>{th.titre}</h3>
                {th.description && <p className={S.cardDesc}>{th.description}</p>}
                {total > 0 && (
                  <>
                    <div className={S.progressBar}><div style={S.progressFill(pct)} /></div>
                    <div className={S.progressText}>
                      <span>{reussis} / {total} leçon{total > 1 ? 's' : ''}</span>
                      <span className="text-[rgba(0,0,0,0.52)]">{pct}%</span>
                    </div>
                  </>
                )}
                <button style={S.btn(palette)}>
                  {started ? 'Continuer' : 'Commencer'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vue Leçons (intermédiaire entre Thématiques et Mon Cours) ───────────────
function LeconsEntryView({ thId, moduleId, thematiqueTitle, onBack }) {
  const navigate = useNavigate();
  const [lecons, setLecons] = useState(null);
  const [progression, setProgression] = useState([]);
  const [niveauxMap, setNiveauxMap] = useState({});
  const [qcmNiveauxIds, setQcmNiveauxIds] = useState(new Set());
  const eleveId = getEleveId();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [lecs, prog] = await Promise.all([
          fetchLeconsEleve(thId),
          fetchProgression(eleveId),
        ]);
        if (!cancelled) setLecons(lecs);
        if (!cancelled) setProgression(prog);
        if (lecs.length > 0) {
          const map = {};
          await Promise.all(lecs.map(async (l) => {
            try { map[l.id] = await fetchNiveauxByLeconEleve(l.id); } catch { map[l.id] = []; }
          }));
          if (!cancelled) setNiveauxMap(map);
          const allNivIds = Object.values(map).flat().map(n => n.id);
          if (allNivIds.length > 0) {
            const qcmIds = await fetchQCMExistenceForNiveaux(allNivIds);
            if (!cancelled) setQcmNiveauxIds(qcmIds);
          }
        }
      } catch(e) { if (!cancelled) setLecons([]); }
    })();
    return () => { cancelled = true; };
  }, [thId, eleveId]);

  if (lecons === null) return <div className={S.empty}>Chargement...</div>;

  // Pas de leçons → vue niveaux directe par thématique
  if (lecons.length === 0) {
    return (
      <NiveauxView
        fetchId={thId}
        byThematique={true}
        stepperTitle={thematiqueTitle}
        onBack={onBack}
      />
    );
  }

  return (
    <div>
      <ModuleBgLetters />
      <button className={S.backBtn} onClick={onBack}>
        <IconBack /> Retour aux thématiques
      </button>
      <div className={S.moduleHeader}>
        <h1 className="text-[25px] font-extrabold text-p-fg mb-2 mt-0 mx-0 tracking-[-0.3px] leading-[1.2]">
          {thematiqueTitle}
        </h1>
      </div>

      <div className={S.grid}>
        {(() => {
          // Précompute la chaîne de déblocage : une leçon est débloquée seulement si
          // la précédente est elle-même débloquée ET complétée (avec QCM validé)
          const leconCompleted = (l) => {
            const nivs = niveauxMap[l.id] || [];
            if (nivs.length === 0) return false;
            for (const nv of nivs) {
              if (!qcmNiveauxIds.has(nv.id)) return false; // un niveau sans QCM brise la chaîne
              if (!progression.some(p => p.niveau_id === nv.id && p.reussi)) return false;
            }
            return true;
          };
          const unlocked = lecons.reduce((acc, lec, i) => {
            acc.push(i === 0 ? true : acc[i - 1] && leconCompleted(lecons[i - 1]));
            return acc;
          }, []);

          return lecons.map((lec, index) => {
          const palette = CARD_PASTELS[index % CARD_PASTELS.length];
          const nivs = niveauxMap[lec.id] || [];
          const nivsAvecQCM = nivs.filter(n => qcmNiveauxIds.has(n.id));
          const reussis = nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
          const completed = leconCompleted(lec); // source de vérité unique
          const started = reussis > 0;
          const locked = !unlocked[index];

          return (
            <div key={lec.id}
              style={{ ...S.card(palette), ...(locked ? { opacity:0.45, cursor:'not-allowed', filter:'grayscale(0.25)' } : {}) }}
              onClick={() => { if (!locked) navigate(
                `/portail/module/${moduleId}/thematique/${thId}/lecon/${lec.id}`,
                { state: { titre: lec.titre, thState: { titre: thematiqueTitle } } }
              ); }}
              onMouseEnter={e => { if (!locked) { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${palette.btnShadow}`; } }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
              {lec.image_url ? (
                <img src={lec.image_url} alt={lec.titre} className={S.cardImg} loading="lazy" />
              ) : (
                <div style={S.cardImgContainer(palette.bg)}>
                  <span className={S.cardImgPlaceholder}>{locked ? '🔒' : '📝'}</span>
                </div>
              )}
              <div className={S.cardBody}>
                <h3 className={S.cardTitle}>{lec.titre}</h3>
                {lec.description && <p className={S.cardDesc}>{lec.description}</p>}
                <button style={locked ? { ...S.btn(palette), opacity:0.6, cursor:'not-allowed' } : completed ? S.btnCompleted(palette) : S.btn(palette)} disabled={locked}>
                  {locked ? '🔒 Verrouillée' : completed ? '📖 Je révise' : started ? 'Continuer' : 'Commencer'}
                </button>
              </div>
            </div>
          );
          });
        })()}
      </div>
    </div>
  );
}

// ─── Styles NiveauxView — nouveau design "Focus Mode" ────────────────────────
const NIVEAU_COLORS = ['#4F8EF7', '#27AE8F', '#F0A500', '#8B5CF6'];
const NS = {
  backBtn: 'inline-flex items-center gap-1.5 text-p-fg-mid text-[13px] font-medium cursor-pointer mb-5 bg-none border-none p-0',
  empty: 'text-center px-5 py-[60px] text-p-fg-mid text-sm',
  // Zone 1 — Progression globale
  progressHeader: 'flex items-center gap-3.5 bg-p-bg-card rounded-p border border-p-border py-3.5 px-5 mb-4',
  progressLeft: 'flex flex-col gap-[3px] flex-[0_0_auto]',
  progressTitle: 'text-[11px] font-bold text-p-fg-light uppercase tracking-[0.8px]',
  progressBadge: 'text-xs font-bold text-p-gold bg-[rgba(191,138,48,0.12)] px-2 py-0.5 rounded-[20px] inline-block',
  progressBarWrap: 'flex-1 h-2 bg-[rgba(127,127,127,0.12)] rounded overflow-hidden min-w-[60px]',
  progressBarFill: (pct) => ({ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg, #30d158, #7DCFA0)', borderRadius:4, transition:'width 0.6s ease-out' }),
  progressPct: 'text-[13px] font-bold text-p-green flex-[0_0_auto]',
  // Zone 2 — Chips navigation
  chipsRow: 'flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none',
  chip: (active, passed, locked) => ({
    display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:980,
    whiteSpace:'nowrap', flexShrink:0, cursor: locked ? 'not-allowed' : 'pointer',
    fontSize:12, fontWeight:600, transition:'all .2s',
    background: active ? 'var(--p-gold)' : passed ? 'rgba(48,209,88,0.1)' : locked ? 'rgba(127,127,127,0.06)' : 'var(--p-bg-card)',
    color: active ? '#fff' : passed ? 'var(--p-green)' : locked ? 'var(--p-fg-light)' : 'var(--p-fg-mid)',
    border: `1.5px solid ${active ? 'transparent' : passed ? 'rgba(48,209,88,0.3)' : 'var(--p-border)'}`,
    boxShadow: active ? '0 4px 14px rgba(191,138,48,0.35)' : 'none',
    opacity: locked ? 0.5 : 1,
  }),
  chipLabel: 'max-w-[110px] overflow-hidden text-ellipsis',
  // Zone 3 — Carte principale
  mainCard: 'bg-p-bg-card rounded-p border border-p-border overflow-hidden mb-4',
  heroContainer: 'relative h-[220px] overflow-hidden shrink-0',
  heroImg: 'w-full h-full object-cover block',
  heroOverlay: { position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' },
  heroTitleOnImg: { position:'absolute', bottom:20, left:20, right:20, fontSize:22, fontWeight:700, color:'#fff', textShadow:'0 2px 8px rgba(0,0,0,0.5)' },
  heroGradient: (idx) => { const c = NIVEAU_COLORS[idx % NIVEAU_COLORS.length]; return { background:`linear-gradient(160deg, ${c}1A 0%, ${c}08 100%)`, padding:'24px 20px 20px', borderBottom:'1px solid var(--p-border)', display:'flex', alignItems:'flex-start', gap:14 }; },
  heroGradientBadge: (idx) => { const c = NIVEAU_COLORS[idx % NIVEAU_COLORS.length]; return { width:48, height:48, borderRadius:14, background:`${c}1A`, border:`1px solid ${c}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }; },
  heroGradientTitle: 'font-p-display text-xl font-bold text-p-fg leading-[1.3]',
  heroGradientDesc: 'text-[13px] text-p-fg-mid mt-[5px] leading-[1.55]',
  contentBody: 'p-5',
  contentItem: 'bg-p-bg-card rounded-p-sm border border-p-border mb-3.5 overflow-hidden',
  contentItemHeader: 'flex items-center gap-2.5 px-4 py-3 border-b border-p-border',
  contentTypeBadge: (c) => ({ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background:`${c}18`, color:c, flexShrink:0 }),
  contentItemTitle: 'text-[13px] font-semibold text-p-fg',
  videoFrame: 'w-full aspect-video border-none block',
  textContent: 'px-4 py-3.5 text-sm text-p-fg leading-[1.7]',
  successBanner: 'flex items-center gap-2.5 bg-[rgba(48,209,88,0.08)] border border-[rgba(48,209,88,0.2)] rounded-p-sm px-4 py-[13px] mb-4 text-sm font-semibold text-p-green',
  qcmCTA: { display:'flex', alignItems:'center', justifyContent:'center', gap:10, width:'100%', padding:'16px', borderRadius:'var(--p-radius-sm)', border:'none', background:'var(--p-gold)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 18px rgba(191,138,48,0.3)', transition:'opacity .2s, transform .15s' },
  // Niveau verrouillé
  lockedCard: 'bg-p-bg-card rounded-p border border-p-border px-6 py-[60px] text-center mb-4',
  lockedIcon: 'text-[52px] mb-3.5',
  lockedTitle: 'font-p-display text-lg font-bold text-p-fg mb-2',
  lockedDesc: 'text-sm text-p-fg-mid leading-[1.6] max-w-[340px] mx-auto mb-6 mt-0',
  lockedPrevBtn: 'inline-flex items-center gap-1.5 px-[22px] py-2.5 rounded-full border border-p-border bg-transparent text-p-fg-mid text-[13px] font-semibold cursor-pointer',
  // Zone 4 — QCM carrousel
  qcmCard: 'bg-p-bg-card rounded-p border border-p-border px-6 py-7 mb-4',
  qcmDotsRow: 'flex gap-[5px] mb-2 flex-wrap',
  qcmDot: (answered, current) => ({ width: current ? 22 : 8, height:8, borderRadius:4, background: answered ? 'var(--p-gold)' : 'rgba(127,127,127,0.18)', transition:'all .3s ease', flexShrink:0 }),
  qcmCounter: 'text-xs text-p-fg-light mb-3.5',
  qcmQuestion: 'text-base font-bold text-p-fg mb-5 leading-[1.55]',
  answerBtn: (selected) => ({ display:'flex', alignItems:'center', gap:14, width:'100%', textAlign:'left', padding:'13px 16px', marginBottom:10, borderRadius:'var(--p-radius-sm)', cursor:'pointer', transition:'all .15s', border:`1.5px solid ${selected ? 'var(--p-gold)' : 'var(--p-border)'}`, background: selected ? 'rgba(191,138,48,0.07)' : 'transparent', color:'var(--p-fg)', fontSize:14, fontWeight: selected ? 600 : 400 }),
  answerLetter: (selected) => ({ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, background: selected ? 'var(--p-gold)' : 'rgba(127,127,127,0.1)', color: selected ? '#fff' : 'var(--p-fg-mid)', transition:'all .15s' }),
  qcmNavRow: 'flex justify-between items-center gap-3 mt-5',
  qcmNavBtn: (primary, disabled) => ({ padding:'10px 22px', borderRadius:980, border: primary ? 'none' : '1px solid var(--p-border)', background: primary ? 'var(--p-gold)' : 'transparent', color: primary ? '#fff' : 'var(--p-fg-mid)', fontSize:13, fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, transition:'opacity .2s' }),
  qcmBackLink: 'block text-center mt-4 text-[13px] text-p-fg-light cursor-pointer bg-none border-none w-full',
  // Résultat
  resultCard: (passed) => ({ textAlign:'center', padding:'40px 24px', background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:`1px solid ${passed ? 'rgba(48,209,88,0.22)' : 'rgba(255,69,58,0.18)'}`, marginBottom:16 }),
  resultEmoji: 'text-[56px] mb-3.5',
  resultTitle: (passed) => ({ fontFamily:'var(--p-font-display)', fontSize:24, fontWeight:800, color: passed ? 'var(--p-green)' : 'var(--p-red)', marginBottom:8 }),
  resultScore: 'text-base text-p-fg-mid mb-6',
  resultBtns: 'flex flex-wrap gap-2.5 justify-center',
  resultBtn: (primary) => ({ padding:'11px 24px', borderRadius:980, border: primary ? 'none' : '1px solid var(--p-border)', background: primary ? 'var(--p-gold)' : 'transparent', color: primary ? '#fff' : 'var(--p-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer' }),
};

// ─── Vue niveaux + contenu + QCM — Focus Mode ────────────────────────────────
function NiveauxView({ fetchId, byThematique, byLecon, stepperTitle, onBack }) {
  const [niveaux, setNiveaux]               = useState([]);
  const [progression, setProgressionState]  = useState([]);
  const [selNiveau, setSelNiveau]           = useState(null);
  const [contenus, setContenus]             = useState([]);
  const [questions, setQuestions]           = useState([]);
  const [showQCM, setShowQCM]               = useState(false);
  const [qcmPage, setQcmPage]               = useState(0);
  const [answers, setAnswers]               = useState({});
  const [showResult, setShowResult]         = useState(false);
  const [score, setScore]                   = useState(0);
  const [loading, setLoading]               = useState(true);
  const [niveauxWithQCM, setNiveauxWithQCM] = useState(new Set());
  const [submitting, setSubmitting]         = useState(false); // garde anti double-soumission
  const [submitError, setSubmitError]       = useState('');
  const eleveId = getEleveId();

  const loadData = useCallback(async () => {
    try {
      const [nivs, prog] = await Promise.all([
        byLecon
          ? fetchNiveauxByLeconEleve(fetchId)
          : byThematique
            ? fetchNiveauxByThematiqueEleve(fetchId)
            : fetchAllNiveauxForModuleEleve(fetchId),
        fetchProgression(eleveId),
      ]);
      const withQCM = await fetchQCMExistenceForNiveaux(nivs.map(n => n.id));
      setNiveaux(nivs);
      setProgressionState(prog);
      setNiveauxWithQCM(withQCM);
      // isUnlockedLocal utilise les variables locales (pas le state) — pas de race condition
      const isUnlockedLocal = (index) => {
        if (index === 0) return true;
        const prevId = nivs[index - 1].id;
        if (!withQCM.has(prevId)) return false; // sans QCM = ne peut jamais être validé → bloqué
        return prog.some(p => p.niveau_id === prevId && p.reussi === true);
      };
      // Sélection automatique : 1er niveau débloqué et non encore réussi
      const firstTarget = nivs.find((n, i) =>
        isUnlockedLocal(i) && !prog.some(p => p.niveau_id === n.id && p.reussi === true)
      );
      setSelNiveau(firstTarget || nivs[0] || null);
    } catch(e) {}
    setLoading(false);
  }, [fetchId, byThematique, byLecon, eleveId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Changement de niveau : réinitialisation IMMÉDIATE de tout l'état QCM
  // puis chargement async du contenu et des questions
  useEffect(() => {
    if (!selNiveau) return;
    // Réinitialisation synchrone — évite tout état stale inter-niveaux
    setShowQCM(false);
    setShowResult(false);
    setAnswers({});
    setQcmPage(0);
    setSubmitting(false);
    setSubmitError('');
    setContenus([]);    // vide immédiatement pour éviter l'affichage du contenu précédent
    setQuestions([]);   // vide immédiatement — CRITIQUE : empêche le QCM stale d'apparaître
    // Chargement du nouveau contenu
    let active = true;
    (async () => {
      try {
        const [c, q] = await Promise.all([fetchContenusEleve(selNiveau.id), fetchQCMEleve(selNiveau.id)]);
        if (active) { setContenus(c); setQuestions(q); }
      } catch(e) {}
    })();
    return () => { active = false; };
  }, [selNiveau]);

  // Un niveau est débloqué ssi :
  // — c'est le premier (index 0), OU
  // — le niveau précédent a un QCM ET ce QCM a été réussi (reussi === true)
  // Un niveau SANS QCM ne peut jamais débloquer le suivant.
  const isUnlocked = (niv, index) => {
    if (index === 0) return true;
    const prevId = niveaux[index - 1].id;
    if (!niveauxWithQCM.has(prevId)) return false; // sans QCM → jamais passable → bloqué
    return progression.some(p => p.niveau_id === prevId && p.reussi === true);
  };

  // Un niveau est "réussi" ssi :
  // — il appartient à niveauxWithQCM (a un QCM actuellement en base), ET
  // — il existe un enregistrement progression avec reussi === true
  // Cette double condition filtre les données stales issues d'anciennes versions du code.
  const isPassed = (nivId) =>
    niveauxWithQCM.has(nivId) &&
    progression.some(p => p.niveau_id === nivId && p.reussi === true);

  const getProgForNiveau = (nivId) => progression.find(p => p.niveau_id === nivId);

  const handleSubmitQCM = async () => {
    // ── Guards stricts — aucune soumission automatique possible ──────────────
    if (submitting) return;                              // anti double-clic
    if (!selNiveau) return;                              // pas de niveau sélectionné
    if (questions.length === 0) return;                  // QCM pas encore chargé
    if (isPassed(selNiveau.id)) return;                  // déjà réussi → pas de double-save
    const currentIdx = niveaux.indexOf(selNiveau);
    if (!isUnlocked(selNiveau, currentIdx)) return;      // niveau verrouillé
    // Vérification côté JS que toutes les questions ont une réponse sélectionnée
    const allAnswered = questions.every((_, qi) => (answers[qi] || []).length > 0);
    if (!allAnswered) return;                            // réponses manquantes
    // ── Calcul du score ───────────────────────────────────────────────────────
    const correct = questions.filter((q, i) => {
      const choixCount = (q.choix || []).length;
      const correctSet = (Array.isArray(q.reponse_correcte) ? q.reponse_correcte : (q.reponse_correcte != null ? [q.reponse_correcte] : []))
        .filter(v => v >= 0 && v < choixCount); // ignore les indices hors limites (données corrompues)
      const selected = answers[i] || [];
      if (correctSet.length === 0 || selected.length === 0) return false;
      return correctSet.length === selected.length && correctSet.every(v => selected.includes(v));
    }).length;
    const pct = Math.round((correct / questions.length) * 100);
    const passed = pct >= (selNiveau.score_requis || 80);
    // ── Sauvegarde ────────────────────────────────────────────────────────────
    setSubmitting(true);
    setSubmitError('');
    setScore(pct);
    try {
      await saveProgression(eleveId, selNiveau.id, pct, passed);
      setProgressionState(await fetchProgression(eleveId));
      setShowResult(true); // affiché seulement si la sauvegarde réussit
    } catch(e) {
      setSubmitError('Erreur de connexion. Ta progression n\'a pas été enregistrée. Réessaie dans quelques instants.');
    } finally {
      setSubmitting(false);
    }
  };

  // Navigation vers le niveau suivant — vérifie le verrou avant de naviguer
  const handleNextLevel = () => {
    const idx = niveaux.findIndex(n => n.id === selNiveau.id);
    if (idx < niveaux.length - 1) {
      const next = niveaux[idx + 1];
      // isUnlocked se met à jour avec la progression fraîchement chargée
      // après handleSubmitQCM → le niveau suivant est déverrouillé si le QCM vient d'être réussi
      if (isUnlocked(next, idx + 1)) {
        setSelNiveau(next);
      }
    }
  };

  if (loading) return <div className={NS.empty}>Chargement...</div>;

  const nivsAvecQCM = niveaux.filter(n => niveauxWithQCM.has(n.id));
  const passedCount = nivsAvecQCM.filter(n => isPassed(n.id)).length;
  const totalPct    = nivsAvecQCM.length > 0 ? Math.round((passedCount / nivsAvecQCM.length) * 100) : 0;
  const selIdx      = selNiveau ? niveaux.indexOf(selNiveau) : -1;
  const isLocked    = selNiveau && selIdx >= 0 && !isUnlocked(selNiveau, selIdx);

  return (
    <div>
      <ModuleBgLetters />
      <button className={NS.backBtn} onClick={onBack}><IconBack /> Retour</button>

      {/* Zone 1 — Barre de progression globale (masquee si aucun niveau n'a de QCM) */}
      {nivsAvecQCM.length > 0 && (
        <div className={NS.progressHeader}>
          <div className={NS.progressLeft}>
            <span className={NS.progressTitle}>{stepperTitle || 'Mon cours'}</span>
            <span className={NS.progressBadge}>{passedCount} / {nivsAvecQCM.length} niveau{nivsAvecQCM.length > 1 ? 'x' : ''}</span>
          </div>
          <div className={NS.progressBarWrap}>
            <div style={NS.progressBarFill(totalPct)} />
          </div>
          <span className={NS.progressPct}>{totalPct}%</span>
        </div>
      )}

      {/* Zone 2 — Navigation horizontale par chips */}
      <div className={NS.chipsRow}>
        {niveaux.map((n, i) => {
          const unlocked = isUnlocked(n, i);
          const passed   = niveauxWithQCM.has(n.id) && isPassed(n.id);
          const active   = selNiveau?.id === n.id;
          return (
            <button key={n.id} style={NS.chip(active, passed, !unlocked)}
              onClick={() => { if (unlocked) setSelNiveau(n); }}
              disabled={!unlocked}>
              {passed ? '✓' : !unlocked ? '🔒' : n.ordre}{' '}
              <span className={NS.chipLabel}>{n.titre}</span>
            </button>
          );
        })}
      </div>

      {/* Zone 3 & 4 — Contenu principal */}
      {isLocked ? (
        <div className={NS.lockedCard}>
          <div className={NS.lockedIcon}>🔒</div>
          <div className={NS.lockedTitle}>Ce niveau est verrouillé</div>
          <p className={NS.lockedDesc}>Réussis le niveau précédent pour débloquer ce contenu.</p>
          <button className={NS.lockedPrevBtn} onClick={() => { if (selIdx > 0) setSelNiveau(niveaux[selIdx - 1]); }}>
            ← Niveau précédent
          </button>
        </div>

      ) : showResult ? (
        <div style={NS.resultCard(score >= (selNiveau.score_requis || 80))}>
          <div className={NS.resultEmoji}>{score >= (selNiveau.score_requis || 80) ? '🎉' : '😔'}</div>
          <div style={NS.resultTitle(score >= (selNiveau.score_requis || 80))}>
            {score >= (selNiveau.score_requis || 80) ? 'Félicitations !' : 'Pas encore...'}
          </div>
          <div className={NS.resultScore}>
            Tu as obtenu <strong>{score}%</strong> (requis : {selNiveau.score_requis || 80}%)
          </div>
          <div className={NS.resultBtns}>
            {score >= (selNiveau.score_requis || 80) ? (
              selIdx < niveaux.length - 1 ? (
                <button style={NS.resultBtn(true)} onClick={handleNextLevel}>Niveau suivant →</button>
              ) : (
                <button style={NS.resultBtn(true)} onClick={onBack}>Terminé ! ✓</button>
              )
            ) : (
              <>
                <button style={NS.resultBtn(false)} onClick={() => { setShowQCM(false); setShowResult(false); }}>Revoir le cours</button>
                <button style={NS.resultBtn(true)} onClick={() => { setShowQCM(true); setShowResult(false); setAnswers({}); setQcmPage(0); }}>Réessayer</button>
              </>
            )}
          </div>
        </div>

      ) : showQCM && questions.length > 0 ? (
        <div className={NS.qcmCard}>
          {/* Dots de progression */}
          <div className={NS.qcmDotsRow}>
            {questions.map((_, i) => (
              <span key={i} style={NS.qcmDot((answers[i] || []).length > 0, i === qcmPage)} />
            ))}
          </div>
          <div className={NS.qcmCounter}>
            <span className="font-normal">Question</span>{' '}
            <strong>{qcmPage + 1}</strong>
            <span className="text-p-fg-light"> / {questions.length}</span>
          </div>
          {(questions[qcmPage]?.reponse_correcte || []).length > 1 && (
            <div className="text-xs text-p-gold font-semibold mb-2.5 flex items-center gap-[5px]">
              <span>☑</span> Plusieurs réponses correctes possibles
            </div>
          )}
          <div className={NS.qcmQuestion}>{questions[qcmPage]?.question}</div>
          {(questions[qcmPage]?.choix || []).map((ch, ci) => {
            if (!ch?.trim()) return null; // ignore les choix vides (données incomplètes)
            const selected = (answers[qcmPage] || []).includes(ci);
            return (
              <button key={ci} style={NS.answerBtn(selected)}
                onClick={() => {
                  const prev = answers[qcmPage] || [];
                  setAnswers({ ...answers, [qcmPage]: selected ? prev.filter(v => v !== ci) : [...prev, ci] });
                }}>
                <span style={NS.answerLetter(selected)}>{String.fromCharCode(65 + ci)}</span>
                {ch}
              </button>
            );
          })}
          {submitError && (
            <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.25)] text-p-red text-[13px]">
              {submitError}
            </div>
          )}
          <div className={NS.qcmNavRow}>
            <button style={NS.qcmNavBtn(false, qcmPage === 0)}
              onClick={() => setQcmPage(p => p - 1)} disabled={qcmPage === 0}>
              ← Précédente
            </button>
            {qcmPage < questions.length - 1 ? (
              <button style={NS.qcmNavBtn(true, !(answers[qcmPage] || []).length)}
                onClick={() => setQcmPage(p => p + 1)}
                disabled={!(answers[qcmPage] || []).length}>
                Suivante →
              </button>
            ) : (
              <button style={NS.qcmNavBtn(true, questions.some((_, qi) => !(answers[qi] || []).length))}
                disabled={questions.some((_, qi) => !(answers[qi] || []).length)}
                onClick={handleSubmitQCM}>
                ✅ Valider
              </button>
            )}
          </div>
          <button className={NS.qcmBackLink} onClick={() => { setShowQCM(false); setQcmPage(0); }}>
            ← Retour au cours
          </button>
        </div>

      ) : selNiveau ? (
        <div className={NS.mainCard}>
          {/* Hero — image ou dégradé coloré */}
          {selNiveau.image_url ? (
            <div className={NS.heroContainer}>
              <img src={selNiveau.image_url} alt={selNiveau.titre} className={NS.heroImg} />
              <div style={NS.heroOverlay} />
              <div style={NS.heroTitleOnImg}>{selNiveau.titre}</div>
            </div>
          ) : (
            <div style={NS.heroGradient(selIdx >= 0 ? selIdx : 0)}>
              <div style={NS.heroGradientBadge(selIdx >= 0 ? selIdx : 0)}>📖</div>
              <div>
                <div className={NS.heroGradientTitle}>{selNiveau.titre}</div>
                {selNiveau.description && <div className={NS.heroGradientDesc}>{selNiveau.description}</div>}
              </div>
            </div>
          )}
          {/* Description si image de couverture */}
          {selNiveau.image_url && selNiveau.description && (
            <p className="pt-3.5 px-5 pb-0 m-0 text-sm text-p-fg-mid leading-[1.6]">
              {selNiveau.description}
            </p>
          )}

          {/* Liste des contenus */}
          <div className={NS.contentBody}>
            {contenus.length === 0 && (
              <div className="text-center py-8 px-0 text-p-fg-mid text-sm">
                Aucun contenu disponible pour ce niveau.
              </div>
            )}
            {contenus.map(c => (
              <div key={c.id} className={NS.contentItem}>
                {c.type !== 'pdf' && (
                  <div className={NS.contentItemHeader}>
                    <span style={NS.contentTypeBadge(TYPE_COLORS[c.type] || '#aaa')}>{TYPE_LABELS[c.type] || c.type}</span>
                    <span className={NS.contentItemTitle}>{c.titre}</span>
                  </div>
                )}
                {c.type === 'video' && getYouTubeId(c.contenu) && (
                  <iframe className={NS.videoFrame}
                    src={`https://www.youtube.com/embed/${getYouTubeId(c.contenu)}`}
                    title={c.titre} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                )}
                {c.type === 'pdf' && (
                  <div className="px-3.5 py-3">
                    <a href={c.contenu} target="_blank" rel="noreferrer" className="flex items-center justify-between px-[18px] py-3.5 rounded-p-sm bg-[rgba(10,132,255,0.06)] border border-[rgba(10,132,255,0.18)] no-underline gap-3">
                      <div className="flex items-center gap-3.5">
                        <span className="text-[30px] shrink-0">📄</span>
                        <div>
                          <div className="text-sm font-semibold text-p-fg">{c.titre}</div>
                          <div className="text-xs text-p-fg-mid mt-0.5">Appuyer pour ouvrir le document</div>
                        </div>
                      </div>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--p-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                )}
                {c.type === 'texte' && (
                  <div className={`portail-rich-text ${NS.textContent}`}
                    {...(c.contenu?.startsWith('<')
                      ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(c.contenu) } }
                      : { children: c.contenu }
                    )} />
                )}
                {(c.type === 'word' || c.type === 'ppt') && (
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(c.contenu)}`}
                    style={{ width:'100%', border:'none', ...(c.type === 'ppt' ? { aspectRatio:'16/9' } : { height:'600px' }) }}
                    title={c.titre} allowFullScreen />
                )}
              </div>
            ))}

            {/* Bandeau succès */}
            {niveauxWithQCM.has(selNiveau.id) && isPassed(selNiveau.id) && (
              <div className={NS.successBanner}>
                ✅ Tu as déjà réussi ce niveau ! Score : {getProgForNiveau(selNiveau.id)?.score}%
              </div>
            )}

            {/* Bouton QCM */}
            {questions.length > 0 && !isPassed(selNiveau.id) && (
              <button style={NS.qcmCTA} onClick={() => { setShowQCM(true); setAnswers({}); setQcmPage(0); }}>
                🎯 Je m'auto-évalue · {questions.length} question{questions.length > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
