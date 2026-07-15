import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MAISON_TAARIF } from './jeuData';
import DragSort from './DragSort';
import kidsTaarif from './assets/kids-taarif.png';
import './jeu.css';

/**
 * Prototype du jeu « Le Royaume du Coran » — une seule maison pour l'instant
 * (« ال » التعريف), pour valider le gameplay avant de transcrire le reste
 * du contenu (149 pages du PDF fourni par Sofiane).
 *
 * Parcours : intro maison → 2 portes (règle + lecture) → salle de jeux
 * (tri par glisser-déposer, débloquée une fois les 2 portes visitées) →
 * réussite.
 */
export default function JeuApp() {
  const [ecran, setEcran] = useState('intro');       // intro | portes | lecon | defi | reussite
  const [porteActive, setPorteActive] = useState(null);
  const [portesVues, setPortesVues] = useState([]);
  const [resultat, setResultat] = useState(null);

  const maison = MAISON_TAARIF;
  const toutesPortesVues = maison.portes.every((p) => portesVues.includes(p.id));

  const ouvrirPorte = (porteId) => { setPorteActive(porteId); setEcran('lecon'); };
  const fermerPorte = () => {
    setPortesVues((v) => (v.includes(porteActive) ? v : [...v, porteActive]));
    setPorteActive(null);
    setEcran('portes');
  };

  const zones = maison.portes.map((p) => ({ id: p.id, label: p.sousTitre, emoji: p.mascotte, couleur: p.couleur }));
  const defiItems = maison.evaluation.map((m, i) => ({ id: `m${i}`, mot: m.mot, famille: m.famille }));

  return (
    <div className="jeu-app">
      <div className="jeu-topbar">
        <Link to="/" className="jeu-back">← Quitter</Link>
        <span className="jeu-topbar-title">Le Royaume du Coran</span>
      </div>

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
        <div className="jeu-screen">
          <h2 className="jeu-h2">Choisis une porte</h2>
          <div className="jeu-portes-grid">
            {maison.portes.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`jeu-porte${portesVues.includes(p.id) ? ' is-vue' : ''}`}
                style={{ '--porte-c': p.couleur }}
                onClick={() => ouvrirPorte(p.id)}
              >
                {portesVues.includes(p.id) && <span className="jeu-porte-check">✓</span>}
                <span className="jeu-porte-emoji">{p.mascotte}</span>
                <span className="jeu-porte-label">{p.nom}</span>
              </button>
            ))}
            <button
              type="button"
              className={`jeu-porte jeu-porte--jeux${!toutesPortesVues ? ' is-locked' : ''}`}
              disabled={!toutesPortesVues}
              onClick={() => setEcran('defi')}
            >
              {!toutesPortesVues && <span className="jeu-porte-lock">🔒</span>}
              <span className="jeu-porte-emoji">🎮</span>
              <span className="jeu-porte-label">Salle de jeux</span>
            </button>
          </div>
          {!toutesPortesVues && (
            <p className="jeu-hint">Visite les 2 portes pour débloquer la salle de jeux.</p>
          )}
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
          </div>
        </div>
      ))}

      <p className="jeu-astuce">💡 {porte.astuce}</p>

      <div className="jeu-lecture">
        <p className="jeu-lecture-titre">Coin lecture — lis les mots</p>
        <div className="jeu-lecture-grid">
          {porte.lecture.map((mot, i) => <span key={i} className="jeu-lecture-mot">{mot}</span>)}
        </div>
      </div>

      <button type="button" className="jeu-btn" onClick={onFini}>
        J'ai compris →
      </button>
    </div>
  );
}
