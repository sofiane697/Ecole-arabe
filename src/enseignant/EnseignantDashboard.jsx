import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEnseignantUser, fetchMesClasses, fetchElevesDeClasse } from './supabaseEnseignant';

const S = {
  page: { minHeight:'100%' },
  welcome: { marginBottom:32 },
  welcomeName: { fontSize:26, fontWeight:800, color:'var(--a-gold)', letterSpacing:'-0.5px' },
  welcomeSub: { fontSize:14, color:'var(--a-fg-mid)', marginTop:4 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:16 },
  card: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', padding:'28px 24px 20px', cursor:'pointer', transition:'transform .2s, box-shadow .2s, border-color .2s', display:'flex', flexDirection:'column', gap:12 },
  className: { fontSize:36, fontWeight:900, color:'var(--a-gold)', letterSpacing:'-1.5px', lineHeight:1 },
  classeNb: { fontSize:14, color:'var(--a-fg-mid)', display:'flex', alignItems:'center', gap:6 },
  btn: { marginTop:8, display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', borderRadius:980, border:'none', background:'var(--a-gold)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 2px 10px rgba(191,138,48,.25)', alignSelf:'flex-start' },
  empty: { textAlign:'center', padding:'80px 20px', color:'var(--a-fg-mid)' },
  emptyIcon: { fontSize:48, marginBottom:16, opacity:.4 },
  emptyTitle: { fontSize:18, fontWeight:600, color:'var(--a-fg)', marginBottom:8 },
  loading: { textAlign:'center', padding:60, color:'var(--a-fg-mid)', fontSize:14 },
};

export default function EnseignantDashboard() {
  const navigate  = useNavigate();
  const user      = getEnseignantUser();
  const [classes, setClasses]   = useState([]);
  const [nbEleves, setNbEleves] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const cls = await fetchMesClasses(user.id);
        setClasses(cls);
        const map = {};
        await Promise.all(cls.map(async c => {
          try {
            const eleves = await fetchElevesDeClasse(c.id);
            map[c.id] = eleves.length;
          } catch { map[c.id] = 0; }
        }));
        setNbEleves(map);
      } catch(e) {}
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) return <div style={S.loading}>Chargement de vos classes...</div>;

  const prenom = user?.prenom || '';

  return (
    <div style={S.page}>
      <div style={S.welcome}>
        <div style={S.welcomeName}>Bonjour, {prenom} 👋</div>
        <div style={S.welcomeSub}>
          {classes.length > 0
            ? `Vous avez ${classes.length} classe${classes.length > 1 ? 's' : ''} assignée${classes.length > 1 ? 's' : ''}.`
            : 'Aucune classe assignée pour le moment.'}
        </div>
      </div>

      {classes.length === 0 ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>🏫</div>
          <div style={S.emptyTitle}>Aucune classe assignée</div>
          <p style={{ fontSize:14, color:'var(--a-fg-mid)' }}>L'administrateur vous assignera des classes prochainement.</p>
        </div>
      ) : (
        <div style={S.grid}>
          {classes.map(c => {
            const nb = nbEleves[c.id] ?? 0;
            return (
              <div key={c.id} style={S.card}
                onClick={() => navigate(`/enseignant/classe/${c.id}`)}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,.2)'; e.currentTarget.style.borderColor='var(--a-gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; e.currentTarget.style.borderColor=''; }}>
                <div style={S.className}>{c.nom}</div>
                <div style={S.classeNb}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  {nb} élève{nb > 1 ? 's' : ''}
                </div>
                <button style={S.btn} onClick={e => { e.stopPropagation(); navigate(`/enseignant/classe/${c.id}`); }}>
                  Voir la classe →
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
