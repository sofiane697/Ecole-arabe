import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { PARCOURS } from './parcoursData';
import StickerGrid from './StickerGrid';
import TarifCard from './TarifCard';
import RecapStep from './RecapStep';
import './parcours.css';

/* ══════════════════════════════════════════════════════
   ORCHESTRATEUR DU PARCOURS
   Une seule vue React qui change d'étape via un state interne.
   Les transitions entre niveaux de stickers sont animées en GSAP.
══════════════════════════════════════════════════════ */
export default function ParcoursApp({ onAtHomeChange }) {
  const [path, setPath] = useState([]);   // nœuds traversés (pôle → public → matière)
  const [tarif, setTarif] = useState(null); // formule sélectionnée
  const [done, setDone] = useState(null);   // pack envoyé (confirmation)

  const stageRef = useRef(null);

  // Nœud courant : dernier du chemin, ou la racine si on est à l'accueil
  const node = path.length ? path[path.length - 1] : PARCOURS;
  const atTarifs = !!node.tarifs && !tarif && !done;

  // À l'accueil (racine) → on autorise les sections en dessous (Contact, footer).
  // Dès qu'on entre dans le parcours → écrans plein écran, rien en dessous.
  const atHome = path.length === 0 && !tarif && !done;
  useEffect(() => { onAtHomeChange?.(atHome); }, [atHome, onAtHomeChange]);

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
    <section className={`parcours${atHome ? '' : ' is-deep'}`} id="accueil">
      <div className="parcours-glow" />
      <div className="parcours-inner" ref={stageRef}>

        {/* Barre retour + fil d'Ariane */}
        {showBar && (
          <div className="parcours-bar">
            <button type="button" className="parcours-back" onClick={back}>
              ← Retour
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

        {/* En-tête de niveau */}
        {!done && (
          <div className="parcours-head parcours-anim">
            {eyebrow && <div className="parcours-eyebrow">{eyebrow}</div>}
            <h1 className="parcours-title">{title}</h1>
            {titleAr && <div className="parcours-title-ar">{titleAr}</div>}
            {sub && <p className="parcours-sub">{sub}</p>}
          </div>
        )}

        {/* Corps : grille / tarifs / récap / confirmation */}
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
        ) : tarif ? (
          <RecapStep path={path} tarif={tarif} onSent={(pack) => { setDone(pack); toTop(); }} />
        ) : atTarifs ? (
          <div className="tarif-wrap">
            {node.meta && <p className="tarif-meta parcours-anim">{node.meta}</p>}
            <div className="tarif-grid">
              {node.tarifs.map((t) => (
                <TarifCard key={t.id} tarif={t} onChoose={() => { setTarif(t); toTop(); }} />
              ))}
            </div>
            {node.adhesion && <p className="tarif-adhesion parcours-anim">+ {node.adhesion}</p>}
          </div>
        ) : (
          <StickerGrid nodes={node.children} onPick={pick} />
        )}

      </div>
    </section>
  );
}
