import { useEffect, useRef, useState } from 'react';

// Dimensions réelles de l'image de la leçon (cf. LECTURE_LECON / ETOILE_SLOTS
// dans JeuApp.jsx) — le viewBox reprend ces pixels 1:1 pour que les étoiles
// gardent une taille et des proportions correctes quel que soit l'écran.
const IMG_W = 887;
const IMG_H = 1774;
const RAYON_EXT = 19; // rayon extérieur d'une étoile, en pixels de l'image (887 de large)
const RAYON_INT = RAYON_EXT * 0.38;

// Calcule directement les coordonnées absolues d'une étoile à 5 branches
// centrée sur (cx, cy), sans passer par `transform` (translate/scale) —
// un seul calcul simple, pas de composition de transformations.
export function etoileD(cx, cy, rExt = RAYON_EXT, rInt = RAYON_INT) {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rExt : rInt;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return `M${points.map((p) => p.join(',')).join('L')}Z`;
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
          en % de l'image) — le SVG des étoiles posées, lui, couvre toute
          l'image et positionne chaque étoile via son propre viewBox. */}
      <div
        ref={boardRef}
        className="jeu-etoile-board-zone"
        style={{ left: `${boardZone.left}%`, top: `${boardZone.top}%`, width: `${boardZone.width}%`, height: `${boardZone.height}%` }}
      />
      <svg
        className="jeu-etoile-board"
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        preserveAspectRatio="none"
      >
        {/* Un seul <path> combinant toutes les étoiles déposées (sous-tracés
            concaténés) plutôt qu'un <path> par étoile — un seul élément à
            gérer, plus simple et plus léger. */}
        {placees > 0 && (
          <path
            d={slots
              .slice(0, placees)
              .map((s) => etoileD((s.x / 100) * IMG_W, (s.y / 100) * IMG_H))
              .join(' ')}
            fill="#ffc93c"
            stroke="#e08a1e"
            strokeWidth={1.5}
          />
        )}
      </svg>

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
