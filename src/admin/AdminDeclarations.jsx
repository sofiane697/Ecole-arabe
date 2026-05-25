import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePageAnimation } from '../shared/usePageAnimation';
import { adminFetchDeclarations, adminMarkDeclarationsVues } from './supabaseAdmin';
import { fmtDateLong } from '../shared/dateUtils';

const TYPE_CFG = {
  retard:  { label: 'Retard',  color: 'var(--a-gold)', bg: 'rgba(191,138,48,.12)', icon: '⏰' },
  absence: { label: 'Absence', color: 'var(--a-red)',  bg: 'rgba(255,69,58,.10)',  icon: '🚫' },
};

function formatDatetime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const PAGE_SIZE = 25;

export default function AdminDeclarations() {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const pageRef = useRef(null);
  usePageAnimation(pageRef, [loading]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await adminFetchDeclarations({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
      if (data.length === 0 && page > 0) { setPage(0); return; }
      setRows(data || []);
      setTotal(Number(data?.[0]?.total_count ?? 0));
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminMarkDeclarationsVues().catch(() => {});
  }, []); // eslint-disable-line

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div ref={pageRef}>
      <p style={{ fontSize: 14, color: 'var(--a-fg-mid)', margin: '0 0 20px' }}>
        Préavis de retards et absences transmis par les familles
        {total > 0 && (
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--a-fg-light)' }}>
            ({total} au total)
          </span>
        )}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--a-fg-mid)' }}>Chargement…</div>
      ) : error ? (
        <div style={{
          padding: 40, textAlign: 'center', color: 'var(--a-red)',
          background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)',
          border: '1px solid rgba(255,69,58,.3)',
        }}>
          {error}
        </div>
      ) : rows.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: 'var(--a-fg-mid)',
          background: 'var(--a-bg-card)', borderRadius: 'var(--a-radius)',
          border: '1px solid var(--a-border)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          Aucune déclaration pour le moment.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(r => {
              const cfg = TYPE_CFG[r.type] || { label: r.type, color: 'var(--a-fg-mid)', bg: 'transparent', icon: '❓' };
              const isNew = !r.vue_admin;
              return (
                <div key={r.id} style={{
                  background: 'var(--a-bg-card)',
                  border: '1px solid var(--a-border)',
                  borderLeft: `4px solid ${cfg.color}`,
                  borderRadius: 'var(--a-radius)',
                  padding: '14px 18px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  boxShadow: isNew ? `0 0 0 1px ${cfg.color}30` : 'none',
                }}>
                  {/* Ligne principale */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Badge type */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 999,
                      background: cfg.bg, color: cfg.color,
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {cfg.icon} {cfg.label}
                    </span>

                    {/* Élève */}
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--a-fg)' }}>
                      {r.eleve_prenom} {r.eleve_nom}
                    </span>

                    {/* Nouveau */}
                    {isNew && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, letterSpacing: '0.5px',
                        background: 'rgba(191,138,48,.18)', color: 'var(--a-gold)',
                        padding: '2px 7px', borderRadius: 4,
                      }}>
                        NOUVEAU
                      </span>
                    )}

                    {/* Classe */}
                    <span style={{
                      marginLeft: 2,
                      fontSize: 12, fontWeight: 600, color: 'var(--a-fg-mid)',
                      background: 'var(--a-bg)', border: '1px solid var(--a-border)',
                      padding: '2px 8px', borderRadius: 6,
                    }}>
                      {r.classe_nom || '—'}
                    </span>

                    {/* Date de l'absence */}
                    <span style={{ fontSize: 13, color: 'var(--a-fg)', fontWeight: 500 }}>
                      — {fmtDateLong(r.date)}
                    </span>

                    {/* Heure */}
                    {r.heure_prevue && (
                      <span style={{
                        fontSize: 12, color: cfg.color, fontWeight: 600,
                        background: cfg.bg, padding: '2px 8px', borderRadius: 6,
                      }}>
                        à {r.heure_prevue}
                      </span>
                    )}

                    {/* Soumis le (à droite) */}
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--a-fg-light)', whiteSpace: 'nowrap' }}>
                      Soumis le {formatDatetime(r.created_at)}
                    </span>
                  </div>

                  {/* Ligne secondaire : motif + parent */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {r.motif ? (
                      <span style={{
                        fontSize: 12, color: 'var(--a-fg-mid)', fontStyle: 'italic',
                        background: 'var(--a-bg)', padding: '3px 10px',
                        borderRadius: 6, border: '1px solid var(--a-border)',
                        maxWidth: 480,
                      }}>
                        "{r.motif}"
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--a-fg-light)' }}>Aucun motif renseigné</span>
                    )}

                    <span style={{
                      marginLeft: 'auto', fontSize: 12, color: 'var(--a-fg-mid)',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {r.parent_label || '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                style={{
                  padding: '7px 18px', borderRadius: 980,
                  border: '1px solid var(--a-border)', background: 'transparent',
                  color: page === 0 ? 'var(--a-fg-light)' : 'var(--a-fg)',
                  fontSize: 13, cursor: page === 0 ? 'default' : 'pointer',
                }}
              >
                ← Précédent
              </button>
              <span style={{ padding: '7px 12px', fontSize: 13, color: 'var(--a-fg-mid)' }}>
                Page {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '7px 18px', borderRadius: 980,
                  border: '1px solid var(--a-border)', background: 'transparent',
                  color: page >= totalPages - 1 ? 'var(--a-fg-light)' : 'var(--a-fg)',
                  fontSize: 13, cursor: page >= totalPages - 1 ? 'default' : 'pointer',
                }}
              >
                Suivant →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
