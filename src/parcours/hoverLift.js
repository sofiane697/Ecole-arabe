import gsap from 'gsap';

// Effet « lift » au survol — en GSAP (règle du projet : animations en GSAP).
// Partagé par les stickers et les cartes tarifs.
const lift = (y, scale) => (e) =>
  gsap.to(e.currentTarget, { y, scale, duration: 0.3, ease: 'power3.out' });

export const cardEnter = lift(-6, 1.02);
export const cardLeave = lift(0, 1);
