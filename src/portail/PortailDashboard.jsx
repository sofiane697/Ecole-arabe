import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchModulesEleve, fetchNiveauxEleve, fetchProgression } from './supabasePortail';

// Variable module-level : reset au refresh de page, persiste lors de la navigation React Router
let _salamHasAnimated = false;

const S = {
  grid: (n) => ({
    display: 'grid',
    gridTemplateColumns: n === 1 ? '1fr' : n === 2 ? '1fr 1fr' : n === 3 ? '1fr 1fr 1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  }),
  card: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', overflow:'hidden', cursor:'pointer', transition:'transform .2s var(--p-ease-out), box-shadow .2s' },
  cardImg: { width:'100%', height:140, objectFit:'cover', display:'block' },
  cardImgContainer: { width:'100%', height:140, background:'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)', display:'flex', alignItems:'center', justifyContent:'center' },
  cardImgPlaceholder: { fontSize:40, opacity:.3 },
  cardBody: { padding:20 },
  cardTitle: { fontSize:17, fontWeight:700, color:'var(--p-fg)', margin:'0 0 6px' },
  cardDesc: { fontSize:13, color:'var(--p-fg-mid)', margin:'0 0 16px', lineHeight:1.5 },
  progressBar: { height:6, borderRadius:3, background:'var(--p-border)', overflow:'hidden' },
  progressFill: (pct) => ({ height:'100%', borderRadius:3, background: pct >= 100 ? 'var(--p-green)' : 'var(--p-gold)', width:`${pct}%`, transition:'width .6s var(--p-ease-out)' }),
  progressText: { display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:'var(--p-fg-mid)' },
  btn: { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'none', background:'var(--p-gold)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16, transition:'opacity .2s' },
  btnCompleted: { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:980, border:'1px solid var(--p-green)', background:'transparent', color:'var(--p-green)', fontSize:13, fontWeight:600, cursor:'pointer', marginTop:16 },
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
  50%      { text-shadow: 0 0 20px rgba(191,138,48,.5); }
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
          color: 'var(--p-gold)',
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let eleveId;
        try { eleveId = JSON.parse(sessionStorage.getItem('eleve_user'))?.id; } catch {}
        const [mods, prog] = await Promise.all([fetchModulesEleve(), fetchProgression(eleveId)]);
        setModules(mods);
        setProgression(prog);
        // Charger niveaux pour chaque module
        const nivMap = {};
        await Promise.all(mods.map(async (m) => {
          try { nivMap[m.id] = await fetchNiveauxEleve(m.id); } catch { nivMap[m.id] = []; }
        }));
        setNiveauxMap(nivMap);
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
          {modules.map(m => {
            const nivs = niveauxMap[m.id] || [];
            const total = nivs.length;
            const reussis = nivs.filter(n => progression.some(p => p.niveau_id === n.id && p.reussi)).length;
            const pct = total > 0 ? Math.round((reussis / total) * 100) : 0;
            const completed = pct >= 100;

            return (
              <div key={m.id} style={S.card}
                onClick={() => navigate(`/portail/module/${m.id}`)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                {m.image_url ? (
                  <img src={m.image_url} alt={m.titre} style={S.cardImg} />
                ) : (
                  <div style={S.cardImgContainer}>
                    <span style={S.cardImgPlaceholder}>📖</span>
                  </div>
                )}
                <div style={S.cardBody}>
                  <h3 style={S.cardTitle}>{m.titre}</h3>
                  {m.description && <p style={S.cardDesc}>{m.description}</p>}
                  {total > 0 && (
                    <>
                      <div style={S.progressBar}><div style={S.progressFill(pct)} /></div>
                      <div style={S.progressText}>
                        <span>{reussis} / {total} niveaux</span>
                        <span style={{ fontWeight:600, color: completed ? 'var(--p-green)' : 'var(--p-gold)' }}>{pct}%</span>
                      </div>
                    </>
                  )}
                  <button style={completed ? S.btnCompleted : S.btn}>
                    {completed ? '✓ Terminé' : reussis > 0 ? 'Continuer' : 'Commencer'}
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
