import { Link } from 'react-router-dom';
import { PORTAILS } from './LoginMenu';
import './AppShellHome.css';

/**
 * Écran d'accueil de l'app installée (PWA) : remplace le site vitrine par un
 * accès direct aux 4 portails, sous forme de cartes sélectionnables. Le site
 * public normal (navigateur classique) n'est pas concerné — cf. `HomeRoute`
 * dans index.js, qui n'affiche cet écran qu'en mode standalone.
 */
export default function AppShellHome() {
  return (
    <div className="app-shell-home">
      <div className="app-shell-glow" aria-hidden="true" />
      <img src="/Logo.png" alt="Educamoov" className="app-shell-logo" />
      <h1 className="app-shell-title">Educamoov</h1>
      <p className="app-shell-sub">Choisissez votre espace</p>

      <div className="app-shell-grid">
        {PORTAILS.map((p) => (
          <Link key={p.href} to={p.href} className="app-shell-card">
            <span className="app-shell-card-label">{p.label}</span>
            <span className="app-shell-card-ar">{p.ar}</span>
          </Link>
        ))}
        <Link to="/jeu" className="app-shell-card app-shell-card--jeu">
          <span className="app-shell-card-badge app-shell-card-badge--new">Nouveau</span>
          <span className="app-shell-card-label">Jeux interactif</span>
          <span className="app-shell-card-ar">لعبة تفاعلية</span>
        </Link>
      </div>
    </div>
  );
}
