import React, { useState, useRef, useEffect, useCallback } from 'react';

export const SCALE_MIN = 1.0;
export const SCALE_MAX = 3.0;
const SCALE_STEP_WHEEL = 0.08;
const WHEEL_COMMIT_MS = 300;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// `+ Number.EPSILON` compense les imprécisions IEEE 754 avant l'arrondi
// (sinon ex: 1.005 * 100 = 100.49999… arrondi à 100 au lieu de 101).
const round = (v, decimals) => {
  const k = 10 ** decimals;
  return Math.round((v + Number.EPSILON) * k) / k;
};

/**
 * Arrondit et borne une valeur de cadrage au format DB.
 * - scale : 2 décimales, dans [SCALE_MIN, SCALE_MAX]
 * - pos_x / pos_y : 1 décimale, dans [0, 100]
 */
export function normalizeCrop(scale, posX, posY) {
  return {
    scale: round(clamp(scale, SCALE_MIN, SCALE_MAX), 2),
    posX:  round(clamp(posX,  0, 100), 1),
    posY:  round(clamp(posY,  0, 100), 1),
  };
}

/**
 * Éditeur de cadrage non-destructif pour une photo de profil élève.
 *
 * - **drag** (souris ou toucher) pour repositionner (pan),
 * - **molette** (desktop) pour zoomer,
 * - **slider** HTML sous la photo pour zoomer (universel mobile/desktop).
 *
 * Le composant maintient un state local pour la preview fluide et n'appelle
 * `onChange(scale, posX, posY)` qu'au **relâchement** (fin de drag, molette settle,
 * slider release) afin de ne pas saturer le back-end.
 *
 * @param {object} props
 * @param {string} props.photoUrl
 * @param {number} props.scale
 * @param {number} props.posX
 * @param {number} props.posY
 * @param {(scale: number, posX: number, posY: number) => void} props.onChange
 * @param {number} [props.size=180]
 * @param {boolean} [props.disabled=false]
 */
export default function PhotoEditor({
  photoUrl,
  scale: scaleProp,
  posX: posXProp,
  posY: posYProp,
  onChange,
  size = 180,
  disabled = false,
}) {
  // Les props initiales ne sont lues qu'au montage. Le parent doit utiliser
  // `key={eleve.id}` pour remounter le composant quand il change d'élève.
  // Ça évite les useEffect de resync props→state (anti-pattern React) et
  // les conflits avec l'état local pendant un drag.
  const [scale, setScale] = useState(scaleProp);
  const [posX, setPosX] = useState(posXProp);
  const [posY, setPosY] = useState(posYProp);

  const containerRef = useRef(null);
  const dragStateRef = useRef(null);
  const wheelTimerRef = useRef(null);

  // Refs miroirs — **mises à jour synchrones par les setters ci-dessous** (pas via
  // useEffect) pour éviter un bug de timing : si le re-render + useEffect miroir
  // n'a pas été flushé quand mouseup déclenche commit(), la ref serait en retard
  // d'un tick → la DB recevrait la position N-1 alors que l'UI affiche N,
  // causant un cadrage différent entre éditeur et fiche.
  const scaleRef = useRef(scale);
  const posXRef  = useRef(posX);
  const posYRef  = useRef(posY);

  const updateScale = (v) => { scaleRef.current = v; setScale(v); };
  const updatePosX  = (v) => { posXRef.current  = v; setPosX(v);  };
  const updatePosY  = (v) => { posYRef.current  = v; setPosY(v);  };

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const commit = useCallback(() => {
    const n = normalizeCrop(scaleRef.current, posXRef.current, posYRef.current);
    onChangeRef.current(n.scale, n.posX, n.posY);
  }, []);

  // ─── Drag (souris + toucher) ─────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (disabled) return;
    // Ignorer le multi-touch (pinch zoom natif) pour éviter un drag incohérent.
    if ('touches' in e && e.touches.length > 1) return;
    e.preventDefault();
    const point = 'touches' in e ? e.touches[0] : e;
    dragStateRef.current = {
      startX: point.clientX,
      startY: point.clientY,
      startPosX: posXRef.current,
      startPosY: posYRef.current,
    };
  };

  // Binding global une seule fois — les handlers lisent les refs pour rester à jour.
  useEffect(() => {
    const handleMove = (e) => {
      const drag = dragStateRef.current;
      if (!drag || !containerRef.current) return;
      if ('touches' in e && e.touches.length > 1) return;
      const point = 'touches' in e ? e.touches[0] : e;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXpct = ((point.clientX - drag.startX) / rect.width) * 100;
      const deltaYpct = ((point.clientY - drag.startY) / rect.height) * 100;
      // Compensation par le zoom : au plus l'image est agrandie, au plus un pixel
      // couvre peu de % de l'image → on divise pour garder un ressenti cohérent.
      const s = scaleRef.current;
      updatePosX(clamp(drag.startPosX - deltaXpct / s, 0, 100));
      updatePosY(clamp(drag.startPosY - deltaYpct / s, 0, 100));
    };
    const handleUp = () => {
      if (!dragStateRef.current) return;
      dragStateRef.current = null;
      commit();
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    window.addEventListener('touchcancel', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
      window.removeEventListener('touchcancel', handleUp);
    };
  }, [commit]);

  // ─── Molette (bindée manuellement en non-passive pour pouvoir preventDefault) ─
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const handleWheel = (e) => {
      if (disabled) return;
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      const next = clamp(scaleRef.current + dir * SCALE_STEP_WHEEL, SCALE_MIN, SCALE_MAX);
      updateScale(next);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        commit();
        wheelTimerRef.current = null;
      }, WHEEL_COMMIT_MS);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [disabled, commit]);

  // Nettoyage du timer au démontage.
  useEffect(() => () => {
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
  }, []);

  // ─── Slider ──────────────────────────────────────────────────────────────
  const handleSliderChange = (e) => updateScale(parseFloat(e.target.value));
  const handleSliderCommit = () => commit();

  const handleReset = () => {
    updateScale(1.0);
    updatePosX(50);
    updatePosY(50);
    onChangeRef.current(1.0, 50, 50);
  };

  // Pan au clavier : accessibilité — déplace la position de 5 % par touche.
  const handleKeyDown = (e) => {
    if (disabled) return;
    const STEP = 5;
    let newX = posXRef.current;
    let newY = posYRef.current;
    switch (e.key) {
      case 'ArrowLeft':  newX = clamp(newX - STEP, 0, 100); break;
      case 'ArrowRight': newX = clamp(newX + STEP, 0, 100); break;
      case 'ArrowUp':    newY = clamp(newY - STEP, 0, 100); break;
      case 'ArrowDown':  newY = clamp(newY + STEP, 0, 100); break;
      default: return;
    }
    e.preventDefault();
    updatePosX(newX);
    updatePosY(newY);
    onChangeRef.current(scaleRef.current, newX, newY);
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${scale})`,
    transformOrigin: 'center',
    userSelect: 'none',
    pointerEvents: 'none',
    display: 'block',
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    position: 'relative',
    background: 'var(--a-bg-input)',
    border: '1px solid var(--a-border)',
    cursor: disabled ? 'default' : 'grab',
    touchAction: 'none',
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div
        ref={containerRef}
        style={containerStyle}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="group"
        aria-label="Éditeur de cadrage — glisser ou flèches du clavier pour déplacer, molette ou slider pour zoomer"
      >
        <img src={photoUrl} alt="" style={imgStyle} draggable={false} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: size + 40 }}>
        <span style={{ fontSize: 11, color: 'var(--a-fg-light)', fontWeight: 600 }} aria-hidden="true">−</span>
        <input
          type="range"
          min={SCALE_MIN}
          max={SCALE_MAX}
          step={0.05}
          value={scale}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          onKeyUp={handleSliderCommit}
          disabled={disabled}
          aria-label="Zoom"
          aria-valuetext={`Zoom ${Math.round(scale * 100)} %`}
          style={{ flex: 1, accentColor: 'var(--a-gold)' }}
        />
        <span style={{ fontSize: 11, color: 'var(--a-fg-light)', fontWeight: 600 }} aria-hidden="true">+</span>
      </div>

      {(scale !== 1 || posX !== 50 || posY !== 50) && !disabled && (
        <button
          type="button"
          onClick={handleReset}
          style={{
            background: 'transparent',
            border: '1px solid var(--a-border)',
            color: 'var(--a-fg-mid)',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Réinitialiser le cadrage
        </button>
      )}
    </div>
  );
}
