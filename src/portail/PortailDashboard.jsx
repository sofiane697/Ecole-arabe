import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { fetchModulesEleve, fetchEleveNiveauScolaireId } from './supabasePortail';
import { coverImgStyle, isSafeCoverUrl } from '../shared/imageCrop';

// Variable module-level : reset au refresh de page, persiste lors de la navigation React Router
let _salamHasAnimated = false;


const CARD_PASTELS = [
  { bg:'#DAEEFF', btnGrad:'linear-gradient(135deg,#7EC8E3,#5BA8D4)', btnShadow:'rgba(91,168,212,0.3)' },
  { bg:'#D5F5E3', btnGrad:'linear-gradient(135deg,#7DCFA0,#5BA87A)', btnShadow:'rgba(91,168,122,0.3)' },
  { bg:'#FADBD8', btnGrad:'linear-gradient(135deg,#F4A896,#E8806D)', btnShadow:'rgba(232,128,109,0.3)' },
  { bg:'#FEF9E7', btnGrad:'linear-gradient(135deg,#F7D070,#F0B429)', btnShadow:'rgba(240,180,41,0.3)' },
];

const S = {
  empty: 'text-center px-5 py-[60px] text-p-fg-mid',
  emptyTitle: 'font-[var(--p-font-display)] text-xl font-semibold text-p-fg mb-2',
  loading: 'text-center p-[60px] text-p-fg-mid text-sm',
  welcome: { paddingBottom: 40, marginBottom: 8 },
  welcomeSub: { fontSize: 15, color: 'var(--p-fg-mid)', marginTop: 14 },
};

function SalamGreeting({ prenom }) {
  const ref = useRef(null);
  const [shouldAnimate] = useState(() => {
    if (_salamHasAnimated) return false;
    _salamHasAnimated = true;
    return true;
  });

  useEffect(() => {
    if (!shouldAnimate || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: -16, filter: 'blur(4px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.75, delay: 0.05, ease: 'power2.out' }
      );
    }, ref);
    return () => ctx.revert();
  }, [shouldAnimate]);

  return (
    <div
      ref={ref}
      style={{ display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap', overflow:'hidden' }}
    >
      {prenom && (
        <span style={{ fontFamily:'var(--p-font-display)', fontSize:34, fontWeight:800, color:'var(--p-fg)', lineHeight:1.2 }}>
          {prenom}
        </span>
      )}
      <span style={{ fontFamily:"'Scheherazade New', serif", fontSize:40, fontWeight:700, color:'#5BA87A', lineHeight:1.3, direction:'rtl' }}>
        السلام عليكم
      </span>
      <span style={{ fontSize:30 }}>👋</span>
    </div>
  );
};

export default function PortailDashboard() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let eleveId, niveauScolaireId;
        try {
          const user = JSON.parse(sessionStorage.getItem('eleve_user'));
          eleveId = user?.id;
          niveauScolaireId = user?.niveau_scolaire_id ?? null;
        } catch {}
        if (eleveId) {
          const freshId = await fetchEleveNiveauScolaireId(eleveId).catch(() => niveauScolaireId);
          if (freshId !== niveauScolaireId) {
            niveauScolaireId = freshId;
            try {
              const user = JSON.parse(sessionStorage.getItem('eleve_user'));
              if (user) { user.niveau_scolaire_id = freshId; sessionStorage.setItem('eleve_user', JSON.stringify(user)); }
            } catch {}
          }
        }
        const allMods = await fetchModulesEleve();
        const mods = allMods.filter(m => {
          if (!Array.isArray(m.niveaux_scolaires_ids) || m.niveaux_scolaires_ids.length === 0) return false;
          if (!niveauScolaireId) return false;
          return m.niveaux_scolaires_ids.includes(niveauScolaireId);
        });
        if (cancelled) return;
        setModules(mods);
      } catch(e) {}
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || modules.length === 0 || !gridRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(gridRef.current.children, {
        opacity: 0, y: 18, duration: 0.35, stagger: 0.07, delay: 0.05, ease: 'power2.out',
      });
    }, gridRef);
    return () => ctx.revert();
  }, [loading, modules.length]);

  if (loading) return <div className={S.loading}>Chargement de vos cours...</div>;

  // Récupérer le prénom
  let prenom = '';
  try { prenom = (JSON.parse(sessionStorage.getItem('eleve_user'))?.prenom || '').trim().toUpperCase(); } catch {}

  return (
    <div>
      <div style={S.welcome}>
        <SalamGreeting prenom={prenom} />
        <div style={S.welcomeSub}>Démarre ton apprentissage en sélectionnant un module !</div>
      </div>

      {modules.length === 0 ? (
        (() => {
          let _niveauScolaireId = null;
          try { _niveauScolaireId = JSON.parse(sessionStorage.getItem('eleve_user'))?.niveau_scolaire_id; } catch {}
          if (!_niveauScolaireId) {
            return (
              <div className={S.empty}>
                <div className="text-5xl mb-4">⚙️</div>
                <div className={S.emptyTitle}>Profil en cours de configuration</div>
                <p className="text-p-fg-mid text-sm max-w-[340px] mx-auto">
                  Ton niveau scolaire n'a pas encore été assigné. Contacte ton enseignant pour qu'il configure ton profil.
                </p>
              </div>
            );
          }
          return (
            <div className={S.empty}>
              <div className="text-5xl mb-4">📚</div>
              <div className={S.emptyTitle}>Aucun cours disponible</div>
              <p className="text-p-fg-mid text-sm">Les cours seront bientôt disponibles. Revenez plus tard !</p>
            </div>
          );
        })()
      ) : (
        <div
          ref={gridRef}
          className="portail-modules-grid"
          style={{ '--grid-cols': Math.min(modules.length, 4) }}
        >
          {modules.map((m, index) => {
            const palette = CARD_PASTELS[index % CARD_PASTELS.length];

            return (
              <div key={m.id}
                className="portail-module-card"
                style={{ background: palette.bg, cursor: 'pointer', transition: 'transform .25s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                onClick={() => navigate(`/portail/module/${m.id}`)}>
                {isSafeCoverUrl(m.image_url) ? (
                  <img
                    src={m.image_url}
                    alt={m.titre}
                    className="portail-module-card-img"
                    style={coverImgStyle(m)}
                  />
                ) : (
                  <div className="portail-module-card-img-placeholder" style={{ background: palette.bg }}>
                    📖
                  </div>
                )}
                <div className="portail-module-card-body">
                  <h3 className="portail-module-card-title">{m.titre}</h3>
                  {m.description && <p className="portail-module-card-desc">{m.description}</p>}
                  <button
                    className="portail-module-card-btn"
                    style={{ background: palette.btnGrad, boxShadow: `0 4px 14px ${palette.btnShadow}`, transition: 'transform .15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                    onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
                    onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}>
                    Commencer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
