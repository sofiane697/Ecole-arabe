import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import PORTAIL_STYLES from './portailStyles';
import { logoutEleve, getEleveUser, fetchUnreadCountEleve, fetchClasseIdEleve, fetchNewDevoirsCount, fetchNewNotesCount, fetchNewObsCount } from './supabasePortail';

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
@keyframes topbarLetterIn {
  0%   { opacity:0; transform:translateY(-14px) scale(0.85); }
  60%  { transform:translateY(3px) scale(1.05); }
  80%  { transform:translateY(-1px) scale(0.98); }
  100% { opacity:1; transform:translateY(0) scale(1); }
}
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
      <span className="portail-topbar-fun-title" style={{
        display:'inline-flex', alignItems:'center', gap:8,
        fontFamily:"'Nunito','Inter',sans-serif",
        fontSize:40, fontWeight:900,
      }}>
        {/* Emoji gauche */}
        <span style={{ fontSize:28, display:'inline-block', animation:'topbarBubble 2.5s ease-in-out infinite' }}>{emoji}</span>
        {/* Lettres animées */}
        {title.split(' ').map((word, wi) => (
          <span key={wi} style={{ display:'inline-flex', gap:0 }}>
            {word.split('').map((char) => {
              const color = FUN_COLORS[ci % FUN_COLORS.length];
              const delay = `${ci * 0.04}s`;
              ci++;
              return (
                <span key={ci} style={{
                  color,
                  textShadow:`0 2px 10px ${color}55`,
                  display:'inline-block',
                  animation:`topbarLetterIn 0.5s cubic-bezier(0.22,1,0.36,1) ${delay} both, topbarLetterFloat ${2.2 + (ci % 3) * 0.4}s ease-in-out ${delay} infinite`,
                }}>{char}</span>
              );
            })}
          </span>
        ))}
        {/* Étoiles droite */}
        <span className="portail-topbar-fun-stars" style={{ fontSize:22, display:'inline-block', animation:'topbarStarSpin 5s linear infinite' }}>⭐</span>
        <span className="portail-topbar-fun-stars" style={{ fontSize:18, display:'inline-block', animation:'topbarBubble 3s ease-in-out 0.8s infinite' }}>✨</span>
      </span>
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

  useLayoutEffect(() => {
    const id = 'portail-styles';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = PORTAIL_STYLES;
      document.head.appendChild(style);
    }
    document.body.style.background = darkMode ? '#000' : 'linear-gradient(160deg, #ffffff 0%, #e4e8ed 100%)';
    return () => { document.body.style.background = ''; };
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('portail_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Garde auth
  useEffect(() => {
    if (!sessionStorage.getItem('eleve_user')) {
      navigate('/portail/login');
    }
  }, [navigate]);

  // Badge messages non-lus — poll toutes les 30s
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;
    const refresh = () => fetchUnreadCountEleve(user.id).then(setUnreadCount).catch(() => {});
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  // Badge devoirs non-vus — poll toutes les 30s
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;
    const seenKey = `devoirs_seen_at_${user.id}`;

    const refreshDevoirs = async () => {
      try {
        let cid = classeIdRef.current;
        if (!cid) {
          cid = user.classe_id || await fetchClasseIdEleve(user.id);
          classeIdRef.current = cid;
        }
        if (!cid) return;
        const seenAt = localStorage.getItem(seenKey) || new Date(0).toISOString();
        const count = await fetchNewDevoirsCount(cid, seenAt);
        setNewDevoirsCount(count);
      } catch {}
    };

    refreshDevoirs();
    const t = setInterval(refreshDevoirs, 30000);
    return () => clearInterval(t);
  }, []);

  // Badge notes non-vues — poll toutes les 30s
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;
    const seenKey = `notes_seen_at_${user.id}`;
    const refresh = async () => {
      try {
        const seenAt = localStorage.getItem(seenKey) || new Date(0).toISOString();
        const count = await fetchNewNotesCount(user.id, seenAt);
        setNewNotesCount(count);
      } catch {}
    };
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  // Badge observations non-vues — poll toutes les 30s
  useEffect(() => {
    const user = getEleveUser();
    if (!user?.id) return;
    const seenKey = `obs_seen_at_${user.id}`;
    const refresh = async () => {
      try {
        const seenAt = localStorage.getItem(seenKey) || new Date(0).toISOString();
        const count = await fetchNewObsCount(user.id, seenAt);
        setNewObsCount(count);
      } catch {}
    };
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  const handleLogout = () => {
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
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <img src="/logo-eleve.png" alt="Logo" style={{ height:50, width:'auto', objectFit:'contain' }} />
            <span className="arabic">رقيب — RAQIB</span>
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
            <span style={{fontSize:18}}>📚</span> Mes Modules
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
            style={{ position:'relative' }}
          >
            <span style={{fontSize:18}}>📝</span> Mes devoirs
            {newDevoirsCount > 0 && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                {newDevoirsCount}
              </span>
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
            style={{ position:'relative' }}
          >
            <span style={{fontSize:18}}>📊</span> Mes résultats
            {newNotesCount > 0 && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                {newNotesCount}
              </span>
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
            style={{ position:'relative' }}
          >
            <span style={{fontSize:18}}>👁️</span> Mes observations
            {newObsCount > 0 && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                {newObsCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/portail/messages"
            className={({ isActive }) => 'portail-nav-link' + (isActive ? ' active' : '')}
            onClick={() => { setSidebarOpen(false); setUnreadCount(0); }}
            style={{ position:'relative' }}
          >
            <span style={{fontSize:18}}>💬</span> Messages
            {unreadCount > 0 && (
              <span style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'var(--p-gold)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>
                {unreadCount}
              </span>
            )}
          </NavLink>

          <div className="portail-nav-section" style={{ marginTop: '1.5rem' }}>Ressources</div>
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
            <span style={{fontSize:14}}>🚪</span> Se déconnecter
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
          <Outlet />
        </div>
      </main>
    </div>
  );
}
