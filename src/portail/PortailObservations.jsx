import React, { useEffect, useState } from 'react';
import { getEleveUser, fetchMesObservations } from './supabasePortail';

const TYPES = {
  general:      { label: 'Général',      color: '#bf8a30', bg: 'rgba(191,138,48,0.1)',  icon: '💬' },
  comportement: { label: 'Comportement', color: '#ff453a', bg: 'rgba(255,69,58,0.1)',   icon: '⚡' },
  progression:  { label: 'Progression',  color: '#30d158', bg: 'rgba(48,209,88,0.1)',   icon: '📈' },
};

function typeInfo(v) { return TYPES[v] || TYPES.general; }

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function groupByMonth(observations) {
  const groups = {};
  observations.forEach(obs => {
    const key = new Date(obs.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(obs);
  });
  return Object.entries(groups);
}

const ALL_TYPES = ['all', 'general', 'comportement', 'progression'];
const FILTER_LABELS = { all: 'Tout', general: 'Général', comportement: 'Comportement', progression: 'Progression' };

export default function PortailObservations() {
  const user = getEleveUser();
  const [observations, setObservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filter,       setFilter]       = useState('all');
  const [showLoader,   setShowLoader]   = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowLoader(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesObservations(user.id)
      .then(data => setObservations(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) {
    if (!showLoader) return null;
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300, color:'var(--p-fg-mid)', fontSize:14 }}>
        Chargement…
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <div style={{ fontSize:52, marginBottom:16, opacity:.3 }}>✏️</div>
        <div style={{ fontFamily:'var(--p-font-display)', fontSize:18, fontWeight:700, color:'var(--p-fg)', marginBottom:8 }}>
          Aucune observation pour le moment
        </div>
        <p style={{ fontSize:14, color:'var(--p-fg-mid)', maxWidth:300, margin:'0 auto', lineHeight:1.6 }}>
          Les observations de ton professeur apparaîtront ici.
        </p>
      </div>
    );
  }

  const filtered = filter === 'all' ? observations : observations.filter(o => o.type === filter);
  const groups = groupByMonth(filtered);

  const counts = { all: observations.length };
  ALL_TYPES.slice(1).forEach(t => { counts[t] = observations.filter(o => o.type === t).length; });

  return (
    <div style={{ paddingBottom: 40 }}>
      <p style={{ fontSize:14, color:'var(--p-fg-mid)', marginBottom:20 }}>
        Les remarques et commentaires de ton professeur.
      </p>

      {/* Filtres */}
      <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
        {ALL_TYPES.map(t => {
          const ti = t === 'all' ? null : typeInfo(t);
          const active = filter === t;
          const count = counts[t] || 0;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'7px 14px', borderRadius:980,
                border:`1.5px solid ${active ? (ti ? ti.color : 'var(--p-gold)') : 'var(--p-border)'}`,
                background: active ? (ti ? ti.bg : 'rgba(191,138,48,0.1)') : 'transparent',
                color: active ? (ti ? ti.color : 'var(--p-gold)') : 'var(--p-fg-mid)',
                fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .15s',
              }}
            >
              {ti && <span>{ti.icon}</span>}
              {FILTER_LABELS[t]}
              <span style={{
                fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:20,
                background: active ? (ti ? `${ti.color}22` : 'rgba(191,138,48,0.2)') : 'var(--p-border)',
                color: active ? (ti ? ti.color : 'var(--p-gold)') : 'var(--p-fg-light)',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline groupée par mois */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--p-fg-mid)', fontSize:14 }}>
          Aucune observation de ce type.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
          {groups.map(([month, obs]) => (
            <div key={month}>
              {/* Séparateur de mois */}
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ flex:1, height:1, background:'var(--p-border)' }} />
                <span style={{
                  fontSize:11, fontWeight:700, color:'var(--p-fg-light)',
                  textTransform:'uppercase', letterSpacing:'1px',
                  padding:'3px 10px', borderRadius:20,
                  border:'1px solid var(--p-border)',
                }}>
                  {month}
                </span>
                <div style={{ flex:1, height:1, background:'var(--p-border)' }} />
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {obs.map(observation => {
                  const ti = typeInfo(observation.type);
                  return (
                    <div
                      key={observation.id}
                      style={{
                        background:'var(--p-bg-card)', borderRadius:14,
                        border:'1px solid var(--p-border)', overflow:'hidden',
                        transition:'box-shadow .2s, transform .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.08)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform=''; }}
                    >
                      {/* En-tête colorée */}
                      <div style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'10px 16px', background:ti.bg, borderBottom:`1px solid ${ti.color}22`,
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:16 }}>{ti.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:ti.color, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                            {ti.label}
                          </span>
                        </div>
                        <span style={{ fontSize:12, color:ti.color, opacity:.7 }}>
                          {formatDate(observation.created_at)}
                        </span>
                      </div>

                      {/* Corps */}
                      <div style={{ padding:'14px 16px', fontSize:14, color:'var(--p-fg)', lineHeight:1.7 }}>
                        {observation.contenu}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
