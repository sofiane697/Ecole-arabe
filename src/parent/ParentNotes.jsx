import React, { useEffect, useState } from 'react';
import { useParentCtx } from './ParentContext';
import { fetchNotesEleve } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';
import { SCORE_LABEL, SCORE_COLOR, SCORE_SUB } from './parentConstants';

export default function ParentNotes() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [notes, setNotes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    fetchNotesEleve(selectedEleveId).then(({ data, error }) => {
      if (cancelled) return;
      setNotes(data);
      if (error) setError(error);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId]);

  if (!selectedEleve) return null;

  const counts = notes.reduce((acc, n) => {
    acc[n.score] = (acc[n.score] || 0) + 1;
    return acc;
  }, {});
  const total = notes.length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 28, fontWeight: 800, color: 'var(--p-fg)',
        margin: '0 0 6px', letterSpacing: '-0.01em',
      }}>
        Notes de {fmtPrenom(selectedEleve.prenom)}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--p-fg-mid)', margin: '0 0 24px' }}>
        {total} {total > 1 ? 'évaluations' : 'évaluation'} au total
      </p>

      {total > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[4, 3, 2, 1].map(score => (
            <div key={score} style={{
              flex: 1, minWidth: 120,
              padding: '16px 18px', borderRadius: 'var(--p-radius)',
              background: 'var(--p-bg-card)',
              border: '1px solid var(--p-border)',
              borderTop: `3px solid ${SCORE_COLOR[score]}`,
              boxShadow: 'var(--p-shadow-sm)',
            }}>
              <div style={{
                fontFamily: 'var(--p-font-display)',
                fontSize: 26, fontWeight: 800, color: SCORE_COLOR[score],
                lineHeight: 1,
              }}>
                {counts[score] || 0}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-fg)', marginTop: 6 }}>
                {SCORE_LABEL[score]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--p-fg-light)', marginTop: 2 }}>
                {SCORE_SUB[score]}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>Chargement…</div>
      ) : error ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-red)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid rgba(255,69,58,0.3)',
        }}>
          Impossible de charger les notes : {error}
        </div>
      ) : notes.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--p-fg-mid)',
          background: 'var(--p-bg-card)', borderRadius: 'var(--p-radius)',
          border: '1px solid var(--p-border)',
        }}>
          Aucune note enregistrée pour l'instant.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(n => (
            <div key={n.id} style={{
              padding: '16px 18px', borderRadius: 'var(--p-radius)',
              background: 'var(--p-bg-card)', border: '1px solid var(--p-border)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
              boxShadow: 'var(--p-shadow-sm)',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-fg)' }}>
                  {n.evaluation?.titre || 'Évaluation'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--p-fg-mid)', marginTop: 4 }}>
                  {n.evaluation?.date && new Date(n.evaluation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {n.commentaire && (
                  <div style={{ fontSize: 13, color: 'var(--p-fg)', marginTop: 8, fontStyle: 'italic' }}>
                    « {n.commentaire} »
                  </div>
                )}
              </div>
              <div style={{
                padding: '8px 16px', borderRadius: 999,
                background: `${SCORE_COLOR[n.score]}22`,
                color: SCORE_COLOR[n.score],
                fontFamily: 'var(--p-font-display)',
                fontSize: 16, fontWeight: 700,
                minWidth: 54, textAlign: 'center',
              }}>
                {n.absent ? 'Abs.' : (SCORE_LABEL[n.score] || '—')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
