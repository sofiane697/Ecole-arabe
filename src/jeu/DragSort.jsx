import { useEffect, useRef, useState } from 'react';

/**
 * Défi de tri par glisser-déposer, à deux catégories.
 * Basé sur les Pointer Events (pas le drag HTML natif, non fiable au
 * doigt) → fonctionne pareil à la souris et au toucher.
 *
 * @param {Array}    items    [{ id, mot, famille }] — famille = id de la bonne zone
 * @param {Array}    zones    [{ id, label, emoji, couleur }]
 * @param {Function} onDone   Appelé avec { erreurs } une fois tous les mots placés
 */
export default function DragSort({ items, zones, onDone }) {
  const [placed, setPlaced] = useState({});     // itemId -> zoneId (une fois correct)
  const [wrong, setWrong] = useState(null);      // itemId en train de rebondir (erreur)
  const [erreurs, setErreurs] = useState(0);
  const [drag, setDrag] = useState(null);        // { id, x, y, offX, offY }
  const zoneRefs = useRef({});
  const doneCalledRef = useRef(false);

  const restants = items.filter((it) => !placed[it.id]);

  useEffect(() => {
    if (restants.length === 0 && items.length > 0 && !doneCalledRef.current) {
      doneCalledRef.current = true;
      onDone?.({ erreurs });
    }
  }, [restants.length, items.length, erreurs, onDone]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => setDrag((d) => d && { ...d, x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      let landedZone = null;
      for (const [zoneId, el] of Object.entries(zoneRefs.current)) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          landedZone = zoneId;
          break;
        }
      }
      setDrag((d) => {
        if (!d) return null;
        if (landedZone) {
          const item = items.find((it) => it.id === d.id);
          if (item.famille === landedZone) {
            setPlaced((p) => ({ ...p, [item.id]: landedZone }));
          } else {
            setErreurs((n) => n + 1);
            setWrong(item.id);
            setTimeout(() => setWrong(null), 420);
          }
        }
        return null;
      });
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [drag, items]);

  const startDrag = (item) => (e) => {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    setDrag({ id: item.id, x: e.clientX, y: e.clientY, offX: e.clientX - r.left, offY: e.clientY - r.top, w: r.width, h: r.height });
  };

  return (
    <div className="jeu-dragsort">
      <div className="jeu-dragsort-zones">
        {zones.map((z) => (
          <div
            key={z.id}
            ref={(el) => { zoneRefs.current[z.id] = el; }}
            className="jeu-dragsort-zone"
            style={{ '--zone-c': z.couleur }}
          >
            <span className="jeu-dragsort-zone-emoji">{z.emoji}</span>
            <span className="jeu-dragsort-zone-label">{z.label}</span>
            <div className="jeu-dragsort-zone-items">
              {items.filter((it) => placed[it.id] === z.id).map((it) => (
                <span key={it.id} className="jeu-dragsort-chip jeu-dragsort-chip--done">{it.mot}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="jeu-dragsort-pool">
        {restants.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`jeu-dragsort-chip${wrong === it.id ? ' is-wrong' : ''}${drag?.id === it.id ? ' is-dragging' : ''}`}
            onPointerDown={startDrag(it)}
          >
            {it.mot}
          </button>
        ))}
      </div>

      {drag && (
        <div
          className="jeu-dragsort-ghost"
          style={{ left: drag.x - drag.offX, top: drag.y - drag.offY, width: drag.w }}
        >
          {items.find((it) => it.id === drag.id)?.mot}
        </div>
      )}
    </div>
  );
}
