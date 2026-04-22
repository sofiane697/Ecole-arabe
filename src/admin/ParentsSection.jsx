import React, { useState } from 'react';
import { formatFoyer } from './adminUtils';
import { emptyBloc, checkDuplicateParentForBloc } from './parentsLogic';

// ─── SVG icons (stroke 1.6, neutres — hériteront de color via currentColor) ──
const IconUser = (p) => (
  <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconMail = (p) => (
  <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
  </svg>
);
const IconPhone = (p) => (
  <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconCheck = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M2 5.5 L4 7.5 L8 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconInfo = ({ size = 12, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
);
const IconLink = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);
const IconX = ({ size = 10 }) => (
  <svg width={size} height={size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M2 2 L8 8 M8 2 L2 8" />
  </svg>
);

// Petit losange doré, utilisé en séparateur décoratif
const Diamond = ({ size = 5 }) => (
  <svg width={size} height={size} viewBox="0 0 6 6" aria-hidden="true">
    <path d="M3 0 L6 3 L3 6 L0 3 Z" fill="var(--a-gold)" opacity="0.75" />
  </svg>
);

const ROMAN = ['I', 'II', 'III'];

/**
 * Section complète "Parents" réutilisée dans le wizard de conversion d'inscription
 * ET dans le modal de création directe d'élève.
 *
 * Props :
 *   - mode: 'ensemble' | 'separes'
 *   - blocs: Array<bloc> (voir emptyBloc() dans parentsLogic.js)
 *   - onChange({ mode, blocs }) → callback unique, reçoit toujours l'état complet.
 */
export default function ParentsSection({ mode, blocs, onChange }) {
  const updateBloc = (idx, patch) => {
    const next = blocs.map((b, i) => {
      if (i !== idx) return b;
      const merged = { ...b, ...patch };
      if ('email' in patch || 'telephone' in patch) {
        merged.matchedParent = null;
        merged.useExisting   = false;
      }
      return merged;
    });
    onChange({ mode, blocs: next });
  };

  const switchMode = (newMode) => {
    const newBlocs = newMode === 'separes' ? [emptyBloc(), emptyBloc()] : [emptyBloc()];
    onChange({ mode: newMode, blocs: newBlocs });
  };

  const checkDuplicate = async (idx, email, tel) => {
    const updated = await checkDuplicateParentForBloc(blocs[idx], email, tel);
    const next = blocs.map((b, i) => (i === idx ? updated : b));
    onChange({ mode, blocs: next });
  };

  return (
    <>
      {/* ─── Header : label + segmented pill qui glisse ───────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
        marginTop: 10, marginBottom: 20,
      }}>
        <label id="parents-mode-label" style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--a-fg-light)',
        }}>
          Situation familiale
        </label>
        <div
          role="radiogroup"
          aria-labelledby="parents-mode-label"
          style={{
            position: 'relative', display: 'inline-flex',
            background: 'var(--a-bg)', border: '1px solid var(--a-border)',
            borderRadius: 999, padding: 3,
          }}
        >
          {/* Indicateur glissant */}
          <span aria-hidden="true" style={{
            position: 'absolute',
            top: 3, bottom: 3,
            left: mode === 'ensemble' ? 3 : 'calc(50% + 0px)',
            width: 'calc(50% - 3px)',
            background: 'var(--a-gold)',
            borderRadius: 999,
            boxShadow: '0 1px 3px rgba(191,138,48,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
            transition: 'left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          }} />
          {[
            { key: 'ensemble', label: 'Ensemble' },
            { key: 'separes',  label: 'Séparés'  },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={mode === key}
              onClick={() => switchMode(key)}
              style={{
                position: 'relative', zIndex: 1,
                padding: '6px 18px',
                border: 'none', background: 'transparent',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
                color: mode === key ? '#fff' : 'var(--a-fg-mid)',
                cursor: 'pointer',
                transition: 'color 0.2s',
                minWidth: 82,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Blocs parents ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {blocs.map((b, idx) => (
          <ParentBloc
            key={idx}
            index={idx}
            total={blocs.length}
            bloc={b}
            onChange={patch => updateBloc(idx, patch)}
            onCheckDuplicate={(email, tel) => checkDuplicate(idx, email, tel)}
          />
        ))}
      </div>
    </>
  );
}

// ─── Bloc parent : card avec header typographique, toggles, contact ─────────
function ParentBloc({ index, total, bloc, onChange, onCheckDuplicate }) {
  const isMultiple = total > 1;
  const title = isMultiple ? `Parent` : 'Foyer';
  const matched = bloc.matchedParent;
  const locked = bloc.useExisting;

  return (
    <div style={{
      padding: '20px 22px 22px',
      borderRadius: 12,
      background: 'var(--a-bg-card)',
      border: '1px solid var(--a-border)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      opacity: locked ? 0.92 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Header : numéro romain (si séparés) + label uppercase + ligne décorative */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        {isMultiple && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: 'var(--a-gold)',
            fontFamily: 'var(--a-font-mono, "JetBrains Mono", monospace)',
            minWidth: 14, textAlign: 'center',
            letterSpacing: '0.08em',
          }}>
            {ROMAN[index] || index + 1}
          </span>
        )}
        <span style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--a-fg-mid)',
        }}>
          {title}
        </span>
        <span aria-hidden="true" style={{
          flex: 1, height: 1,
          background: 'linear-gradient(to right, var(--a-border), transparent)',
        }} />
      </div>

      {/* Toggles Père / Mère (chips au lieu de checkboxes) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: (bloc.has_pere || bloc.has_mere) ? 16 : 20 }}>
        <ParentToggle
          active={bloc.has_pere}
          onClick={() => onChange({ has_pere: !bloc.has_pere })}
          disabled={locked}
          label="Père"
          ariaLabel="Ajouter le père"
        />
        <ParentToggle
          active={bloc.has_mere}
          onClick={() => onChange({ has_mere: !bloc.has_mere })}
          disabled={locked}
          label="Mère"
          ariaLabel="Ajouter la mère"
        />
      </div>

      {/* Champs père */}
      {bloc.has_pere && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <RefinedInput
            icon={<IconUser />}
            placeholder="Prénom du père"
            ariaLabel="Prénom du père"
            value={bloc.pere_prenom}
            onChange={e => onChange({ pere_prenom: e.target.value })}
            disabled={locked}
          />
          <RefinedInput
            placeholder="Nom du père"
            ariaLabel="Nom du père"
            value={bloc.pere_nom}
            onChange={e => onChange({ pere_nom: e.target.value })}
            disabled={locked}
          />
        </div>
      )}

      {/* Champs mère */}
      {bloc.has_mere && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <RefinedInput
            icon={<IconUser />}
            placeholder="Prénom de la mère"
            ariaLabel="Prénom de la mère"
            value={bloc.mere_prenom}
            onChange={e => onChange({ mere_prenom: e.target.value })}
            disabled={locked}
          />
          <RefinedInput
            placeholder="Nom de la mère"
            ariaLabel="Nom de la mère"
            value={bloc.mere_nom}
            onChange={e => onChange({ mere_nom: e.target.value })}
            disabled={locked}
          />
        </div>
      )}

      {/* Séparateur décoratif : ligne + losange doré + ligne */}
      {(bloc.has_pere || bloc.has_mere) && (
        <div aria-hidden="true" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 2px 18px',
        }}>
          <span style={{ flex: 1, height: 1, background: 'var(--a-border)', opacity: 0.55 }} />
          <Diamond />
          <span style={{ flex: 1, height: 1, background: 'var(--a-border)', opacity: 0.55 }} />
        </div>
      )}

      {/* Contact (email + téléphone) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <RefinedInput
          icon={<IconMail />}
          type="email"
          placeholder="Email du parent"
          ariaLabel="Email du parent"
          value={bloc.email}
          onChange={e => onChange({ email: e.target.value })}
          onBlur={e => onCheckDuplicate(e.target.value, bloc.telephone)}
          disabled={locked}
        />
        <RefinedInput
          icon={<IconPhone />}
          type="tel"
          placeholder="Téléphone du parent"
          ariaLabel="Téléphone du parent"
          value={bloc.telephone}
          onChange={e => onChange({ telephone: e.target.value })}
          onBlur={e => onCheckDuplicate(bloc.email, e.target.value)}
          disabled={locked}
        />
      </div>

      {/* Bannière "parent déjà enregistré" */}
      {matched && !locked && (
        <DuplicateBanner
          matched={matched}
          onAttach={() => onChange({ useExisting: true })}
          onDismiss={() => onChange({ matchedParent: null })}
        />
      )}

      {/* Confirmation : bloc rattaché (compact) */}
      {locked && matched && (
        <div style={{
          marginTop: 12, padding: '10px 12px 10px 14px',
          borderRadius: 10,
          background: 'rgba(48,209,88,0.08)',
          border: '1px solid rgba(48,209,88,0.28)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--a-green)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <IconCheck size={11} />
          </span>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--a-fg)', lineHeight: 1.4 }}>
            Rattaché au compte <MonoChip>{matched.identifiant}</MonoChip>
          </div>
          <button
            type="button"
            onClick={() => onChange({ useExisting: false })}
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--a-fg-light)',
              background: 'transparent', border: 'none',
              cursor: 'pointer', padding: '4px 8px',
              textDecoration: 'underline', textUnderlineOffset: 2,
            }}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toggle Père/Mère : chip cliquable avec check circle ────────────────────
function ParentToggle({ active, onClick, disabled, label, ariaLabel }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        padding: '12px 16px',
        borderRadius: 10,
        border: active ? '1px solid var(--a-gold)' : '1px solid var(--a-border)',
        background: active ? 'rgba(191,138,48,0.09)' : 'var(--a-bg)',
        color: active ? 'var(--a-gold)' : 'var(--a-fg-mid)',
        fontSize: 13, fontWeight: active ? 600 : 500,
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden="true" style={{
        width: 16, height: 16, borderRadius: '50%',
        border: active ? 'none' : '1.5px solid var(--a-border)',
        background: active ? 'var(--a-gold)' : 'transparent',
        color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', flexShrink: 0,
      }}>
        {active && <IconCheck size={10} />}
      </span>
      {label}
    </button>
  );
}

// ─── Input raffiné : border dorée au focus + box-shadow ambre + icône ───────
function RefinedInput({ icon, placeholder, ariaLabel, value, onChange, onBlur, onFocus, disabled, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position: 'relative',
      display: 'flex', alignItems: 'center',
      // Sans min-width: 0, la min-content des <input type="email/tel"> pousse
      // les cellules d'un grid 1fr 1fr à déborder du conteneur parent.
      minWidth: 0, width: '100%', boxSizing: 'border-box',
      borderRadius: 10,
      background: disabled ? 'var(--a-bg)' : 'var(--a-bg-card)',
      border: focused
        ? '1px solid var(--a-gold)'
        : '1px solid var(--a-border)',
      boxShadow: focused ? '0 0 0 3px rgba(191,138,48,0.13)' : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      opacity: disabled ? 0.65 : 1,
    }}>
      {icon && (
        <span style={{
          paddingLeft: 12, display: 'inline-flex',
          color: focused ? 'var(--a-gold)' : 'var(--a-fg-light)',
          transition: 'color 0.15s',
        }}>
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        onChange={onChange}
        onFocus={(e) => { setFocused(true); if (onFocus) onFocus(e); }}
        onBlur={(e) => { setFocused(false); if (onBlur) onBlur(e); }}
        style={{
          flex: 1,
          padding: icon ? '12px 14px 12px 10px' : '12px 14px',
          border: 'none', background: 'transparent',
          color: 'var(--a-fg)', fontSize: 13.5,
          fontFamily: 'inherit',
          outline: 'none', minWidth: 0,
        }}
      />
    </div>
  );
}

// ─── Pastille monospace pour afficher un identifiant ────────────────────────
function MonoChip({ children }) {
  return (
    <code style={{
      fontFamily: 'var(--a-font-mono, "JetBrains Mono", monospace)',
      fontSize: 11.5, fontWeight: 700,
      color: 'var(--a-gold)',
      background: 'var(--a-bg)',
      padding: '2px 7px',
      borderRadius: 5,
      border: '1px solid var(--a-border)',
      letterSpacing: '0.04em',
    }}>
      {children}
    </code>
  );
}

// ─── Bannière "parent déjà enregistré" ──────────────────────────────────────
function DuplicateBanner({ matched, onAttach, onDismiss }) {
  const label = formatFoyer(matched);
  const enfants = matched?.enfants || [];
  return (
    <div style={{
      position: 'relative', marginTop: 14,
      borderRadius: 10, overflow: 'hidden',
      background: 'var(--a-bg)',
      border: '1px solid rgba(245,159,11,0.28)',
    }}>
      {/* Accent bar latérale */}
      <span aria-hidden="true" style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: 'var(--a-yellow)',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px 6px 16px',
      }}>
        <IconInfo size={13} color="var(--a-yellow)" />
        <span style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--a-yellow)',
        }}>
          Parent déjà enregistré
        </span>
      </div>

      {/* Corps */}
      <div style={{
        padding: '0 14px 12px 16px',
        fontSize: 12, color: 'var(--a-fg)', lineHeight: 1.55,
      }}>
        {label && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-fg)', marginBottom: 6 }}>{label}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 3, columnGap: 8, color: 'var(--a-fg-mid)' }}>
          <span style={{ color: 'var(--a-fg-light)' }}>Email</span>
          <span>{matched.email}</span>
          <span style={{ color: 'var(--a-fg-light)' }}>Téléphone</span>
          <span>{matched.telephone}</span>
          <span style={{ color: 'var(--a-fg-light)' }}>Identifiant</span>
          <span><MonoChip>{matched.identifiant}</MonoChip></span>
          {enfants.length > 0 && (
            <>
              <span style={{ color: 'var(--a-fg-light)' }}>Enfants</span>
              <span>
                {enfants.map((e, i) => (
                  <span key={e.eleve_id}>
                    {i > 0 && ', '}
                    {e.prenom} {e.nom}
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '8px 12px 10px 16px',
        borderTop: '1px solid var(--a-border)',
        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.02))',
      }}>
        <button
          type="button"
          onClick={onAttach}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 8,
            background: 'var(--a-green)', color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <IconLink size={12} /> Rattacher à ce compte
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 8,
            background: 'transparent', color: 'var(--a-fg-mid)',
            border: '1px solid var(--a-border)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <IconX size={10} /> Nouveau compte
        </button>
      </div>
    </div>
  );
}

// ─── Résultats post-création : cartes stylées par type (created/linked/failed)
export function ParentResults({ results }) {
  if (!results || results.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
      {results.map((r, i) => (
        <ResultCard key={i} result={r} />
      ))}
    </div>
  );
}

function ResultCard({ result: r }) {
  const variants = {
    created: {
      color: 'var(--a-green)', bg: 'rgba(52,212,114,0.06)', border: 'rgba(52,212,114,0.30)',
      label: 'Compte parent créé', icon: <IconCheck size={11} />,
    },
    linked: {
      color: 'var(--a-blue)', bg: 'rgba(85,150,247,0.06)', border: 'rgba(85,150,247,0.30)',
      label: 'Parent rattaché', icon: <IconLink size={11} />,
    },
    failed: {
      color: 'var(--a-red)', bg: 'rgba(240,85,85,0.06)', border: 'rgba(240,85,85,0.30)',
      label: 'Échec du parent', icon: <IconX size={10} />,
    },
  };
  const v = variants[r.kind] || variants.failed;

  return (
    <div style={{
      position: 'relative',
      borderRadius: 10, overflow: 'hidden',
      background: v.bg, border: `1px solid ${v.border}`,
    }}>
      <span aria-hidden="true" style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: v.color,
      }} />
      <div style={{ padding: '10px 14px 10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ color: v.color, display: 'inline-flex' }}>{v.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: v.color,
          }}>
            {v.label}
          </span>
          {r.label && (
            <span style={{ fontSize: 12, color: 'var(--a-fg-mid)', marginLeft: 'auto' }}>
              {r.label}
            </span>
          )}
        </div>
        {r.kind === 'failed' ? (
          <div style={{ fontSize: 12, color: 'var(--a-fg-mid)', lineHeight: 1.5 }}>
            {r.error}. L'élève est bien créé — relance la création du parent depuis sa fiche.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 3, columnGap: 10, fontSize: 12, color: 'var(--a-fg-mid)' }}>
            <span style={{ color: 'var(--a-fg-light)' }}>Identifiant</span>
            <span><MonoChip>{r.identifiant}</MonoChip>{r.kind === 'linked' && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--a-fg-light)' }}>(déjà transmis)</span>}</span>
            {r.kind === 'created' && (
              <>
                <span style={{ color: 'var(--a-fg-light)' }}>Mot de passe</span>
                <span><MonoChip>{r.password}</MonoChip></span>
              </>
            )}
            {r.kind === 'linked' && (
              <>
                <span />
                <span style={{ fontSize: 11, color: 'var(--a-fg-light)', fontStyle: 'italic' }}>
                  Le parent utilise le mot de passe déjà en sa possession.
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
