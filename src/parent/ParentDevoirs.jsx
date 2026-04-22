import React, { useEffect, useState } from 'react';
import { useParentCtx } from './ParentContext';
import { fetchDevoirsClasse } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';

function urgenceColor(dateLimite) {
  if (!dateLimite) return 'var(--p-fg-light)';
  const now = new Date();
  const d   = new Date(dateLimite);
  const diffDays = Math.ceil((d - now) / 86400000);
  if (diffDays < 0)  return 'var(--p-fg-light)';
  if (diffDays <= 2) return 'var(--p-red)';
  if (diffDays <= 6) return 'var(--p-yellow)';
  return 'var(--p-green)';
}

function urgenceLabel(dateLimite) {
  if (!dateLimite) return '';
  const now = new Date();
  const d   = new Date(dateLimite);
  const diffDays = Math.ceil((d - now) / 86400000);
  if (diffDays < 0)   return `Il y a ${-diffDays} j`;
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  return `Dans ${diffDays} j`;
}

export default function ParentDevoirs() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [devoirs, setDevoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    fetchDevoirsClasse(selectedEleveId).then(({ data, error }) => {
      if (cancelled) return;
      setDevoirs(data);
      if (error) setError(error);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId]);

  if (!selectedEleve) return null;

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const aVenir = devoirs.filter(d => d.date_limite && new Date(d.date_limite) >= todayStart);
  const passes = devoirs.filter(d => !d.date_limite || new Date(d.date_limite) < todayStart);

  const Section = ({ title, list, empty }) => (
    <>
      <h2 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 18, fontWeight: 700, color: 'var(--p-fg)',
        margin: '24px 0 12px',
      }}>{title}</h2>
      {list.length === 0 ? (
        <div style={{
          padding: '20px 22px', textAlign: 'center',
          color: 'var(--p-fg-mid)', background: 'var(--p-bg-card)',
          borderRadius: 'var(--p-radius)', border: '1px solid var(--p-border)',
          fontSize: 13,
        }}>
          {empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(d => {
            const color = urgenceColor(d.date_limite);
            const label = urgenceLabel(d.date_limite);
            const ens   = d.enseignants;
            return (
              <div key={d.id} style={{
                padding: '16px 18px', borderRadius: 'var(--p-radius)',
                background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
                borderLeft: `4px solid ${color}`,
                boxShadow: 'var(--p-shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-fg)' }}>{d.titre}</div>
                  <span style={{
                    padding: '4px 12px', borderRadius: 999,
                    background: `${color}22`, color,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {label}
                  </span>
                </div>
                {d.description && (
                  <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--p-fg)', lineHeight: 1.65 }}>{d.description}</p>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'var(--p-fg-mid)' }}>
                  <span>
                    {d.date_limite && `À rendre le ${new Date(d.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </span>
                  {ens && <span style={{ fontStyle: 'italic' }}>— {ens.prenom} {ens.nom}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 28, fontWeight: 800, color: 'var(--p-fg)',
        margin: '0 0 6px', letterSpacing: '-0.01em',
      }}>
        Devoirs de {fmtPrenom(selectedEleve.prenom)}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--p-fg-mid)', margin: 0 }}>
        Classe : {selectedEleve.classe_nom || '—'}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>Chargement…</div>
      ) : error ? (
        <div style={{
          padding: 40, marginTop: 24, textAlign: 'center', color: 'var(--p-red)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid rgba(255,69,58,0.3)',
        }}>
          Impossible de charger les devoirs : {error}
        </div>
      ) : (
        <>
          <Section title={`À venir (${aVenir.length})`} list={aVenir} empty="Aucun devoir à venir." />
          <Section title={`Passés (${passes.length})`}   list={passes} empty="Aucun devoir passé." />
        </>
      )}
    </div>
  );
}
