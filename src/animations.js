import { motion, AnimatePresence } from 'framer-motion';

// Courbes et durées — discrètes, adaptées à un ENT
const EASE = [0.22, 0.61, 0.36, 1];
const DUR  = { xs: 0.18, sm: 0.25, md: 0.35, lg: 0.5 };

// ─── Transitions de page (fade + légère translation) ────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0,  transition: { duration: DUR.md, ease: EASE } },
  exit:    { opacity: 0, y: -8, transition: { duration: DUR.sm, ease: EASE } },
};

// ─── Micro-interactions (boutons, liens cliquables) ─────────────────────────
export const tapScale = {
  whileHover: { scale: 1.02, transition: { duration: DUR.xs, ease: EASE } },
  whileTap:   { scale: 0.97, transition: { duration: 0.1,    ease: EASE } },
};

// Variante plus discrète pour cartes cliquables
export const cardHover = {
  whileHover: { y: -3, transition: { duration: DUR.sm, ease: EASE } },
  whileTap:   { scale: 0.99, transition: { duration: 0.1, ease: EASE } },
};

// ─── Apparition au scroll ───────────────────────────────────────────────────
export const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR.md, ease: EASE } },
};

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.md, ease: EASE } },
};

// Conteneur avec enfants échelonnés (listes, grilles de cartes)
export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

// ─── Composants prêts à l'emploi ────────────────────────────────────────────
export function PageTransition({ children, style, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Révèle l'élément quand il entre dans le viewport (une seule fois)
export function Reveal({ children, variants = fadeUp, amount = 0.2, style, className, as = 'div' }) {
  const MotionTag = motion[as] || motion.div;
  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      style={style}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

export { motion, AnimatePresence };
