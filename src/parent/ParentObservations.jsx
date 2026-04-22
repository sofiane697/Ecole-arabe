import React, { useEffect, useState } from 'react';
import { useParentCtx } from './ParentContext';
import { fetchObservationsEleve } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';

const TYPE_CFG = {
  general:      { label: 'Général',      color: 'var(--p-blue)',   icon: '📋' },
  comportement: { label: 'Comportement', color: 'var(--p-yellow)', icon: '🧭' },
  progression:  { label: 'Progression',  color: 'var(--p-green)',  icon: '📈' },
};

export default function ParentObservations() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('tous');

  useEffect(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    fetchObservationsEleve(selectedEleveId).then(({ data, error }) => {
      if (cancelled) return;
      setItems(data);
      if (error) setError(error);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId]);

  if (!selectedEleve) return null;
  const filtered = filter === 'tous' ? items : items.filter(i => i.type === filter);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 28, fontWeight: 800, color: 'var(--p-fg)',
        margin: '0 0 6px', letterSpacing: '-0.01em',
      }}>
        Appréciations sur {fmtPrenom(selectedEleve.prenom)}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--p-fg-mid)', margin: '0 0 24px' }}>
        Messages laissés par les enseignants
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { key: 'tous', label: 'Tous', icon: '📌', color: 'var(--p-gold)' },
          ...Object.entries(TYPE_CFG).map(([key, cfg]) => ({ key, ...cfg })),
        ].map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 16px', borderRadius: 999,
              border: `1px solid ${filter === f.key ? f.color : 'var(--p-border)'}`,
              background: filter === f.key ? `${f.color}22` : 'var(--p-bg-card)',
              color: filter === f.key ? f.color : 'var(--p-fg)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>Chargement…</div>
      ) : error ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-red)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid rgba(255,69,58,0.3)',
        }}>
          Impossible de charger les appréciations : {error}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-fg-mid)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid var(--p-border)',
        }}>
          Aucune appréciation {filter !== 'tous' ? 'de ce type ' : ''}pour l'instant.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(obs => {
            const cfg = TYPE_CFG[obs.type] || { label: obs.type, color: 'var(--p-fg-mid)', icon: '📌' };
            const ens = obs.enseignants;
            return (
              <div key={obs.id} style={{
                padding: '16px 18px', borderRadius: 'var(--p-radius)',
                background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
                borderLeft: `4px solid ${cfg.color}`,
                boxShadow: 'var(--p-shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999,
                    background: `${cfg.color}22`, color: cfg.color,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--p-fg-light)' }}>
                    {new Date(obs.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--p-fg)', lineHeight: 1.65 }}>
                  {obs.contenu}
                </p>
                {ens && (
                  <div style={{ fontSize: 12, color: 'var(--p-fg-mid)', fontStyle: 'italic' }}>
                    — {ens.prenom} {ens.nom}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
