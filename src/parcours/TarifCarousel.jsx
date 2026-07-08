import { useRef, useState, useEffect, useCallback } from 'react';
import TarifCard from './TarifCard';

/**
 * Carrousel horizontal des cartes tarif (version web) : défilement au
 * doigt/molette + flèches, avec repli en liste empilée classique sur
 * mobile (cf. media query ≤768px dans parcours.css — les flèches restent
 * dans le DOM mais sont masquées, pas de JS spécifique à débrancher).
 *
 * @param {Array}    tarifs   Formules à afficher (node.tarifs)
 * @param {Function} onChoose Appelé avec la formule cliquée
 */
export default function TarifCarousel({ tarifs, onChoose }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  // Distinct de canPrev/canNext (qui dépendent de la position de scroll) :
  // vrai dès que tout tient déjà à l'écran → cartes centrées plutôt que
  // plaquées à gauche avec du vide à droite.
  const [overflows, setOverflows] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    setOverflows(el.scrollWidth > el.clientWidth + 4);
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
    const gap = 1.3 * 16; // 1.3rem, cf. parcours.css .tarif-grid { gap }
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
        className={`tarif-grid${tarifs.length === 1 || !overflows ? ' tarif-grid--fits' : ''}`}
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
