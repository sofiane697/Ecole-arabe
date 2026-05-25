import { useEffect } from 'react';
import gsap from 'gsap';

export function usePageAnimation(containerRef, deps = []) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !el.children.length) return;
    gsap.from(el.children, {
      opacity: 0, y: 20, duration: 0.45, stagger: 0.07,
      ease: 'power2.out', clearProps: 'opacity,transform',
    });
  }, deps);
}
