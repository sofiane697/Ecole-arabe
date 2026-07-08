import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { PARCOURS } from './parcoursData';
import StickerGrid from './StickerGrid';
import TarifCarousel from './TarifCarousel';
import RecapStep from './RecapStep';
import DevisStep from './DevisStep';
import IslamUniverse from './IslamUniverse';
import './parcours.css';

/* ══════════════════════════════════════════════════════
   ORCHESTRATEUR DU PARCOURS
   Une seule vue React qui change d'étape via un state interne.
   Les transitions entre niveaux de stickers sont animées en GSAP.
══════════════════════════════════════════════════════ */
export default function ParcoursApp({ onAtHomeChange, onIslamChange }) {
  const [path, setPath] = useState([]);   // nœuds traversés (pôle → public → matière)
  const [tarif, setTarif] = useState(null); // formule sélectionnée
  const [done, setDone] = useState(null);   // pack envoyé (confirmation)

  const stageRef = useRef(null);

  // Nœud courant : dernier du chemin, ou la racine si on est à l'accueil
  const node = path.length ? path[path.length - 1] : PARCOURS;
  const atTarifs = !!node.tarifs && !tarif && !done;
  const atDevis = !!node.devis && !done; // feuille « devis sur mesure »
  // Branche « Enseignement religieux » → univers islamique appliqué partout (stickers, tarifs, envoi).
  const inIslam = path[0]?.id === 'enseignement-religieux';
  // Écran d'accueil de l'univers (header sacré « Les sources du savoir ») = 1er niveau seulement.
  const atIslamUniverse = inIslam && path.length === 1 && !tarif && !done;

  // À l'accueil (racine) → on autorise les sections en dessous (Contact, footer).
  // Dès qu'on entre dans le parcours → écrans plein écran, rien en dessous.
  const atHome = path.length === 0 && !tarif && !done;
  useEffect(() => { onAtHomeChange?.(atHome); }, [atHome, onAtHomeChange]);
  useEffect(() => { onIslamChange?.(inIslam); }, [inIslam, onIslamChange]);

  const toTop = () => window.scrollTo({ top: 0 });

  // Clé d'étape : change à chaque transition → déclenche l'animation d'entrée
  const stepKey = done
    ? 'done'
    : tarif
    ? 'recap'
    : path.map((n) => n.id).join('/') + (atTarifs ? ':tarifs' : ':grid');

  // ─── Animation d'entrée GSAP à chaque changement d'étape ───
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.parcours-anim', {
        y: 26,
        opacity: 0,
        scale: 0.98,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.06,
      });
    }, stageRef);
    return () => ctx.revert();
  }, [stepKey]);

  // ─── Navigation ───
  const pick = (n) => { setPath((p) => [...p, n]); toTop(); };   // descendre d'un niveau
  const back = () => {
    toTop();
    if (tarif) return setTarif(null);
    setPath((p) => p.slice(0, -1));
  };
  const reset = () => { setPath([]); setTarif(null); setDone(null); toTop(); };

  // ─── En-tête selon l'étape ───
  let eyebrow, title, titleAr, sub;
  if (done) {
    eyebrow = null;
  } else if (tarif) {
    eyebrow = 'Récapitulatif'; title = 'Votre demande';
  } else if (atDevis) {
    eyebrow = path.length > 1 ? path[path.length - 2].label : 'Devis';
    title = node.label;
    sub = 'Décrivez-nous votre besoin.';
  } else if (atTarifs) {
    eyebrow = 'Tarifs'; title = node.label; titleAr = node.ar;
    sub = 'Choisissez la formule qui vous convient.';
  } else if (path.length === 0) {
    eyebrow = 'Educamoov';
    title = 'Que souhaitez-vous découvrir ?';
    sub = 'Choisissez un domaine pour commencer.';
  } else {
    eyebrow = 'Choisissez'; title = node.label; titleAr = node.ar; sub = node.desc;
  }

  const showBar = !done && (path.length > 0 || !!tarif);

  return (
    <section className={`parcours${atHome ? '' : ' is-deep'}${inIslam ? ' is-islam' : ''}`} id="accueil">
      <div className={`islam-bg${inIslam ? ' is-on' : ''}`} aria-hidden="true" />
      <div className="parcours-glow" />
      <div className="parcours-inner" ref={stageRef}>

        {/* Barre retour + fil d'Ariane */}
        {showBar && (
          <div className="parcours-bar">
            <button type="button" className="parcours-back" onClick={back}>
              <span className="parcours-back-arrow" aria-hidden="true">←</span> Retour
            </button>
            {path.length > 0 && (
              <span className="parcours-crumbs">
                {path.map((n, i) => (
                  <span key={n.id}>
                    {i > 0 && ' › '}
                    {i === path.length - 1 ? <b>{n.label}</b> : n.label}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* En-tête de niveau (masqué dans l'univers islamique qui a son propre header) */}
        {!done && !atIslamUniverse && (
          <div className="parcours-head parcours-anim">
            {eyebrow && <div className="parcours-eyebrow">{eyebrow}</div>}
            <h1 className="parcours-title">{title}</h1>
            {titleAr && <div className="parcours-title-ar">{titleAr}</div>}
            {sub && <p className="parcours-sub">{sub}</p>}
          </div>
        )}

        {/* Corps : univers / grille / tarifs / récap / confirmation */}
        {done ? (
          <div className="parcours-done parcours-anim">
            <div className="parcours-done-ico">✓</div>
            <h3>Demande envoyée</h3>
            <p>
              Merci {done.coord.prenom} ! Votre demande pour «&nbsp;{done.choix.join(' · ')}&nbsp;»
              a bien été prise en compte. Nous vous recontacterons sous 24h.
            </p>
            <button type="button" className="recap-send" onClick={reset}>
              Faire une nouvelle demande
            </button>
          </div>
        ) : atIslamUniverse ? (
          <IslamUniverse node={node} onPick={pick} />
        ) : tarif ? (
          <RecapStep path={path} tarif={tarif} onSent={(pack) => { setDone(pack); toTop(); }} />
        ) : atDevis ? (
          <DevisStep path={path} onSent={(pack) => { setDone(pack); toTop(); }} />
        ) : atTarifs ? (
          <div className="tarif-wrap">
            {node.meta && <p className="tarif-meta parcours-anim">{node.meta}</p>}
            <TarifCarousel
              tarifs={node.tarifs}
              onChoose={(t) =>
                t.tarifs
                  ? pick({ id: t.id, label: t.niveau || t.titre, ar: t.ar, tarifs: t.tarifs })
                  : (setTarif(t), toTop())
              }
            />
          </div>
        ) : (
          <StickerGrid nodes={node.children} onPick={pick} />
        )}

      </div>
    </section>
  );
}
