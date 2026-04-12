import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import AdminSurveillance from './admin/AdminSurveillance';
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
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
        <Route path="enseignants" element={<Enseignants />} />
        <Route path="surveillance" element={<AdminSurveillance />} />
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
    </Routes>
  </BrowserRouter>
);
