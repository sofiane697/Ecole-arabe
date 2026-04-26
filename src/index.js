import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import App from './App';
import AdminLogin from './admin/AdminLogin';
import AdminApp from './admin/AdminApp';
import Dashboard from './admin/Dashboard';
import Inscriptions from './admin/Inscriptions';
import Messages from './admin/Messages';
import Cours from './admin/Cours';
import Classes from './admin/Classes';
import Eleves from './admin/Eleves';
import Enseignants from './admin/Enseignants';
import Parents from './admin/Parents';
import AdminSurveillance   from './admin/AdminSurveillance';
import AdminDeclarations   from './admin/AdminDeclarations';
import EnseignantLogin      from './enseignant/EnseignantLogin';
import EnseignantApp        from './enseignant/EnseignantApp';
import EnseignantMesClasses from './enseignant/EnseignantMesClasses';
import EnseignantClasse     from './enseignant/EnseignantClasse';
import EnseignantMessages   from './enseignant/EnseignantMessages';
import EnseignantAbsences     from './enseignant/EnseignantAbsences';
import EnseignantEleveProfile from './enseignant/EnseignantEleveProfile';
import EnseignantDevoirs      from './enseignant/EnseignantDevoirs';
import EnseignantNotes        from './enseignant/EnseignantNotes';
import EnseignantObservations from './enseignant/EnseignantObservations';
import PortailLogin from './portail/PortailLogin';
import PortailApp from './portail/PortailApp';
import PortailDashboard from './portail/PortailDashboard';
import PortailModule from './portail/PortailModule';
import PortailDevoirs from './portail/PortailDevoirs';
import PortailResultats from './portail/PortailResultats';
import PortailObservations from './portail/PortailObservations';
import PortailMessages     from './portail/PortailMessages';
import ParentLogin         from './parent/ParentLogin';
import ParentApp           from './parent/ParentApp';
import ParentDashboard     from './parent/ParentDashboard';
import ParentNotes         from './parent/ParentNotes';
import ParentObservations  from './parent/ParentObservations';
import ParentDevoirs       from './parent/ParentDevoirs';
import ParentAbsences      from './parent/ParentAbsences';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split('/')[1] || 'root'}>
        {/* Site public */}
        <Route path="/" element={<App />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminApp />}>
          <Route index element={<Dashboard />} />
          <Route path="inscriptions" element={<Inscriptions />} />
          <Route path="messages" element={<Messages />} />
          <Route path="cours" element={<Cours />} />
          <Route path="classes" element={<Classes />} />
          <Route path="eleves" element={<Eleves />} />
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
    </AnimatePresence>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AnimatedRoutes />
  </BrowserRouter>
);
