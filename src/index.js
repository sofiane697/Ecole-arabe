import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminLogin from './admin/AdminLogin';
import AdminApp from './admin/AdminApp';
import Dashboard from './admin/Dashboard';
import Inscriptions from './admin/Inscriptions';
import Messages from './admin/Messages';
import Cours from './admin/Cours';
import Classes from './admin/Classes';
import Eleves from './admin/Eleves';
import PortailLogin from './portail/PortailLogin';
import PortailApp from './portail/PortailApp';
import PortailDashboard from './portail/PortailDashboard';
import PortailModule from './portail/PortailModule';

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
      </Route>

      {/* Portail élève */}
      <Route path="/portail/login" element={<PortailLogin />} />
      <Route path="/portail" element={<PortailApp />}>
        <Route index element={<PortailDashboard />} />
        <Route path="module/:id" element={<PortailModule />} />
        <Route path="module/:moduleId/thematique/:thId" element={<PortailModule />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
