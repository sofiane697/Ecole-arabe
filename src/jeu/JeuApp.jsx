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
import maisonNounMimPortes from './assets/maison-noun-mim-portes.jpg';
import audioNounMimMushaddadatan from './assets/noun-mim-mim-noun-mushaddadatan.wav';
import audioNounMimIqlab from './assets/noun-mim-iqlab.wav';
import audioNounMimIdghamBilaGhunna from './assets/noun-mim-idgham-bila-ghunna.wav';
import audioNounMimIdghamBiGhunna from './assets/noun-mim-idgham-bi-ghunna.wav';
import audioNounMimIkhfa from './assets/noun-mim-ikhfa.wav';
import audioNounMimTitre from './assets/noun-mim-titre.wav';
import leconShamsiya from './assets/lecon-shamsiya.jpg';
import leconQamariya from './assets/lecon-qamariya.jpg';
import coinLectureShamsiya from './assets/coin-lecture-shamsiya.jpg';
import coinLectureQamariya from './assets/coin-lecture-qamariya.jpg';
import evaluationTaarif from './assets/evaluation-taarif.jpg';
import nounMimVideoMp4 from './assets/noun-mim-video.mp4';
import nounMimVideoWebm from './assets/noun-mim-video.webm';
import nounMimKids from './assets/noun-mim-kids.jpg';
import nounMimLecon from './assets/noun-mim-lecon.jpg';
import iqlabLecon from './assets/iqlab-lecon.jpg';
import audioIqlabAnbatna from './assets/iqlab-anbatna.wav';
import audioIqlabWaliyyan from './assets/iqlab-waliyyan.wav';
import audioIqlabDanbin from './assets/iqlab-danbin.wav';
import audioIqlabYanbaghi from './assets/iqlab-yanbaghi.wav';
import audioIqlabHarasan from './assets/iqlab-harasan.wav';
import audioIqlabTanbitu from './assets/iqlab-tanbitu.wav';
import audioIqlabLayunbadhanna from './assets/iqlab-layunbadhanna.wav';
import audioIqlabLafa from './assets/iqlab-lafa.wav';
import audioIqlabTitre from './assets/iqlab-titre.wav';
import idghamBilaGhunnaLecon from './assets/idgham-bila-ghunna-lecon.jpg';
import audioIdghamBilaGhunnaTitre from './assets/idgham-bila-ghunna-titre.wav';
import audioIdghamBilaGhunnaAnRabbihim from './assets/idgham-bila-ghunna-an-rabbihim.wav';
import audioIdghamBilaGhunnaMinRabbika from './assets/idgham-bila-ghunna-min-rabbika.wav';
import audioIdghamBilaGhunnaGhafurunRahim from './assets/idgham-bila-ghunna-ghafurun-rahim.wav';
import audioIdghamBilaGhunnaMinRahiqin from './assets/idgham-bila-ghunna-min-rahiqin.wav';
import audioIdghamBilaGhunnaQasamunLladhi from './assets/idgham-bila-ghunna-qasamun-lladhi.wav';
import audioIdghamBilaGhunnaYakunLahu from './assets/idgham-bila-ghunna-yakun-lahu.wav';
import audioIdghamBilaGhunnaAnLan from './assets/idgham-bila-ghunna-an-lan.wav';
import audioIdghamBilaGhunnaAnLam from './assets/idgham-bila-ghunna-an-lam.wav';
import idghamBiGhunnaLecon from './assets/idgham-bi-ghunna-lecon.jpg';
import audioIdghamBiGhunnaTitre from './assets/idgham-bi-ghunna-titre.wav';
import audioIdghamBiGhunnaFamanYamal from './assets/idgham-bi-ghunna-faman-yamal.wav';
import audioIdghamBiGhunnaMalaWaAdadahu from './assets/idgham-bi-ghunna-mala-wa-adadahu.wav';
import audioIdghamBiGhunnaSururunMarfuatun from './assets/idgham-bi-ghunna-sururun-marfuatun.wav';
import audioIdghamBiGhunnaInNafaati from './assets/idgham-bi-ghunna-in-nafaati.wav';
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

// Repère de l'évaluation sur l'écran des portes — placé sur le panneau
// « La maison de ال التعريف » (mur de gauche), débloqué une fois le défi
// de tri réussi.
const EVALUATION_HOTSPOT = { x: 10, y: 36 };

// Page d'évaluation illustrée (15 mots شمسية/قمرية mélangés) avec repères
// audio par mot, affichée une fois le défi de tri de la salle de jeux réussi.
// Leçon de la ghunna (maison Noun et Mim) — zones cliquables recalées au
// pixel près (détection de bordures) sur la nouvelle image fournie par
// Sofiane (x,y = coin bas-droit de chaque zone).
const NOUN_MIM_LECON = {
  img: nounMimLecon,
  hotspots: [
    { text: 'غُنَّة', x: 69.6, y: 5.7, zoneW: 10.5, zoneH: 2.6 },
    { text: 'مِيمٌ وَ نُونٌ مُشَدَّدَتَانِ', x: 75.7, y: 51.9, zoneW: 45.5, zoneH: 4.2 },
    { text: 'يَظُنُّ', x: 53.7, y: 82.1, zoneW: 6.6, zoneH: 4.4 },
    { text: 'إِنَّ', x: 62.1, y: 82.1, zoneW: 6.5, zoneH: 4.4 },
    { text: 'إِنَّهُ', x: 70.5, y: 82.1, zoneW: 6.5, zoneH: 4.4 },
    { text: 'كُنَّا', x: 79.1, y: 82.1, zoneW: 6.5, zoneH: 4.4 },
    { text: 'أَعِنَّا', x: 87.4, y: 82.1, zoneW: 6.5, zoneH: 4.4 },
    { text: 'لَمَّا', x: 53.7, y: 87.4, zoneW: 6.6, zoneH: 4.6 },
    { text: 'مِمَّ', x: 62.1, y: 87.4, zoneW: 6.5, zoneH: 4.6 },
    { text: 'أَمَّنْ', x: 70.5, y: 87.4, zoneW: 6.5, zoneH: 4.6 },
    { text: 'ثُمَّ', x: 79.1, y: 87.4, zoneW: 6.5, zoneH: 4.6 },
    { text: 'أَمَّا', x: 87.4, y: 87.4, zoneW: 6.5, zoneH: 4.6 },
  ],
};

// Leçon de l'iqlab (porte إِقْلاَبٌ de la maison Noun et Mim) — zones cliquables
// image-map.net fournies par Sofiane, converties en % (x,y = coin bas-droit).
const IQLAB_LECON = {
  img: iqlabLecon,
  hotspots: [
    { text: 'إِقْلاَبٌ', x: 75.54, y: 6.82, zoneW: 14.66, zoneH: 3.49, audio: audioIqlabTitre },
    { text: 'أَنْۢبَتْنَا', x: 80.16, y: 72.09, zoneW: 12.74, zoneH: 4.23, audio: audioIqlabAnbatna },
    { text: 'وَلِيًّا', x: 64.49, y: 71.98, zoneW: 11.95, zoneH: 3.95, audio: audioIqlabWaliyyan },
    { text: 'ذَنۢبِ', x: 50.85, y: 72.66, zoneW: 13.76, zoneH: 4.79, audio: audioIqlabDanbin },
    { text: 'يَنْۢبَغِي', x: 80.95, y: 77.45, zoneW: 13.87, zoneH: 4.23, audio: audioIqlabYanbaghi },
    { text: 'حَرَسًا', x: 64.60, y: 77.73, zoneW: 12.51, zoneH: 4.57, audio: audioIqlabHarasan },
    { text: 'تَنْۢبِتُ', x: 50.62, y: 77.96, zoneW: 13.53, zoneH: 4.74, audio: audioIqlabTanbitu },
    { text: 'لَيُنْۢبَذَنَّ', x: 72.15, y: 83.37, zoneW: 13.42, zoneH: 4.68, audio: audioIqlabLayunbadhanna },
    { text: 'لَفَى', x: 56.15, y: 83.48, zoneW: 14.66, zoneH: 4.85, audio: audioIqlabLafa },
  ],
};

// Leçon de l'idgham bila ghunna (porte إِدْغَامٌ بِلاَ غُنَّةٍ) — zones cliquables
// image-map.net fournies par Sofiane, converties en % (x,y = coin bas-droit).
const IDGHAM_BILA_GHUNNA_LECON = {
  img: idghamBilaGhunnaLecon,
  hotspots: [
    { text: 'إِدْغَامٌ بِلاَ غُنَّةٍ', x: 63.70, y: 7.27, zoneW: 25.82, zoneH: 4.06, audio: audioIdghamBilaGhunnaTitre },
    { text: 'عَنْ رَّبِهِمْ', x: 78.69, y: 65.22, zoneW: 25.59, zoneH: 6.31, audio: audioIdghamBilaGhunnaAnRabbihim },
    { text: 'مِنْ رَّبِكَ', x: 47.91, y: 65.16, zoneW: 23.45, zoneH: 5.81, audio: audioIdghamBilaGhunnaMinRabbika },
    { text: 'غَفُورٌ رَّحِيمٌ', x: 78.81, y: 73.96, zoneW: 25.71, zoneH: 6.48, audio: audioIdghamBilaGhunnaGhafurunRahim },
    { text: 'مِنْ رَّحِيقٍ', x: 48.03, y: 73.90, zoneW: 24.69, zoneH: 6.09, audio: audioIdghamBilaGhunnaMinRahiqin },
    { text: 'قَسَمٌ لَّذِي', x: 78.69, y: 83.20, zoneW: 25.03, zoneH: 6.88, audio: audioIdghamBilaGhunnaQasamunLladhi },
    { text: 'يَكُنْ لَّهُ', x: 47.80, y: 82.70, zoneW: 22.66, zoneH: 6.26, audio: audioIdghamBilaGhunnaYakunLahu },
    { text: 'أَنْ لَّنْ', x: 77.79, y: 91.15, zoneW: 21.87, zoneH: 5.41, audio: audioIdghamBilaGhunnaAnLan },
    { text: 'أَنْ لَّمْ', x: 47.69, y: 91.32, zoneW: 23.45, zoneH: 6.26, audio: audioIdghamBilaGhunnaAnLam },
  ],
};

// Leçon de l'idgham bi ghunna (porte إِدْغَامٌ بِغُنَّةٍ) — zones cliquables
// image-map.net fournies par Sofiane, converties en % (x,y = coin bas-droit).
const IDGHAM_BI_GHUNNA_LECON = {
  img: idghamBiGhunnaLecon,
  hotspots: [
    { text: 'إِدْغَامٌ بِغُنَّةٍ', x: 65.04, y: 6.58, zoneW: 23.80, zoneH: 4.90, audio: audioIdghamBiGhunnaTitre },
    { text: 'فَمَنْ يَعْمَلْ', x: 58.98, y: 65.43, zoneW: 23.17, zoneH: 8.49, audio: audioIdghamBiGhunnaFamanYamal },
    { text: 'مَالَا وَعَدَدَهُ', x: 31.77, y: 65.43, zoneW: 20.62, zoneH: 7.72, audio: audioIdghamBiGhunnaMalaWaAdadahu },
    { text: 'سُرُرٌ مَّرْفُوعَةٌ', x: 55.58, y: 74.82, zoneW: 19.77, zoneH: 6.82, audio: audioIdghamBiGhunnaSururunMarfuatun },
    { text: 'إِنْ نَّفَعَتِ', x: 32.41, y: 76.08, zoneW: 22.85, zoneH: 8.85, audio: audioIdghamBiGhunnaInNafaati },
  ],
};

const EVALUATION_SCENE = {
  img: evaluationTaarif,
  zoneW: 16,
  zoneH: 10,
  hotspots: [
    { text: 'أَيْنَ الْمَفَرُّ', x: 31, y: 37 },
    { text: 'بِالْغَيْبِ', x: 49, y: 37 },
    { text: 'ٱلصَّالِحِينَ', x: 67, y: 37 },
    { text: 'ٱلْحَيَوٰةُ', x: 85, y: 37 },
    { text: 'ٱلزَّوْجَيْنِ', x: 31, y: 49 },
    { text: 'بِٱلْفَصْلِ', x: 49, y: 49 },
    { text: 'كَٱلْعِهْنِ', x: 67, y: 49 },
    { text: 'وَٱلرَّجْزَ', x: 85, y: 49 },
    { text: 'ٱلْقَوْمُ', x: 31, y: 59 },
    { text: 'ٱلسَّاقُ', x: 49, y: 59 },
    { text: 'ٱلْخَيْرُ', x: 67, y: 59 },
    { text: 'لِوَجْهِ ٱللَّهِ', x: 85, y: 59 },
    { text: 'عَنِ التَّذْكِرَةِ', x: 45, y: 66, zoneW: 22 },
    { text: 'عَلَى الْأَرَائِكِ', x: 93, y: 66, zoneW: 22 },
    { text: 'وَٱلْكَافِرُونَ', x: 70, y: 76, zoneW: 22 },
  ],
};

// Leçons illustrées (page du PDF) avec repères audio par mot. Sans entrée
// ici, la leçon retombe sur l'ancien écran texte (cf. LeconPorte).
const LECON_SCENES = {
  shamsiya: {
    img: leconShamsiya,
    zoneW: 20,
    zoneH: 10,
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
    // Coordonnées précises obtenues via image-map.net (fournies par Sofiane),
    // converties depuis les pixels de l'image source (864×1821) en % — x,y
    // représentent le coin bas-droit de chaque zone, comme ailleurs.
    hotspots: [
      { text: 'اَلْقَمَرُ', x: 57.5, y: 16.1, zoneW: 13.8, zoneH: 3.2 },
      { text: 'وَالْقَمَرِ', x: 57.2, y: 27.6, zoneW: 13.7, zoneH: 5.2 },
      { text: 'اَلْمَسْجِدَ', x: 52.9, y: 64.5, zoneW: 11.6, zoneH: 3.8 },
      { text: 'اَلْأَرْضَ', x: 70.3, y: 65.2, zoneW: 13.1, zoneH: 4.4 },
      { text: 'اَلْقُرْآنَ', x: 86.9, y: 65.2, zoneW: 12.7, zoneH: 4.7 },
      { text: 'وَالْجِبَالِ', x: 49.8, y: 73.8, zoneW: 8.8, zoneH: 2.9 },
      { text: 'وَالْمَرْجَانُ', x: 67.9, y: 74.5, zoneW: 12.5, zoneH: 3.8 },
      { text: 'هُوَ الْأَوَّلُ', x: 82.9, y: 74.4, zoneW: 9.7, zoneH: 2.7 },
    ],
  },
};

// Coin lecture avant la salle de jeux — grille de 15 mots شمسية avec audio,
// affichée après le choix des 2 portes et avant le défi de tri. Repères
// décalés vers le coin bas-droit de chaque case pour ne pas chevaucher le mot.
const COIN_LECTURE_SHAMSIYA = {
  img: coinLectureShamsiya,
  zoneW: 20,
  zoneH: 13,
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
  zoneW: 25,
  zoneH: 11,
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
    { text: 'الْكَوْثَرَ', x: 72, y: 79, audio: audioQamariyaAlKawthara, zoneW: 18 },
    { text: 'الْقَدَرِ', x: 92, y: 79, audio: audioQamariyaAlQadari, zoneW: 18 },
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
  { id: 'waqf', label: 'Les secrets du Waqf', x: 18, y: 38, actif: false },
  { id: 'noun-mim', label: 'Les secrets du Noun et Mim', x: 50, y: 38, actif: false },
  { id: 'taarif', label: "Les secrets de « ال » التعريف", x: 80, y: 38, actif: true },
];

// Couloir de la maison secrète du Noun et Mim — pancartes des 5 règles +
// panneau du titre, avec zones audio invisibles (mêmes conventions que
// NOUN_MIM_LECON : x,y = coin bas-droit de la zone, zoneW/zoneH = taille,
// coordonnées fournies par Sofiane via image-map.net sur l'image 887×1774,
// converties en %).
const PORTES_NOUN_MIM_LECON = {
  img: maisonNounMimPortes,
  hotspots: [
    { text: 'مِيمْ وَنُونٌ مُشَدَّدَتَانِ', x: 28.86, y: 32.47, zoneW: 8.01, zoneH: 5.92, audio: audioNounMimMushaddadatan },
    { text: 'إِقْلاَبٌ', x: 43.86, y: 32.53, zoneW: 9.13, zoneH: 5.41, audio: audioNounMimIqlab },
    { text: 'إِدْغَامٌ بِلاَ غُنَّةٍ', x: 57.38, y: 33.37, zoneW: 8.23, zoneH: 5.92, audio: audioNounMimIdghamBilaGhunna },
    { text: 'إِدْغَامٌ بِغُنَّةٍ', x: 71.25, y: 33.93, zoneW: 8.57, zoneH: 5.92, audio: audioNounMimIdghamBiGhunna },
    { text: 'إِخْفَاءٌ', x: 84.90, y: 33.48, zoneW: 8.01, zoneH: 5.47, audio: audioNounMimIkhfa },
    { text: 'اَلنُّونِ وَ الْمِيمُ', x: 13.75, y: 40.81, zoneW: 11.39, zoneH: 2.20, audio: audioNounMimTitre },
  ],
};

// Les 5 portes du couloir — seule مِيمْ وَنُونٌ مُشَدَّدَتَانِ mène à une leçon
// pour l'instant (la ghunna, cf. NOUN_MIM_LECON), les 4 autres sont
// verrouillées (contenu à venir). x,y = centre de la poignée.
const PORTES_NOUN_MIM_DOORS = [
  { id: 'mim-noun-mushaddadatan', label: 'مِيمْ وَنُونٌ مُشَدَّدَتَانِ', x: 24.52, y: 45.38, actif: true, ecran: 'noun-mim-lecon' },
  { id: 'iqlab', label: 'إِقْلاَبٌ', x: 38.67, y: 45.38, actif: true, ecran: 'iqlab-lecon' },
  { id: 'idgham-bila-ghunna', label: 'إِدْغَامٌ بِلاَ غُنَّةٍ', x: 52.65, y: 45.38, actif: true, ecran: 'idgham-bila-ghunna-lecon' },
  { id: 'idgham-bi-ghunna', label: 'إِدْغَامٌ بِغُنَّةٍ', x: 66.85, y: 45.38, actif: true, ecran: 'idgham-bi-ghunna-lecon' },
  { id: 'ikhfa', label: 'إِخْفَاءٌ', x: 80.83, y: 45.38, actif: false },
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
  const [evaluationDebloquee, setEvaluationDebloquee] = useState(false);
  const [evaluationVerrouillee, setEvaluationVerrouillee] = useState(false);
  const [nounMimDebloque, setNounMimDebloque] = useState(false);
  const [porteNounMimVerrouillee, setPorteNounMimVerrouillee] = useState(null);

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
    if (m.id === 'taarif') setEcran('intro');
    else if (m.id === 'noun-mim') setEcran('portes-noun-mim');
    else setEcran('bientot');
  };
  const cliquerPorteNounMim = (d) => {
    if (!d.actif) {
      setPorteNounMimVerrouillee(d.id);
      setTimeout(() => setPorteNounMimVerrouillee((v) => (v === d.id ? null : v)), 1600);
      return;
    }
    setEcran(d.ecran);
  };
  const cliquerSalleJeux = () => {
    if (!toutesPortesVues) {
      setJeuxVerrouille(true);
      setTimeout(() => setJeuxVerrouille(false), 1600);
      return;
    }
    setEcran('lecture');
  };
  const cliquerEvaluation = () => {
    if (!evaluationDebloquee) {
      setEvaluationVerrouillee(true);
      setTimeout(() => setEvaluationVerrouillee(false), 1600);
      return;
    }
    setEcran('evaluation');
  };

  const maisonsVillage = MAISONS_VILLAGE.map((m) => (m.id === 'noun-mim' ? { ...m, actif: nounMimDebloque } : m));

  const zones = maison.portes.map((p) => ({ id: p.id, label: p.sousTitre, emoji: p.mascotte, couleur: p.couleur }));
  const defiItems = maison.evaluation.map((m, i) => ({ id: `m${i}`, mot: m.mot, famille: m.famille }));

  const estEcranLecture = ecran === 'lecture' || ecran === 'lecture2';
  const estEcranVillage = ecran === 'village' || ecran === 'village-video';
  const retourLabel = estEcranVillage ? '← Carte du Royaume' : estEcranLecture ? '← Choisir une porte' : '← Village du Coran';
  const retourCible = estEcranVillage ? 'carte' : estEcranLecture ? 'portes' : 'village';
  const leconScene = porteActive ? LECON_SCENES[porteActive] : null;
  const leconVideo = porteActive ? LECON_VIDEOS[porteActive] : null;
  const ecranPleinEcran = ['carte', 'carte-video', 'village', 'village-video', 'portes', 'portes-video-1', 'portes-video-2', 'portes-noun-mim', 'lecture', 'lecture2', 'lecon-video', 'evaluation', 'noun-mim-video', 'noun-mim-lecon', 'iqlab-lecon', 'idgham-bila-ghunna-lecon', 'idgham-bi-ghunna-lecon'].includes(ecran) || (ecran === 'lecon' && leconScene);

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
            {maisonsVillage.map((m) => (
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
            <button
              type="button"
              className={`jeu-repere${evaluationDebloquee ? ' is-actif' : ' is-verrouille'}`}
              style={{ left: `${EVALUATION_HOTSPOT.x}%`, top: `${EVALUATION_HOTSPOT.y}%` }}
              onClick={cliquerEvaluation}
              aria-label="Évaluation de la maison"
            >
              <span className="jeu-repere-point" />
              {evaluationVerrouillee && <span className="jeu-repere-toast">🔒 Termine d'abord le défi de la salle de jeux</span>}
            </button>
          </div>
        </div>
      )}

      {ecran === 'evaluation' && (
        <LeconScene scene={EVALUATION_SCENE} onFini={() => setEcran('noun-mim-video')} boutonLabel="Retour à la maison →" />
      )}

      {ecran === 'noun-mim-video' && (
        <VideoIntro
          mp4={nounMimVideoMp4}
          webm={nounMimVideoWebm}
          onEnded={() => { setNounMimDebloque(true); setEcran('village'); }}
        />
      )}

      {ecran === 'portes-noun-mim' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={maisonNounMimPortes} alt="Le couloir de la maison secrète du Noun et Mim" className="jeu-carte-img" />
            {PORTES_NOUN_MIM_LECON.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
            {PORTES_NOUN_MIM_DOORS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`jeu-repere${d.actif ? ' is-actif' : ' is-verrouille'}`}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                onClick={() => cliquerPorteNounMim(d)}
                aria-label={d.label}
              >
                <span className="jeu-repere-point" />
                {porteNounMimVerrouillee === d.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {ecran === 'noun-mim-lecon' && (
        <LeconScene scene={NOUN_MIM_LECON} onFini={() => setEcran('portes-noun-mim')} boutonLabel="J'ai compris →" />
      )}

      {ecran === 'iqlab-lecon' && (
        <LeconScene scene={IQLAB_LECON} onFini={() => setEcran('portes-noun-mim')} boutonLabel="J'ai compris →" />
      )}

      {ecran === 'idgham-bila-ghunna-lecon' && (
        <LeconScene scene={IDGHAM_BILA_GHUNNA_LECON} onFini={() => setEcran('portes-noun-mim')} boutonLabel="J'ai compris →" />
      )}

      {ecran === 'idgham-bi-ghunna-lecon' && (
        <LeconScene scene={IDGHAM_BI_GHUNNA_LECON} onFini={() => setEcran('portes-noun-mim')} boutonLabel="J'ai compris →" />
      )}

      {ecran === 'bientot' && (
        <div className="jeu-screen jeu-intro">
          <img src={nounMimKids} alt="" className="jeu-intro-kids" />
          <h1 className="jeu-title">Les secrets du Noun et du Mim</h1>
          <p className="jeu-desc">
            Cette maison arrive bientôt. Reviens vite pour découvrir ses secrets !
          </p>
          <button type="button" className="jeu-btn" onClick={() => setEcran('village')}>
            ← Retour au village
          </button>
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
            onDone={(r) => { setResultat(r); setEvaluationDebloquee(true); setEcran('reussite'); }}
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
  const zoneW = scene.zoneW ?? 20;
  const zoneH = scene.zoneH ?? 12;
  return (
    <div className="jeu-carte jeu-lecon-scene">
      <div className="jeu-carte-inner">
        <img src={scene.img} alt="Leçon illustrée" className="jeu-carte-img" />
        {scene.hotspots.map((h, i) => (
          <button
            key={i}
            type="button"
            className="jeu-repere-zone"
            style={{
              left: `${h.x}%`,
              top: `${h.y}%`,
              width: `${h.zoneW ?? zoneW}%`,
              height: `${h.zoneH ?? zoneH}%`,
            }}
            onClick={() => playHotspot(h)}
            aria-label={`Écouter la prononciation de ${h.text}`}
          />
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
