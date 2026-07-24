import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MAISON_TAARIF } from './jeuData';
import DragSort from './DragSort';
import EtoileDrag, { etoileD } from './EtoileDrag';
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
import ikhfaLecon from './assets/ikhfa-lecon.jpg';
import audioIkhfaTitre from './assets/ikhfa-titre.wav';
import audioIkhfaMinSharrin from './assets/ikhfa-min-sharrin.wav';
import audioIkhfaDharratinSharran from './assets/ikhfa-dharratin-sharran.wav';
import audioIkhfaAlInsanu from './assets/ikhfa-al-insanu.wav';
import audioIkhfaNaranDhata from './assets/ikhfa-naran-dhata.wav';
import audioIkhfaMinJuin from './assets/ikhfa-min-juin.wav';
import audioIkhfaManThaqulat from './assets/ikhfa-man-thaqulat.wav';
import audioIkhfaAntum from './assets/ikhfa-antum.wav';
import audioIkhfaAnSalatihim from './assets/ikhfa-an-salatihim.wav';
import lectureLecon from './assets/lecture-lecon.jpg';
import audioLectureUmmahu from './assets/lecture-ummahu.wav';
import audioLectureJamma from './assets/lecture-jamma.wav';
import audioLectureAmma from './assets/lecture-amma.wav';
import audioLectureAlMuzzammilu from './assets/lecture-al-muzzammilu.wav';
import audioLectureHumilu from './assets/lecture-humilu.wav';
import audioLectureHammazin from './assets/lecture-hammazin.wav';
import audioLectureRummanun from './assets/lecture-rummanun.wav';
import audioLectureAlayma from './assets/lecture-alayma.wav';
import audioLectureYutamma from './assets/lecture-yutamma.wav';
import audioLectureMusamma from './assets/lecture-musamma.wav';
import audioLectureHammat from './assets/lecture-hammat.wav';
import audioLectureMuhammadun from './assets/lecture-muhammadun.wav';
import audioLectureDammara from './assets/lecture-dammara.wav';
import audioLectureUmmatin from './assets/lecture-ummatin.wav';
import audioLectureAlUmmiyyina from './assets/lecture-al-ummiyyina.wav';
import audioLectureMimman from './assets/lecture-mimman.wav';
import audioLectureHalumma from './assets/lecture-halumma.wav';
import audioLectureAimmata from './assets/lecture-aimmata.wav';
import audioLectureUmma from './assets/lecture-umma.wav';
import audioLectureNaammarahu from './assets/lecture-naammarahu.wav';
import jeuDeLectureDe from './assets/jeu-de-lecture-de.jpg';
import audioDeAlKhannasi from './assets/de-al-khannasi.wav';
import audioDeLatarawunna from './assets/de-latarawunna.wav';
import audioDeLatusalunna from './assets/de-latusalunna.wav';
import audioDeJahannama from './assets/de-jahannama.wav';
import audioDeAlMutmainnatu from './assets/de-al-mutmainnatu.wav';
import audioDeLatarkabunna from './assets/de-latarkabunna.wav';
import audioDeAlKhunnasi from './assets/de-al-khunnasi.wav';
import audioDeAlKunnasi from './assets/de-al-kunnasi.wav';
import audioDeAlJinna from './assets/de-al-jinna.wav';
import audioDeTallaqakunna from './assets/de-tallaqakunna.wav';
import jeuLectureCrayons from './assets/jeu-lecture-crayons.jpg';
import audioLecture2AnBadin from './assets/lecture2-an-badin.wav';
import audioLecture2YadhanuBihi from './assets/lecture2-yadhanu-bihi.wav';
import audioLecture2MashshainBinamimin from './assets/lecture2-mashshain-binamimin.wav';
import audioLecture2MakaninBaidin from './assets/lecture2-makanin-baidin.wav';
import audioLecture2ShadidunBima from './assets/lecture2-shadidun-bima.wav';
import audioLecture2Dhanbin from './assets/lecture2-dhanbin.wav';
import audioLecture2Layunbadhanna from './assets/lecture2-layunbadhanna.wav';
import audioLecture2NafsinBima from './assets/lecture2-nafsin-bima.wav';
import audioLecture2YuminuBirabbihi from './assets/lecture2-yuminu-birabbihi.wav';
import audioLecture2KiraminBararatin from './assets/lecture2-kiramin-bararatin.wav';
import audioLecture2YawmaidhinBibanihi from './assets/lecture2-yawmaidhin-bibanihi.wav';
import audioLecture2YawmaidhinBijahannama from './assets/lecture2-yawmaidhin-bijahannama.wav';
import audioLecture2ShayinBiamri from './assets/lecture2-shayin-biamri.wav';
import audioLecture2Yanbaghi from './assets/lecture2-yanbaghi.wav';
import audioLecture2Anbatna from './assets/lecture2-anbatna.wav';
import audioLecture2UtullinBaada from './assets/lecture2-utullin-baada.wav';
import lectureIdghamBilaGhunna from './assets/lecture-idgham-bila-ghunna.jpg';
import audioLecture3Titre from './assets/lecture3-titre.wav';
import audioLecture3HumazatiLumazatin from './assets/lecture3-humazati-lumazatin.wav';
import audioLecture3NuhunRabbi from './assets/lecture3-nuhun-rabbi.wav';
import audioLecture3MalaLubadan from './assets/lecture3-mala-lubadan.wav';
import audioLecture3WaylulLikulli from './assets/lecture3-waylul-likulli.wav';
import audioLecture3KhayrulLaka from './assets/lecture3-khayrul-laka.wav';
import audioLecture3FayawmaidhilLa from './assets/lecture3-fayawmaidhil-la.wav';
import audioLecture3FaaalulLima from './assets/lecture3-faaalul-lima.wav';
import audioLecture3NafsulLamma from './assets/lecture3-nafsul-lamma.wav';
import audioLecture3LaibratalLiman from './assets/lecture3-laibratal-liman.wav';
import audioLecture3MataaanLakum from './assets/lecture3-mataaan-lakum.wav';
import audioLecture3MannaaulLilkhayri from './assets/lecture3-mannaaul-lilkhayri.wav';
import audioLecture3AnRabbihim from './assets/lecture3-an-rabbihim.wav';
import audioLecture3MinRabbika from './assets/lecture3-min-rabbika.wav';
import audioLecture3AnLan from './assets/lecture3-an-lan.wav';
import audioLecture3ShihabanRasadan from './assets/lecture3-shihaban-rasadan.wav';
import audioLecture3AnLam from './assets/lecture3-an-lam.wav';
import audioLecture3YakunLahu from './assets/lecture3-yakun-lahu.wav';
import audioLecture3MinRahiqin from './assets/lecture3-min-rahiqin.wav';
import audioLecture3QasamulLidhi from './assets/lecture3-qasamul-lidhi.wav';
import audioLecture3AkhadhatanRabiyatan from './assets/lecture3-akhadhatan-rabiyatan.wav';
import lectureIdghamBiGhunna from './assets/lecture-idgham-bi-ghunna.jpg';
import audioLecture4Titre from './assets/lecture4-titre.wav';
import audioLecture4BihijaratinMin from './assets/lecture4-bihijaratin-min.wav';
import audioLecture4HablunMin from './assets/lecture4-hablun-min.wav';
import audioLecture4MinMasadin from './assets/lecture4-min-masadin.wav';
import audioLecture4AbidunMa from './assets/lecture4-abidun-ma.wav';
import audioLecture4SuhufanMutahharatan from './assets/lecture4-suhufan-mutahharatan.wav';
import audioLecture4AmadinMumaddadatin from './assets/lecture4-amadin-mumaddadatin.wav';
import audioLecture4KhayrunMin from './assets/lecture4-khayrun-min.wav';
import audioLecture4RasulunMin from './assets/lecture4-rasulun-min.wav';
import audioLecture4RabbihimMin from './assets/lecture4-rabbihim-min.wav';
import audioLecture4LahabinWa from './assets/lecture4-lahabin-wa.wav';
import audioLecture4MalanWa from './assets/lecture4-malan-wa.wav';
import audioLecture4QuwwatinWala from './assets/lecture4-quwwatin-wala.wav';
import audioLecture4MinWaraihim from './assets/lecture4-min-waraihim.wav';
import audioLecture4YawmaidhinYasduru from './assets/lecture4-yawmaidhin-yasduru.wav';
import audioLecture4HisabanYasiran from './assets/lecture4-hisaban-yasiran.wav';
import audioLecture4LanYahura from './assets/lecture4-lan-yahura.wav';
import audioLecture4LanYaqdira from './assets/lecture4-lan-yaqdira.wav';
import audioLecture4AmilatunNasibatun from './assets/lecture4-amilatun-nasibatun.wav';
import audioLecture4YawmaidhinNaimatun from './assets/lecture4-yawmaidhin-naimatun.wav';
import audioLecture4FamanYamal from './assets/lecture4-faman-yamal.wav';
import jeuDeLectureIkhfa from './assets/jeu-de-lecture-ikhfa.jpg';
import audioJeuIkhfaTitre from './assets/jeuikhfa-titre.wav';
import audioJeuIkhfaInda from './assets/jeuikhfa-inda.wav';
import audioJeuIkhfaAnzalnahu from './assets/jeuikhfa-anzalnahu.wav';
import audioJeuIkhfaAnka from './assets/jeuikhfa-anka.wav';
import audioJeuIkhfaFaandhartukum from './assets/jeuikhfa-faandhartukum.wav';
import audioJeuIkhfaYantahi from './assets/jeuikhfa-yantahi.wav';
import audioJeuIkhfaMunfakkina from './assets/jeuikhfa-munfakkina.wav';
import audioJeuIkhfaFaansab from './assets/jeuikhfa-faansab.wav';
import audioJeuIkhfaAnqad from './assets/jeuikhfa-anqad.wav';
import audioJeuIkhfaMinMain from './assets/jeuikhfa-min-main.wav';
import audioJeuIkhfaDallanFahada from './assets/jeuikhfa-dallan-fahada.wav';
import audioJeuIkhfaNasiyatinKadhibatin from './assets/jeuikhfa-nasiyatin-kadhibatin.wav';
import audioJeuIkhfaNaranTalazza from './assets/jeuikhfa-naran-talazza.wav';
import audioJeuIkhfaAnTabaqin from './assets/jeuikhfa-an-tabaqin.wav';
import audioJeuIkhfaDakkanDakkan from './assets/jeuikhfa-dakkan-dakkan.wav';
import audioJeuIkhfaAilanFaaghna from './assets/jeuikhfa-ailan-faaghna.wav';
import audioJeuIkhfaMinDariin from './assets/jeuikhfa-min-dariin.wav';
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
import villageWaqfVideoMp4 from './assets/village-waqf-video.mp4';
import villageWaqfVideoWebm from './assets/village-waqf-video.webm';
import maisonWaqfPortes from './assets/maison-waqf-portes.jpg';
import audioWaqfTitre from './assets/waqf-titre.wav';
import audioWaqfHurufulMaddi from './assets/waqf-huruful-maddi.wav';
import audioWaqfAttauMarbutatu from './assets/waqf-attau-marbutatu.wav';
import audioWaqfAlfathatani from './assets/waqf-alfathatani.wav';
import audioWaqfSukunulWaqfi from './assets/waqf-sukunul-waqfi.wav';
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

// Leçon de l'ikhfa (porte إِخْفَاءٌ) — zones cliquables image-map.net
// fournies par Sofiane, converties en % (x,y = coin bas-droit).
const IKHFA_LECON = {
  img: ikhfaLecon,
  hotspots: [
    { text: 'إِخْفَاءٌ', x: 57.38, y: 7.78, zoneW: 17.48, zoneH: 4.96, audio: audioIkhfaTitre },
    { text: 'مِن شَرِّ', x: 92.67, y: 64.71, zoneW: 16.01, zoneH: 6.48, audio: audioIkhfaMinSharrin },
    { text: 'ذَرَّةِ شَرًّا', x: 72.27, y: 64.43, zoneW: 14.32, zoneH: 6.76, audio: audioIkhfaDharratinSharran },
    { text: 'الْإِنسَانُ', x: 52.65, y: 65.11, zoneW: 15.90, zoneH: 7.84, audio: audioIkhfaAlInsanu },
    { text: 'نَارًا ذَاتَ', x: 31.00, y: 64.82, zoneW: 14.77, zoneH: 6.99, audio: audioIkhfaNaranDhata },
    { text: 'مِن جُوعٍ', x: 93.57, y: 75.65, zoneW: 17.36, zoneH: 7.72, audio: audioIkhfaMinJuin },
    { text: 'مَن ثَقُلَتْ', x: 73.28, y: 75.65, zoneW: 16.57, zoneH: 8.06, audio: audioIkhfaManThaqulat },
    { text: 'أَنتُمْ', x: 50.51, y: 74.63, zoneW: 13.08, zoneH: 6.54, audio: audioIkhfaAntum },
    { text: 'عَن صَلَاتِهِمْ', x: 32.02, y: 75.70, zoneW: 16.80, zoneH: 8.51, audio: audioIkhfaAnSalatihim },
  ],
};

// Salle de jeux de la maison Noun et Mim — tableau de lecture des 20 mots
// (révision des 5 règles). Zones audio image-map.net fournies par Sofiane
// (x,y = coin bas-droit) ; pas encore de fichiers audio dédiés (à venir) →
// repli synthèse vocale via playHotspot. Le tableau « Mes bonnes lectures »
// est un jeu de glisser-déposer d'étoiles indépendant (cf. EtoileDrag).
const LECTURE_LECON = {
  img: lectureLecon,
  hotspots: [
    { text: 'أُمَّهُ', x: 76.10, y: 34.05, zoneW: 10.15, zoneH: 5.47, audio: audioLectureUmmahu },
    { text: 'جَمَّا', x: 62.68, y: 33.76, zoneW: 10.37, zoneH: 4.85, audio: audioLectureJamma },
    { text: 'عَمَّ', x: 48.71, y: 33.99, zoneW: 10.26, zoneH: 5.35, audio: audioLectureAmma },
    { text: 'اَلْمُزَّمِّلُ', x: 35.40, y: 34.27, zoneW: 11.05, zoneH: 5.86, audio: audioLectureAlMuzzammilu },
    { text: 'حُمِلُوا۟', x: 20.97, y: 34.05, zoneW: 10.71, zoneH: 5.58, audio: audioLectureHumilu },
    { text: 'هَمَّازٍ', x: 75.54, y: 41.66, zoneW: 9.58, zoneH: 5.47, audio: audioLectureHammazin },
    { text: 'رُمَّانٌ', x: 62.12, y: 41.88, zoneW: 10.15, zoneH: 5.58, audio: audioLectureRummanun },
    { text: 'اَلَيمَ', x: 48.93, y: 41.88, zoneW: 10.71, zoneH: 5.64, audio: audioLectureAlayma },
    { text: 'يُتَمَّ', x: 35.06, y: 41.77, zoneW: 10.26, zoneH: 5.52, audio: audioLectureYutamma },
    { text: 'هَمَّتْ', x: 20.41, y: 41.49, zoneW: 10.49, zoneH: 5.02, audio: audioLectureHammat },
    { text: 'مُسَمَّى', x: 76.55, y: 49.72, zoneW: 10.94, zoneH: 5.92, audio: audioLectureMusamma },
    { text: 'مُحَمَّدٌ', x: 62.91, y: 49.38, zoneW: 10.60, zoneH: 5.30, audio: audioLectureMuhammadun },
    { text: 'دَمَّرَ', x: 48.71, y: 49.32, zoneW: 10.49, zoneH: 5.24, audio: audioLectureDammara },
    { text: 'أُمَّةٍ', x: 35.06, y: 49.61, zoneW: 9.92, zoneH: 5.41, audio: audioLectureUmmatin },
    { text: 'اَلْأُمِّيّنَ', x: 20.86, y: 49.27, zoneW: 10.82, zoneH: 5.47, audio: audioLectureAlUmmiyyina },
    { text: 'مِمَّن', x: 76.66, y: 57.22, zoneW: 10.94, zoneH: 5.47, audio: audioLectureMimman },
    { text: 'هَلُمَّ', x: 62.35, y: 57.27, zoneW: 9.81, zoneH: 5.69, audio: audioLectureHalumma },
    { text: 'أَئِمَّةَ', x: 47.91, y: 57.10, zoneW: 9.47, zoneH: 5.30, audio: audioLectureAimmata },
    { text: 'أُمَّ', x: 34.05, y: 57.10, zoneW: 9.02, zoneH: 5.30, audio: audioLectureUmma },
    { text: 'نَعَمَّرَهُ', x: 22.10, y: 57.10, zoneW: 11.84, zoneH: 5.24, audio: audioLectureNaammarahu },
  ],
};

// Jeu de lecture au dé (2e écran de la salle de jeux) — 10 mots (5 roses,
// 5 bleus) avec zones audio image-map.net fournies par Sofiane, converties
// en % (x,y = coin bas-droit).
const JEU_DE_LECTURE = {
  img: jeuDeLectureDe,
  hotspots: [
    { text: 'اَلْخَنَّاسِ', x: 80.38, y: 39.68, zoneW: 26.16, zoneH: 5.92, audio: audioDeAlKhannasi },
    { text: 'لَتَرَوُنَّ', x: 47.91, y: 39.74, zoneW: 26.61, zoneH: 5.75, audio: audioDeLatarawunna },
    { text: 'لَتُسْأَلُنَّ', x: 80.95, y: 47.52, zoneW: 27.17, zoneH: 5.19, audio: audioDeLatusalunna },
    { text: 'جَهَنَّمَ', x: 47.13, y: 48.48, zoneW: 25.48, zoneH: 6.26, audio: audioDeJahannama },
    { text: 'اَلْمُطْمَئِنَّةُ', x: 80.16, y: 56.03, zoneW: 26.72, zoneH: 5.75, audio: audioDeAlMutmainnatu },
    { text: 'لَتَركَبُنَّ', x: 46.34, y: 56.37, zoneW: 23.23, zoneH: 5.07, audio: audioDeLatarkabunna },
    { text: 'اَلْخُنَّسِ', x: 79.03, y: 64.43, zoneW: 25.03, zoneH: 5.75, audio: audioDeAlKhunnasi },
    { text: 'اَلْكُنَّسِ', x: 46.90, y: 65.16, zoneW: 25.71, zoneH: 6.26, audio: audioDeAlKunnasi },
    { text: 'اَلْجِنَّ', x: 78.47, y: 72.83, zoneW: 23.90, zoneH: 5.64, audio: audioDeAlJinna },
    { text: 'طَلَّقَكُنَّ', x: 46.11, y: 73.06, zoneW: 24.69, zoneH: 5.64, audio: audioDeTallaqakunna },
  ],
};

// Jeu de lecture à colorier (3e écran de la salle de jeux) — 16 mots en
// grille 4×4, un crayon virtuel permet de colorier l'étoile de chaque carte
// après lecture (clic = colorie, définitif). Coordonnées mesurées au pixel
// sur l'image 887×1774 (mêmes conventions que EtoileDrag : cercles centrés
// cx,cy ; zones audio x,y = coin bas-droit).
const LECTURE_MOTS_CRAYON = {
  img: jeuLectureCrayons,
  hotspots: [
    { text: 'عَنْ بَعْضٍ', x: 95.83, y: 36.36, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2AnBadin },
    { text: 'يَأْذَن بِهِ', x: 69.90, y: 36.36, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2YadhanuBihi },
    { text: 'مَشَّاءٍ بِنَمِيمٍ', x: 46.22, y: 36.36, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2MashshainBinamimin },
    { text: 'مَكَانٍ بَعِيدٍ', x: 22.55, y: 36.36, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2MakaninBaidin },
    { text: 'شَدِيدٌ بِمَا', x: 95.83, y: 54.23, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2ShadidunBima },
    { text: 'ذَنبٍ', x: 69.90, y: 54.23, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2Dhanbin },
    { text: 'لَيُنْبَذَنَّ', x: 46.22, y: 54.23, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2Layunbadhanna },
    { text: 'نَفْسٍ بِمَا', x: 22.55, y: 54.23, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2NafsinBima },
    { text: 'يُؤْمِنْ بِرَبِّهِ', x: 95.83, y: 71.82, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2YuminuBirabbihi },
    { text: 'كِرَامٍ بَرَرَةٍ', x: 69.90, y: 71.82, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2KiraminBararatin },
    { text: 'يَوْمَئِذٍ بِبَنِيهِ', x: 46.22, y: 71.82, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2YawmaidhinBibanihi },
    { text: 'يَوْمَئِذٍ بِجَهَنَّمَ', x: 22.55, y: 71.82, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2YawmaidhinBijahannama },
    { text: 'شَىْءٍ بِأَمْرِ', x: 95.83, y: 85.01, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2ShayinBiamri },
    { text: 'يَنْبَغِي', x: 69.90, y: 85.01, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2Yanbaghi },
    { text: 'أَنبَتْنَا', x: 46.22, y: 85.01, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2Anbatna },
    { text: 'عُتُلٍّ بَعْدَ', x: 22.55, y: 85.01, zoneW: 21.99, zoneH: 8.46, audio: audioLecture2UtullinBaada },
  ],
  // Centres des étoiles à colorier (une par carte), mêmes positions que les
  // mots ci-dessus (rangée/colonne), en % du centre cette fois (pas coin).
  etoiles: [
    { cx: 92.90, cy: 39.46 }, { cx: 69.56, cy: 39.46 }, { cx: 45.32, cy: 39.46 }, { cx: 21.42, cy: 39.46 },
    { cx: 92.90, cy: 57.33 }, { cx: 69.56, cy: 57.33 }, { cx: 45.32, cy: 57.33 }, { cx: 21.42, cy: 57.33 },
    { cx: 92.90, cy: 74.92 }, { cx: 69.56, cy: 74.92 }, { cx: 45.32, cy: 74.92 }, { cx: 21.42, cy: 74.92 },
    { cx: 92.90, cy: 88.11 }, { cx: 69.56, cy: 88.11 }, { cx: 45.32, cy: 88.11 }, { cx: 21.42, cy: 88.11 },
  ],
};
// Centres des 16 petites étoiles de la rangée « Ma récompense » (remplies
// une par une, dans l'ordre où l'élève colorie les cartes — même logique que
// ETOILE_SLOTS/EtoileDrag).
const LECTURE_RECOMPENSE_ETOILES = [
  { cx: 23.51, cy: 96.45 }, { cx: 28.19, cy: 96.45 }, { cx: 32.25, cy: 96.45 }, { cx: 36.30, cy: 96.45 },
  { cx: 40.42, cy: 96.45 }, { cx: 44.42, cy: 96.45 }, { cx: 48.48, cy: 96.45 }, { cx: 52.60, cy: 96.45 },
  { cx: 56.71, cy: 96.45 }, { cx: 60.82, cy: 96.45 }, { cx: 65.00, cy: 96.45 }, { cx: 69.05, cy: 96.45 },
  { cx: 73.11, cy: 96.45 }, { cx: 77.23, cy: 96.45 }, { cx: 81.40, cy: 96.45 }, { cx: 85.52, cy: 96.45 },
];

// Lecture pratique de l'idgham bila ghunna (4e écran de la salle de jeux) —
// 20 mots en grille 4×5 + le titre de la règle, zones audio image-map.net
// fournies par Sofiane, converties en % (x,y = coin bas-droit).
const LECTURE_IDGHAM_BILA_GHUNNA = {
  img: lectureIdghamBilaGhunna,
  hotspots: [
    { text: 'إِدْغَامُ بِلَا غُنَّةٍ', x: 71.36, y: 18.20, zoneW: 38.22, zoneH: 5.02, audio: audioLecture3Titre },
    { text: 'هُمَزَةِ لُمَزَةٍ', x: 96.51, y: 38.95, zoneW: 19.28, zoneH: 7.16, audio: audioLecture3HumazatiLumazatin },
    { text: 'نُوحٌ رَبِّ', x: 72.38, y: 38.78, zoneW: 17.36, zoneH: 6.76, audio: audioLecture3NuhunRabbi },
    { text: 'مَالَا لُبَدًا', x: 48.93, y: 38.61, zoneW: 18.72, zoneH: 6.42, audio: audioLecture3MalaLubadan },
    { text: 'وَيْلٌ لِّكُلِ', x: 24.92, y: 38.50, zoneW: 17.59, zoneH: 6.82, audio: audioLecture3WaylulLikulli },
    { text: 'خَيْرٌ لَّكَ', x: 96.28, y: 49.89, zoneW: 19.62, zoneH: 6.65, audio: audioLecture3KhayrulLaka },
    { text: 'فَيَوْمَئِذٍ لَّا', x: 73.39, y: 49.94, zoneW: 20.29, zoneH: 7.05, audio: audioLecture3FayawmaidhilLa },
    { text: 'فَعَّالٌ لِّمَا', x: 48.03, y: 50.62, zoneW: 16.46, zoneH: 7.27, audio: audioLecture3FaaalulLima },
    { text: 'نَفْسٌ لَّمَّا', x: 24.69, y: 50.00, zoneW: 17.02, zoneH: 7.10, audio: audioLecture3NafsulLamma },
    { text: 'لَعِبْرَةً لِّمَنْ', x: 97.18, y: 61.72, zoneW: 21.31, zoneH: 7.55, audio: audioLecture3LaibratalLiman },
    { text: 'مَتَاعًا لَّكُمْ', x: 72.94, y: 61.22, zoneW: 20.07, zoneH: 6.60, audio: audioLecture3MataaanLakum },
    { text: 'مَنَّاعٌ لِّلْخَيْرِ', x: 49.94, y: 61.50, zoneW: 20.97, zoneH: 6.76, audio: audioLecture3MannaaulLilkhayri },
    { text: 'عَنْ رَّبِّهِمْ', x: 25.03, y: 60.88, zoneW: 18.38, zoneH: 6.31, audio: audioLecture3AnRabbihim },
    { text: 'مِن رَّبِّكَ', x: 96.17, y: 72.83, zoneW: 19.05, zoneH: 7.05, audio: audioLecture3MinRabbika },
    { text: 'أَن لَّنْ', x: 70.80, y: 73.11, zoneW: 16.69, zoneH: 7.38, audio: audioLecture3AnLan },
    { text: 'شِهَابًا رَّصَدًا', x: 49.27, y: 72.10, zoneW: 21.20, zoneH: 6.31, audio: audioLecture3ShihabanRasadan },
    { text: 'أَن لَّمْ', x: 24.35, y: 71.53, zoneW: 15.67, zoneH: 5.75, audio: audioLecture3AnLam },
    { text: 'يَكُن لَّهُ', x: 95.60, y: 83.77, zoneW: 17.02, zoneH: 6.71, audio: audioLecture3YakunLahu },
    { text: 'مِن رَّحِيقٍ', x: 72.61, y: 84.44, zoneW: 19.50, zoneH: 7.72, audio: audioLecture3MinRahiqin },
    { text: 'قَسَمٌ لِّذِي', x: 48.03, y: 83.88, zoneW: 18.27, zoneH: 7.16, audio: audioLecture3QasamulLidhi },
    { text: 'أَخَذَةً رَّابِيَةً', x: 25.93, y: 84.05, zoneW: 21.76, zoneH: 7.44, audio: audioLecture3AkhadhatanRabiyatan },
  ],
};

// Lecture pratique de l'idgham bi ghunna (5e écran de la salle de jeux) —
// 20 mots en grille 4×5 + le titre de la règle, zones audio image-map.net
// fournies par Sofiane, converties en % (x,y = coin bas-droit).
const LECTURE_IDGHAM_BI_GHUNNA = {
  img: lectureIdghamBiGhunna,
  hotspots: [
    { text: 'إِدْغَامُ بِغُنَّةٍ', x: 67.19, y: 15.95, zoneW: 31.91, zoneH: 5.07, audio: audioLecture4Titre },
    { text: 'بِحِجَارَةٍ مِّن', x: 95.38, y: 52.98, zoneW: 19.73, zoneH: 5.92, audio: audioLecture4BihijaratinMin },
    { text: 'حَبْلٌ مِّن', x: 71.02, y: 53.78, zoneW: 18.38, zoneH: 6.93, audio: audioLecture4HablunMin },
    { text: 'مِن مَّسَدٍ', x: 47.13, y: 53.72, zoneW: 17.02, zoneH: 5.64, audio: audioLecture4MinMasadin },
    { text: 'عَابِدُ مَا', x: 23.34, y: 53.33, zoneW: 16.35, zoneH: 5.30, audio: audioLecture4AbidunMa },
    { text: 'صُحُفًا مُّطَهَّرَةً', x: 94.48, y: 63.19, zoneW: 19.17, zoneH: 6.71, audio: audioLecture4SuhufanMutahharatan },
    { text: 'عَمَدٍ مُّمَدَّدَةٍ', x: 71.93, y: 63.59, zoneW: 20.29, zoneH: 7.27, audio: audioLecture4AmadinMumaddadatin },
    { text: 'خَيْرٌ مِّن', x: 48.25, y: 63.02, zoneW: 19.50, zoneH: 6.48, audio: audioLecture4KhayrunMin },
    { text: 'رَسُولٌ مِّن', x: 23.90, y: 63.30, zoneW: 18.38, zoneH: 6.71, audio: audioLecture4RasulunMin },
    { text: 'رَبِّهِم مِّن', x: 95.04, y: 72.77, zoneW: 19.73, zoneH: 6.54, audio: audioLecture4RabbihimMin },
    { text: 'لَهَبٍ وَ', x: 71.14, y: 72.83, zoneW: 18.60, zoneH: 6.88, audio: audioLecture4LahabinWa },
    { text: 'مَالًا وَ', x: 47.13, y: 72.83, zoneW: 17.25, zoneH: 6.48, audio: audioLecture4MalanWa },
    { text: 'قُوَّةٍ وَلَا', x: 24.24, y: 72.72, zoneW: 16.91, zoneH: 5.86, audio: audioLecture4QuwwatinWala },
    { text: 'مِن وَرَآئِهِم', x: 94.48, y: 82.19, zoneW: 18.60, zoneH: 6.03, audio: audioLecture4MinWaraihim },
    { text: 'يَوْمَئِذٍ يَصْدُرُ', x: 72.15, y: 82.41, zoneW: 20.29, zoneH: 6.42, audio: audioLecture4YawmaidhinYasduru },
    { text: 'حِسَابًا يَسِيرًا', x: 48.82, y: 82.13, zoneW: 21.08, zoneH: 6.31, audio: audioLecture4HisabanYasiran },
    { text: 'لَن يَحُورَ', x: 24.35, y: 82.30, zoneW: 19.17, zoneH: 6.71, audio: audioLecture4LanYahura },
    { text: 'لَن يَقْدِرَ', x: 93.80, y: 91.71, zoneW: 18.15, zoneH: 6.48, audio: audioLecture4LanYaqdira },
    { text: 'عَامِلَةٌ نَّاصِبَةٌ', x: 72.49, y: 91.77, zoneW: 20.63, zoneH: 6.09, audio: audioLecture4AmilatunNasibatun },
    { text: 'يَوْمَئِذٍ نَّاعِمَةٌ', x: 48.82, y: 91.83, zoneW: 21.20, zoneH: 6.82, audio: audioLecture4YawmaidhinNaimatun },
    { text: 'فَمَن يَعْمَلْ', x: 24.13, y: 91.88, zoneW: 19.28, zoneH: 6.76, audio: audioLecture4FamanYamal },
  ],
};

// Jeu de lecture de l'ikhfa (6e écran de la salle de jeux) — titre + 16 mots
// en grille 4×4, zones audio image-map.net fournies par Sofiane, converties
// en % (x,y = coin bas-droit).
const JEU_DE_LECTURE_IKHFA = {
  img: jeuDeLectureIkhfa,
  hotspots: [
    { text: 'إِخْفَاءِ', x: 68.32, y: 15.16, zoneW: 18.60, zoneH: 4.45, audio: audioJeuIkhfaTitre },
    { text: 'عِندَ', x: 93.46, y: 56.31, zoneW: 14.32, zoneH: 6.65, audio: audioJeuIkhfaInda },
    { text: 'أَنزَلْنَهُ', x: 71.36, y: 56.42, zoneW: 18.04, zoneH: 7.27, audio: audioJeuIkhfaAnzalnahu },
    { text: 'عَنكَ', x: 46.22, y: 57.05, zoneW: 17.25, zoneH: 8.00, audio: audioJeuIkhfaAnka },
    { text: 'فَأَنذَرْتُكُم', x: 23.45, y: 57.10, zoneW: 18.72, zoneH: 7.55, audio: audioJeuIkhfaFaandhartukum },
    { text: 'يَنتَهِ', x: 93.80, y: 68.32, zoneW: 14.32, zoneH: 5.52, audio: audioJeuIkhfaYantahi },
    { text: 'مُنفَكِّينَ', x: 70.58, y: 68.77, zoneW: 17.14, zoneH: 7.95, audio: audioJeuIkhfaMunfakkina },
    { text: 'فَأَنصَبْ', x: 45.89, y: 68.94, zoneW: 17.36, zoneH: 6.88, audio: audioJeuIkhfaFaansab },
    { text: 'أَنقَضَ', x: 22.10, y: 68.77, zoneW: 16.46, zoneH: 7.05, audio: audioJeuIkhfaAnqad },
    { text: 'مِن مَّآءٍ', x: 94.70, y: 80.50, zoneW: 17.70, zoneH: 7.16, audio: audioJeuIkhfaMinMain },
    { text: 'ضَآلًّا فَهَدَىٰ', x: 72.72, y: 81.51, zoneW: 20.86, zoneH: 8.06, audio: audioJeuIkhfaDallanFahada },
    { text: 'نَاصِيَةٍ كَٰذِبَةٍ', x: 48.71, y: 81.06, zoneW: 21.42, zoneH: 8.23, audio: audioJeuIkhfaNasiyatinKadhibatin },
    { text: 'نَارًا تَلَظَّىٰ', x: 23.11, y: 81.17, zoneW: 18.38, zoneH: 7.84, audio: audioJeuIkhfaNaranTalazza },
    { text: 'عَن طَبَقٍ', x: 94.93, y: 92.78, zoneW: 18.38, zoneH: 7.38, audio: audioJeuIkhfaAnTabaqin },
    { text: 'دَكًّا دَكًّا', x: 70.58, y: 92.78, zoneW: 17.70, zoneH: 7.16, audio: audioJeuIkhfaDakkanDakkan },
    { text: 'عَآئِلًا فَأَغْنَىٰ', x: 48.14, y: 93.63, zoneW: 19.50, zoneH: 8.29, audio: audioJeuIkhfaAilanFaaghna },
    { text: 'مِن ضَرِيعٍ', x: 23.23, y: 93.12, zoneW: 18.49, zoneH: 8.06, audio: audioJeuIkhfaMinDariin },
  ],
};

// Cases du tableau « Mes bonnes lectures » (3 colonnes, remplies dans
// l'ordre de lecture) — mesurées au pixel sur l'image 887×1774.
const ETOILE_SLOTS = [
  { x: 82.30, y: 33.99 }, { x: 88.28, y: 33.99 }, { x: 93.91, y: 33.99 },
  { x: 82.30, y: 36.64 }, { x: 88.28, y: 36.64 }, { x: 93.91, y: 36.64 },
  { x: 82.30, y: 39.35 }, { x: 88.28, y: 39.35 }, { x: 93.91, y: 39.35 },
  { x: 82.30, y: 41.99 }, { x: 88.28, y: 41.99 }, { x: 93.91, y: 41.99 },
  { x: 82.30, y: 44.70 }, { x: 88.28, y: 44.70 }, { x: 93.91, y: 44.70 },
  { x: 82.30, y: 47.35 }, { x: 88.28, y: 47.35 }, { x: 93.91, y: 47.35 },
  { x: 82.30, y: 50.06 }, { x: 88.28, y: 50.06 },
];
const ETOILE_BOARD_ZONE = { left: 78, top: 32, width: 20, height: 20 };

// Point d'entrée « Salle de jeux » sur le couloir Noun et Mim, sur la
// pancarte de la porte bleue.
const SALLE_JEUX_NOUN_MIM_HOTSPOT = { x: 94, y: 42 };

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
  { id: 'ikhfa', label: 'إِخْفَاءٌ', x: 80.83, y: 45.38, actif: true, ecran: 'ikhfa-lecon' },
];

// Couloir de la maison secrète du Waqf — pancartes des 4 règles + panneau du
// titre, avec zones audio invisibles (mêmes conventions que
// PORTES_NOUN_MIM_LECON : x,y = coin bas-droit de la zone, zoneW/zoneH =
// taille, coordonnées fournies par Sofiane via image-map.net sur l'image
// 887×1774, converties en %).
const PORTES_WAQF_LECON = {
  img: maisonWaqfPortes,
  hotspots: [
    { text: 'La Maison des Arrêts', x: 15.78, y: 25.37, zoneW: 13.53, zoneH: 3.10, audio: audioWaqfTitre },
    { text: 'سُكُونُ الْوَقْفِ', x: 32.81, y: 32.53, zoneW: 10.26, zoneH: 6.71, audio: audioWaqfSukunulWaqfi },
    { text: 'اَلْفَتْحَتَانِ', x: 50.17, y: 31.45, zoneW: 12.51, zoneH: 4.11, audio: audioWaqfAlfathatani },
    { text: 'اَلتَّاءُ الْمَرْبُوطَةُ', x: 66.52, y: 32.02, zoneW: 13.19, zoneH: 6.20, audio: audioWaqfAttauMarbutatu },
    { text: 'حُرُوفُ الْمَدِّ', x: 81.40, y: 32.47, zoneW: 11.27, zoneH: 6.71, audio: audioWaqfHurufulMaddi },
  ],
};

// Les 4 portes du couloir du Waqf — aucune leçon développée pour l'instant,
// toutes verrouillées (contenu à venir). x,y = centre de la poignée.
const PORTES_WAQF_DOORS = [
  { id: 'sukunul-waqfi', label: 'سُكُونُ الْوَقْفِ', x: 27.68, y: 45.38, actif: false },
  { id: 'alfathatani', label: 'اَلْفَتْحَتَانِ', x: 43.92, y: 45.38, actif: false },
  { id: 'attau-marbutatu', label: 'اَلتَّاءُ الْمَرْبُوطَةُ', x: 59.92, y: 45.38, actif: false },
  { id: 'huruful-maddi', label: 'حُرُوفُ الْمَدِّ', x: 75.76, y: 45.38, actif: false },
];

// Point d'entrée « Salle de jeux » sur le couloir du Waqf, sur la pancarte
// de la porte bleue (pas encore de contenu, verrouillée).
const SALLE_JEUX_WAQF_HOTSPOT = { x: 91.32, y: 46.79 };

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
  const [waqfDebloque, setWaqfDebloque] = useState(false);
  const [maisonBientotLabel, setMaisonBientotLabel] = useState('');
  const [porteNounMimVerrouillee, setPorteNounMimVerrouillee] = useState(null);
  const [porteWaqfVerrouillee, setPorteWaqfVerrouillee] = useState(null);
  const [jeuxWaqfVerrouille, setJeuxWaqfVerrouille] = useState(false);
  const [deResultat, setDeResultat] = useState(null);
  const [deLance, setDeLance] = useState(false);
  const [motsColories, setMotsColories] = useState(() => Array(LECTURE_MOTS_CRAYON.etoiles.length).fill(false));
  const [crayonDrag, setCrayonDrag] = useState(null);

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
    else if (m.id === 'waqf') setEcran('portes-waqf');
    else { setMaisonBientotLabel(m.label); setEcran('bientot'); }
  };
  const cliquerPorteNounMim = (d) => {
    if (!d.actif) {
      setPorteNounMimVerrouillee(d.id);
      setTimeout(() => setPorteNounMimVerrouillee((v) => (v === d.id ? null : v)), 1600);
      return;
    }
    setEcran(d.ecran);
  };
  const cliquerPorteWaqf = (d) => {
    if (!d.actif) {
      setPorteWaqfVerrouillee(d.id);
      setTimeout(() => setPorteWaqfVerrouillee((v) => (v === d.id ? null : v)), 1600);
      return;
    }
    setEcran(d.ecran);
  };
  const cliquerSalleJeuxWaqf = () => {
    setJeuxWaqfVerrouille(true);
    setTimeout(() => setJeuxWaqfVerrouille(false), 1600);
  };
  const lancerDe = () => {
    if (deLance) return;
    setDeLance(true);
    setDeResultat(null);
    setTimeout(() => {
      setDeResultat(Math.random() < 0.5 ? 'rose' : 'bleu');
      setDeLance(false);
    }, 600);
  };
  const colorierMot = (i) => {
    setMotsColories((arr) => (arr[i] ? arr : arr.map((v, idx) => (idx === i ? true : v))));
  };
  const demarrerDragCrayon = (e) => {
    e.preventDefault();
    setCrayonDrag({ x: e.clientX, y: e.clientY });
  };
  useEffect(() => {
    if (!crayonDrag) return;
    const onMove = (e) => setCrayonDrag((d) => d && { ...d, x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      const cible = document.elementFromPoint(e.clientX, e.clientY)?.closest('.jeu-crayon-etoile');
      if (cible) colorierMot(Number(cible.dataset.index));
      setCrayonDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [crayonDrag]);
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

  const maisonsVillage = MAISONS_VILLAGE.map((m) => {
    if (m.id === 'noun-mim') return { ...m, actif: nounMimDebloque };
    if (m.id === 'waqf') return { ...m, actif: waqfDebloque };
    return m;
  });

  const zones = maison.portes.map((p) => ({ id: p.id, label: p.sousTitre, emoji: p.mascotte, couleur: p.couleur }));
  const defiItems = maison.evaluation.map((m, i) => ({ id: `m${i}`, mot: m.mot, famille: m.famille }));

  const estEcranLecture = ecran === 'lecture' || ecran === 'lecture2';
  const estEcranVillage = ecran === 'village' || ecran === 'village-video';
  const retourLabel = estEcranVillage ? '← Carte du Royaume' : estEcranLecture ? '← Choisir une porte' : '← Village du Coran';
  const retourCible = estEcranVillage ? 'carte' : estEcranLecture ? 'portes' : 'village';
  const leconScene = porteActive ? LECON_SCENES[porteActive] : null;
  const leconVideo = porteActive ? LECON_VIDEOS[porteActive] : null;
  const ecranPleinEcran = ['carte', 'carte-video', 'village', 'village-video', 'portes', 'portes-video-1', 'portes-video-2', 'portes-noun-mim', 'lecture', 'lecture2', 'lecon-video', 'evaluation', 'noun-mim-video', 'noun-mim-lecon', 'iqlab-lecon', 'idgham-bila-ghunna-lecon', 'idgham-bi-ghunna-lecon', 'ikhfa-lecon', 'lecture-defi', 'jeu-de-lecture', 'lecture-mots-crayon', 'lecture-idgham-bila-ghunna', 'lecture-idgham-bi-ghunna', 'jeu-de-lecture-ikhfa', 'village-video-waqf', 'portes-waqf'].includes(ecran) || (ecran === 'lecon' && leconScene);

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
            <button
              type="button"
              className="jeu-repere is-actif"
              style={{ left: `${SALLE_JEUX_NOUN_MIM_HOTSPOT.x}%`, top: `${SALLE_JEUX_NOUN_MIM_HOTSPOT.y}%` }}
              onClick={() => setEcran('lecture-defi')}
              aria-label="Salle de jeux"
            >
              <span className="jeu-repere-point" />
            </button>
          </div>
          <button
            type="button"
            className="jeu-btn jeu-lecon-scene-btn"
            onClick={() => setEcran('village-video-waqf')}
          >
            Je quitte la maison →
          </button>
        </div>
      )}

      {ecran === 'village-video-waqf' && (
        <VideoIntro
          mp4={villageWaqfVideoMp4}
          webm={villageWaqfVideoWebm}
          onEnded={() => { setWaqfDebloque(true); setEcran('village'); }}
        />
      )}

      {ecran === 'portes-waqf' && (
        <div className="jeu-carte">
          <div className="jeu-carte-inner">
            <img src={maisonWaqfPortes} alt="Le couloir de la maison secrète du Waqf" className="jeu-carte-img" />
            {PORTES_WAQF_LECON.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
            {PORTES_WAQF_DOORS.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`jeu-repere${d.actif ? ' is-actif' : ' is-verrouille'}`}
                style={{ left: `${d.x}%`, top: `${d.y}%` }}
                onClick={() => cliquerPorteWaqf(d)}
                aria-label={d.label}
              >
                <span className="jeu-repere-point" />
                {porteWaqfVerrouillee === d.id && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
              </button>
            ))}
            <button
              type="button"
              className="jeu-repere is-verrouille"
              style={{ left: `${SALLE_JEUX_WAQF_HOTSPOT.x}%`, top: `${SALLE_JEUX_WAQF_HOTSPOT.y}%` }}
              onClick={cliquerSalleJeuxWaqf}
              aria-label="Salle de jeux"
            >
              <span className="jeu-repere-point" />
              {jeuxWaqfVerrouille && <span className="jeu-repere-toast">🔒 Bientôt disponible</span>}
            </button>
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

      {ecran === 'ikhfa-lecon' && (
        <LeconScene scene={IKHFA_LECON} onFini={() => setEcran('portes-noun-mim')} boutonLabel="J'ai compris →" />
      )}

      {ecran === 'lecture-defi' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={LECTURE_LECON.img} alt="Défi de lecture" className="jeu-carte-img" />
            {LECTURE_LECON.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
            <EtoileDrag slots={ETOILE_SLOTS} boardZone={ETOILE_BOARD_ZONE} />
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('jeu-de-lecture')}>
            Suite →
          </button>
        </div>
      )}

      {ecran === 'jeu-de-lecture' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={JEU_DE_LECTURE.img} alt="Jeu de lecture au dé" className="jeu-carte-img" />
            {JEU_DE_LECTURE.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
            <button
              type="button"
              className={`jeu-de-bouton${deLance ? ' is-lance' : ''}`}
              style={{ left: '44.5%', top: '78.2%', width: '15.8%', height: '8.6%' }}
              onClick={lancerDe}
              aria-label="Lancer le dé"
            />
            {deResultat && (
              <span className={`jeu-de-resultat jeu-de-resultat--${deResultat}`}>
                🎲 {deResultat === 'rose' ? 'Rose !' : 'Bleu !'}
              </span>
            )}
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('lecture-mots-crayon')}>
            Suite →
          </button>
        </div>
      )}

      {ecran === 'lecture-mots-crayon' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={LECTURE_MOTS_CRAYON.img} alt="Jeu de lecture à colorier" className="jeu-carte-img" />
            {LECTURE_MOTS_CRAYON.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
            {LECTURE_MOTS_CRAYON.etoiles.map((e, i) => (
              <button
                key={i}
                type="button"
                className="jeu-crayon-etoile"
                data-index={i}
                style={{ left: `${e.cx}%`, top: `${e.cy}%` }}
                onClick={() => colorierMot(i)}
                aria-label={`Colorier l'étoile du mot ${i + 1}`}
              />
            ))}
            <svg className="jeu-crayon-svg" viewBox="0 0 887 1774" preserveAspectRatio="none">
              {motsColories.some(Boolean) && (
                <path
                  d={LECTURE_MOTS_CRAYON.etoiles
                    .filter((_, i) => motsColories[i])
                    .map((e) => etoileD((e.cx / 100) * 887, (e.cy / 100) * 1774))
                    .join(' ')}
                  fill="#ffc93c"
                  stroke="#e08a1e"
                  strokeWidth={1.5}
                />
              )}
              {(() => {
                const nb = motsColories.filter(Boolean).length;
                return nb > 0 && (
                  <path
                    d={LECTURE_RECOMPENSE_ETOILES.slice(0, nb)
                      .map((e) => etoileD((e.cx / 100) * 887, (e.cy / 100) * 1774, 13, 4.94))
                      .join(' ')}
                    fill="#ffc93c"
                    stroke="#e08a1e"
                    strokeWidth={1}
                  />
                );
              })()}
            </svg>
            <button
              type="button"
              className={`jeu-crayon-icone${crayonDrag ? ' is-en-cours' : ''}`}
              onPointerDown={demarrerDragCrayon}
              aria-label="Crayon à glisser sur une étoile pour la colorier"
            >
              🖍️
            </button>
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('lecture-idgham-bila-ghunna')}>
            Suite →
          </button>
          {crayonDrag && (
            <div className="jeu-crayon-ghost" style={{ left: crayonDrag.x, top: crayonDrag.y }} aria-hidden="true">🖍️</div>
          )}
        </div>
      )}

      {ecran === 'lecture-idgham-bila-ghunna' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={LECTURE_IDGHAM_BILA_GHUNNA.img} alt="Lecture idgham bila ghunna" className="jeu-carte-img" />
            {LECTURE_IDGHAM_BILA_GHUNNA.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('lecture-idgham-bi-ghunna')}>
            Suite →
          </button>
        </div>
      )}

      {ecran === 'lecture-idgham-bi-ghunna' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={LECTURE_IDGHAM_BI_GHUNNA.img} alt="Lecture idgham bi ghunna" className="jeu-carte-img" />
            {LECTURE_IDGHAM_BI_GHUNNA.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('jeu-de-lecture-ikhfa')}>
            Suite →
          </button>
        </div>
      )}

      {ecran === 'jeu-de-lecture-ikhfa' && (
        <div className="jeu-carte jeu-lecon-scene">
          <div className="jeu-carte-inner">
            <img src={JEU_DE_LECTURE_IKHFA.img} alt="Jeu de lecture de l'ikhfa" className="jeu-carte-img" />
            {JEU_DE_LECTURE_IKHFA.hotspots.map((h, i) => (
              <button
                key={i}
                type="button"
                className="jeu-repere-zone"
                style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.zoneW}%`, height: `${h.zoneH}%` }}
                onClick={() => playHotspot(h)}
                aria-label={`Écouter la prononciation de ${h.text}`}
              />
            ))}
          </div>
          <button type="button" className="jeu-btn jeu-lecon-scene-btn" onClick={() => setEcran('portes-noun-mim')}>
            Retour au couloir →
          </button>
        </div>
      )}

      {ecran === 'bientot' && (
        <div className="jeu-screen jeu-intro">
          <img src={nounMimKids} alt="" className="jeu-intro-kids" />
          <h1 className="jeu-title">{maisonBientotLabel}</h1>
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
