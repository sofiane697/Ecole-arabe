import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getEnseignantUser, fetchMesClasses, fetchElevesDeClasse } from './supabaseEnseignant';
import EleveAvatar from '../shared/EleveAvatar';

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const S = {
  page: { minHeight:'100%' },
  breadcrumb: { display:'flex', alignItems:'center', gap:8, marginBottom:28, cursor:'pointer', color:'var(--a-fg-mid)', fontSize:14, fontWeight:500 },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 },
  title: { fontFamily:'var(--a-font-display)', fontSize:28, fontWeight:900, color:'var(--a-gold)', letterSpacing:'-1px' },
  sub: { fontSize:13, color:'var(--a-fg-mid)', marginTop:4 },
  table: { width:'100%', borderCollapse:'separate', borderSpacing:0 },
  th: { fontSize:11, fontWeight:700, color:'var(--a-fg-light)', textTransform:'uppercase', letterSpacing:'.7px', padding:'10px 16px', textAlign:'left', borderBottom:'1px solid var(--a-border)' },
  tr: { transition:'background .15s' },
  td: { padding:'14px 16px', fontSize:14, color:'var(--a-fg)', borderBottom:'1px solid var(--a-border)' },
  avatar: { width:34, height:34, borderRadius:'50%', background:'var(--a-gold)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, marginRight:10, flexShrink:0, letterSpacing:'-0.3px' },
  nameCell: { display:'flex', alignItems:'center' },
  badge: (actif) => ({ padding:'2px 10px', borderRadius:980, fontSize:11, fontWeight:700, background: actif ? 'rgba(48,209,88,.15)' : 'rgba(255,69,58,.15)', color: actif ? 'var(--a-green)' : 'var(--a-red)' }),
  identifiant: { fontSize:13, fontFamily:'var(--a-font-mono)', color:'var(--a-gold)', fontWeight:700, letterSpacing:.5 },
  empty: { textAlign:'center', padding:'60px 20px', color:'var(--a-fg-mid)', fontSize:14 },
  loading: { textAlign:'center', padding:60, color:'var(--a-fg-mid)', fontSize:14 },
  tableWrap: { background:'var(--a-bg-card)', borderRadius:'var(--a-radius)', border:'1px solid var(--a-border)', overflow:'hidden' },
};

export default function EnseignantClasse() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getEnseignantUser();
  const [classe, setClasse]   = useState(null);
  const [eleves, setEleves]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [cls, elvs] = await Promise.all([
          fetchMesClasses(user.id),
          fetchElevesDeClasse(id),
        ]);
        const c = cls.find(c => String(c.id) === String(id));
        setClasse(c || null);
        setEleves(elvs);
      } catch(e) {}
      setLoading(false);
    })();
  }, [id, user?.id]);

  if (loading) return <div style={S.loading}>Chargement...</div>;

  const actifs   = eleves.filter(e => e.actif).length;
  const inactifs = eleves.filter(e => !e.actif).length;

  return (
    <div style={S.page}>
      <div style={S.breadcrumb} onClick={() => navigate('/enseignant')}>
        <IconBack /> Tableau de bord
        {classe && <><span style={{ margin:'0 4px', color:'var(--a-border)' }}>›</span><span style={{ color:'var(--a-fg)', fontWeight:600 }}>{classe.nom}</span></>}
      </div>

      <div style={S.header}>
        <div>
          <div style={S.title}>{classe?.nom || 'Classe'}</div>
          <div style={S.sub}>
            {eleves.length} élève{eleves.length > 1 ? 's' : ''}
            {actifs > 0 && <> · <span style={{ color:'var(--a-green)' }}>{actifs} actif{actifs > 1 ? 's' : ''}</span></>}
            {inactifs > 0 && <> · <span style={{ color:'var(--a-red)' }}>{inactifs} inactif{inactifs > 1 ? 's' : ''}</span></>}
          </div>
        </div>
      </div>

      {eleves.length === 0 ? (
        <div style={S.empty}>Aucun élève dans cette classe pour le moment.</div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Élève</th>
                <th style={S.th}>Identifiant</th>
                <th style={S.th}>Statut</th>
                <th style={S.th}>Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(e => {
                const date = e.created_at
                  ? new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
                  : '—';
                return (
                  <tr key={e.id} style={{ ...S.tr, cursor: 'pointer' }}
                    onClick={() => navigate(`/enseignant/eleve/${e.id}`, { state: { classeId: id, classe, eleve: e } })}
                    onMouseEnter={ev => ev.currentTarget.style.background='var(--a-bg-hover)'}
                    onMouseLeave={ev => ev.currentTarget.style.background=''}>
                    <td style={S.td}>
                      <div style={S.nameCell}>
                        <EleveAvatar eleve={e} fallbackStyle={S.avatar} />
                        <span style={{ fontWeight:600 }}>{e.prenom} {e.nom}</span>
                      </div>
                    </td>
                    <td style={S.td}><span style={S.identifiant}>{(e.identifiant || '—').toUpperCase()}</span></td>
                    <td style={S.td}><span style={S.badge(e.actif)}>{e.actif ? 'Actif' : 'Inactif'}</span></td>
                    <td style={S.td}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
