import React, { useEffect, useState } from 'react';
import { useParentCtx } from './ParentContext';
import { fetchAbsencesEleve } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';

const TYPE_CFG = {
  retard:  { label: 'Retard',  color: 'var(--p-yellow)', icon: '⏰' },
  absence: { label: 'Absence', color: 'var(--p-red)',    icon: '🚫' },
};

export default function ParentAbsences() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    fetchAbsencesEleve(selectedEleveId).then(({ data, error }) => {
      if (cancelled) return;
      setItems(data);
      if (error) setError(error);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId]);

  if (!selectedEleve) return null;
  const nbRetards  = items.filter(i => i.type === 'retard').length;
  const nbAbsences = items.filter(i => i.type === 'absence').length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 28, fontWeight: 800, color: 'var(--p-fg)',
        margin: '0 0 6px', letterSpacing: '-0.01em',
      }}>
        Retards & absences de {fmtPrenom(selectedEleve.prenom)}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--p-fg-mid)', margin: '0 0 24px' }}>
        Historique communiqué par les enseignants
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <div style={{
          flex: 1, padding: '18px 20px', borderRadius: 'var(--p-radius)',
          background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
          borderTop: '3px solid var(--p-yellow)',
          boxShadow: 'var(--p-shadow-sm)',
        }}>
          <div style={{
            fontFamily: 'var(--p-font-display)',
            fontSize: 30, fontWeight: 800, color: 'var(--p-yellow)', lineHeight: 1,
          }}>{nbRetards}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-fg)', marginTop: 6 }}>
            Retard{nbRetards > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{
          flex: 1, padding: '18px 20px', borderRadius: 'var(--p-radius)',
          background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
          borderTop: '3px solid var(--p-red)',
          boxShadow: 'var(--p-shadow-sm)',
        }}>
          <div style={{
            fontFamily: 'var(--p-font-display)',
            fontSize: 30, fontWeight: 800, color: 'var(--p-red)', lineHeight: 1,
          }}>{nbAbsences}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-fg)', marginTop: 6 }}>
            Absence{nbAbsences > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>Chargement…</div>
      ) : error ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-red)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid rgba(255,69,58,0.3)',
        }}>
          Impossible de charger l'historique : {error}
        </div>
      ) : items.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-fg-mid)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid var(--p-border)',
        }}>
          Aucun retard ni absence enregistré.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => {
            const cfg = TYPE_CFG[item.type] || { label: item.type, color: 'var(--p-fg-mid)', icon: '❓' };
            return (
              <div key={item.id} style={{
                padding: '16px 18px', borderRadius: 'var(--p-radius)',
                background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
                borderLeft: `4px solid ${cfg.color}`,
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                boxShadow: 'var(--p-shadow-sm)',
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 999,
                    background: `${cfg.color}22`, color: cfg.color,
                    fontSize: 12, fontWeight: 600, marginBottom: 8,
                  }}>
                    {cfg.icon} {cfg.label}
                  </div>
                  {item.commentaire && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--p-fg)', lineHeight: 1.65 }}>
                      {item.commentaire}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--p-fg-mid)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
