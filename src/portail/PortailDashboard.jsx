import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchModulesEleve, fetchNiveauxEleve, fetchProgression, fetchQCMExistenceForNiveaux, fetchEleveNiveauScolaireId } from './supabasePortail';

// Variable module-level : reset au refresh de page, persiste lors de la navigation React Router
let _salamHasAnimated = false;

const FUN_KEYFRAMES = `
@keyframes funTitleIn {
  0%   { opacity:0; transform:translateY(-18px) scale(0.92); }
  60%  { transform:translateY(4px) scale(1.02); }
  80%  { transform:translateY(-2px) scale(0.99); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
@keyframes starSpin {
  0%   { transform:rotate(0deg) scale(1); }
  50%  { transform:rotate(180deg) scale(1.3); }
  100% { transform:rotate(360deg) scale(1); }
}
@keyframes bubbleFloat {
  0%,100% { transform:translateY(0); opacity:.7; }
  50%      { transform:translateY(-5px); opacity:1; }
}
`;

const LETTER_COLORS = ['#7EC8E3', '#7DCFA0', '#F4A896', '#F7D070'];

function FunTitle() {
  const word1 = 'Mes';
  const word2 = 'Modules';
  return (
    <>
      <style>{FUN_KEYFRAMES}</style>
      <div style={{
        fontFamily:"'Nunito', 'Inter', sans-serif",
        marginBottom: 24,
        animation: 'funTitleIn 0.75s cubic-bezier(0.22,1,0.36,1) both',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span style={{ fontSize:20, animation:'bubbleFloat 2.5s ease-in-out infinite' }}>📚</span>
          {/* "Mes" lettre par lettre en couleurs rotatives */}
          <span style={{ fontSize:40, fontWeight:900, letterSpacing:2, display:'inline-flex', gap:0 }}>
            {word1.split('').map((char, i) => (
              <span key={i} style={{
                color: LETTER_COLORS[i % LETTER_COLORS.length],
                textShadow:`0 3px 10px ${LETTER_COLORS[i % LETTER_COLORS.length]}55`,
                display:'inline-block',
              }}>{char}</span>
            ))}
          </span>
          {/* "Modules" lettre par lettre en couleurs rotatives */}
          <span style={{ fontSize:40, fontWeight:900, letterSpacing:2, display:'inline-flex', gap:0 }}>
            {word2.split('').map((char, i) => (
              <span key={i} style={{
                color: LETTER_COLORS[i % LETTER_COLORS.length],
                textShadow:`0 3px 10px ${LETTER_COLORS[i % LETTER_COLORS.length]}55`,
                display:'inline-block',
              }}>{char}</span>
            ))}
          </span>
          <span style={{ fontSize:18, animation:'starSpin 5s linear infinite', display:'inline-block' }}>⭐</span>
          <span style={{ fontSize:16, animation:'bubbleFloat 3s ease-in-out 0.8s infinite', display:'inline-block' }}>✨</span>
        </div>
        {/* Bulles décoratives */}
        <div style={{ display:'flex', gap:5, alignItems:'center', marginTop:6, paddingLeft:4 }}>
          {['#7EC8E3','#7DCFA0','#F4A896','#F7D070','#7EC8E3','#F4A896'].map((c, i) => (
            <span key={i} style={{
              color: c, fontSize: [8,11,7,10,9,8][i],
              animation:`bubbleFloat ${2+i*0.3}s ease-in-out ${i*0.2}s infinite`,
              display:'inline-block',
            }}>●</span>
          ))}
        </div>
      </div>
    </>
  );
}

const CARD_PASTELS = [
  { bg:'#DAEEFF', btnGrad:'linear-gradient(135deg,#7EC8E3,#5BA8D4)', btnShadow:'rgba(91,168,212,0.3)' },
  { bg:'#D5F5E3', btnGrad:'linear-gradient(135deg,#7DCFA0,#5BA87A)', btnShadow:'rgba(91,168,122,0.3)' },
  { bg:'#FADBD8', btnGrad:'linear-gradient(135deg,#F4A896,#E8806D)', btnShadow:'rgba(232,128,109,0.3)' },
  { bg:'#FEF9E7', btnGrad:'linear-gradient(135deg,#F7D070,#F0B429)', btnShadow:'rgba(240,180,41,0.3)' },
];

const S = {
  grid: (n) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${Math.min(n, 4)}, 1fr)`,
    gap: 20,
  }),
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
  empty: { textAlign:'center', padding:'60px 20px', color:'var(--p-fg-mid)' },
  emptyTitle: { fontSize:20, fontWeight:600, color:'var(--p-fg)', marginBottom:8 },
  loading: { textAlign:'center', padding:'60px', color:'var(--p-fg-mid)', fontSize:14 },
  welcome: { marginBottom:28 },
  welcomeSub: { fontSize:14, color:'var(--p-fg-mid)', marginTop:6 },
};

const GREETING_KEYFRAMES = `
@keyframes salamSpreadArabic {
  0%   { opacity:0; transform: translateX(60px); filter: blur(6px); }
  40%  { opacity:1; filter: blur(0); }
  100% { opacity:1; transform: translateX(0); }
}
@keyframes salamSpreadName {
  0%   { opacity:0; transform: translateX(-60px); filter: blur(6px); }
  40%  { opacity:1; filter: blur(0); }
  100% { opacity:1; transform: translateX(0); }
}
@keyframes salamGlow {
  0%,100% { text-shadow: 0 0 0px transparent; }
  50%      { text-shadow: 0 0 20px rgba(91,168,122,.5); }
}
`;

function SalamGreeting({ prenom }) {
  // useState lazy init : lu une seule fois au montage du composant
  // _salamHasAnimated persiste pendant la navigation React Router mais reset au refresh
  const [shouldAnimate] = useState(() => {
    if (_salamHasAnimated) return false;
    _salamHasAnimated = true;
    return true;
  });

  return (
    <>
      <style>{GREETING_KEYFRAMES}</style>
      <div style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap', overflow:'hidden' }}>
        {prenom && (
          <span style={{
            fontSize: 22, fontWeight: 700, color: 'var(--p-fg)',
            display: 'inline-block',
            animation: shouldAnimate
              ? 'salamSpreadName .75s cubic-bezier(0.22,1,0.36,1) .1s both'
              : 'none',
          }}>
            {prenom}
          </span>
        )}
        <span style={{
          fontFamily: "'Scheherazade New', serif",
          fontSize: 36, fontWeight: 700,
          color: '#5BA87A',
          lineHeight: 1.3, direction: 'rtl',
          display: 'inline-block',
          animation: shouldAnimate
            ? 'salamSpreadArabic .75s cubic-bezier(0.22,1,0.36,1) .1s both, salamGlow 3s ease-in-out 1s infinite'
            : 'salamGlow 3s ease-in-out infinite',
        }}>
          السلام عليكم
        </span>
        <span style={{
          fontSize: 28, display: 'inline-block',
          animation: shouldAnimate ? 'salamSpreadArabic .75s cubic-bezier(0.22,1,0.36,1) .25s both' : 'none',
        }}>👋</span>
      </div>
    </>
  );
};

export default function PortailDashboard() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [niveauxMap, setNiveauxMap] = useState({});
  const [progression, setProgression] = useState([]);
  const [qcmNiveauxIds, setQcmNiveauxIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let eleveId, niveauScolaireId;
        try {
          const user = JSON.parse(sessionStorage.getItem('eleve_user'));
          eleveId = user?.id;
          niveauScolaireId = user?.niveau_scolaire_id ?? null;
        } catch {}
        // Rafraîchir niveau_scolaire_id depuis la DB au cas où il a changé
        if (eleveId) {
          const freshId = await fetchEleveNiveauScolaireId(eleveId).catch(() => niveauScolaireId);
          if (freshId !== niveauScolaireId) {
            niveauScolaireId = freshId;
            try {
              const user = JSON.parse(sessionStorage.getItem('eleve_user'));
              if (user) { user.niveau_scolaire_id = freshId; sessionStorage.setItem('eleve_user', JSON.stringify(user)); }
            } catch {}
          }
        }
        const [allMods, prog] = await Promise.all([fetchModulesEleve(), fetchProgression(eleveId)]);
        // Filtrage client : garder les modules dont niveaux_scolaires_ids contient le niveau de l'élève
        // Si niveaux_scolaires_ids est vide ou absent → visible par tous
        const mods = allMods.filter(m => {
          if (!Array.isArray(m.niveaux_scolaires_ids) || m.niveaux_scolaires_ids.length === 0) return false;
          if (!niveauScolaireId) return false;
          return m.niveaux_scolaires_ids.includes(niveauScolaireId);
        });
        setModules(mods);
        setProgression(prog);
        // Charger niveaux pour chaque module
        const nivMap = {};
        await Promise.all(mods.map(async (m) => {
          try { nivMap[m.id] = await fetchNiveauxEleve(m.id); } catch { nivMap[m.id] = []; }
        }));
        setNiveauxMap(nivMap);
        const allNivIds = Object.values(nivMap).flat().map(n => n.id);
        if (allNivIds.length > 0) {
          const qcmIds = await fetchQCMExistenceForNiveaux(allNivIds);
          setQcmNiveauxIds(qcmIds);
        }
      } catch(e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={S.loading}>Chargement de vos cours...</div>;

  // Récupérer le prénom
  let prenom = '';
  try { prenom = (JSON.parse(sessionStorage.getItem('eleve_user'))?.prenom || '').trim().toUpperCase(); } catch {}

  return (
    <div>
      <div style={S.welcome}>
        <SalamGreeting prenom={prenom} />
        <div style={S.welcomeSub}>Démarre ton apprentissage en sélectionnant un module !</div>
      </div>

      {modules.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <div style={S.emptyTitle}>Aucun cours disponible</div>
          <p style={{ color:'var(--p-fg-mid)', fontSize:14 }}>Les cours seront bientôt disponibles. Revenez plus tard !</p>
        </div>
      ) : (
        <div style={S.grid(modules.length)}>
          {modules.map((m, index) => {
            const palette = CARD_PASTELS[index % CARD_PASTELS.length];
            const nivs = niveauxMap[m.id] || [];
            const nivsAvecQCM = nivs.filter(n => qcmNiveauxIds.has(n.id));
            const reussis = nivsAvecQCM.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
            const completed = nivsAvecQCM.length > 0 && reussis === nivsAvecQCM.length;
            const started = reussis > 0;

            return (
              <div key={m.id}
                style={S.card(palette)}
                onClick={() => navigate(`/portail/module/${m.id}`)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 12px 40px ${palette.btnShadow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.titre} style={S.cardImg} />
                ) : (
                  <div style={S.cardImgContainer(palette.bg)}>
                    <span style={S.cardImgPlaceholder}>📖</span>
                  </div>
                )}
                <div style={S.cardBody}>
                  <h3 style={S.cardTitle}>{m.titre}</h3>
                  {m.description && <p style={S.cardDesc}>{m.description}</p>}
                  <button style={completed ? S.btnCompleted(palette) : S.btn(palette)}>
                    {completed ? '✓ Terminé' : started ? 'Continuer' : 'Commencer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
