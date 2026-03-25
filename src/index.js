import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminLogin from './admin/AdminLogin';
import AdminApp from './admin/AdminApp';
import Dashboard from './admin/Dashboard';
import Inscriptions from './admin/Inscriptions';
import Messages from './admin/Messages';

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
      </Route>
    </Routes>
  </BrowserRouter>
);
