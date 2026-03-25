import React, { useState } from 'react';
import { MOCK_INSCRIPTIONS } from './mockData';

const STATUTS = ['tous', 'nouveau', 'contacté', 'inscrit'];
const COURS   = ['tous', 'Débutant — Alphabet', 'Intermédiaire — Lecture', 'Avancé — Expression', 'Lecture & Mémorisation Coran'];

const STATUT_NEXT = { nouveau: 'contacté', contacté: 'inscrit', inscrit: 'nouveau' };
const STATUT_CFG  = {
  nouveau:  { label: 'Nouveau',  cls: 'badge-nouveau'  },
  contacté: { label: 'Contacté', cls: 'badge-contacte' },
  inscrit:  { label: 'Inscrit',  cls: 'badge-inscrit'  },
};

export default function Inscriptions() {
  const [data,       setData]       = useState(MOCK_INSCRIPTIONS);
  const [filtreStat, setFiltreStat] = useState('tous');
  const [filtreCours,setFiltreCours]= useState('tous');

  const filtered = data.filter(i => {
    const okStat  = filtreStat  === 'tous' || i.statut === filtreStat;
    const okCours = filtreCours === 'tous' || i.cours  === filtreCours;
    return okStat && okCours;
  });

  const avancerStatut = (id) => {
    setData(prev => prev.map(i =>
      i.id === id ? { ...i, statut: STATUT_NEXT[i.statut] } : i
    ));
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <p className="admin-page-title">Pré-inscriptions</p>
          <p className="admin-page-subtitle">Gérez les demandes d'inscription et leur avancement</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="admin-filters">
        <select className="admin-filter-select" value={filtreStat} onChange={e => setFiltreStat(e.target.value)}>
          <option value="tous">Tous les statuts</option>
          {STATUTS.slice(1).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select className="admin-filter-select" value={filtreCours} onChange={e => setFiltreCours(e.target.value)}>
          <option value="tous">Tous les cours</option>
          {COURS.slice(1).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <span className="admin-filter-count">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tableau */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Élève</th>
              <th>Âge</th>
              <th>Cours souhaité</th>
              <th>Années de pratique</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign:'center', padding:'2rem', color:'var(--a-fg-light)' }}>
                  Aucune inscription trouvée
                </td>
              </tr>
            ) : filtered.map(i => {
              const s    = STATUT_CFG[i.statut];
              const next = STATUT_NEXT[i.statut];
              return (
                <tr key={i.id}>
                  <td className="muted">{i.id}</td>
                  <td>
                    <strong>{i.prenom} {i.nom}</strong>
                  </td>
                  <td className="muted">{i.age} ans</td>
                  <td>{i.cours}</td>
                  <td className="muted">
                    {i.annees === 0 ? 'Débutant' : `${i.annees} an${i.annees > 1 ? 's' : ''}`}
                  </td>
                  <td className="muted">{i.date}</td>
                  <td>
                    <span className={`badge ${s.cls}`}>● {s.label}</span>
                  </td>
                  <td>
                    <button
                      className="admin-status-btn"
                      onClick={() => avancerStatut(i.id)}
                      title={`Passer à : ${STATUT_CFG[next].label}`}
                    >
                      → {STATUT_CFG[next].label}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
