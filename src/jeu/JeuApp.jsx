import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MAISON_TAARIF } from './jeuData';
import DragSort from './DragSort';
import kidsTaarif from './assets/kids-taarif.png';
import carteVideoMp4 from './assets/carte-video.mp4';
import carteVideoWebm from './assets/carte-video.webm';
import royaumeMap from './assets/royaume-map-nouvelle.jpg';
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
import portesVideo1Mp4 from './assets/portes-video-1.mp4';
import portesVideo1Webm from './assets/portes-video-1.webm';
import portesVideo2Mp4 from './assets/portes-video-2.mp4';
import portesVideo2Webm from './assets/portes-video-2.webm';
import villageVideoMp4 from './assets/village-video.mp4';
import villageVideoWebm from './assets/village-video.webm';
import audioQamariyaAlAqabatu from './assets/audio/qamariya-ma-al-aqabatu.mp3';
import audioQamariyaWaAlFajri from './assets/audio/qamariya-wa-al-fajri.mp3';
import audioQamariyaAlWatri from './assets/audio/qamariya-al-watri.mp3';
import audioQamariyaBilHazli from './assets/audio/qamariya-bil-hazli.mp3';
import audioQamariyaIlaAlIbili from './assets/audio/qamariya-ila-al-ibili.mp3';
import audioQamariyaAlKhunnasi from './assets/audio/qamariya-al-khunnasi.mp3';
import audioQamariyaAlGhashiyati from './assets/audio/qamariya-al-ghashiyati.mp3';
import audioQamariyaAlJibalu from './assets/audio/qamariya-al-jibalu.mp3';
import audioQamariyaWalMaliku from './assets/audio/qamariya-wal-maliku.mp3';
import audioQamariyaAlHutamatu from './assets/audio/qamariya-al-hutamatu.mp3';
import audioQamariyaAlYaqini from './assets/audio/qamariya-al-yaqini.mp3';
import audioQamariyaFiAlBaladi from './assets/audio/qamariya-fi-al-baladi.mp3';
import audioQamariyaAlKawthara from './assets/audio/qamariya-al-kawthara.mp3';
import audioQamariyaAlQadari from './assets/audio/qamariya-al-qadari.mp3';
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
      { text: 'اَلشَّمْسُ', x: 68, y: 23 },
      { text: 'وَالشَّمْسِ', x: 68, y: 34 },
      { text: 'اَلسَّمَاءُ', x: 49, y: 66 },
      { text: 'اَلصُّبْحُ', x: 70, y: 66 },
      { text: 'اَلنَّاسُ', x: 90, y: 66 },
      { text: 'وَالزَّيْتُونِ', x: 49, y: 76 },
      { text: 'وَالطَّارِقِ', x: 70, y: 76 },
      { text: 'وَالضُّحَى', x: 90, y: 76 },
    ],
  },
  qamariya: {
    img: leconQamariya,
    hotspots: [
      { text: 'اَلْقَمَرُ', x: 82, y: 21 },
      { text: 'وَالْقَمَرِ', x: 80, y: 32 },
      { text: 'اَلْمَسْجِدَ', x: 58, y: 65 },
      { text: 'اَلْأَرْضَ', x: 77, y: 65 },
      { text: 'اَلْقُرْآنَ', x: 95, y: 65 },
      { text: 'وَالْجِبَالِ', x: 58, y: 77 },
      { text: 'وَالْمَرْجَانُ', x: 78, y: 77 },
      { text: 'هُوَ الْأَوَّلُ', x: 96, y: 77 },
    ],
  },
};

// Coin lecture avant la salle de jeux — grille de 15 mots شمسية avec audio,
// affichée après le choix des 2 portes et avant le défi de tri. Repères
// décalés vers le coin bas-droit de chaque case pour ne pas chevaucher le mot.
const COIN_LECTURE_SHAMSIYA = {
  img: coinLectureShamsiya,
  hotspots: [
    { text: 'وَالزَّيْتُونِ', x: 26, y: 32 },
    { text: 'اَلثَّرَائِبِ', x: 48, y: 32 },
    { text: 'إِذَا اَلشَّمْسُ', x: 71, y: 32 },
    { text: 'اَلنَّهَارَ', x: 92, y: 32 },
    { text: 'اَلرَّحِيمِ', x: 26, y: 47 },
    { text: 'وَالصُّبْحِ', x: 48, y: 47 },
    { text: 'اَلسَّمَاءُ', x: 71, y: 47 },
    { text: 'وَاللَّهِ', x: 92, y: 47 },
    { text: 'اَلظَّالِمِينَ', x: 26, y: 60 },
    { text: 'اَلثَّاقِبِ', x: 48, y: 60 },
    { text: 'اَلطَّارِقِ', x: 71, y: 60 },
    { text: 'اَلذِّكْرَى', x: 92, y: 60 },
    { text: 'اَلدُّنْيَا', x: 48, y: 74 },
    { text: 'اَلضَّالِّينَ', x: 71, y: 74 },
    { text: 'اَلذِّكْرَى', x: 92, y: 74 },
  ],
};

// Coin lecture قمرية — grille de 14 mots avec audio, affichée après le coin
// lecture شمسية et avant le défi de tri (3 colonnes au lieu de 4).
const COIN_LECTURE_QAMARIYA = {
  img: coinLectureQamariya,
  hotspots: [
    { text: 'مَا الْعَقَبَةُ', x: 35, y: 32, audio: audioQamariyaAlAqabatu },
    { text: 'وَالْفَجْرِ', x: 63, y: 32, audio: audioQamariyaWaAlFajri },
    { text: 'الْوَتْرِ', x: 90, y: 32, audio: audioQamariyaAlWatri },
    { text: 'بِالْهَزْلِ', x: 35, y: 44, audio: audioQamariyaBilHazli },
    { text: 'إِلَى الْإِبِلِ', x: 63, y: 44, audio: audioQamariyaIlaAlIbili },
    { text: 'الْخُنَّاسِ', x: 90, y: 44, audio: audioQamariyaAlKhunnasi },
    { text: 'الْغَشِيَةِ', x: 35, y: 56, audio: audioQamariyaAlGhashiyati },
    { text: 'الْجِبَالُ', x: 63, y: 56, audio: audioQamariyaAlJibalu },
    { text: 'وَالْمَلِكُ', x: 90, y: 56, audio: audioQamariyaWalMaliku },
    { text: 'الْحُطَمَةُ', x: 35, y: 68, audio: audioQamariyaAlHutamatu },
    { text: 'الْيَقِينِ', x: 63, y: 68, audio: audioQamariyaAlYaqini },
    { text: 'فِي الْبَلَدِ', x: 90, y: 68, audio: audioQamariyaFiAlBaladi },
    { text: 'الْكَوْثَرَ', x: 72, y: 79, audio: audioQamariyaAlKawthara },
    { text: 'الْقَدَرِ', x: 92, y: 79, audio: audioQamariyaAlQadari },
  ],
};

// Repères sur la carte du Royaume (en % de l'image) — un seul point d'entrée
// actif pour l'instant (Village du Coran, qui contient la maison ال التعريف).
// Les autres maisons du Palais des Lettres sont affichées pour l'immersion
// mais pas encore développées. Positionnés sur les toits/icônes plutôt que
// sur les pancartes de texte.
const REPERES_CARTE = [
  { id: 'village', label: 'Village du Coran', x: 85, y: 29, actif: true },
  { id: 'tresor', label: 'Le trésor caché', x: 15, y: 25, actif: false },
  { id: 'voyelles-courtes', label: 'Maison des voyelles courtes', x: 20, y: 44, actif: false },
  { id: 'voyelles-longues', label: 'Maison des voyelles longues', x: 12, y: 62, actif: false },
  { id: 'soukoun', label: 'Maison du soukoun', x: 78, y: 44, actif: false },
  { id: 'doubles-voyelles', label: 'Maison des doubles voyelles', x: 89, y: 62, actif: false },
];

// Les 3 maisons du Village du Coran — seule « ال التعريف » est développée.
const MAISONS_VILLAGE = [
  { id: 'waqf', label: 'Les secrets du Waqf', x: 20, y: 30, actif: false },
  { id: 'noun-mim', label: 'Les secrets du Noun et Mim', x: 51, y: 29, actif: false },
  { id: 'taarif', label: "Les secrets de « ال » التعريف", x: 83, y: 30, actif: true },
];

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

// Joue le fichier audio pré-généré (voix enregistrée) du mot si disponible,
// sinon retombe sur la synthèse vocale du navigateur.
function playHotspot(h) {
  if (h.audio) {
    new window.Audio(h.audio).play();
  } else {
    speak(h.text, 'ar-SA');
  }
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
  const [ecran, setEcran] = useState('carte-video'); // carte-video | carte | village | intro | portes | lecon | defi | reussite
  const [porteActive, setPorteActive] = useState(null);
  const [portesVues, setPortesVues] = useState([]);
  const [resultat, setResultat] = useState(null);
  const [repereVerrouille, setRepereVerrouille] = useState(null);
  const [maisonVerrouillee, setMaisonVerrouillee] = useState(null);
  const [jeuxVerrouille, setJeuxVerrouille] = useState(false);

  const maison = MAISON_TAARIF;
  const toutesPortesVues = maison.portes.every((p) => portesVues.includes(p.id));

  const ouvrirPorte = (porteId) => {
    setPorteActive(porteId);
    setEcran(LECON_VIDEOS[porteId] ? 'lecon-video' : 'lecon');
  };
  const fermerPorte = () => {
    // La vidéo du couloir (les enfants qui discutent) se joue au retour de la
    // 1ère porte visitée — 2e apparition du couloir, après l'arrivée initiale
    // en image statique.
    const secondeApparitionCouloir = portesVues.length === 0;
    setPortesVues((v) => (v.includes(porteActive) ? v : [...v, porteActive]));
    setPorteActive(null);
    setEcran(secondeApparitionCouloir ? 'portes-video-2' : 'portes');
  };
  const cliquerRepere = (repere) => {
    if (!repere.actif) {
      setRepereVerrouille(repere.id);
      setTimeout(() => setRepereVerrouille((r) => (r === repere.id ? null : r)), 1600);
      return;
    }
    setEcran('village-video');
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
  const estEcranVillage = ecran === 'village' || ecran === 'village-video';
  const retourLabel = estEcranVillage ? '← Carte du Royaume' : estEcranLecture ? '← Choisir une porte' : '← Village du Coran';
  const retourCible = estEcranVillage ? 'carte' : estEcranLecture ? 'portes' : 'village';
  const leconScene = porteActive ? LECON_SCENES[porteActive] : null;
  const leconVideo = porteActive ? LECON_VIDEOS[porteActive] : null;
  const ecranPleinEcran = ['carte', 'carte-video', 'village', 'village-video', 'portes', 'portes-video-1', 'portes-video-2', 'lecture', 'lecture2', 'lecon-video'].includes(ecran) || (ecran === 'lecon' && leconScene);

  return (
    <div className={`jeu-app${ecranPleinEcran ? ' jeu-app--carte' : ''}`}>
      <div className="jeu-topbar">
        {ecran === 'carte' || ecran === 'carte-video'
          ? <Link to="/" className="jeu-back">← Quitter</Link>
          : <button type="button" className="jeu-back jeu-back-btn" onClick={() => setEcran(retourCible)}>{retourLabel}</button>}
        <span className="jeu-topbar-title">Le Royaume du Coran</span>
      </div>

      {ecran === 'carte-video' && (
        <VideoIntro mp4={carteVideoMp4} webm={carteVideoWebm} onEnded={() => setEcran('carte')} />
      )}

      {ecran === 'carte' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={royaumeMap} alt="Le Royaume du Coran" className="jeu-carte-img" />
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
          </div>
        </div>
      )}

      {ecran === 'village-video' && (
        <VideoIntro mp4={villageVideoMp4} webm={villageVideoWebm} onEnded={() => setEcran('village')} />
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
        </div>
      )}

      {ecran === 'intro' && (
        <div className="jeu-screen jeu-intro">
          <img src={kidsTaarif} alt="" className="jeu-intro-kids" />
          <h1 className="jeu-title">{maison.nom}</h1>
          <p className="jeu-title-ar">{maison.nomAr}</p>
          <p className="jeu-desc">{maison.desc}</p>
          <button type="button" className="jeu-btn" onClick={() => setEcran('portes-video-1')}>
            Entrer dans la maison →
          </button>
        </div>
      )}

      {ecran === 'portes-video-1' && (
        <VideoIntro mp4={portesVideo1Mp4} webm={portesVideo1Webm} onEnded={() => setEcran('portes')} />
      )}

      {ecran === 'portes-video-2' && (
        <VideoIntro mp4={portesVideo2Mp4} webm={portesVideo2Webm} onEnded={() => setEcran('portes')} />
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
        <VideoIntro mp4={leconVideo.mp4} webm={leconVideo.webm} onEnded={() => setEcran('lecon')} />
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

// Vidéo d'intro plein écran (personnage qui parle) jouée une fois, son actif
// par défaut (déclenchée par un geste utilisateur), puis enchaîne
// automatiquement vers l'écran suivant à la fin — avec un filet de sécurité
// muet si un navigateur bloque quand même l'autoplay avec son.
function VideoIntro({ mp4, webm, onEnded }) {
  const [sonCoupe, setSonCoupe] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        v.muted = true;
        setSonCoupe(true);
        v.play().catch(() => {});
      });
    }
  }, []);

  const activerSon = () => {
    setSonCoupe(false);
    if (videoRef.current) videoRef.current.muted = false;
  };

  return (
    <div className="jeu-carte">
      <div className="jeu-carte-inner">
        <video
          ref={videoRef}
          className="jeu-carte-img"
          autoPlay
          muted={sonCoupe}
          playsInline
          onEnded={onEnded}
        >
          <source src={webm} type="video/webm" />
          <source src={mp4} type="video/mp4" />
        </video>
        {sonCoupe && (
          <button
            type="button"
            className="jeu-voice-btn jeu-voice-btn--son"
            onClick={activerSon}
            aria-label="Activer le son de la vidéo"
          >
            🔇
          </button>
        )}
      </div>
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
            onClick={() => playHotspot(h)}
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
