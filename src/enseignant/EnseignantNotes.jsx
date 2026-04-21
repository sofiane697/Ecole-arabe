import React, { useEffect, useState, useCallback } from 'react';
import {
  getEnseignantUser, fetchMesClasses, fetchElevesDeClasse,
  fetchEvaluationsClasse, createEvaluation, updateEvaluation, deleteEvaluation,
  fetchNotesEvaluation, upsertNote,
} from './supabaseEnseignant';

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconEdit2 = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);
const IconTrash2 = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconCheck = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconMessage = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── Système de notation ──────────────────────────────────────────────────────
const GRADES = [
  { value: 4, label: 'A+',  libelle: 'Excellent',              color: '#30d158' },
  { value: 3, label: 'A',   libelle: 'Acquis',                 color: '#0a84ff' },
  { value: 2, label: 'ECA', libelle: "En cours d'acquisition", color: '#f7963a' },
  { value: 1, label: 'NA',  libelle: 'Non acquis',             color: '#ff453a' },
];

const gradeFromScore = (score) => GRADES.find(g => g.value === score) || null;
const noteKey = (evalId, eleveId) => `${evalId}_${eleveId}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : null;
function initials(e) { return `${(e.prenom||'')[0]||''}${(e.nom||'')[0]||''}`.toUpperCase(); }

// ─── CSS ─────────────────────────────────────────────────────────────────────
const NOTES_CSS = `
/* ── Layout ── */
.en-tabs { display:flex; gap:6px; margin-bottom:28px; flex-wrap:wrap; }
.en-tab {
  padding:7px 20px; border-radius:980px; cursor:pointer; transition:all .18s;
  font-weight:700; font-size:12.5px; letter-spacing:.01em;
  border:1.5px solid var(--a-border); background:transparent; color:var(--a-fg-mid);
}
.en-tab.active {
  background:var(--a-gold); border-color:var(--a-gold); color:#000;
  box-shadow:0 2px 14px rgba(191,138,48,.28);
}
.en-tab:not(.active):hover { border-color:var(--a-fg-light); color:var(--a-fg); }

.en-grid { display:grid; grid-template-columns:300px 1fr; gap:20px; align-items:start; }

/* ── Left column ── */
.en-col { display:flex; flex-direction:column; gap:10px; }
.en-col-head {
  display:flex; align-items:baseline; justify-content:space-between;
  padding-bottom:14px; border-bottom:1px solid var(--a-border); margin-bottom:2px;
}
.en-col-title {
  font-family:var(--a-font-display);
  font-size:17px; font-weight:700; color:var(--a-fg); letter-spacing:-.01em;
}
.en-col-count {
  font-family:var(--a-font-mono); font-size:10px;
  color:var(--a-fg-light); font-weight:500;
}

.en-add-btn {
  display:flex; align-items:center; justify-content:center; gap:7px;
  padding:11px 16px; border-radius:12px; width:100%;
  background:var(--a-gold); color:#000; font-weight:700; font-size:13px;
  border:none; cursor:pointer; transition:all .2s;
  letter-spacing:.01em;
  box-shadow:0 2px 16px rgba(191,138,48,.18);
}
.en-add-btn:hover { box-shadow:0 4px 24px rgba(191,138,48,.3); transform:translateY(-1px); }

.en-grade-legend { display:flex; flex-wrap:wrap; gap:4px; }
.en-grade-pip {
  font-size:10px; font-weight:700;
  border-radius:6px; padding:2px 7px; letter-spacing:.02em;
}

/* ── Eval card ── */
.en-eval-card {
  border-radius:11px; border:1px solid var(--a-border); background:var(--a-bg-card);
  cursor:pointer; transition:all .15s; overflow:hidden; position:relative;
  padding:13px 14px 13px 18px;
}
.en-eval-card::before {
  content:''; position:absolute; left:0; top:0; bottom:0; width:3px;
  background:transparent; transition:background .15s; border-radius:3px 0 0 3px;
}
.en-eval-card:hover { border-color:rgba(191,138,48,.35); background:rgba(191,138,48,.03); }
.en-eval-card.active { border-color:rgba(191,138,48,.4); background:rgba(191,138,48,.05); }
.en-eval-card.active::before { background:var(--a-gold); }

.en-eval-card-row1 { display:flex; align-items:flex-start; gap:8px; }
.en-eval-title {
  flex:1; min-width:0;
  font-size:13.5px; font-weight:700;
  color:var(--a-fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.35;
}
.en-eval-meta {
  font-size:11px; color:var(--a-fg-light); margin-top:3px;
  display:flex; align-items:center; gap:6px;
}
.en-eval-by { font-style:italic; color:var(--a-fg-light); }
.en-eval-actions { display:flex; gap:3px; flex-shrink:0; }
.en-eval-action-btn {
  width:24px; height:24px; border-radius:7px; border:1px solid var(--a-border);
  background:var(--a-bg); color:var(--a-fg-mid); cursor:pointer;
  display:flex; align-items:center; justify-content:center; transition:all .12s;
}
.en-eval-action-btn:hover { border-color:var(--a-gold); color:var(--a-gold); }
.en-eval-action-btn.del { border-color:rgba(255,69,58,.2); background:rgba(255,69,58,.05); color:#ff453a; }
.en-eval-action-btn.del:hover { background:rgba(255,69,58,.15); }

.en-eval-bar-row { display:flex; align-items:center; gap:8px; margin-top:10px; }
.en-eval-bar-track { flex:1; height:3px; border-radius:2px; background:var(--a-border); overflow:hidden; }
.en-eval-bar-fill { height:100%; border-radius:2px; background:var(--a-gold); transition:width .4s; }
.en-eval-fraction {
  font-family:var(--a-font-mono); font-size:10px;
  color:var(--a-fg-light); white-space:nowrap;
}
.en-eval-grade-dots { display:flex; gap:3px; flex-wrap:wrap; }
.en-eval-grade-dot {
  font-size:9px; font-weight:800; border-radius:5px; padding:1px 5px;
  }

/* ── Right panel ── */
.en-panel {
  background:var(--a-bg-card); border-radius:16px;
  border:1px solid var(--a-border); overflow:hidden;
}
.en-panel-head {
  padding:22px 28px 18px;
  border-bottom:1px solid var(--a-border);
  background:linear-gradient(160deg, rgba(201,150,58,.07) 0%, transparent 60%);
}
.en-panel-title {
  font-family:var(--a-font-display);
  font-size:17px; font-weight:700; color:var(--a-fg);
  letter-spacing:-.01em; line-height:1.25; margin:0 0 8px;
}
.en-panel-meta-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.en-panel-date {
  font-size:12px; color:var(--a-fg-mid);
}
.en-panel-legend { display:flex; gap:5px; flex-wrap:wrap; }
.en-panel-legend-pip {
  font-size:10px; font-weight:700; border-radius:6px; padding:2px 7px;
  }
.en-panel-stats { display:flex; gap:24px; margin-left:auto; align-items:center; }
.en-stat-num {
  font-family:var(--a-font-display); font-size:28px; font-weight:800;
  line-height:1; display:block; text-align:center;
}
.en-stat-lbl {
  font-size:9px; font-weight:700;
  color:var(--a-fg-mid); text-transform:uppercase; letter-spacing:.8px;
  display:block; text-align:center; margin-top:2px;
}

.en-table-head {
  display:grid; grid-template-columns:1fr 290px; gap:16px;
  padding:10px 28px; background:rgba(0,0,0,.09);
  border-bottom:1px solid var(--a-border);
}
.en-table-th {
  font-size:10px; font-weight:700;
  color:var(--a-fg-light); text-transform:uppercase; letter-spacing:1.2px;
}

.en-student-row {
  display:grid; grid-template-columns:1fr 290px; gap:16px;
  align-items:center; padding:13px 28px; transition:background .1s;
}
.en-student-row + .en-student-row { border-top:1px solid var(--a-border); }
.en-student-row:hover { background:rgba(255,255,255,.018); }

.en-avatar {
  width:40px; height:40px; border-radius:50%; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:800;
  transition:all .2s;
}
.en-student-name {
  font-size:13.5px; font-weight:600;
  color:var(--a-fg); line-height:1.3;
}
.en-student-sub {
  font-size:11.5px; margin-top:2px;
}

/* ── Grade buttons ── */
.en-grade-input { display:flex; gap:5px; align-items:center; }
.en-grade-btn {
  flex:1; height:40px; border-radius:10px;
  font-weight:800;
  cursor:pointer; transition:all .13s;
  display:flex; align-items:center; justify-content:center;
  letter-spacing:.02em; font-size:11.5px;
}
.en-abs-btn {
  width:40px; height:40px; border-radius:10px;
  border:1px solid var(--a-border); background:transparent;
  color:var(--a-fg-light); cursor:pointer; flex-shrink:0;
  font-size:10px; font-weight:700;
  display:flex; align-items:center; justify-content:center; transition:all .13s;
}
.en-abs-btn:hover { border-color:#ff453a; color:#ff453a; }
.en-comment-btn {
  width:40px; height:40px; border-radius:10px;
  border:1px solid var(--a-border); background:transparent;
  color:var(--a-fg-light); cursor:pointer; flex-shrink:0;
  display:flex; align-items:center; justify-content:center; transition:all .13s;
}
.en-comment-btn:hover { border-color:var(--a-gold); color:var(--a-gold); }
.en-comment-btn.has-comment {
  background:rgba(191,138,48,.12);
  border-color:var(--a-gold);
  color:var(--a-gold);
}
.en-comment-readonly {
  display:inline-flex; align-items:center; justify-content:center;
  width:28px; height:28px; border-radius:8px;
  border:1px solid var(--a-border); background:rgba(191,138,48,.1);
  color:var(--a-gold); cursor:pointer; margin-left:8px; transition:all .13s;
}
.en-comment-readonly:hover { background:rgba(191,138,48,.18); border-color:var(--a-gold); }
.en-comment-textarea {
  width:100%;
  background:var(--a-bg);
  border:1px solid var(--a-border);
  border-radius:10px;
  padding:10px 14px;
  color:var(--a-fg);
  font-size:14px;
  resize:vertical;
  min-height:120px;
  box-sizing:border-box;
  font-family:inherit;
  line-height:1.5;
  transition:border-color .13s;
}
.en-comment-textarea:focus { outline:none; border-color:var(--a-gold); }
.en-comment-textarea:read-only { cursor:default; opacity:.85; }
.en-comment-counter {
  font-family:var(--a-font-mono);
  font-size:11px; color:var(--a-fg-light);
  text-align:right; margin-top:6px;
}
.en-saved {
  width:40px; height:40px; border-radius:10px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:rgba(48,209,88,.12); color:#30d158;
}
.en-absent-tag {
  flex:1; height:40px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  font-weight:700; font-size:10.5px; letter-spacing:.5px;
  background:rgba(255,69,58,.1); border:1.5px solid rgba(255,69,58,.22); color:#ff453a;
  }
.en-absent-remove {
  height:40px; border-radius:10px; padding:0 14px;
  border:1px solid var(--a-border); background:transparent;
  color:var(--a-fg-mid); cursor:pointer; font-size:11px; flex-shrink:0;
  font-weight:600; transition:all .13s;
}
.en-absent-remove:hover { border-color:var(--a-fg-mid); color:var(--a-fg); }

.en-readonly-grade {
  display:flex; justify-content:center;
}

/* ── Panel footer ── */
.en-panel-footer {
  padding:16px 28px;
  border-top:2px solid rgba(191,138,48,.1);
  background:rgba(191,138,48,.03);
  display:flex; align-items:center; justify-content:space-between;
  flex-wrap:wrap; gap:10px;
}
.en-footer-label {
  font-size:10px; font-weight:700;
  color:var(--a-fg-mid); text-transform:uppercase; letter-spacing:1px;
}
.en-footer-grades { display:flex; gap:18px; }
.en-footer-grade { text-align:center; }
.en-footer-grade-num {
  font-family:var(--a-font-display); font-size:22px; font-weight:800; line-height:1; display:block;
}
.en-footer-grade-lbl {
  font-size:9px; font-weight:700;
  text-transform:uppercase; letter-spacing:.8px; opacity:.65; display:block; margin-top:2px;
}

/* ── Empty / loading ── */
.en-loading { text-align:center; color:var(--a-fg-mid); padding:80px 0; font-size:14px; }
.en-empty-panel {
  background:var(--a-bg-card); border-radius:16px;
  border:1px solid var(--a-border); padding:80px 24px; text-align:center;
}
.en-empty-icon { font-size:38px; margin-bottom:14px; opacity:.12; }
.en-empty-title {
  font-family:var(--a-font-display);
  font-size:17px; font-weight:700; color:var(--a-fg); margin-bottom:6px;
}
.en-empty-sub { font-size:13px; color:var(--a-fg-mid); }
.en-no-evals {
  text-align:center; border-radius:12px; color:var(--a-fg-mid);
  font-size:13px; padding:28px 20px; border:1px dashed var(--a-border);
  line-height:1.7; }

/* ── Error ── */
.en-error {
  font-size:13px; margin-bottom:12px;
  color:#ff453a; padding:10px 14px; border-radius:10px;
  background:rgba(255,69,58,.07); border:1px solid rgba(255,69,58,.18);
}

/* ── Modal ── */
.en-modal-backdrop {
  position:fixed; inset:0; z-index:1000;
  display:flex; align-items:center; justify-content:center; padding:20px;
  background:rgba(0,0,0,.7); backdrop-filter:blur(8px);
}
.en-modal {
  background:var(--a-bg-card); border-radius:20px; padding:32px;
  width:100%; max-width:420px; box-shadow:0 30px 80px rgba(0,0,0,.5);
  border:1px solid var(--a-border);
}
.en-modal-title {
  font-family:var(--a-font-display);
  font-size:17px; font-weight:700; color:var(--a-fg); margin:0 0 4px;
}
.en-modal-sub { font-size:13px; color:var(--a-fg-mid); margin:0 0 22px; }
.en-modal-legend { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:22px; padding:10px 12px; border-radius:10px; background:var(--a-bg); border:1px solid var(--a-border); }
.en-modal-label {
  display:block; font-size:10px; font-weight:700;
  color:var(--a-fg-mid); text-transform:uppercase; letter-spacing:.8px; margin-bottom:8px;
}
.en-modal-field { margin-bottom:18px; }
.en-modal-input {
  width:100%; background:var(--a-bg); color:var(--a-fg); border-radius:12px;
  font-size:14px; outline:none; box-sizing:border-box;
  border:1.5px solid var(--a-border); padding:12px 16px;
  transition:border-color .15s;
}
.en-modal-input:focus { border-color:var(--a-gold); }
.en-modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:10px; }
.en-modal-cancel {
  border-radius:980px; border:1px solid var(--a-border); background:transparent;
  color:var(--a-fg-mid); cursor:pointer; font-size:13px; padding:10px 22px; transition:all .15s;
}
.en-modal-cancel:hover { border-color:var(--a-fg-mid); color:var(--a-fg); }
.en-modal-save {
  border-radius:980px; border:none; background:var(--a-gold); color:#000;
  font-weight:700; cursor:pointer; font-size:13px; padding:10px 24px; transition:opacity .15s;
}
.en-modal-save:hover { opacity:.9; }
.en-modal-save:disabled { opacity:.45; cursor:not-allowed; }

/* ── Confirm delete ── */
.en-confirm-backdrop {
  position:fixed; inset:0; z-index:1100;
  display:flex; align-items:center; justify-content:center; padding:20px;
  background:rgba(0,0,0,.7); backdrop-filter:blur(8px);
}
.en-confirm {
  background:var(--a-bg-card); border-radius:16px; max-width:380px; width:100%;
  padding:28px; box-shadow:0 20px 60px rgba(0,0,0,.5); border:1px solid var(--a-border);
}
.en-confirm-title {
  font-family:var(--a-font-display);
  font-size:17px; font-weight:700; color:var(--a-fg); margin-bottom:10px;
}
.en-confirm-body { font-size:13px; color:var(--a-fg-mid); margin-bottom:24px; line-height:1.65; }
.en-confirm-actions { display:flex; justify-content:flex-end; gap:10px; }
.en-confirm-cancel {
  border-radius:980px; border:1px solid var(--a-border); background:transparent;
  color:var(--a-fg-mid); cursor:pointer; font-size:13px; padding:9px 20px;
}
.en-confirm-delete {
  border-radius:980px; border:none; background:var(--a-red); color:#fff;
  font-weight:700; cursor:pointer; font-size:13px; padding:9px 20px;
}
`;

// ─── CommentModal ─────────────────────────────────────────────────────────────
function CommentModal({ eleve, currentValue, onSave, onClose, readOnly = false }) {
  const [value, setValue] = useState(currentValue || '');
  const [saving, setSaving] = useState(false);
  const MAX = 500;

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(value.trim() || null); }
    finally { setSaving(false); }
  };

  return (
    <div className="en-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="en-modal">
        <h3 className="en-modal-title">
          {readOnly ? 'Commentaire' : 'Commentaire sur la note'}
        </h3>
        <p className="en-modal-sub">
          {eleve?.prenom} {eleve?.nom}
        </p>

        <div className="en-modal-field">
          <label className="en-modal-label">
            {readOnly ? 'Appréciation de l\'enseignant' : 'Appréciation (facultatif)'}
          </label>
          <textarea
            className="en-comment-textarea"
            autoFocus={!readOnly}
            readOnly={readOnly}
            value={value}
            maxLength={MAX}
            onChange={e => setValue(e.target.value)}
            placeholder={readOnly ? '' : 'Ex : Très bon travail sur la lecture, peut encore progresser à l\'oral.'}
          />
          {!readOnly && (
            <div className="en-comment-counter">{value.length}/{MAX}</div>
          )}
        </div>

        <div className="en-modal-actions">
          <button className="en-modal-cancel" onClick={onClose}>
            {readOnly ? 'Fermer' : 'Annuler'}
          </button>
          {!readOnly && (
            <button className="en-modal-save" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── NoteLetterInput ──────────────────────────────────────────────────────────
function NoteLetterInput({ note, onSave, onAbsent, onOpenComment }) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSelect = async (grade) => {
    const newScore = note?.score === grade.value ? null : grade.value;
    setSaving(true);
    try {
      await onSave(newScore);
      if (newScore !== null) { setSaved(true); setTimeout(() => setSaved(false), 1400); }
    } finally { setSaving(false); }
  };

  const hasComment = Boolean(note?.commentaire);

  if (note?.absent) {
    return (
      <div className="en-grade-input">
        <div className="en-absent-tag">ABSENT</div>
        <button className="en-absent-remove" onClick={onAbsent}>Retirer</button>
      </div>
    );
  }

  return (
    <div className="en-grade-input">
      {GRADES.map(g => {
        const isSelected = note?.score === g.value;
        return (
          <button
            key={g.label}
            className="en-grade-btn"
            onClick={() => handleSelect(g)}
            disabled={saving}
            title={g.libelle}
            style={{
              border: `1.5px solid ${isSelected ? g.color : 'var(--a-border)'}`,
              background: isSelected ? g.color : 'var(--a-bg)',
              color: isSelected ? '#fff' : 'var(--a-fg-mid)',
              fontSize: g.label === 'ECA' ? 10 : 11.5,
              cursor: saving ? 'wait' : 'pointer',
            }}
            onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = g.color; e.currentTarget.style.color = g.color; }}}
            onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--a-border)'; e.currentTarget.style.color = 'var(--a-fg-mid)'; }}}
          >
            {g.label}
          </button>
        );
      })}
      <button className="en-abs-btn" onClick={onAbsent} title="Marquer absent">Abs</button>
      <button
        type="button"
        className={`en-comment-btn${hasComment ? ' has-comment' : ''}`}
        onClick={onOpenComment}
        title={hasComment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
      >
        <IconMessage />
      </button>
      {saved && (
        <div className="en-saved"><IconCheck /></div>
      )}
    </div>
  );
}

// ─── GradeBadge ───────────────────────────────────────────────────────────────
function GradeBadge({ score }) {
  const g = gradeFromScore(score);
  if (!g) return <span style={{ color:'var(--a-fg-light)', fontSize:12 }}>—</span>;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, borderRadius:8,
      fontWeight:800, padding:'4px 12px', fontSize:13,
      background:`${g.color}18`, color:g.color, border:`1px solid ${g.color}35`,
    }}>
      {g.label}
      <span style={{ fontSize:11, fontWeight:400, opacity:.8 }}>{g.libelle}</span>
    </span>
  );
}

// ─── EvalCard ─────────────────────────────────────────────────────────────────
function EvalCard({ ev, isActive, user, stats, onClick, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const isOwn = ev.enseignant_id === user.id;
  const pct   = stats.total > 0 ? stats.noted / stats.total : 0;

  return (
    <div
      className={`en-eval-card${isActive ? ' active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="en-eval-card-row1">
        <div style={{ flex:1, minWidth:0 }}>
          <div className="en-eval-title">{ev.titre}</div>
          <div className="en-eval-meta">
            {ev.date_evaluation && <span>{fmt(ev.date_evaluation)}</span>}
            {!isOwn && ev.enseignants && (
              <span className="en-eval-by">par {ev.enseignants.prenom} {ev.enseignants.nom}</span>
            )}
          </div>
        </div>
        {isOwn && (hovered || isActive) && (
          <div className="en-eval-actions">
            <button className="en-eval-action-btn" onClick={onEdit}><IconEdit2/></button>
            <button className="en-eval-action-btn del" onClick={onDelete}><IconTrash2/></button>
          </div>
        )}
      </div>

      {/* Barre de progression */}
      <div className="en-eval-bar-row">
        <div className="en-eval-bar-track">
          <div className="en-eval-bar-fill" style={{ width: `${pct * 100}%` }} />
        </div>
        <span className="en-eval-fraction" style={{ color: pct === 1 ? '#30d158' : undefined, fontWeight: pct === 1 ? 700 : 400 }}>
          {stats.noted}/{stats.total}
        </span>
      </div>

      {/* Badges grades */}
      {(stats.noted > 0 || stats.absent > 0) && (
        <div className="en-eval-grade-dots" style={{ marginTop:7 }}>
          {GRADES.map(g => stats.dist[g.label] > 0 && (
            <span key={g.label} className="en-eval-grade-dot" style={{ background:`${g.color}15`, color:g.color }}>
              {g.label}×{stats.dist[g.label]}
            </span>
          ))}
          {stats.absent > 0 && (
            <span className="en-eval-grade-dot" style={{ background:'rgba(255,69,58,.12)', color:'#ff453a' }}>
              Abs×{stats.absent}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function EnseignantNotes() {
  const user = getEnseignantUser();

  const [classes,     setClasses]     = useState([]);
  const [selClasse,   setSelClasse]   = useState(null);
  const [eleves,      setEleves]      = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [notesMap,    setNotesMap]    = useState({});
  const [loading,     setLoading]     = useState(true);
  const [selEval,     setSelEval]     = useState(null);
  const [modal,       setModal]       = useState(null);
  const [fTitre,      setFTitre]      = useState('');
  const [fDate,       setFDate]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(null);
  const [commentModal, setCommentModal] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetchMesClasses(user.id).then(cls => {
      setClasses(cls);
      if (cls.length) setSelClasse(cls[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []); // eslint-disable-line

  const loadData = useCallback(async (classeId) => {
    if (!classeId) return;
    setLoading(true);
    setSelEval(null);
    setCommentModal(null);
    setEleves([]); setEvaluations([]); setNotesMap({});
    try {
      const [elevs, evals] = await Promise.all([
        fetchElevesDeClasse(classeId),
        fetchEvaluationsClasse(classeId),
      ]);
      setEleves(elevs);
      setEvaluations(evals);
      if (evals.length) {
        const arrays = await Promise.all(evals.map(e => fetchNotesEvaluation(e.id)));
        const map = {};
        arrays.forEach(notes => notes.forEach(n => { map[noteKey(n.evaluation_id, n.eleve_id)] = n; }));
        setNotesMap(map);
        setSelEval(evals[0]);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { if (selClasse) loadData(selClasse); }, [selClasse, loadData]);

  const saveNote = useCallback(async (evalId, eleveId, score) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    try {
      const result = await upsertNote(evalId, eleveId, score, false, current?.commentaire ?? null);
      setNotesMap(prev => ({ ...prev, [key]: result }));
    } catch(e) { setActionError(e.message || 'Erreur lors de la sauvegarde de la note.'); }
  }, [notesMap]);

  const toggleAbsent = useCallback(async (evalId, eleveId) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    const newAbsent = !current?.absent;
    setNotesMap(prev => ({ ...prev, [key]: { ...prev[key], evaluation_id:evalId, eleve_id:eleveId, score:null, absent:newAbsent } }));
    try {
      const result = await upsertNote(evalId, eleveId, null, newAbsent, current?.commentaire ?? null);
      setNotesMap(prev => ({ ...prev, [key]: result }));
    } catch(e) { setActionError(e.message || 'Erreur lors du marquage absent.'); }
  }, [notesMap]);

  const saveComment = useCallback(async (evalId, eleveId, commentaire) => {
    const key = noteKey(evalId, eleveId);
    const current = notesMap[key];
    try {
      const result = await upsertNote(
        evalId, eleveId,
        current?.score ?? null,
        current?.absent ?? false,
        commentaire,
      );
      setNotesMap(prev => ({ ...prev, [key]: result }));
      setCommentModal(null);
    } catch(e) { setActionError(e.message || 'Erreur lors de la sauvegarde du commentaire.'); }
  }, [notesMap]);

  const evalStats = (ev) => {
    const noted  = eleves.filter(e => { const n = notesMap[noteKey(ev.id, e.id)]; return n && (n.absent || n.score != null); }).length;
    const absent = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.absent).length;
    const dist   = {};
    GRADES.forEach(g => { dist[g.label] = eleves.filter(e => notesMap[noteKey(ev.id, e.id)]?.score === g.value).length; });
    return { noted, absent, dist, total: eleves.length };
  };

  const openCreate = () => { setFTitre(''); setFDate(''); setModal({ mode:'create' }); };
  const openEdit   = (ev, e) => { e.stopPropagation(); setFTitre(ev.titre); setFDate(ev.date_evaluation || ''); setModal({ mode:'edit', eval:ev }); };

  const handleSaveEval = async () => {
    if (!fTitre.trim()) return;
    setSaving(true);
    try {
      const data = { titre:fTitre.trim(), classe_id:selClasse, enseignant_id:user.id, date_evaluation:fDate||null, score_max:4 };
      if (modal.mode === 'create') {
        const created = await createEvaluation(data);
        setEvaluations(prev => [...prev, created]);
        setSelEval(created);
      } else {
        await updateEvaluation(modal.eval.id, { titre:data.titre, date_evaluation:data.date_evaluation, score_max:4 }, user.id);
        setEvaluations(prev => prev.map(e => e.id === modal.eval.id ? { ...e, ...data } : e));
        setSelEval(prev => prev?.id === modal.eval.id ? { ...prev, ...data } : prev);
      }
      setModal(null);
    } catch(e) { setActionError(e.message || 'Erreur lors de l\'enregistrement.'); }
    setSaving(false);
  };

  const handleDeleteEval = async () => {
    if (!confirmDel) return;
    try {
      await deleteEvaluation(confirmDel.id, user.id);
      const next = evaluations.filter(e => e.id !== confirmDel.id);
      setEvaluations(next);
      setNotesMap(prev => { const n={...prev}; Object.keys(n).forEach(k=>{if(k.startsWith(confirmDel.id+'_'))delete n[k];}); return n; });
      setSelEval(next.length ? next[0] : null);
      setCommentModal(null);
    } catch(e) { setActionError(e.message || 'Erreur lors de la suppression.'); }
    setConfirmDel(null);
  };

  const className = classes.find(c => c.id === selClasse)?.nom || '';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom:32 }}>
      <style>{NOTES_CSS}</style>

      {actionError && <div className="en-error">{actionError}</div>}

      {/* ── Tabs classes ── */}
      <div className="en-tabs">
        {classes.map(c => (
          <button
            key={c.id}
            className={`en-tab${selClasse === c.id ? ' active' : ''}`}
            onClick={() => setSelClasse(c.id)}
          >
            {c.nom}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="en-loading">Chargement…</div>
      ) : (
        <div className="en-grid">

          {/* ══ COLONNE GAUCHE ══ */}
          <div className="en-col">

            <div className="en-col-head">
              <span className="en-col-title">Évaluations — {className}</span>
              {evaluations.length > 0 && (
                <span className="en-col-count">{evaluations.length} au total</span>
              )}
            </div>

            <button className="en-add-btn" onClick={openCreate}>
              <IconPlus /> Nouvelle évaluation
            </button>

            {/* Légende */}
            <div className="en-grade-legend">
              {GRADES.map(g => (
                <span key={g.label} className="en-grade-pip" style={{ background:`${g.color}15`, color:g.color, border:`1px solid ${g.color}28` }}>
                  {g.label} = {g.libelle}
                </span>
              ))}
            </div>

            {/* Liste */}
            {evaluations.length === 0 ? (
              <div className="en-no-evals">
                Aucune évaluation pour le moment.<br/>
                <span style={{ color:'var(--a-gold)', fontWeight:600 }}>↑ Créez-en une ci-dessus.</span>
              </div>
            ) : evaluations.map(ev => {
              const s = evalStats(ev);
              return (
                <EvalCard
                  key={ev.id}
                  ev={ev}
                  isActive={selEval?.id === ev.id}
                  user={user}
                  stats={s}
                  onClick={() => setSelEval(ev)}
                  onEdit={e => openEdit(ev, e)}
                  onDelete={e => { e.stopPropagation(); setConfirmDel(ev); }}
                />
              );
            })}
          </div>

          {/* ══ COLONNE DROITE ══ */}
          {selEval ? (
            <div className="en-panel">

              {/* Header */}
              <div className="en-panel-head">
                <h3 className="en-panel-title">{selEval.titre}</h3>
                <div className="en-panel-meta-row">
                  {selEval.date_evaluation && (
                    <span className="en-panel-date">{fmt(selEval.date_evaluation)}</span>
                  )}
                  <div className="en-panel-legend">
                    {GRADES.map(g => (
                      <span key={g.label} className="en-panel-legend-pip" style={{ background:`${g.color}18`, color:g.color }}>
                        {g.label} = {g.libelle}
                      </span>
                    ))}
                  </div>
                  {(() => {
                    const s = evalStats(selEval);
                    return (
                      <div className="en-panel-stats">
                        <div>
                          <span className="en-stat-num" style={{ color:'var(--a-gold)' }}>{s.noted}</span>
                          <span className="en-stat-lbl">saisis</span>
                        </div>
                        {s.absent > 0 && (
                          <div>
                            <span className="en-stat-num" style={{ color:'#ff453a' }}>{s.absent}</span>
                            <span className="en-stat-lbl">absents</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Table */}
              {eleves.length === 0 ? (
                <div style={{ textAlign:'center', color:'var(--a-fg-mid)', fontSize:14, padding:'60px 24px' }}>
                  Aucun élève dans cette classe
                </div>
              ) : (
                <div>
                  <div className="en-table-head">
                    <span className="en-table-th">Élève</span>
                    <span className="en-table-th" style={{ textAlign:'center' }}>Appréciation</span>
                  </div>

                  {eleves.map((eleve) => {
                    const note  = notesMap[noteKey(selEval.id, eleve.id)];
                    const grade = (note && !note.absent && note.score != null) ? gradeFromScore(note.score) : null;
                    return (
                      <div key={eleve.id} className="en-student-row">
                        {/* Identité */}
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div
                            className="en-avatar"
                            style={{
                              background: grade ? `${grade.color}18` : 'rgba(255,255,255,.05)',
                              border: `2px solid ${grade ? grade.color : 'var(--a-border)'}`,
                              color: grade ? grade.color : 'var(--a-fg-mid)',
                            }}
                          >
                            {initials(eleve)}
                          </div>
                          <div>
                            <div className="en-student-name">{eleve.prenom} {eleve.nom}</div>
                            <div className="en-student-sub" style={{ color: note?.absent ? '#ff453a' : grade ? grade.color : 'var(--a-fg-light)', fontWeight: grade || note?.absent ? 600 : 400 }}>
                              {note?.absent ? 'Absent(e)' : grade ? `${grade.label} — ${grade.libelle}` : 'Non saisi'}
                            </div>
                          </div>
                        </div>

                        {/* Saisie / affichage */}
                        {selEval.enseignant_id === user.id ? (
                          <NoteLetterInput
                            note={note}
                            onSave={(score) => saveNote(selEval.id, eleve.id, score)}
                            onAbsent={() => toggleAbsent(selEval.id, eleve.id)}
                            onOpenComment={() => setCommentModal({ eleve, note, readOnly: false, evalId: selEval.id })}
                          />
                        ) : (
                          <div className="en-readonly-grade">
                            {note?.absent
                              ? <span style={{ fontSize:12, fontWeight:700, borderRadius:8, padding:'4px 12px', background:'rgba(255,69,58,.12)', color:'#ff453a' }}>ABSENT</span>
                              : <GradeBadge score={note?.score} />
                            }
                            {note?.commentaire && (
                              <button
                                type="button"
                                className="en-comment-readonly"
                                title="Voir le commentaire"
                                onClick={() => setCommentModal({ eleve, note, readOnly: true, evalId: selEval.id })}
                              >
                                <IconMessage size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Footer résultats */}
                  {(() => {
                    const s = evalStats(selEval);
                    const hasNotes = GRADES.some(g => s.dist[g.label] > 0);
                    if (!hasNotes) return null;
                    return (
                      <div className="en-panel-footer">
                        <span className="en-footer-label">Résultats de classe</span>
                        <div className="en-footer-grades">
                          {GRADES.map(g => s.dist[g.label] > 0 && (
                            <div key={g.label} className="en-footer-grade">
                              <span className="en-footer-grade-num" style={{ color:g.color }}>{s.dist[g.label]}</span>
                              <span className="en-footer-grade-lbl" style={{ color:g.color }}>{g.label}</span>
                            </div>
                          ))}
                          {s.absent > 0 && (
                            <div className="en-footer-grade">
                              <span className="en-footer-grade-num" style={{ color:'#ff453a' }}>{s.absent}</span>
                              <span className="en-footer-grade-lbl" style={{ color:'#ff453a' }}>Abs.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="en-empty-panel">
              <div className="en-empty-icon">📋</div>
              <div className="en-empty-title">Sélectionnez une évaluation</div>
              <div className="en-empty-sub">ou créez-en une nouvelle depuis la colonne gauche.</div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal évaluation ── */}
      {modal && (
        <div className="en-modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div className="en-modal">
            <h3 className="en-modal-title">
              {modal.mode==='create' ? 'Nouvelle évaluation' : 'Modifier l\'évaluation'}
            </h3>
            <p className="en-modal-sub">
              {modal.mode==='create' ? `Classe : ${className}` : 'Mettre à jour les informations'}
            </p>

            <div className="en-modal-legend">
              {GRADES.map(g => (
                <span key={g.label} className="en-grade-pip" style={{ background:`${g.color}18`, color:g.color, border:`1px solid ${g.color}28` }}>
                  {g.label} = {g.libelle}
                </span>
              ))}
            </div>

            <div className="en-modal-field">
              <label className="en-modal-label">Titre de l'évaluation</label>
              <input
                className="en-modal-input"
                autoFocus
                value={fTitre}
                onChange={e => setFTitre(e.target.value)}
                placeholder="ex : Contrôle de lecture n°1"
                onKeyDown={e => { if (e.key==='Enter' && fTitre.trim()) handleSaveEval(); }}
              />
            </div>
            <div className="en-modal-field">
              <label className="en-modal-label">Date (facultatif)</label>
              <input
                type="date"
                className="en-modal-input"
                value={fDate}
                onChange={e => setFDate(e.target.value)}
              />
            </div>

            <div className="en-modal-actions">
              <button className="en-modal-cancel" onClick={() => setModal(null)}>Annuler</button>
              <button className="en-modal-save" onClick={handleSaveEval} disabled={saving || !fTitre.trim()}>
                {saving ? 'Enregistrement…' : modal.mode==='create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal commentaire ── */}
      {commentModal && (
        <CommentModal
          eleve={commentModal.eleve}
          currentValue={commentModal.note?.commentaire || ''}
          readOnly={commentModal.readOnly}
          onClose={() => setCommentModal(null)}
          onSave={(value) => saveComment(commentModal.evalId, commentModal.eleve.id, value)}
        />
      )}

      {/* ── Confirmation suppression ── */}
      {confirmDel && (
        <div className="en-confirm-backdrop">
          <div className="en-confirm">
            <div className="en-confirm-title">Supprimer cette évaluation ?</div>
            <div className="en-confirm-body">
              <strong style={{ color:'var(--a-fg)' }}>{confirmDel.titre}</strong> et toutes les notes associées seront supprimées définitivement.
            </div>
            <div className="en-confirm-actions">
              <button className="en-confirm-cancel" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="en-confirm-delete" onClick={handleDeleteEval}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
