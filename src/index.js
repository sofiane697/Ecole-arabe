import './index.css';
import React, { lazy, Suspense, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import AppShellHome from './AppShellHome';

const App = lazy(() => import('./App'));
const JeuApp = lazy(() => import('./jeu/JeuApp'));
const JeuGate = lazy(() => import('./jeu/JeuGate'));

// App installée (PWA, lancée depuis l'écran d'accueil) → accès direct aux 4
// portails (AppShellHome), sans le site vitrine. Visite normale au navigateur
// → site public inchangé. iOS expose ce mode via `navigator.standalone`
// (pas de support de la media query display-mode avant iOS 16.4).
const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

function HomeRoute() {
  const [standalone] = useState(isStandalone);
  return standalone ? <AppShellHome /> : <App />;
}

const AdminLogin         = lazy(() => import('./admin/AdminLogin'));
const AdminApp           = lazy(() => import('./admin/AdminApp'));
const Inscriptions       = lazy(() => import('./admin/Inscriptions'));
const Messages           = lazy(() => import('./admin/Messages'));
const Cours              = lazy(() => import('./admin/Cours'));
const Classes            = lazy(() => import('./admin/Classes'));
const Eleves             = lazy(() => import('./admin/Eleves'));
const Enseignants        = lazy(() => import('./admin/Enseignants'));
const Parents            = lazy(() => import('./admin/Parents'));
const AdminSurveillance  = lazy(() => import('./admin/AdminSurveillance'));
const AdminDeclarations  = lazy(() => import('./admin/AdminDeclarations'));

const EnseignantLogin       = lazy(() => import('./enseignant/EnseignantLogin'));
const EnseignantApp         = lazy(() => import('./enseignant/EnseignantApp'));
const EnseignantMesClasses  = lazy(() => import('./enseignant/EnseignantMesClasses'));
const EnseignantClasse      = lazy(() => import('./enseignant/EnseignantClasse'));
const EnseignantMessages    = lazy(() => import('./enseignant/EnseignantMessages'));
const EnseignantAbsences    = lazy(() => import('./enseignant/EnseignantAbsences'));
const EnseignantEleveProfile= lazy(() => import('./enseignant/EnseignantEleveProfile'));
const EnseignantDevoirs     = lazy(() => import('./enseignant/EnseignantDevoirs'));
const EnseignantNotes       = lazy(() => import('./enseignant/EnseignantNotes'));
const EnseignantObservations= lazy(() => import('./enseignant/EnseignantObservations'));

const PortailLogin        = lazy(() => import('./portail/PortailLogin'));
const PortailApp          = lazy(() => import('./portail/PortailApp'));
const PortailDashboard    = lazy(() => import('./portail/PortailDashboard'));
const PortailModule       = lazy(() => import('./portail/PortailModule'));
const PortailDevoirs      = lazy(() => import('./portail/PortailDevoirs'));
const PortailResultats    = lazy(() => import('./portail/PortailResultats'));
const PortailObservations = lazy(() => import('./portail/PortailObservations'));
const PortailMessages     = lazy(() => import('./portail/PortailMessages'));

const ParentLogin        = lazy(() => import('./parent/ParentLogin'));
const ParentApp          = lazy(() => import('./parent/ParentApp'));
const ParentDashboard    = lazy(() => import('./parent/ParentDashboard'));
const ParentNotes        = lazy(() => import('./parent/ParentNotes'));
const ParentObservations = lazy(() => import('./parent/ParentObservations'));
const ParentDevoirs      = lazy(() => import('./parent/ParentDevoirs'));
const ParentAbsences     = lazy(() => import('./parent/ParentAbsences'));

function RouteFallback() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '2px solid rgba(191,138,48,.2)',
          borderTopColor: '#bf8a30',
          borderRadius: '50%',
          animation: 'route-spin .8s linear infinite',
        }}
      />
      <style>{`@keyframes route-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes location={location} key={location.pathname.split('/')[1] || 'root'}>
          {/* Site public (ou 4 portails si l'app est installée, cf. HomeRoute) */}
          <Route path="/" element={<HomeRoute />} />

          {/* Jeu éducatif (prototype) — protégé par le même code que le portail admin */}
          <Route path="/jeu" element={<JeuGate><JeuApp /></JeuGate>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<Inscriptions />} />
            <Route path="messages" element={<Messages />} />
            <Route path="cours" element={<Cours />} />
            <Route path="classes" element={<Classes />} />
            <Route path="eleves" element={<Eleves variant="eleves" />} />
            <Route path="etudiants" element={<Eleves variant="etudiants" />} />
            <Route path="parents" element={<Parents />} />
            <Route path="enseignants" element={<Enseignants />} />
            <Route path="surveillance"  element={<AdminSurveillance />} />
            <Route path="declarations"  element={<AdminDeclarations />} />
          </Route>

          {/* Portail enseignant */}
          <Route path="/enseignant/login" element={<EnseignantLogin />} />
          <Route path="/enseignant" element={<EnseignantApp />}>
            <Route index element={<Navigate to="classes" replace />} />
            <Route path="classes" element={<EnseignantMesClasses />} />
            <Route path="classe/:id" element={<EnseignantClasse />} />
            <Route path="absences"     element={<EnseignantAbsences />} />
            <Route path="eleve/:eleveId" element={<EnseignantEleveProfile />} />
            <Route path="devoirs"      element={<EnseignantDevoirs />} />
            <Route path="notes"        element={<EnseignantNotes />} />
            <Route path="observations" element={<EnseignantObservations />} />
            <Route path="messages"     element={<EnseignantMessages />} />
          </Route>

          {/* Portail élève */}
          <Route path="/portail/login" element={<PortailLogin />} />
          <Route path="/portail" element={<PortailApp />}>
            <Route index element={<PortailDashboard />} />
            <Route path="module/:id" element={<PortailModule />} />
            <Route path="module/:moduleId/thematique/:thId" element={<PortailModule />} />
            <Route path="module/:moduleId/thematique/:thId/lecon/:leconId" element={<PortailModule />} />
            <Route path="devoirs" element={<PortailDevoirs />} />
            <Route path="resultats" element={<PortailResultats />} />
            <Route path="observations" element={<PortailObservations />} />
            <Route path="messages" element={<PortailMessages />} />
          </Route>

          {/* Portail parent */}
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/parent" element={<ParentApp />}>
            <Route index              element={<ParentDashboard />} />
            <Route path="notes"        element={<ParentNotes />} />
            <Route path="observations" element={<ParentObservations />} />
            <Route path="devoirs"      element={<ParentDevoirs />} />
            <Route path="absences"     element={<ParentAbsences />} />
          </Route>
      </Routes>
    </Suspense>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AnimatedRoutes />
  </BrowserRouter>
);

// App installable (PWA) + écran d'accueil disponible hors-ligne pour les 4
// portails. N'enregistre rien en dev (cf. serviceWorkerRegistration.js).
serviceWorkerRegistration.register();
