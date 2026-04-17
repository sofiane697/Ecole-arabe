import React, { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logoutEleve, getEleveUser, fetchAllBadgeCounts, startSession, heartbeatSession, endSession, verifyEleveSession } from './supabasePortail';
import { AnimatePresence, motion, pageVariants, staggerContainer } from '../animations';

const LETTER_SPRING = { type: 'spring', stiffness: 280, damping: 20, mass: 0.6 };

const BG_LETTERS = [
  // Zone gauche (bord sidebar)
  { l:'ب', size:'80px', top:'5%',  left:'2%',  color:'#AED6F1', dur:'12s', delay:'0s',   anim:'1' },
  { l:'ك', size:'75px', top:'30%', left:'4%',  color:'#FADBD8', dur:'11s', delay:'2s',   anim:'2' },
  { l:'ن', size:'70px', top:'58%', left:'1%',  color:'#A9DFBF', dur:'14s', delay:'4s',   anim:'3' },
  { l:'ل', size:'65px', top:'80%', left:'3%',  color:'#FCF3CF', dur:'10s', delay:'1s',   anim:'4' },
  // Zone droite (bord droit)
  { l:'ر', size:'85px', top:'8%',  left:'88%', color:'#A9DFBF', dur:'9s',  delay:'1.5s', anim:'1' },
  { l:'م', size:'70px', top:'28%', left:'84%', color:'#FCF3CF', dur:'13s', delay:'3s',   anim:'2' },
  { l:'ع', size:'80px', top:'50%', left:'90%', color:'#AED6F1', dur:'10s', delay:'5s',   anim:'3' },
  { l:'ق', size:'65px', top:'72%', left:'85%', color:'#FADBD8', dur:'8s',  delay:'2.5s', anim:'4' },
  { l:'ص', size:'75px', top:'90%', left:'92%', color:'#A9DFBF', dur:'11s', delay:'0.5s', anim:'1' },
  // Zone haute
  { l:'و', size:'72px', top:'2%',  left:'30%', color:'#FADBD8', dur:'13s', delay:'3.5s', anim:'2' },
  { l:'ح', size:'68px', top:'3%',  left:'55%', color:'#FCF3CF', dur:'9s',  delay:'1s',   anim:'3' },
  { l:'ذ', size:'78px', top:'2%',  left:'72%', color:'#AED6F1', dur:'11s', delay:'4.5s', anim:'4' },
  // Zone basse
  { l:'ز', size:'70px', top:'90%', left:'25%', color:'#A9DFBF', dur:'12s', delay:'2s',   anim:'1' },
  { l:'ط', size:'74px', top:'88%', left:'55%', color:'#FADBD8', dur:'10s', delay:'0s',   anim:'2' },
];

const TOPBAR_KEYFRAMES = `
@keyframes topbarLetterFloat {
  0%,100% { transform:translateY(0); }
  50%      { transform:translateY(-4px); }
}
@keyframes topbarStarSpin {
  0%   { transform:rotate(0deg) scale(1); }
  50%  { transform:rotate(180deg) scale(1.3); }
  100% { transform:rotate(360deg) scale(1); }
}
@keyframes topbarBubble {
  0%,100% { transform:translateY(0); opacity:.8; }
  50%      { transform:translateY(-5px); opacity:1; }
}
`;
const FUN_COLORS = ['#7EC8E3', '#7DCFA0', '#F4A896', '#F7D070'];

const PAGE_EMOJIS = {
  '/portail':              '📚',
  '/portail/devoirs':      '📝',
  '/portail/resultats':    '📊',
  '/portail/observations': '👁️',
  '/portail/messages':     '💬',
};
function getPageEmoji(pathname) {
  if (PAGE_EMOJIS[pathname]) return PAGE_EMOJIS[pathname];
  if (pathname.includes('/lecon/')) return '📖';
  if (pathname.includes('/thematique/')) return '📂';
  if (pathname.startsWith('/portail/module/')) return '🗂️';
  return '📖';
}

function TopbarFunTitle({ title, emoji }) {
  let ci = 0;
  return (
    <>
      <style>{TOPBAR_KEYFRAMES}</style>
      <motion.span
        className="portail-topbar-fun-title inline-flex items-center gap-2 text-[40px] font-black"
        style={{ fontFamily:"'Nunito','Inter',sans-serif" }}
        variants={{ hidden:{}, visible:{ transition:{ staggerChildren: 0.04, delayChildren: 0.05 } } }}
        initial="hidden" animate="visible"
      >
        {/* Emoji gauche */}
        <span className="text-[28px] inline-block" style={{ animation:'topbarBubble 2.5s ease-in-out infinite' }}>{emoji}</span>
        {/* Lettres animées */}
        {title.split(' ').map((word, wi) => (
          <span key={wi} className="inline-flex gap-0">
            {word.split('').map((char) => {
              const color = FUN_COLORS[ci % FUN_COLORS.length];
              const floatDur = `${2.2 + (ci % 3) * 0.4}s`;
              ci++;
              return (
                /* motion.span gère l'entrée (opacity+y+scale), span interne gère le float CSS sans conflit */
                <motion.span
                  key={ci}
                  className="inline-block"
                  style={{ color, textShadow:`0 2px 10px ${color}55` }}
                  variants={{
                    hidden:  { opacity: 0, y: -14, scale: 0.85 },
                    visible: { opacity: 1, y: 0,   scale: 1, transition: LETTER_SPRING },
                  }}
                >
                  <span className="inline-block" style={{ animation:`topbarLetterFloat ${floatDur} ease-in-out infinite` }}>
                    {char}
                  </span>
                </motion.span>
              );
            })}
          </span>
        ))}
        {/* Étoiles droite */}
        <span className="portail-topbar-fun-stars text-[22px] inline-block" style={{ animation:'topbarStarSpin 5s linear infinite' }}>⭐</span>
        <span className="portail-topbar-fun-stars text-lg inline-block" style={{ animation:'topbarBubble 3s ease-in-out 0.8s infinite' }}>✨</span>
      </motion.span>
    </>
  );
}

const PAGE_TITLES = {
  '/portail':                  'Mes Modules',
  '/portail/devoirs':          'Mes devoirs',
  '/portail/resultats':        'Mes résultats',
  '/portail/observations':     'Mes observations',
  '/portail/messages':         'Messages',
};

export default function PortailApp() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('portail_theme');
    return saved ? saved === 'dark' : false;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newDevoirsCount, setNewDevoirsCount] = useState(0);
  const [newNotesCount, setNewNotesCount] = useState(0);
  const [newObsCount, setNewObsCount] = useState(0);
  const classeIdRef = useRef(null);

  useEffect(() => {
    document.body.style.background = darkMode ? '#000' : 'linear-gradient(160deg, #ffffff 0%, #e4e8ed 100%)';
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('portail_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Garde auth (vérification côté serveur)
  useEffect(() => {
    const user = (() => { try { return JSON.parse(sessionStorage.getItem('eleve_user')); } catch { return null; } })();
    if (!user?.id) { navigate('/portail/login'); return; }
    verifyEleveSession(user.id).then(valid => {
      if (!valid) { sessionStorage.clear(); navigate('/portail/login'); }
    }).catch(() => { sessionStorage.clear(); navigate('/portail/login'); });
  }, [navigate]);

  // ─── Tracking de session ────────────────────────────────────────────
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;

    let sessionId = null;

    startSession(user.id).then(sid => {
      if (!sid) return;
      sessionId = sid;
      sessionStorage.setItem('portail_session_id', sid);
    });

    const hbInterval = setInterval(() => {
      const sid = sessionId || sessionStorage.getItem('portail_session_id');
      if (sid) heartbeatSession(sid);
    }, 120_000);

    const handleUnload = () => {
      const sid = sessionId || sessionStorage.getItem('portail_session_id');
      if (sid) endSession(sid);
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(hbInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []); // une seule fois au montage

  // ─── Badges consolidés — 1 seul poll toutes les 30s au lieu de 4 ───
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;

    const epoch = new Date(0).toISOString();

    const refreshAll = async () => {
      const seenDates = {
        devoirs: localStorage.getItem(`devoirs_seen_at_${user.id}`) || epoch,
        notes:   localStorage.getItem(`notes_seen_at_${user.id}`)   || epoch,
        obs:     localStorage.getItem(`obs_seen_at_${user.id}`)     || epoch,
      };
      const cid = classeIdRef.current || user.classe_id || null;
      const counts = await fetchAllBadgeCounts(user.id, cid, seenDates).catch(() => null);
      if (!counts) return;
      if (counts.classeId) classeIdRef.current = counts.classeId;
      setUnreadCount(counts.unread);
      setNewDevoirsCount(counts.devoirs);
      setNewNotesCount(counts.notes);
      setNewObsCount(counts.obs);
    };

    refreshAll();
    const t = setInterval(refreshAll, 30_000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = async () => {
    const sid = sessionStorage.getItem('portail_session_id');
    if (sid) {
      sessionStorage.removeItem('portail_session_id');
      await endSession(sid);
    }
    logoutEleve();
    navigate('/portail/login');
  };

  const user = getEleveUser();
  const fmtPrenom = (s) => s ? s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase() : s;
  const fmtNom    = (s) => s ? s.trim().toUpperCase() : s;
  const userName = `${fmtPrenom(user?.prenom || '')} ${fmtNom(user?.nom || '')}`.trim() || 'Élève';
  const userIdentifiant = user?.identifiant ? user.identifiant.toUpperCase() : '';

  // Titre dynamique
  const currentTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.includes('/lecon/') ? 'Mon cours' :
     location.pathname.includes('/thematique/') ? 'Mes Leçons' :
     location.pathname.startsWith('/portail/module/') ? 'Mes Thématiques' :
     'Mon cours');

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className={`portail-root portail-layout${darkMode ? '' : ' portail-light'}`}>
      {/* Lettres arabes de fond */}
      <div className="portail-bg-letters" aria-hidden="true">
        {BG_LETTERS.map((l, i) => (
          <span key={i} className="portail-bg-letter"
            data-anim={l.anim}
            style={{ top:l.top, left:l.left, fontSize:l.size, color:l.color,
                     '--dur':l.dur, '--delay':l.delay }}>
            {l.l}
          </span>
        ))}
      </div>
      {/* Overlay mobile */}
      <div
        className={`portail-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`portail-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="portail-sidebar-brand">
          <div className="flex items-center gap-2.5">
            <img src="/logo-eleve.png" alt="Logo" className="h-[50px] w-auto object-contain" />
            <span className="arabic flex flex-col w-full leading-[1.4]">
              <span>Institut As-Safaa</span>
              <span className="text-right">الصفاء</span>
            </span>
          </div>
          <span className="label">Portail Élève</span>
        </div>

        <nav className="portail-nav">
          <div className="portail-nav-section">Navigation</div>

          <NavLink
            to="/portail" end
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="text-lg">📚</span> Mes Modules
          </NavLink>

          <NavLink
            to="/portail/devoirs"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => {
              setSidebarOpen(false);
              // Marquer comme vus
              const user = getEleveUser();
              if (user?.id) localStorage.setItem(`devoirs_seen_at_${user.id}`, new Date().toISOString());
              setNewDevoirsCount(0);
            }}
          >
            <span className="text-lg">📝</span> Mes devoirs
            {newDevoirsCount > 0 && (
              <span className="portail-nav-badge">{newDevoirsCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/portail/resultats"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => {
              setSidebarOpen(false);
              const user = getEleveUser();
              if (user?.id) localStorage.setItem(`notes_seen_at_${user.id}`, new Date().toISOString());
              setNewNotesCount(0);
            }}
          >
            <span className="text-lg">📊</span> Mes résultats
            {newNotesCount > 0 && (
              <span className="portail-nav-badge">{newNotesCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/portail/observations"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => {
              setSidebarOpen(false);
              const user = getEleveUser();
              if (user?.id) localStorage.setItem(`obs_seen_at_${user.id}`, new Date().toISOString());
              setNewObsCount(0);
            }}
          >
            <span className="text-lg">👁️</span> Mes observations
            {newObsCount > 0 && (
              <span className="portail-nav-badge">{newObsCount}</span>
            )}
          </NavLink>

          <NavLink
            to="/portail/messages"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => { setSidebarOpen(false); setUnreadCount(0); }}
          >
            <span className="text-lg">💬</span> Messages
            {unreadCount > 0 && (
              <span className="portail-nav-badge">{unreadCount}</span>
            )}
          </NavLink>

          <div className="portail-nav-section mt-6">Ressources</div>
          <a href="https://www.mon-kitabi.fr/kitabis/" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            Voir mon livre interactif
          </a>
          <a href="https://fr.muqri.com/" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l2 2 4-4"/>
            </svg>
            Al - Muqri
          </a>
          <a href="https://us05web.zoom.us/j/86234248993?pwd=KMayngoYNo4AgejJFVVnw9zGHbMu2T.1" className="portail-nav-link" target="_blank" rel="noreferrer" onClick={() => setSidebarOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 10l4.553-2.07A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.916L15 14"/><rect x="3" y="7" width="12" height="10" rx="2"/>
            </svg>
            Mon ZOOM
          </a>
        </nav>

        <div className="portail-sidebar-footer">
          <div className="portail-sidebar-user">
            <strong>{userName}</strong>
            <span>ID : {userIdentifiant}</span>
          </div>
          <button className="portail-logout-btn" onClick={handleLogout}>
            <span className="text-sm">🚪</span> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="portail-main">
        <header className="portail-topbar">
          <div className="portail-topbar-left">
            <button className="portail-hamburger" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <TopbarFunTitle key={currentTitle} title={currentTitle} emoji={getPageEmoji(location.pathname)} />
          </div>
          <div className="portail-topbar-right">
            <button className="portail-theme-toggle" onClick={() => setDarkMode(d => !d)}>
              {darkMode ? '☀' : '☾'}
            </button>
            <span className="portail-topbar-date">{today}</span>
          </div>
        </header>
        <div className="portail-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
