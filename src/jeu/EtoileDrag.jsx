import { useEffect, useRef, useState } from 'react';

// SVG plutôt que l'emoji ⭐ : Chromium peut échouer à peindre certaines
// occurrences d'un même glyphe couleur quand plusieurs s'affichent coup sur
// coup (étoiles « fantômes » qui restent en simple contour). Le SVG passe
// par le rendu vectoriel classique et n'a pas ce problème.
function EtoileSvg({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} width="1em" height="1em">
      <path
        fill="#ffc93c"
        stroke="#e08a1e"
        strokeWidth="1"
        strokeLinejoin="round"
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"
      />
    </svg>
  );
}

/**
 * Réservoir d'étoiles à glisser sur le tableau « Mes bonnes lectures ».
 * Basé sur les Pointer Events (comme DragSort) → fonctionne à la souris
 * et au toucher. Chaque étoile déposée sur la zone du tableau se cale
 * automatiquement dans la prochaine case vide de `slots` (grille précise,
 * pas de dépôt libre). Le réservoir ne s'épuise jamais.
 *
 * @param {{x:number,y:number}[]} slots     Positions des cases (en %), dans l'ordre de remplissage.
 * @param {{left:number,top:number,width:number,height:number}} boardZone  Zone de dépôt du tableau (en %).
 */
export default function EtoileDrag({ slots, boardZone }) {
  const [placees, setPlacees] = useState(0);
  const [drag, setDrag] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      const el = boardRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          setPlacees((n) => Math.min(slots.length, n + 1));
        }
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, slots.length]);

  const startDrag = (e) => {
    e.preventDefault();
    setDrag({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Zone invisible utilisée uniquement pour détecter le dépôt (dimensions
          en % de l'image) — les étoiles posées, elles, sont positionnées par
          rapport à l'image entière, pas à cette boîte. */}
      <div
        ref={boardRef}
        className="jeu-etoile-board-zone"
        style={{ left: `${boardZone.left}%`, top: `${boardZone.top}%`, width: `${boardZone.width}%`, height: `${boardZone.height}%` }}
      />
      <div className="jeu-etoile-board">
        {slots.slice(0, placees).map((s, i) => (
          <EtoileSvg key={i} className="jeu-etoile-placee" style={{ left: `${s.x}%`, top: `${s.y}%` }} />
        ))}
      </div>

      <div className="jeu-etoile-tray">
        {Array.from({ length: 6 }).map((_, i) => (
          <button
            key={i}
            type="button"
            className="jeu-etoile-source"
            onPointerDown={startDrag}
            aria-label="Étoile à déposer sur le tableau"
          >
            ⭐
          </button>
        ))}
      </div>

      {drag && (
        <div className="jeu-etoile-ghost" style={{ left: drag.x, top: drag.y }}>⭐</div>
      )}
    </>
  );
}
