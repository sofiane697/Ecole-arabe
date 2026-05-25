import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchInscriptions, fetchMessages } from './supabaseAdmin';
import gsap from 'gsap';

const STATUT_LABEL = {
  nouveau:  { label: 'Nouveau',  cls: 'badge-nouveau'  },
  contacté: { label: 'Contacté', cls: 'badge-contacte' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit'  },
  refuse:   { label: 'Refusé',   cls: 'badge-refuse'   },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [inscriptions, setInscriptions] = useState([]);
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([fetchInscriptions(), fetchMessages()])
      .then(([insc, msgs]) => { setInscriptions(insc); setMessages(msgs); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Stats
  const totalInscriptions = inscriptions.length;
  const nouveaux          = inscriptions.filter(i => i.statut === 'nouveau').length;
  const totalMessages     = messages.length;
  const nonLus            = messages.filter(m => !m.lu).length;

  // 5 derniers
  const lastInscriptions = inscriptions.slice(0, 5);
  const lastMessages     = messages.slice(0, 5);

  const statBarRef = useRef(null);
  useEffect(() => {
    if (!loading && statBarRef.current) {
      gsap.from(statBarRef.current.children, {
        opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power2.out',
      });
    }
  }, [loading]);

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'4rem', color:'var(--a-fg-light)' }}>
        Chargement des données…
      </div>
    );
  }

  return (
    <>
      {/* ── Stats ── */}
      <div ref={statBarRef} className="admin-stat-bar">
        {[
          { label: 'Total inscriptions', value: totalInscriptions, sub: 'Toutes les demandes',   color: 'gold'  },
          { label: 'Nouvelles demandes', value: nouveaux,          sub: 'En attente de traitement', color: 'red' },
          { label: 'Total messages',     value: totalMessages,     sub: 'Formulaire contact',    color: 'blue'  },
          { label: 'Messages non lus',   value: nonLus,            sub: 'À traiter',             color: 'green' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-bar-item">
            <span className="admin-stat-label">{s.label}</span>
            <span className={`admin-stat-value ${s.color}`}>{s.value}</span>
            <span className="admin-stat-sub">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Tableaux résumés ── */}
      <div className="admin-dash-grid">

        {/* Dernières inscriptions */}
        <div>
          <p className="admin-section-title">Dernières pré-inscriptions</p>
          <div className="admin-panel dash-table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
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
                {lastInscriptions.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--a-fg-light)' }}>Aucune inscription</td></tr>
                ) : lastInscriptions.map(i => {
                  const s = STATUT_LABEL[i.statut] || { label: i.statut, cls: '' };
                  const date = new Date(i.created_at).toLocaleDateString('fr-FR');
                  return (
                    <tr key={i.id} onClick={() => navigate('/admin/inscriptions')}>
                      <td>
                        <strong>{i.prenom} {i.nom}</strong>
                        <span className="muted" style={{ display:'block' }}>{i.age} ans</span>
                      </td>
                      <td className="muted">{(i.cours || '').split('—')[0].trim()}</td>
                      <td><span className={`badge ${s.cls}`}>● {s.label}</span></td>
                      <td className="muted">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--a-border)' }}>
              <button
                onClick={() => navigate('/admin/inscriptions')}
                style={{ background:'none', border:'none', color:'var(--a-gold)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}
              >
                Voir toutes les inscriptions →
              </button>
            </div>
          </div>
        </div>

        {/* Derniers messages */}
        <div>
          <p className="admin-section-title">Derniers messages</p>
          <div className="admin-panel dash-table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
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
                {lastMessages.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign:'center', padding:'2rem', color:'var(--a-fg-light)' }}>Aucun message</td></tr>
                ) : lastMessages.map(m => {
                  const date = new Date(m.created_at).toLocaleDateString('fr-FR');
                  return (
                    <tr
                      key={m.id}
                      className={!m.lu ? 'admin-msg-row-unread' : ''}
                      onClick={() => navigate('/admin/messages')}
                    >
                      <td>
                        <strong>{m.prenom} {m.nom}</strong>
                        <span className="muted" style={{ display:'block' }}>{m.email}</span>
                      </td>
                      <td className="muted">{(m.cours || '').split('—')[0].trim()}</td>
                      <td>
                        <span className={`badge ${m.lu ? 'badge-lu' : 'badge-nonlu'}`}>
                          {m.lu ? '✓ Lu' : '● Non lu'}
                        </span>
                      </td>
                      <td className="muted">{date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--a-border)' }}>
              <button
                onClick={() => navigate('/admin/messages')}
                style={{ background:'none', border:'none', color:'var(--a-gold)', fontSize:'0.82rem', cursor:'pointer', fontFamily:'inherit' }}
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
