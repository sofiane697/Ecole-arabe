import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEnseignantUser, fetchMesClasses, fetchElevesDeClasse } from './supabaseEnseignant';
import EleveAvatar from '../shared/EleveAvatar';
import { Flourish } from '../shared/Ornaments';

const C = {
  bg:       '#F2EEDF',
  paper:    '#FBFAF1',
  ink:      '#1E2317',
  ink2:     '#3F4A33',
  ink3:     '#7A876A',
  gold:     '#8A6B1F',
  goldSoft: '#DCBC6E',
  rule:     'rgba(138,107,31,0.18)',
  ruleSoft: 'rgba(138,107,31,0.10)',
};

const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

function initials(e) {
  return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase();
}

export default function EnseignantClasse() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const user     = getEnseignantUser();

  const [classe,  setClasse]  = useState(null);
  const [eleves,  setEleves]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const [cls, elvs] = await Promise.all([
          fetchMesClasses(user.id),
          fetchElevesDeClasse(id),
        ]);
        setClasse(cls.find(c => String(c.id) === String(id)) || null);
        setEleves(elvs);
      } catch {}
      setLoading(false);
    })();
  }, [id, user?.id]);

  if (loading) return (
    <div style={{ padding: '60px 40px', fontFamily: "'Newsreader', Georgia, serif", fontStyle: 'italic', color: C.ink3, fontSize: 16 }}>
      Chargement…
    </div>
  );

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const actifs = eleves.filter(e => e.actif).length;

  return (
    <div style={{ padding: '32px 40px 48px', minHeight: '100%', background: C.bg, fontFamily: "'Manrope', system-ui, sans-serif" }}>

      {/* ── Retour ── */}
      <button
        onClick={() => navigate('/enseignant/classes')}
        style={{ display:'inline-flex', alignItems:'center', gap:6, background:'transparent', border:'none', cursor:'pointer', color:C.ink3, fontFamily:"'Manrope',sans-serif", fontSize:12, fontWeight:600, marginBottom:24, padding:0, letterSpacing:'0.01em' }}
        onMouseEnter={e => e.currentTarget.style.color=C.ink}
        onMouseLeave={e => e.currentTarget.style.color=C.ink3}
      >
        <IconBack /> Mes classes
        {classe && <><span style={{ margin:'0 4px', opacity:.4 }}>›</span><span style={{ color:C.ink }}>{classe.nom}</span></>}
      </button>

      {/* ── En-tête ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
            <Flourish size={26} />
            <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.22em', textTransform:'uppercase', color:C.ink3 }}>
              Liste des élèves
            </span>
          </div>
          <h1 style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:40, fontWeight:500, color:C.ink, margin:0, lineHeight:1.05, letterSpacing:'-0.015em' }}>
            Classe <em style={{ fontStyle:'italic', color:C.gold }}>{classe?.nom || '…'}</em>
          </h1>
          {classe?.description && (
            <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:13, color:C.ink3, marginTop:4 }}>
              {classe.description}
            </div>
          )}
        </div>
        <div style={{ textAlign:'right', paddingTop:6 }}>
          <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:12.5, color:C.ink2 }}>{today}</div>
          <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:C.ink3, marginTop:3 }}>
            {eleves.length} élève{eleves.length !== 1 ? 's' : ''} · {actifs} actif{actifs !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Liste élèves ── */}
      {eleves.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', fontFamily:"'Newsreader',Georgia,serif", fontStyle:'italic', fontSize:18, color:C.ink3 }}>
          Aucun élève dans cette classe pour le moment.
        </div>
      ) : (
        <div style={{ background:C.paper, borderRadius:20, border:`1px solid ${C.rule}`, overflow:'hidden' }}>

          {/* Header de table */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:20, padding:'10px 20px', borderBottom:`1px solid ${C.ruleSoft}` }}>
            {['Élève','Identifiant','Statut','Inscription'].map((h,i) => (
              <span key={i} style={{ fontFamily:"'Manrope',sans-serif", fontSize:9.5, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:C.ink3 }}>
                {h}
              </span>
            ))}
          </div>

          {/* Lignes */}
          {eleves.map((e, idx) => {
            const date = e.created_at
              ? new Date(e.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
              : '—';
            return (
              <div
                key={e.id}
                onClick={() => navigate(`/enseignant/eleve/${e.id}`, { state: { classeId:id, classe, eleve:e } })}
                style={{
                  display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:20,
                  padding:'13px 20px', cursor:'pointer', transition:'background 0.12s',
                  borderBottom: idx < eleves.length - 1 ? `1px solid ${C.ruleSoft}` : 'none',
                  alignItems:'center',
                }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(138,107,31,0.04)'}
                onMouseLeave={ev => ev.currentTarget.style.background = ''}
              >
                {/* Nom + avatar */}
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <EleveAvatar
                    eleve={e}
                    size={36}
                    variant="enseignant"
                    fallbackStyle={{
                      background: '#1E2317', color: '#C09844',
                      fontWeight: 700, letterSpacing: '0.5px',
                    }}
                  />
                  <div>
                    <div style={{ fontFamily:"'Manrope',sans-serif", fontSize:13, fontWeight:600, color:C.ink }}>
                      {e.prenom} <span style={{ textTransform:'uppercase' }}>{e.nom}</span>
                    </div>
                  </div>
                </div>

                {/* Identifiant */}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:700, color:C.gold, letterSpacing:'0.04em' }}>
                  {(e.identifiant||'—').toUpperCase()}
                </span>

                {/* Statut */}
                <span style={{
                  padding:'3px 12px', borderRadius:999,
                  border: `1px solid ${e.actif ? 'rgba(138,107,31,0.3)' : C.ruleSoft}`,
                  background: e.actif ? 'rgba(138,107,31,0.08)' : 'transparent',
                  fontFamily:"'Manrope',sans-serif", fontSize:11, fontWeight:600,
                  color: e.actif ? C.gold : C.ink3,
                  whiteSpace:'nowrap',
                }}>
                  {e.actif ? 'Actif' : 'Inactif'}
                </span>

                {/* Date */}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:C.ink3, fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>
                  {date}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
