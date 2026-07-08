import { useRef, useState, useEffect, useCallback } from 'react';
import TarifCard from './TarifCard';

/**
 * Cartes tarif : grille classique sur desktop (pas de carrousel), et
 * carrousel avec flèches + défilement au doigt sur mobile (cf. media
 * query ≤768px dans parcours.css, qui bascule `.tarif-grid` en rangée
 * horizontale défilante). Les flèches ne s'affichent que si le contenu
 * déborde réellement — sur desktop (grille, jamais de débordement
 * horizontal) elles ne s'affichent donc jamais, sans JS spécifique.
 *
 * @param {Array}    tarifs   Formules à afficher (node.tarifs)
 * @param {Function} onChoose Appelé avec la formule cliquée
 */
export default function TarifCarousel({ tarifs, onChoose }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // Tolérance généreuse : le padding du track peut donner un scrollLeft
    // initial de quelques px (snap/arrondi navigateur) sans qu'il y ait
    // vraiment de contenu à découvrir en arrière.
    setCanPrev(el.scrollLeft > 16);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 16);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, tarifs]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.tarif-card');
    // Lu depuis le DOM plutôt que codé en dur : le gap diffère entre le
    // desktop (grille, 1.3rem) et le mobile (carrousel plein écran, 0).
    const gap = card ? parseFloat(getComputedStyle(el).columnGap) || 0 : 0;
    const step = card ? card.getBoundingClientRect().width + gap : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <div className="tarif-carousel">
      {canPrev && (
        <button
          type="button"
          className="tarif-carousel-arrow tarif-carousel-arrow--prev"
          onClick={() => scroll(-1)}
          aria-label="Formules précédentes"
        >
          ‹
        </button>
      )}
      <div
        className={`tarif-grid${tarifs.length === 1 ? ' tarif-grid--fits' : ''}`}
        ref={trackRef}
      >
        {tarifs.map((t) => (
          <TarifCard key={t.id} tarif={t} onChoose={() => onChoose(t)} />
        ))}
      </div>
      {canNext && (
        <button
          type="button"
          className="tarif-carousel-arrow tarif-carousel-arrow--next"
          onClick={() => scroll(1)}
          aria-label="Formules suivantes"
        >
          ›
        </button>
      )}
    </div>
  );
}
