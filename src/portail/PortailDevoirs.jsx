import React, { useState, useEffect } from 'react';
import { fetchDevoirsEleve, fetchClasseIdEleve } from './supabasePortail';

function getEleveUser() {
  try { return JSON.parse(sessionStorage.getItem('eleve_user')); } catch { return null; }
}

function joursRestants(dateLimite) {
  const today = new Date(); today.setHours(0,0,0,0);
  const dl    = new Date(dateLimite);
  return Math.round((dl - today) / 86400000);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

function groupParSemaine(devoirs) {
  const semaines = {};
  devoirs.forEach(d => {
    const dl   = new Date(d.date_limite);
    const lun  = new Date(dl); lun.setDate(dl.getDate() - ((dl.getDay() + 6) % 7));
    const key  = lun.toISOString().slice(0,10);
    if (!semaines[key]) semaines[key] = [];
    semaines[key].push(d);
  });
  return Object.entries(semaines).sort(([a],[b]) => a.localeCompare(b));
}

function labelSemaine(lundiStr) {
  const lundi    = new Date(lundiStr);
  const dimanche = new Date(lundi); dimanche.setDate(lundi.getDate() + 6);
  const opts     = { day:'numeric', month:'short' };
  return `Semaine du ${lundi.toLocaleDateString('fr-FR', opts)} au ${dimanche.toLocaleDateString('fr-FR', opts)}`;
}

const S = {
  page:   { padding:'32px 0' },
  header: { marginBottom:28 },
  title:  { fontSize:24, fontWeight:700, color:'var(--p-fg)', margin:'0 0 6px' },
  sub:    { fontSize:14, color:'var(--p-fg-mid)', marginTop:6 },
  // Semaine
  semaine:     { marginBottom:28 },
  semaineLabel:{ fontSize:11, fontWeight:700, color:'var(--p-fg-light)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 },
  // Carte devoir
  card:    { background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', border:'1px solid var(--p-border)', padding:'16px 20px', marginBottom:10, display:'flex', gap:16, alignItems:'flex-start' },
  badge:   (jours) => ({
    flexShrink:0, minWidth:56, textAlign:'center', borderRadius:10, padding:'6px 10px',
    background: jours < 0 ? 'rgba(255,69,58,.1)' : jours <= 2 ? 'rgba(255,69,58,.12)' : jours <= 6 ? 'rgba(255,159,10,.12)' : 'rgba(48,209,88,.1)',
    border: `1px solid ${jours < 0 ? 'rgba(255,69,58,.25)' : jours <= 2 ? 'rgba(255,69,58,.25)' : jours <= 6 ? 'rgba(255,159,10,.3)' : 'rgba(48,209,88,.25)'}`,
  }),
  badgeJours: (jours) => ({
    fontSize:18, fontWeight:900, display:'block', lineHeight:1,
    color: jours < 0 ? 'var(--p-red)' : jours <= 2 ? 'var(--p-red)' : jours <= 6 ? '#ff9f0a' : 'var(--p-green)',
  }),
  badgeLabel: (jours) => ({
    fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px', display:'block', marginTop:2,
    color: jours < 0 ? 'var(--p-red)' : jours <= 2 ? 'var(--p-red)' : jours <= 6 ? '#ff9f0a' : 'var(--p-green)',
  }),
  cardBody: { flex:1, minWidth:0 },
  cardTitre:{ fontSize:15, fontWeight:700, color:'var(--p-fg)', marginBottom:4 },
  cardDate: { fontSize:12, color:'var(--p-fg-mid)', marginBottom:6 },
  cardDesc: { fontSize:13, color:'var(--p-fg-mid)', lineHeight:1.6 },
  // Passés
  passesHeader:{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', marginBottom:12, marginTop:8 },
  passesLabel: { fontSize:13, fontWeight:600, color:'var(--p-fg-mid)' },
  // Empty
  empty:      { textAlign:'center', padding:'80px 20px' },
  emptyIcon:  { fontSize:48, marginBottom:16, opacity:.4 },
  emptyTitle: { fontSize:18, fontWeight:600, color:'var(--p-fg)', marginBottom:8 },
  emptyText:  { fontSize:14, color:'var(--p-fg-mid)', lineHeight:1.6 },
};

export default function PortailDevoirs() {
  const user    = getEleveUser();
  const [classeId, setClasseId] = useState(user?.classe_id || null);
  const [devoirs,  setDevoirs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const run = async () => {
      try {
        let cid = user?.classe_id || null;
        // classe_id absent de la session (login_eleve ne le retourne pas) → on le fetch
        if (!cid) cid = await fetchClasseIdEleve(user.id);
        setClasseId(cid);
        if (!cid) { setLoading(false); return; }
        const dvs = await fetchDevoirsEleve(cid);
        setDevoirs(dvs);
      } catch {
        setDevoirs([]);
      }
      setLoading(false);
    };
    run();
  }, [user?.id]);

  if (loading) return (
    <div style={S.page}>
      <div style={S.header}><h1 style={S.title}>Mes devoirs</h1></div>
      <div style={{ ...S.empty, padding:'40px 0' }}>
        <div style={{ color:'var(--p-fg-mid)', fontSize:14 }}>Chargement...</div>
      </div>
    </div>
  );

  if (!classeId) return (
    <div style={S.page}>
      <div style={S.header}><h1 style={S.title}>Mes devoirs</h1></div>
      <div style={S.empty}>
        <div style={S.emptyIcon}>⚙️</div>
        <div style={S.emptyTitle}>Classe non configurée</div>
        <p style={S.emptyText}>Tu n'as pas encore été assigné à une classe. Contacte ton enseignant.</p>
      </div>
    </div>
  );

  const today    = new Date(); today.setHours(0,0,0,0);
  const avenir   = devoirs.filter(d => new Date(d.date_limite) >= today);
  const passes   = devoirs.filter(d => new Date(d.date_limite) < today);
  const semaines = groupParSemaine(avenir);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Mes devoirs</h1>
        <p style={S.sub}>
          {avenir.length === 0
            ? 'Aucun devoir à venir pour le moment.'
            : `${avenir.length} devoir${avenir.length > 1 ? 's' : ''} à venir`}
        </p>
      </div>

      {avenir.length === 0 && passes.length === 0 && (
        <div style={S.empty}>
          <div style={S.emptyIcon}>📋</div>
          <div style={S.emptyTitle}>Aucun devoir pour le moment</div>
          <p style={S.emptyText}>Vos devoirs apparaîtront ici dès que votre professeur en aura assigné.</p>
        </div>
      )}

      {/* Devoirs à venir groupés par semaine */}
      {semaines.map(([lundiStr, dvs]) => (
        <div key={lundiStr} style={S.semaine}>
          <div style={S.semaineLabel}>{labelSemaine(lundiStr)}</div>
          {dvs.map(d => {
            const jours = joursRestants(d.date_limite);
            return (
              <div key={d.id} style={S.card}>
                <div style={S.badge(jours)}>
                  <span style={S.badgeJours(jours)}>
                    {jours < 0 ? Math.abs(jours) : jours}
                  </span>
                  <span style={S.badgeLabel(jours)}>
                    {jours < 0 ? 'en retard' : jours === 0 ? "auj." : jours === 1 ? 'demain' : 'jours'}
                  </span>
                </div>
                <div style={S.cardBody}>
                  <div style={S.cardTitre}>{d.titre}</div>
                  <div style={S.cardDate}>📅 Pour le {formatDate(d.date_limite)}</div>
                  {d.description && <div style={S.cardDesc}>{d.description}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Devoirs passés (repliables) */}
      {passes.length > 0 && (
        <div>
          <div style={S.passesHeader} onClick={() => setShowPass(v => !v)}>
            <span style={S.passesLabel}>
              {showPass ? '▾' : '▸'} Devoirs passés ({passes.length})
            </span>
          </div>
          {showPass && passes.map(d => {
            const jours = joursRestants(d.date_limite);
            return (
              <div key={d.id} style={{ ...S.card, opacity:.6 }}>
                <div style={S.badge(jours)}>
                  <span style={S.badgeJours(jours)}>{Math.abs(jours)}</span>
                  <span style={S.badgeLabel(jours)}>passé</span>
                </div>
                <div style={S.cardBody}>
                  <div style={S.cardTitre}>{d.titre}</div>
                  <div style={S.cardDate}>📅 {formatDate(d.date_limite)}</div>
                  {d.description && <div style={S.cardDesc}>{d.description}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
