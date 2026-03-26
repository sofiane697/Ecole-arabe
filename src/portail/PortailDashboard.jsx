import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchModulesEleve, fetchNiveauxEleve, fetchProgression } from './supabasePortail';

const S = {
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:20 },
  card: { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', overflow:'hidden', cursor:'pointer', transition:'transform .2s var(--p-ease-out), box-shadow .2s' },
  cardImg: { width:'100%', height:140, objectFit:'cover', background:'linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)', display:'flex', alignItems:'center', justifyContent:'center' },
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
  welcomeTitle: { fontSize:22, fontWeight:700, color:'var(--p-fg)', marginBottom:4 },
  welcomeSub: { fontSize:14, color:'var(--p-fg-mid)' },
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
  try { prenom = JSON.parse(sessionStorage.getItem('eleve_user'))?.prenom || ''; } catch {}

  return (
    <div>
      <div style={S.welcome}>
        <div style={S.welcomeTitle}>Bienvenue{prenom ? `, ${prenom}` : ''} 👋</div>
        <div style={S.welcomeSub}>Continuez votre apprentissage en sélectionnant un module ci-dessous.</div>
      </div>

      {modules.length === 0 ? (
        <div style={S.empty}>
          <div style={{ fontSize:48, marginBottom:16 }}>📚</div>
          <div style={S.emptyTitle}>Aucun cours disponible</div>
          <p style={{ color:'var(--p-fg-mid)', fontSize:14 }}>Les cours seront bientôt disponibles. Revenez plus tard !</p>
        </div>
      ) : (
        <div style={S.grid}>
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
                  <div style={S.cardImg}>
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
