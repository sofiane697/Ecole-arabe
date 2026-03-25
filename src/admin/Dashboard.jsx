import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_INSCRIPTIONS, MOCK_MESSAGES } from './mockData';

const STATUT_LABEL = {
  nouveau:  { label: 'Nouveau',  cls: 'badge-nouveau'  },
  contacté: { label: 'Contacté', cls: 'badge-contacte' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit'  },
};

export default function Dashboard() {
  const navigate = useNavigate();

  // Stats
  const totalInscriptions = MOCK_INSCRIPTIONS.length;
  const nouveaux          = MOCK_INSCRIPTIONS.filter(i => i.statut === 'nouveau').length;
  const totalMessages     = MOCK_MESSAGES.length;
  const nonLus            = MOCK_MESSAGES.filter(m => !m.lu).length;

  // 5 derniers
  const lastInscriptions = [...MOCK_INSCRIPTIONS].sort((a,b) => b.id - a.id).slice(0, 5);
  const lastMessages     = [...MOCK_MESSAGES].sort((a,b) => b.id - a.id).slice(0, 5);

  return (
    <>
      {/* ── Stats ── */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card gold">
          <span className="admin-stat-label">Total inscriptions</span>
          <span className="admin-stat-value">{totalInscriptions}</span>
          <span className="admin-stat-sub">Toutes les demandes</span>
        </div>
        <div className="admin-stat-card red">
          <span className="admin-stat-label">Nouvelles demandes</span>
          <span className="admin-stat-value">{nouveaux}</span>
          <span className="admin-stat-sub">En attente de traitement</span>
        </div>
        <div className="admin-stat-card blue">
          <span className="admin-stat-label">Total messages</span>
          <span className="admin-stat-value">{totalMessages}</span>
          <span className="admin-stat-sub">Formulaire contact</span>
        </div>
        <div className="admin-stat-card green">
          <span className="admin-stat-label">Messages non lus</span>
          <span className="admin-stat-value">{nonLus}</span>
          <span className="admin-stat-sub">À traiter</span>
        </div>
      </div>

      {/* ── Tableaux résumés ── */}
      <div className="admin-dash-grid">

        {/* Dernières inscriptions */}
        <div>
          <p className="admin-section-title">Dernières pré-inscriptions</p>
          <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Élève</th>
                  <th>Cours</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {lastInscriptions.map(i => {
                  const s = STATUT_LABEL[i.statut];
                  return (
                    <tr key={i.id} onClick={() => navigate('/admin/inscriptions')}>
                      <td>
                        <strong>{i.prenom} {i.nom}</strong>
                        <span className="muted" style={{ display:'block' }}>{i.age} ans</span>
                      </td>
                      <td className="muted">{i.cours.split('—')[0].trim()}</td>
                      <td><span className={`badge ${s.cls}`}>● {s.label}</span></td>
                      <td className="muted">{i.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--a-border)' }}>
              <button
                onClick={() => navigate('/admin/inscriptions')}
                style={{ background:'none', border:'none', color:'var(--a-gold)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'Jost, sans-serif' }}
              >
                Voir toutes les inscriptions →
              </button>
            </div>
          </div>
        </div>

        {/* Derniers messages */}
        <div>
          <p className="admin-section-title">Derniers messages</p>
          <div className="admin-panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Expéditeur</th>
                  <th>Cours</th>
                  <th>Lu</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {lastMessages.map(m => (
                  <tr
                    key={m.id}
                    className={!m.lu ? 'admin-msg-row-unread' : ''}
                    onClick={() => navigate('/admin/messages')}
                  >
                    <td>
                      <strong>{m.prenom} {m.nom}</strong>
                      <span className="muted" style={{ display:'block' }}>{m.email}</span>
                    </td>
                    <td className="muted">{m.cours.split('—')[0].trim()}</td>
                    <td>
                      <span className={`badge ${m.lu ? 'badge-lu' : 'badge-nonlu'}`}>
                        {m.lu ? '✓ Lu' : '● Non lu'}
                      </span>
                    </td>
                    <td className="muted">{m.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--a-border)' }}>
              <button
                onClick={() => navigate('/admin/messages')}
                style={{ background:'none', border:'none', color:'var(--a-gold)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'Jost, sans-serif' }}
              >
                Voir tous les messages →
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
