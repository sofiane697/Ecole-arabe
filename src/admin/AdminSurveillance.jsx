import React, { useState, useEffect, useRef } from 'react';
import { fetchAllConversations, fetchConversationMessages } from './supabaseAdmin';

// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(prenom, nom) {
  return `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
}

const AVATAR_PALETTES = [
  { bg: 'rgba(191,138,48,.20)',  color: '#d4a843' },
  { bg: 'rgba(79,142,247,.18)',  color: '#7aadff' },
  { bg: 'rgba(48,209,88,.16)',   color: '#30d158' },
  { bg: 'rgba(255,149,0,.16)',   color: '#ff9f0a' },
  { bg: 'rgba(191,90,242,.16)',  color: '#bf5af2' },
  { bg: 'rgba(255,55,95,.16)',   color: '#ff375f' },
  { bg: 'rgba(100,210,255,.14)', color: '#64d2ff' },
];

function avatarPalette(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return formatTime(iso);
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7)  return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatDateSep(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Composant Avatar ───────────────────────────────────────────────────────

function Avatar({ prenom, nom, size = 36, radius = 10 }) {
  const p = avatarPalette(`${prenom}${nom}`);
  return (
    <div className="surv-conv-avatar" style={{
      width: size, height: size, borderRadius: radius,
      background: p.bg, color: p.color,
    }}>
      {initials(prenom, nom)}
    </div>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function AdminSurveillance() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [messages, setMessages]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [filtreEns, setFiltreEns]         = useState('tous');
  const messagesEndRef     = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMsgCountRef    = useRef(0);

  // Chargement conversations + polling 10s
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchAllConversations().then(data => {
        if (!cancelled) { setConversations(data); setLoading(false); }
      }).catch(() => { if (!cancelled) setLoading(false); });
    };
    load();
    const timer = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  // Chargement messages + polling 5s
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    const load = () => {
      fetchConversationMessages(selected.eleve_id, selected.enseignant_id)
        .then(data => { if (!cancelled) setMessages(data); })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selected]);

  // Scroll bas : uniquement si un nouveau message arrive OU si c'est le chargement initial
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const newCount  = messages.length;
    const prevCount = prevMsgCountRef.current;

    if (newCount === 0) {
      // Réinitialisation à la sélection d'une conversation
      prevMsgCountRef.current = 0;
      return;
    }

    if (newCount > prevCount) {
      // Premier chargement ou nouveau message : scroll vers le bas
      messagesEndRef.current?.scrollIntoView({ behavior: prevCount === 0 ? 'instant' : 'smooth' });
    }
    prevMsgCountRef.current = newCount;
  }, [messages]);

  // Enseignants uniques pour le filtre
  const enseignantsUniques = Array.from(
    new Map(conversations.map(c => [c.enseignant_id, c.enseignants])).entries()
  ).map(([id, ens]) => ({ id, ...ens }));

  // Filtrage
  const filtered = conversations.filter(c => {
    const nomEleve = `${c.profils_eleves?.prenom ?? ''} ${c.profils_eleves?.nom ?? ''}`.toLowerCase();
    const nomEns   = `${c.enseignants?.prenom ?? ''} ${c.enseignants?.nom ?? ''}`.toLowerCase();
    const q = search.toLowerCase().trim();
    const okSearch = !q || nomEleve.includes(q) || nomEns.includes(q);
    const okEns    = filtreEns === 'tous' || c.enseignant_id === filtreEns;
    return okSearch && okEns;
  });

  // Grouper messages par date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.created_at).toDateString();
    if (!acc.length || acc[acc.length - 1].dateKey !== dateKey) {
      acc.push({ dateKey, label: formatDateSep(msg.created_at), messages: [msg] });
    } else {
      acc[acc.length - 1].messages.push(msg);
    }
    return acc;
  }, []);

  const isActive = (c) => selected &&
    c.eleve_id === selected.eleve_id && c.enseignant_id === selected.enseignant_id;

  return (
    <div className="surv-wrap">

      {/* ── Sidebar : liste des conversations ── */}
      <div className="surv-sidebar">
        <div className="surv-sidebar-head">
          <p className="surv-sidebar-title">Conversations</p>

          {/* Barre de recherche */}
          <div className="surv-search-wrap">
            <span className="surv-search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              className="surv-search"
              placeholder="Élève, professeur…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filtre professeur */}
          <select
            className="surv-filter-sel"
            value={filtreEns}
            onChange={e => setFiltreEns(e.target.value)}
          >
            <option value="tous">Tous les professeurs</option>
            {enseignantsUniques.map(e => (
              <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>
            ))}
          </select>
        </div>

        {/* Compteur */}
        {!loading && (
          <div className="surv-list-count">
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
            {search || filtreEns !== 'tous' ? ' filtrée' + (filtered.length !== 1 ? 's' : '') : ''}
          </div>
        )}

        <div className="surv-list">
          {loading && <div className="surv-empty">Chargement…</div>}
          {!loading && filtered.length === 0 && (
            <div className="surv-empty">Aucune conversation</div>
          )}

          {filtered.map(c => {
            const eleve = c.profils_eleves;
            const ens   = c.enseignants;
            const pEleve = avatarPalette(`${eleve?.prenom}${eleve?.nom}`);
            return (
              <div
                key={`${c.eleve_id}|${c.enseignant_id}`}
                className={`surv-conv-item${isActive(c) ? ' active' : ''}`}
                onClick={() => { setSelected(c); setMessages([]); prevMsgCountRef.current = 0; }}
              >
                {/* Avatar double */}
                <div className="relative w-9 h-9 shrink-0">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold absolute top-0 left-0 z-[2] shadow-[0_0_0_2px_var(--a-bg-card)]"
                    style={{ background: pEleve.bg, color: pEleve.color }}>
                    {initials(eleve?.prenom, eleve?.nom)}
                  </div>
                  <div className="w-[22px] h-[22px] rounded-md flex items-center justify-center text-[8px] font-bold absolute bottom-0 right-0 z-[1] shadow-[0_0_0_2px_var(--a-bg-card)]"
                    style={{
                      background: avatarPalette(`${ens?.prenom}${ens?.nom}`).bg,
                      color: avatarPalette(`${ens?.prenom}${ens?.nom}`).color,
                    }}>
                    {initials(ens?.prenom, ens?.nom)}
                  </div>
                </div>

                {/* Corps */}
                <div className="surv-conv-body">
                  <div className="surv-conv-row1">
                    <span className="surv-conv-names">
                      {eleve?.prenom} {eleve?.nom}
                    </span>
                    <span className="surv-conv-time">{formatDateShort(c.created_at)}</span>
                  </div>
                  <div className="text-[11px] text-[var(--a-muted)] mt-px mb-[3px]">
                    avec {ens?.prenom} {ens?.nom}
                  </div>
                  <div className="surv-conv-row2">
                    <span className={`surv-conv-role-tag ${c.sender_role}`}>
                      {c.sender_role === 'eleve' ? 'Élève' : 'Prof.'}
                    </span>
                    <span className="surv-conv-preview">{c.contenu}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Zone messages ── */}
      {selected ? (
        <div className="surv-main">
          {/* Header */}
          <div className="surv-main-header">
            <div className="surv-main-participants">
              {/* Chip élève */}
              <div className="surv-participant-chip">
                <div className="chip-av" style={{
                  background: avatarPalette(`${selected.profils_eleves?.prenom}${selected.profils_eleves?.nom}`).bg,
                  color: avatarPalette(`${selected.profils_eleves?.prenom}${selected.profils_eleves?.nom}`).color,
                }}>
                  {initials(selected.profils_eleves?.prenom, selected.profils_eleves?.nom)}
                </div>
                <div>
                  <div className="chip-name">{selected.profils_eleves?.prenom} {selected.profils_eleves?.nom}</div>
                  <div className="chip-role">Élève</div>
                </div>
              </div>

              {/* Séparateur */}
              <span className="surv-chip-sep">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </span>

              {/* Chip enseignant */}
              <div className="surv-participant-chip">
                <div className="chip-av" style={{
                  background: avatarPalette(`${selected.enseignants?.prenom}${selected.enseignants?.nom}`).bg,
                  color: avatarPalette(`${selected.enseignants?.prenom}${selected.enseignants?.nom}`).color,
                }}>
                  {initials(selected.enseignants?.prenom, selected.enseignants?.nom)}
                </div>
                <div>
                  <div className="chip-name">{selected.enseignants?.prenom} {selected.enseignants?.nom}</div>
                  <div className="chip-role">Professeur</div>
                </div>
              </div>
            </div>

            {/* Badge info */}
            <div className="surv-main-badge">
              {messages.length} msg · lecture seule
            </div>
          </div>

          {/* Messages */}
          <div className="surv-messages" ref={messagesContainerRef}>
            {messages.length === 0 && (
              <div className="surv-empty flex-1">Chargement…</div>
            )}

            {groupedMessages.map(group => (
              <React.Fragment key={group.dateKey}>
                {/* Séparateur de date */}
                <div className="surv-date-sep">
                  <div className="surv-date-sep-line" />
                  <span className="surv-date-sep-label">{group.label}</span>
                  <div className="surv-date-sep-line" />
                </div>

                {group.messages.map(m => {
                  const isEleve = m.sender_role === 'eleve';
                  const senderPrenom = isEleve
                    ? selected.profils_eleves?.prenom
                    : selected.enseignants?.prenom;
                  const senderNom = isEleve
                    ? selected.profils_eleves?.nom
                    : selected.enseignants?.nom;
                  const pal = avatarPalette(`${senderPrenom}${senderNom}`);

                  return (
                    <div key={m.id} className={`surv-bubble-wrap ${m.sender_role}`}>
                      {/* Avatar expéditeur */}
                      <div className="surv-bubble-av" style={{ background: pal.bg, color: pal.color }}>
                        {initials(senderPrenom, senderNom)}
                      </div>

                      {/* Bulle + heure */}
                      <div className="surv-bubble-content">
                        <div className={`surv-bubble ${m.sender_role}`}>{m.contenu}</div>
                        <div className="surv-bubble-time">{formatTime(m.created_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}

            <div ref={messagesEndRef} />
          </div>
        </div>
      ) : (
        /* État vide */
        <div className="surv-empty-full">
          <div className="surv-empty-full-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--a-muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <span className="surv-empty-full-text">Sélectionnez une conversation</span>
          <span className="surv-empty-full-hint">Cliquez sur une discussion dans la liste de gauche</span>
        </div>
      )}
    </div>
  );
}
