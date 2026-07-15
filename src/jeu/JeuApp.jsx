import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MAISON_TAARIF } from './jeuData';
import DragSort from './DragSort';
import kidsTaarif from './assets/kids-taarif.png';
import royaumeMap from './assets/royaume-map.jpg';
import villageScene from './assets/village-scene.jpg';
import porteShamsiya from './assets/porte-shamsiya.jpg';
import porteQamariya from './assets/porte-qamariya.jpg';
import './jeu.css';

const SCENES = { shamsiya: porteShamsiya, qamariya: porteQamariya };

// Repères sur la carte du Royaume (en % de l'image) — un seul point d'entrée
// actif pour l'instant (Village du Coran, qui contient la maison ال التعريف).
// Les autres maisons du Palais des Lettres sont affichées pour l'immersion
// mais pas encore développées.
const REPERES_CARTE = [
  { id: 'village', label: 'Village du Coran', x: 89, y: 20, actif: true },
  { id: 'tresor', label: 'Le trésor caché', x: 12, y: 20, actif: false },
  { id: 'voyelles-courtes', label: 'Maison des voyelles courtes', x: 22, y: 31, actif: false },
  { id: 'voyelles-longues', label: 'Maison des voyelles longues', x: 15, y: 54, actif: false },
  { id: 'soukoun', label: 'Maison du soukoun', x: 89, y: 38, actif: false },
  { id: 'doubles-voyelles', label: 'Maison des doubles voyelles', x: 90, y: 59, actif: false },
];

// Les 3 maisons du Village du Coran — seule « ال التعريف » est développée.
const MAISONS_VILLAGE = [
  { id: 'waqf', label: 'Les secrets du Waqf', x: 18, y: 40, actif: false },
  { id: 'noun-mim', label: 'Les secrets du Noun et Mim', x: 50, y: 40, actif: false },
  { id: 'taarif', label: "Les secrets de « ال » التعريف", x: 85, y: 38, actif: true },
];

const VILLAGE_NARRATION =
  "Le Coran est la parole d'Allah, révélée à notre Prophète. Pour bien le lire, il est important d'apprendre les règles de tajwid. Dans cette aventure, nous allons découvrir des secrets merveilleux qui rendent notre récitation plus belle et plus juste. Bienvenue au Village du Coran !";

function speak(text, lang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.82;
  window.speechSynthesis.speak(u);
}

function VoiceBtn({ text, lang = 'ar-SA', className = 'jeu-voice-btn' }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label="Écouter la prononciation"
      onClick={(e) => { e.stopPropagation(); speak(text, lang); }}
    >
      🔊
    </button>
  );
}

/**
 * Prototype du jeu « Le Royaume du Coran » — une seule maison pour l'instant
 * (« ال » التعريف), pour valider le gameplay avant de transcrire le reste
 * du contenu (149 pages du PDF fourni par Sofiane).
 *
 * Parcours : carte du Royaume → intro maison → 2 portes (scènes réelles avec
 * les mascottes) → salle de jeux (tri par glisser-déposer, débloquée une fois
 * les 2 portes visitées) → réussite.
 */
export default function JeuApp() {
  const [ecran, setEcran] = useState('carte');       // carte | village | intro | portes | lecon | defi | reussite
  const [porteActive, setPorteActive] = useState(null);
  const [portesVues, setPortesVues] = useState([]);
  const [resultat, setResultat] = useState(null);
  const [repereVerrouille, setRepereVerrouille] = useState(null);
  const [maisonVerrouillee, setMaisonVerrouillee] = useState(null);

  const maison = MAISON_TAARIF;
  const toutesPortesVues = maison.portes.every((p) => portesVues.includes(p.id));

  const ouvrirPorte = (porteId) => { setPorteActive(porteId); setEcran('lecon'); };
  const fermerPorte = () => {
    setPortesVues((v) => (v.includes(porteActive) ? v : [...v, porteActive]));
    setPorteActive(null);
    setEcran('portes');
  };
  const cliquerRepere = (repere) => {
    if (!repere.actif) {
      setRepereVerrouille(repere.id);
      setTimeout(() => setRepereVerrouille((r) => (r === repere.id ? null : r)), 1600);
      return;
    }
    setEcran('village');
  };
  const cliquerMaisonVillage = (m) => {
    if (!m.actif) {
      setMaisonVerrouillee(m.id);
      setTimeout(() => setMaisonVerrouillee((v) => (v === m.id ? null : v)), 1600);
      return;
    }
    setEcran('intro');
  };

  const zones = maison.portes.map((p) => ({ id: p.id, label: p.sousTitre, emoji: p.mascotte, couleur: p.couleur }));
  const defiItems = maison.evaluation.map((m, i) => ({ id: `m${i}`, mot: m.mot, famille: m.famille }));

  const retourLabel = ecran === 'village' ? '← Carte du Royaume' : '← Village du Coran';
  const retourCible = ecran === 'village' ? 'carte' : 'village';

  return (
    <div className={`jeu-app${ecran === 'carte' || ecran === 'village' ? ' jeu-app--carte' : ''}`}>
      <div className="jeu-topbar">
        {ecran === 'carte'
          ? <Link to="/" className="jeu-back">← Quitter</Link>
          : <button type="button" className="jeu-back jeu-back-btn" onClick={() => setEcran(retourCible)}>{retourLabel}</button>}
        <span className="jeu-topbar-title">Le Royaume du Coran</span>
      </div>

      {ecran === 'carte' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={royaumeMap} alt="Carte du Royaume du Coran" className="jeu-carte-img" />
            {REPERES_CARTE.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`jeu-repere${r.actif ? ' is-actif' : ' is-verrouille'}`}
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
                onClick={() => cliquerRepere(r)}
              >
                <span className="jeu-repere-point" />
                <span className="jeu-repere-label">{r.label}</span>
                {repereVerrouille === r.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {ecran === 'village' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={villageScene} alt="Village du Coran" className="jeu-carte-img" />
            {MAISONS_VILLAGE.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`jeu-repere${m.actif ? ' is-actif' : ' is-verrouille'}`}
                style={{ left: `${m.x}%`, top: `${m.y}%` }}
                onClick={() => cliquerMaisonVillage(m)}
              >
                <span className="jeu-repere-point" />
                <span className="jeu-repere-label">{m.label}</span>
                {maisonVerrouillee === m.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
          </div>
          <div className="jeu-village-dialogue">
            <VoiceBtn text={VILLAGE_NARRATION} lang="fr-FR" className="jeu-voice-btn jeu-voice-btn--village" />
            <p>Bienvenue au Village du Coran ! Découvrons ensemble les secrets de la belle récitation.</p>
          </div>
        </div>
      )}

      {ecran === 'intro' && (
        <div className="jeu-screen jeu-intro">
          <img src={kidsTaarif} alt="" className="jeu-intro-kids" />
          <h1 className="jeu-title">{maison.nom}</h1>
          <p className="jeu-title-ar">{maison.nomAr}</p>
          <p className="jeu-desc">{maison.desc}</p>
          <button type="button" className="jeu-btn" onClick={() => setEcran('portes')}>
            Entrer dans la maison →
          </button>
        </div>
      )}

      {ecran === 'portes' && (
        <div className="jeu-screen jeu-portes-screen">
          <h2 className="jeu-h2">Choisis une porte</h2>
          <div className="jeu-portes-scenes">
            {maison.portes.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`jeu-porte-scene${portesVues.includes(p.id) ? ' is-vue' : ''}`}
                style={{ '--porte-c': p.couleur, backgroundImage: `url(${SCENES[p.id]})` }}
                onClick={() => ouvrirPorte(p.id)}
              >
                {portesVues.includes(p.id) && <span className="jeu-porte-check">✓</span>}
                <span className="jeu-porte-scene-label">{p.nom}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`jeu-salle-jeux${!toutesPortesVues ? ' is-locked' : ''}`}
            disabled={!toutesPortesVues}
            onClick={() => setEcran('defi')}
          >
            {!toutesPortesVues ? '🔒 Visite les 2 portes pour débloquer' : '🎮 Entrer dans la salle de jeux →'}
          </button>
        </div>
      )}

      {ecran === 'lecon' && porteActive && (
        <LeconPorte porte={maison.portes.find((p) => p.id === porteActive)} onFini={fermerPorte} />
      )}

      {ecran === 'defi' && (
        <div className="jeu-screen">
          <h2 className="jeu-h2">Salle de jeux — trie les mots</h2>
          <p className="jeu-desc">Fais glisser chaque mot vers la bonne maison.</p>
          <DragSort
            items={defiItems}
            zones={zones}
            onDone={(r) => { setResultat(r); setEcran('reussite'); }}
          />
        </div>
      )}

      {ecran === 'reussite' && resultat && (
        <div className="jeu-screen jeu-reussite">
          <div className="jeu-etoiles">
            {[0, 1, 2].map((i) => {
              const etoilesGagnees = resultat.erreurs === 0 ? 3 : resultat.erreurs <= 2 ? 2 : 1;
              const allumee = i < etoilesGagnees;
              return (
                <span key={i} className={`jeu-etoile${allumee ? '' : ' is-off'}`}>
                  {allumee ? '⭐' : '☆'}
                </span>
              );
            })}
          </div>
          <h2 className="jeu-h2">Bravo, maison terminée !</h2>
          <p className="jeu-desc">
            {resultat.erreurs === 0
              ? 'Aucune erreur, parfait !'
              : `${resultat.erreurs} erreur${resultat.erreurs > 1 ? 's' : ''} en route, continue de t'entraîner.`}
          </p>
          <button type="button" className="jeu-btn" onClick={() => { setEcran('portes'); setResultat(null); }}>
            Retour à la maison
          </button>
        </div>
      )}
    </div>
  );
}

function LeconPorte({ porte, onFini }) {
  return (
    <div className="jeu-screen jeu-lecon">
      <div className="jeu-lecon-head" style={{ '--porte-c': porte.couleur }}>
        <span className="jeu-lecon-emoji">{porte.mascotte}</span>
        <div>
          <h2 className="jeu-h2">{porte.nom}</h2>
          <p className="jeu-lecon-sous">{porte.sousTitre}</p>
        </div>
      </div>

      {porte.regles.map((r, i) => (
        <div className="jeu-regle" key={i}>
          <p className="jeu-regle-titre">{r.titre}</p>
          <ul className="jeu-regle-points">
            {r.points.map((pt, j) => <li key={j}>{pt}</li>)}
          </ul>
          <div className="jeu-regle-exemple">
            <span className="jeu-regle-exemple-mot">{r.exemple.mot}</span>
            <span className="jeu-regle-exemple-note">{r.exemple.note}</span>
            <VoiceBtn text={r.exemple.mot} />
          </div>
        </div>
      ))}

      <p className="jeu-astuce">💡 {porte.astuce}</p>

      <div className="jeu-lecture">
        <p className="jeu-lecture-titre">Coin lecture — écoute et lis les mots</p>
        <div className="jeu-lecture-grid">
          {porte.lecture.map((mot, i) => (
            <button key={i} type="button" className="jeu-lecture-mot" onClick={() => speak(mot, 'ar-SA')}>
              {mot} <span className="jeu-lecture-mot-icon">🔊</span>
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="jeu-btn" onClick={onFini}>
        J'ai compris →
      </button>
    </div>
  );
}
