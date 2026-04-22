import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParentCtx } from './ParentContext';
import { fetchNotesEleve, fetchObservationsEleve, fetchDevoirsClasse, fetchAbsencesEleve } from './supabaseParent';
import { fmtPrenom } from '../shared/nameUtils';
import { SCORE_LABEL, SCORE_COLOR } from './parentConstants';

const cardBase = {
  display: 'block', textDecoration: 'none', color: 'inherit',
  padding: 22, borderRadius: 'var(--p-radius)',
  background: 'var(--p-bg-card)',
  border: '1px solid var(--p-border)',
  boxShadow: 'var(--p-shadow-sm)',
  transition: 'transform .18s var(--p-ease), box-shadow .18s var(--p-ease)',
};

function Card({ to, title, value, sub, icon, accent }) {
  return (
    <Link
      to={to}
      style={{ ...cardBase, borderLeft: `4px solid ${accent}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--p-shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{
          fontSize: 11, color: 'var(--p-fg-light)',
          textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700,
        }}>{title}</span>
      </div>
      <div style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 30, fontWeight: 700, color: 'var(--p-fg)', lineHeight: 1,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: 'var(--p-fg-mid)', marginTop: 10, lineHeight: 1.5 }}>{sub}</div>}
    </Link>
  );
}

export default function ParentDashboard() {
  const { selectedEleve, selectedEleveId } = useParentCtx();
  const [notes, setNotes]             = useState([]);
  const [observations, setObs]        = useState([]);
  const [devoirs, setDevoirs]         = useState([]);
  const [absences, setAbsences]       = useState([]);
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (!selectedEleveId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchNotesEleve(selectedEleveId),
      fetchObservationsEleve(selectedEleveId),
      fetchDevoirsClasse(selectedEleveId),
      fetchAbsencesEleve(selectedEleveId),
    ]).then(([n, o, d, a]) => {
      if (cancelled) return;
      setNotes(n.data); setObs(o.data); setDevoirs(d.data); setAbsences(a.data);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedEleveId]);

  if (!selectedEleve) return null;

  const derniereNote = notes[0];
  const derniereObs  = observations[0];
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const prochainsDevoirs = devoirs.filter(d => d.date_limite && new Date(d.date_limite) >= todayStart);
  const prochainDevoir   = prochainsDevoirs[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{
        fontFamily: 'var(--p-font-display)',
        fontSize: 32, fontWeight: 800,
        color: 'var(--p-fg)', margin: '0 0 6px',
        letterSpacing: '-0.01em',
      }}>
        Bonjour,
      </h1>
      <p style={{ fontSize: 15, color: 'var(--p-fg-mid)', margin: '0 0 28px', lineHeight: 1.6 }}>
        Voici un résumé de la scolarité de {fmtPrenom(selectedEleve.prenom)}.
        {selectedEleve.classe_nom && <> Classe : <strong style={{ color: 'var(--p-fg)' }}>{selectedEleve.classe_nom}</strong>.</>}
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--p-fg-mid)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Card
            to="/parent/notes"
            title="Dernière note"
            icon="📊"
            accent="var(--p-blue)"
            value={derniereNote
              ? <span style={{ color: SCORE_COLOR[derniereNote.score] }}>{SCORE_LABEL[derniereNote.score] || '—'}</span>
              : '—'}
            sub={derniereNote
              ? (derniereNote.evaluation?.titre || 'Évaluation')
              : 'Pas encore de notes'}
          />

          <Card
            to="/parent/observations"
            title="Appréciations"
            icon="👁️"
            accent="var(--p-gold)"
            value={observations.length}
            sub={derniereObs
              ? `Dernière : ${new Date(derniereObs.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              : 'Aucune appréciation'}
          />

          <Card
            to="/parent/devoirs"
            title="Devoirs à venir"
            icon="📝"
            accent="var(--p-green)"
            value={prochainsDevoirs.length}
            sub={prochainDevoir
              ? `${prochainDevoir.titre} — ${new Date(prochainDevoir.date_limite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
              : 'Aucun devoir à venir'}
          />

          <Card
            to="/parent/absences"
            title="Retards & absences"
            icon="⏰"
            accent="var(--p-yellow)"
            value={absences.length}
            sub={absences.length === 0 ? 'Aucun incident enregistré' : 'Voir le détail'}
          />
        </div>
      )}
    </div>
  );
}
