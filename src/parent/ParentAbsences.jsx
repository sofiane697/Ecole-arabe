import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParentCtx } from './ParentContext';
import { fetchAbsencesEleve, createDeclarationParent, fetchDeclarationsParent } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';
import { todayISO, fmtDateLong } from '../shared/dateUtils';

const TYPE_CFG = {
  retard:  { label: 'Retard',  color: 'var(--p-yellow)', icon: '⏰' },
  absence: { label: 'Absence', color: 'var(--p-red)',    icon: '🚫' },
};

// ─── Modal de déclaration ──────────────────────────────────────────────────────
function DeclarationModal({ onClose, onSuccess }) {
  const [type,        setType]        = useState('retard');
  const [date,        setDate]        = useState(todayISO());
  const [heure,       setHeure]       = useState('');
  const [motif,       setMotif]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState(null);
  const firstFieldRef = useRef(null);

  const { selectedEleveId } = useParentCtx();

  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [saving, onClose]);

  const handleSubmit = async () => {
    setErr(null);
    if (!date) { setErr('Veuillez choisir une date.'); return; }
    if (saving) return;
    setSaving(true);
    try {
      await createDeclarationParent({
        eleveId:     selectedEleveId,
        type,
        date,
        heurePrevue: type === 'retard' && heure ? heure : null,
        motif:       motif.trim() || null,
      });
      onSuccess(); // unmounts modal — no setState after this
    } catch (e) {
      setSaving(false);
      setErr(e.message || 'Une erreur est survenue.');
    }
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-labelledby="decl-modal-title"
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background:'var(--p-bg-card)', borderRadius:'var(--p-radius)', padding:28,
        width:'100%', maxWidth:420, boxShadow:'0 24px 80px rgba(0,0,0,.5)',
      }}>
        <div id="decl-modal-title" style={{
          fontFamily:'var(--p-font-display)', fontSize:17, fontWeight:700,
          color:'var(--p-fg)', marginBottom:20,
        }}>
          Déclarer un retard ou une absence
        </div>

        {/* Toggle type */}
        <div style={{ display:'flex', gap:10, marginBottom:18 }}>
          {['retard', 'absence'].map((t, idx) => {
            const cfg = TYPE_CFG[t];
            const active = type === t;
            return (
              <button key={t} ref={idx === 0 ? firstFieldRef : null} onClick={() => setType(t)} style={{
                flex:1, padding:'10px 0', borderRadius:'var(--p-radius-sm)',
                border:`1.5px solid ${active ? cfg.color : 'var(--p-border)'}`,
                background: active ? `${cfg.color}18` : 'transparent',
                color: active ? cfg.color : 'var(--p-fg-mid)',
                fontSize:13, fontWeight:700, cursor:'pointer',
              }}>
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Date */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--p-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Date
          </label>
          <input
            type="date"
            min={todayISO()}
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width:'100%', background:'var(--p-bg)', border:'1px solid var(--p-border)',
              borderRadius:'var(--p-radius-sm)', padding:'8px 12px',
              color:'var(--p-fg)', fontSize:14, boxSizing:'border-box',
            }}
          />
        </div>

        {/* Heure prévue (retard seulement) */}
        {type === 'retard' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--p-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
              Heure d'arrivée prévue (optionnel)
            </label>
            <input
              type="time"
              value={heure}
              onChange={e => setHeure(e.target.value)}
              style={{
                width:'100%', background:'var(--p-bg)', border:'1px solid var(--p-border)',
                borderRadius:'var(--p-radius-sm)', padding:'8px 12px',
                color:'var(--p-fg)', fontSize:14, boxSizing:'border-box',
              }}
            />
          </div>
        )}

        {/* Motif */}
        <div style={{ marginBottom:20 }}>
          <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--p-fg-mid)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Motif (optionnel)
          </label>
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value.slice(0, 300))}
            placeholder="Ex : rendez-vous médical, maladie…"
            rows={3}
            style={{
              width:'100%', background:'var(--p-bg)', border:'1px solid var(--p-border)',
              borderRadius:'var(--p-radius-sm)', padding:'8px 12px',
              color:'var(--p-fg)', fontSize:13, resize:'vertical',
              fontFamily:'inherit', boxSizing:'border-box',
            }}
          />
          <div style={{ fontSize:11, color:'var(--p-fg-mid)', textAlign:'right', marginTop:3 }}>
            {motif.length}/300
          </div>
        </div>

        {err && (
          <div style={{
            padding:'10px 14px', borderRadius:'var(--p-radius-sm)',
            background:'rgba(255,69,58,.1)', border:'1px solid rgba(255,69,58,.3)',
            color:'var(--p-red)', fontSize:13, marginBottom:16,
          }}>
            {err}
          </div>
        )}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button
            onClick={onClose} disabled={saving}
            style={{
              padding:'8px 20px', borderRadius:980, border:'1px solid var(--p-border)',
              background:'transparent', color:'var(--p-fg-mid)', fontSize:13, fontWeight:600, cursor:'pointer',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit} disabled={saving || !date}
            style={{
              padding:'8px 20px', borderRadius:980, border:'none',
              background:'var(--p-gold)', color:'#fff', fontSize:13, fontWeight:700,
              cursor:'pointer', boxShadow:'0 2px 10px rgba(191,138,48,.3)',
              opacity: saving || !date ? 0.65 : 1,
            }}
          >
            {saving ? 'Envoi…' : 'Envoyer la déclaration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────
export default function ParentAbsences() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [items,       setItems]       = useState([]);
  const [decls,       setDecls]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [showModal,   setShowModal]   = useState(false);
  const [feedback,    setFeedback]    = useState(null);
  const [reloadKey,   setReloadKey]   = useState(0);

  const loadData = useCallback(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true); setError(null);
    Promise.all([
      fetchAbsencesEleve(selectedEleveId),
      fetchDeclarationsParent(selectedEleveId),
    ]).then(([abs, dcl]) => {
      if (cancelled) return;
      setItems(abs.data || []);
      setDecls(dcl.data || []);
      if (abs.error) setError(abs.error);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId, reloadKey]); // eslint-disable-line

  useEffect(() => { const cancel = loadData(); return cancel; }, [loadData]);

  const handleSuccess = () => {
    setShowModal(false);
    setFeedback('Déclaration envoyée. Elle sera visible par l\'administration et l\'enseignant de votre enfant.');
    setTimeout(() => setFeedback(null), 5000);
    setReloadKey(k => k + 1);
  };

  if (!selectedEleve) return null;
  const nbRetards  = items.filter(i => i.type === 'retard').length;
  const nbAbsences = items.filter(i => i.type === 'absence').length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* En-tête */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:6 }}>
        <div>
          <h1 style={{
            fontFamily:'var(--p-font-display)', fontSize:28, fontWeight:800,
            color:'var(--p-fg)', margin:'0 0 4px', letterSpacing:'-0.01em',
          }}>
            Retards & absences de {fmtPrenom(selectedEleve.prenom)}
          </h1>
          <p style={{ fontSize:14, color:'var(--p-fg-mid)', margin:0 }}>
            Historique communiqué par les enseignants
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'10px 18px', borderRadius:980, border:'none',
            background:'var(--p-gold)', color:'#fff',
            fontSize:13, fontWeight:700, cursor:'pointer',
            boxShadow:'0 2px 10px rgba(191,138,48,.3)', whiteSpace:'nowrap',
            flexShrink:0,
          }}
        >
          + Déclarer un retard ou une absence
        </button>
      </div>

      {/* Feedback succès */}
      {feedback && (
        <div style={{
          padding:'12px 16px', borderRadius:'var(--p-radius-sm)', marginBottom:20,
          background:'rgba(48,209,88,.1)', border:'1px solid rgba(48,209,88,.3)',
          color:'var(--p-green)', fontSize:13, fontWeight:600,
        }}>
          {feedback}
        </div>
      )}

      {/* Compteurs */}
      <div style={{ display:'flex', gap:12, marginBottom:28, marginTop:20 }}>
        <div style={{
          flex:1, padding:'18px 20px', borderRadius:'var(--p-radius)',
          background:'var(--p-bg-card)', border:'1px solid var(--p-border)',
          borderTop:'3px solid var(--p-yellow)', boxShadow:'var(--p-shadow-sm)',
        }}>
          <div style={{ fontFamily:'var(--p-font-display)', fontSize:30, fontWeight:800, color:'var(--p-yellow)', lineHeight:1 }}>{nbRetards}</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--p-fg)', marginTop:6 }}>Retard{nbRetards > 1 ? 's' : ''}</div>
        </div>
        <div style={{
          flex:1, padding:'18px 20px', borderRadius:'var(--p-radius)',
          background:'var(--p-bg-card)', border:'1px solid var(--p-border)',
          borderTop:'3px solid var(--p-red)', boxShadow:'var(--p-shadow-sm)',
        }}>
          <div style={{ fontFamily:'var(--p-font-display)', fontSize:30, fontWeight:800, color:'var(--p-red)', lineHeight:1 }}>{nbAbsences}</div>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--p-fg)', marginTop:6 }}>Absence{nbAbsences > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Historique officiel */}
      {error && !loading && (
        <div style={{
          padding:'12px 16px', borderRadius:'var(--p-radius-sm)', marginBottom:16,
          background:'rgba(255,69,58,.08)', border:'1px solid rgba(255,69,58,.25)',
          color:'var(--p-red)', fontSize:13,
        }}>
          Impossible de charger l'historique : {error}
        </div>
      )}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--p-fg-mid)' }}>Chargement…</div>
      ) : items.length === 0 ? (
        <div style={{
          padding:40, textAlign:'center', color:'var(--p-fg-mid)',
          background:'var(--p-bg-card)', borderRadius:'var(--p-radius)',
          border:'1px solid var(--p-border)',
        }}>
          Aucun retard ni absence enregistré.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map(item => {
            const cfg = TYPE_CFG[item.type] || { label: item.type, color:'var(--p-fg-mid)', icon:'❓' };
            return (
              <div key={item.id} style={{
                padding:'16px 18px', borderRadius:'var(--p-radius)',
                background:'var(--p-bg-card)', border:'1px solid var(--p-border)',
                borderLeft:`4px solid ${cfg.color}`,
                display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center',
                boxShadow:'var(--p-shadow-sm)',
              }}>
                <div>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:6,
                    padding:'4px 12px', borderRadius:999,
                    background:`${cfg.color}22`, color:cfg.color,
                    fontSize:12, fontWeight:600, marginBottom:8,
                  }}>
                    {cfg.icon} {cfg.label}
                  </div>
                  {item.commentaire && (
                    <p style={{ margin:0, fontSize:13, color:'var(--p-fg)', lineHeight:1.65 }}>
                      {item.commentaire}
                    </p>
                  )}
                </div>
                <div style={{ fontSize:13, color:'var(--p-fg-mid)', textAlign:'right', whiteSpace:'nowrap' }}>
                  {fmtDateLong(item.date)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mes déclarations envoyées */}
      {!loading && decls.length > 0 && (
        <div style={{ marginTop:36 }}>
          <h2 style={{
            fontFamily:'var(--p-font-display)', fontSize:16, fontWeight:700,
            color:'var(--p-fg)', margin:'0 0 14px', letterSpacing:'-0.01em',
          }}>
            Mes déclarations envoyées
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {decls.map(d => {
              const cfg = TYPE_CFG[d.type] || { label: d.type, color:'var(--p-fg-mid)', icon:'❓' };
              const dateLabel = fmtDateLong(d.date);
              return (
                <div key={d.id} style={{
                  padding:'13px 16px', borderRadius:'var(--p-radius-sm)',
                  background:'var(--p-bg-card)', border:'1px solid var(--p-border)',
                  borderLeft:`3px solid ${cfg.color}`,
                  display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                  boxShadow:'var(--p-shadow-sm)',
                }}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:5,
                    padding:'3px 10px', borderRadius:999,
                    background:`${cfg.color}18`, color:cfg.color,
                    fontSize:12, fontWeight:600, flexShrink:0,
                  }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--p-fg)' }}>{dateLabel}</span>
                  {d.heure_prevue && (
                    <span style={{ fontSize:12, color:'var(--p-fg-mid)' }}>Arrivée prévue : {d.heure_prevue}</span>
                  )}
                  {d.motif && (
                    <span style={{ fontSize:12, color:'var(--p-fg-mid)', fontStyle:'italic' }}>{d.motif}</span>
                  )}
                  <span style={{ marginLeft:'auto', fontSize:11, color:'var(--p-fg-mid)', whiteSpace:'nowrap' }}>
                    Soumis le {new Date(d.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <DeclarationModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
