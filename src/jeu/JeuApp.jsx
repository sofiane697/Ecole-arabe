import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MAISON_TAARIF } from './jeuData';
import DragSort from './DragSort';
import kidsTaarif from './assets/kids-taarif.png';
import royaumeMapVideoMp4 from './assets/royaume-map.mp4';
import royaumeMapVideoWebm from './assets/royaume-map.webm';
import villageScene from './assets/village-scene.jpg';
import maisonTaarifPortes from './assets/maison-taarif-portes.jpg';
import leconShamsiya from './assets/lecon-shamsiya.jpg';
import leconQamariya from './assets/lecon-qamariya.jpg';
import coinLectureShamsiya from './assets/coin-lecture-shamsiya.jpg';
import coinLectureQamariya from './assets/coin-lecture-qamariya.jpg';
import leconShamsiyaVideoMp4 from './assets/lecon-shamsiya-video.mp4';
import leconShamsiyaVideoWebm from './assets/lecon-shamsiya-video.webm';
import leconQamariyaVideoMp4 from './assets/lecon-qamariya-video.mp4';
import leconQamariyaVideoWebm from './assets/lecon-qamariya-video.webm';
import './jeu.css';

// Vidéos d'intro (soleil/lune qui parlent) jouées avant la leçon illustrée
// de chaque porte — son actif par défaut, enchaînement automatique vers le
// PDF à la fin (cf. écran « lecon-video »).
const LECON_VIDEOS = {
  shamsiya: { mp4: leconShamsiyaVideoMp4, webm: leconShamsiyaVideoWebm },
  qamariya: { mp4: leconQamariyaVideoMp4, webm: leconQamariyaVideoWebm },
};

// Repères des 2 portes + la salle de jeux sur la scène du couloir (en %).
// Positionnés au niveau de la poignée, sous le texte « Salle de jeux ».
const PORTES_HOTSPOTS = {
  shamsiya: { x: 32, y: 44 },
  qamariya: { x: 58, y: 44 },
};
const SALLE_JEUX_HOTSPOT = { x: 83, y: 44 };

// Leçons illustrées (page du PDF) avec repères audio par mot. Sans entrée
// ici, la leçon retombe sur l'ancien écran texte (cf. LeconPorte).
const LECON_SCENES = {
  shamsiya: {
    img: leconShamsiya,
    hotspots: [
      { text: 'اَلشَّمْسُ', x: 63, y: 20 },
      { text: 'وَالشَّمْسِ', x: 62, y: 30 },
      { text: 'اَلسَّمَاءُ', x: 50, y: 69 },
      { text: 'اَلصُّبْحُ', x: 77, y: 69 },
      { text: 'اَلنَّاسُ', x: 93, y: 69 },
      { text: 'وَالزَّيْتُونِ', x: 50, y: 77 },
      { text: 'وَالطَّارِقِ', x: 77, y: 77 },
      { text: 'وَالضُّحَى', x: 93, y: 77 },
    ],
  },
  qamariya: {
    img: leconQamariya,
    hotspots: [
      { text: 'اَلْقَمَرُ', x: 74, y: 20 },
      { text: 'وَالْقَمَرِ', x: 70, y: 27 },
      { text: 'اَلْمَسْجِدَ', x: 41, y: 63 },
      { text: 'اَلْأَرْضَ', x: 60, y: 63 },
      { text: 'اَلْقُرْآنَ', x: 81, y: 63 },
      { text: 'وَالْجِبَالِ', x: 41, y: 77 },
      { text: 'وَالْمَرْجَانُ', x: 63, y: 77 },
      { text: 'هُوَ الْأَوَّلُ', x: 84, y: 77 },
    ],
  },
};

// Coin lecture avant la salle de jeux — grille de 15 mots شمسية avec audio,
// affichée après le choix des 2 portes et avant le défi de tri. Repères
// décalés vers le coin bas-droit de chaque case pour ne pas chevaucher le mot.
const COIN_LECTURE_SHAMSIYA = {
  img: coinLectureShamsiya,
  hotspots: [
    { text: 'وَالزَّيْتُونِ', x: 24, y: 32 },
    { text: 'اَلثَّرَائِبِ', x: 50, y: 32 },
    { text: 'إِذَا اَلشَّمْسُ', x: 75, y: 32 },
    { text: 'اَلنَّهَارَ', x: 98, y: 32 },
    { text: 'اَلرَّحِيمِ', x: 24, y: 47 },
    { text: 'وَالصُّبْحِ', x: 50, y: 47 },
    { text: 'اَلسَّمَاءُ', x: 75, y: 47 },
    { text: 'وَاللَّهِ', x: 98, y: 47 },
    { text: 'اَلظَّالِمِينَ', x: 24, y: 62 },
    { text: 'اَلثَّاقِبِ', x: 50, y: 62 },
    { text: 'اَلطَّارِقِ', x: 75, y: 62 },
    { text: 'اَلذِّكْرَى', x: 98, y: 62 },
    { text: 'اَلدُّنْيَا', x: 50, y: 77 },
    { text: 'اَلضَّالِّينَ', x: 75, y: 77 },
    { text: 'اَلذِّكْرَى', x: 98, y: 77 },
  ],
};

// Coin lecture قمرية — grille de 14 mots avec audio, affichée après le coin
// lecture شمسية et avant le défi de tri (3 colonnes au lieu de 4).
const COIN_LECTURE_QAMARIYA = {
  img: coinLectureQamariya,
  hotspots: [
    { text: 'مَا الْعَقَبَةُ', x: 31, y: 31 },
    { text: 'وَالْفَجْرِ', x: 59, y: 31 },
    { text: 'الْوَتْرِ', x: 86, y: 31 },
    { text: 'بِالْهَزْلِ', x: 31, y: 46 },
    { text: 'إِلَى الْإِبِلِ', x: 59, y: 46 },
    { text: 'الْخُنَّاسِ', x: 86, y: 46 },
    { text: 'الْغَشِيَةِ', x: 31, y: 60 },
    { text: 'الْجِبَالُ', x: 59, y: 60 },
    { text: 'وَالْمَلِكُ', x: 86, y: 60 },
    { text: 'الْحُطَمَةُ', x: 31, y: 75 },
    { text: 'الْيَقِينِ', x: 59, y: 75 },
    { text: 'فِي الْبَلَدِ', x: 86, y: 75 },
    { text: 'الْكَوْثَرَ', x: 59, y: 89 },
    { text: 'الْقَدَرِ', x: 86, y: 89 },
  ],
};

// Repères sur la carte du Royaume (en % de l'image) — un seul point d'entrée
// actif pour l'instant (Village du Coran, qui contient la maison ال التعريف).
// Les autres maisons du Palais des Lettres sont affichées pour l'immersion
// mais pas encore développées. Positionnés sur les toits/icônes plutôt que
// sur les pancartes de texte.
const REPERES_CARTE = [
  { id: 'village', label: 'Village du Coran', x: 82, y: 20, actif: true },
  { id: 'tresor', label: 'Le trésor caché', x: 8, y: 15, actif: false },
  { id: 'voyelles-courtes', label: 'Maison des voyelles courtes', x: 20, y: 20, actif: false },
  { id: 'voyelles-longues', label: 'Maison des voyelles longues', x: 10, y: 35, actif: false },
  { id: 'soukoun', label: 'Maison du soukoun', x: 91, y: 23, actif: false },
  { id: 'doubles-voyelles', label: 'Maison des doubles voyelles', x: 91, y: 39, actif: false },
];

// Les 3 maisons du Village du Coran — seule « ال التعريف » est développée.
const MAISONS_VILLAGE = [
  { id: 'waqf', label: 'Les secrets du Waqf', x: 20, y: 30, actif: false },
  { id: 'noun-mim', label: 'Les secrets du Noun et Mim', x: 51, y: 29, actif: false },
  { id: 'taarif', label: "Les secrets de « ال » التعريف", x: 83, y: 30, actif: true },
];

const CARTE_NARRATION =
  "Bonjour les enfants ! Aujourd'hui, une grande aventure commence avec Anas, Bilal et Assia. Ensemble, nous allons entrer dans le merveilleux Royaume du Coran pour découvrir ses trésors. Alors, êtes-vous prêts à traverser les ponts du Royaume, découvrir les secrets des lettres arabes et apprendre les paroles d'Allah, avec joie ?";

const VILLAGE_NARRATION =
  "Le Coran est la parole d'Allah, révélée à notre Prophète. Pour bien le lire, il est important d'apprendre les règles de tajwid. Dans cette aventure, nous allons découvrir des secrets merveilleux qui rendent notre récitation plus belle et plus juste. Bienvenue au Village du Coran !";

// Voix des personnages : pitch relevé pour se rapprocher d'une voix
// d'enfant (l'API Web Speech ne propose pas de voix « enfant » dédiée,
// on approxime avec un pitch plus aigu + un débit un peu plus vif).
function speak(text, lang, pitch = 1) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new window.SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = pitch > 1 ? 0.95 : 0.82;
  u.pitch = pitch;
  window.speechSynthesis.speak(u);
}

function VoiceBtn({ text, lang = 'ar-SA', pitch = 1, className = 'jeu-voice-btn' }) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  return (
    <button
      type="button"
      className={className}
      aria-label="Écouter"
      onClick={(e) => { e.stopPropagation(); speak(text, lang, pitch); }}
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
  const [jeuxVerrouille, setJeuxVerrouille] = useState(false);
  const [carteSonCoupe, setCarteSonCoupe] = useState(true);
  const carteVideoRef = useRef(null);
  // Son activé par défaut : la vidéo est déclenchée par le clic sur la porte
  // (geste utilisateur), ce qui autorise l'autoplay avec son dans la plupart
  // des navigateurs. Filet de sécurité si un navigateur le bloque quand même.
  const [leconVideoSonCoupe, setLeconVideoSonCoupe] = useState(false);
  const leconVideoRef = useRef(null);

  // Autoplay avec son est bloqué par les navigateurs sans interaction
  // préalable — la vidéo démarre donc coupée, avec un bouton pour activer
  // le son au premier tap (autorisé une fois que l'utilisateur a interagi).
  const activerSonCarte = () => {
    setCarteSonCoupe(false);
    if (carteVideoRef.current) carteVideoRef.current.muted = false;
  };
  const activerSonLeconVideo = () => {
    setLeconVideoSonCoupe(false);
    if (leconVideoRef.current) leconVideoRef.current.muted = false;
  };

  useEffect(() => {
    if (ecran !== 'lecon-video') return;
    const v = leconVideoRef.current;
    if (!v) return;
    v.muted = false;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        v.muted = true;
        setLeconVideoSonCoupe(true);
        v.play().catch(() => {});
      });
    }
  }, [ecran]);

  const maison = MAISON_TAARIF;
  const toutesPortesVues = maison.portes.every((p) => portesVues.includes(p.id));

  const ouvrirPorte = (porteId) => {
    setPorteActive(porteId);
    if (LECON_VIDEOS[porteId]) {
      setLeconVideoSonCoupe(false);
      setEcran('lecon-video');
    } else {
      setEcran('lecon');
    }
  };
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
  const cliquerSalleJeux = () => {
    if (!toutesPortesVues) {
      setJeuxVerrouille(true);
      setTimeout(() => setJeuxVerrouille(false), 1600);
      return;
    }
    setEcran('lecture');
  };

  const zones = maison.portes.map((p) => ({ id: p.id, label: p.sousTitre, emoji: p.mascotte, couleur: p.couleur }));
  const defiItems = maison.evaluation.map((m, i) => ({ id: `m${i}`, mot: m.mot, famille: m.famille }));

  const estEcranLecture = ecran === 'lecture' || ecran === 'lecture2';
  const retourLabel = ecran === 'village' ? '← Carte du Royaume' : estEcranLecture ? '← Choisir une porte' : '← Village du Coran';
  const retourCible = ecran === 'village' ? 'carte' : estEcranLecture ? 'portes' : 'village';
  const leconScene = porteActive ? LECON_SCENES[porteActive] : null;
  const leconVideo = porteActive ? LECON_VIDEOS[porteActive] : null;
  const ecranPleinEcran = ['carte', 'village', 'portes', 'lecture', 'lecture2', 'lecon-video'].includes(ecran) || (ecran === 'lecon' && leconScene);

  return (
    <div className={`jeu-app${ecranPleinEcran ? ' jeu-app--carte' : ''}`}>
      <div className="jeu-topbar">
        {ecran === 'carte'
          ? <Link to="/" className="jeu-back">← Quitter</Link>
          : <button type="button" className="jeu-back jeu-back-btn" onClick={() => setEcran(retourCible)}>{retourLabel}</button>}
        <span className="jeu-topbar-title">Le Royaume du Coran</span>
      </div>

      {ecran === 'carte' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <video
              ref={carteVideoRef}
              className="jeu-carte-img"
              autoPlay
              muted={carteSonCoupe}
              playsInline
            >
              <source src={royaumeMapVideoWebm} type="video/webm" />
              <source src={royaumeMapVideoMp4} type="video/mp4" />
            </video>
            {REPERES_CARTE.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`jeu-repere${r.actif ? ' is-actif' : ' is-verrouille'}`}
                style={{ left: `${r.x}%`, top: `${r.y}%` }}
                onClick={() => cliquerRepere(r)}
                aria-label={r.label}
              >
                <span className="jeu-repere-point" />
                {repereVerrouille === r.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
            {carteSonCoupe && (
              <button
                type="button"
                className="jeu-voice-btn jeu-voice-btn--son"
                onClick={activerSonCarte}
                aria-label="Activer le son de la vidéo"
              >
                🔇
              </button>
            )}
            <VoiceBtn
              text={CARTE_NARRATION}
              lang="fr-FR"
              pitch={1.35}
              className="jeu-voice-btn jeu-voice-btn--floating"
            />
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
                aria-label={m.label}
              >
                <span className="jeu-repere-point" />
                {maisonVerrouillee === m.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
          </div>
          <div className="jeu-village-dialogue">
            <VoiceBtn text={VILLAGE_NARRATION} lang="fr-FR" pitch={1.35} className="jeu-voice-btn jeu-voice-btn--village" />
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
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={maisonTaarifPortes} alt="Le couloir de la maison ال التعريف" className="jeu-carte-img" />
            {maison.portes.map((p) => {
              const pos = PORTES_HOTSPOTS[p.id];
              if (!pos) return null;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`jeu-repere is-actif${portesVues.includes(p.id) ? ' is-vue' : ''}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  onClick={() => ouvrirPorte(p.id)}
                  aria-label={p.nom}
                >
                  <span className="jeu-repere-point" />
                  {portesVues.includes(p.id) && <span className="jeu-repere-check">✓</span>}
                </button>
              );
            })}
            <button
              type="button"
              className={`jeu-repere${toutesPortesVues ? ' is-actif' : ' is-verrouille'}`}
              style={{ left: `${SALLE_JEUX_HOTSPOT.x}%`, top: `${SALLE_JEUX_HOTSPOT.y}%` }}
              onClick={cliquerSalleJeux}
              aria-label="Salle de jeux"
            >
              <span className="jeu-repere-point" />
              {jeuxVerrouille && <span className="jeu-repere-toast">🔒 Visite les 2 portes d'abord</span>}
            </button>
          </div>
        </div>
      )}

      {ecran === 'lecon-video' && leconVideo && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <video
              ref={leconVideoRef}
              className="jeu-carte-img"
              autoPlay
              muted={leconVideoSonCoupe}
              playsInline
              onEnded={() => setEcran('lecon')}
            >
              <source src={leconVideo.webm} type="video/webm" />
              <source src={leconVideo.mp4} type="video/mp4" />
            </video>
            {leconVideoSonCoupe && (
              <button
                type="button"
                className="jeu-voice-btn jeu-voice-btn--son"
                onClick={activerSonLeconVideo}
                aria-label="Activer le son de la vidéo"
              >
                🔇
              </button>
            )}
          </div>
        </div>
      )}

      {ecran === 'lecon' && porteActive && leconScene && (
        <LeconScene scene={leconScene} onFini={fermerPorte} />
      )}

      {ecran === 'lecon' && porteActive && !leconScene && (
        <LeconPorte porte={maison.portes.find((p) => p.id === porteActive)} onFini={fermerPorte} />
      )}

      {ecran === 'lecture' && (
        <LeconScene
          scene={COIN_LECTURE_SHAMSIYA}
          onFini={() => setEcran('lecture2')}
          boutonLabel="Suite →"
        />
      )}

      {ecran === 'lecture2' && (
        <LeconScene
          scene={COIN_LECTURE_QAMARIYA}
          onFini={() => setEcran('defi')}
          boutonLabel="Commencer le défi →"
        />
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

function LeconScene({ scene, onFini, boutonLabel = "J'ai compris →" }) {
  return (
    <div className="jeu-carte jeu-lecon-scene">
      <div className="jeu-carte-inner">
        <img src={scene.img} alt="Leçon illustrée" className="jeu-carte-img" />
        {scene.hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            className="jeu-repere jeu-repere--audio"
            style={{ left: `${h.x}%`, top: `${h.y}%` }}
            onClick={() => speak(h.text, 'ar-SA')}
            aria-label="Écouter la prononciation"
          >
            <span className="jeu-repere-point">🔊</span>
          </button>
        ))}
      </div>
      <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={onFini}>
        {boutonLabel}
      </button>
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
