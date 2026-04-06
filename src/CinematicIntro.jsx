import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

// ─── Dimensions ───────────────────────────────────────────────────────────────
const W = 260;   // largeur livre
const H = 350;   // hauteur livre
const D = 48;    // épaisseur dos

// ─── SVG ornement coin ────────────────────────────────────────────────────────
const Corner = ({ style }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={style}>
    <path d="M3 3 L16 3" stroke="#c9963a" strokeWidth="1.2" opacity="0.8"/>
    <path d="M3 3 L3 16" stroke="#c9963a" strokeWidth="1.2" opacity="0.8"/>
    <circle cx="3" cy="3" r="2" fill="#c9963a" opacity="0.6"/>
    <path d="M7 7 L12 7 L12 8.2 L8.2 8.2 L8.2 12 L7 12 Z" fill="#c9963a" opacity="0.35"/>
    <circle cx="14" cy="14" r="1" fill="#c9963a" opacity="0.2"/>
  </svg>
);

// ─── SVG séparateur ornemental ────────────────────────────────────────────────
const Divider = ({ w = 110, opacity = 1 }) => (
  <svg width={w} height="14" viewBox={`0 0 ${w} 14`} fill="none" style={{ opacity }}>
    <line x1="0" y1="7" x2={w * 0.38} y2="7" stroke="#c9963a" strokeWidth="0.6" opacity="0.55"/>
    <polygon points={`${w*0.43},7 ${w*0.47},4 ${w*0.5},7 ${w*0.47},10`} fill="#c9963a" opacity="0.65"/>
    <circle cx={w*0.5} cy="7" r="1.8" fill="#c9963a" opacity="0.9"/>
    <polygon points={`${w*0.5},7 ${w*0.53},4 ${w*0.57},7 ${w*0.53},10`} fill="#c9963a" opacity="0.65"/>
    <line x1={w*0.62} y1="7" x2={w} y2="7" stroke="#c9963a" strokeWidth="0.6" opacity="0.55"/>
  </svg>
);

// ─── Particules flottantes ────────────────────────────────────────────────────
const Dust = () => (
  <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}
       viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
    {[
      [160,220,1.1,'9s','0s'],[340,410,0.7,'13s','2s'],[760,160,1.4,'11s','1s'],
      [840,350,0.8,'10s','3.2s'],[110,560,0.9,'12s','0.6s'],[610,500,0.6,'14s','4s'],
      [470,90,1.2,'8s','1.8s'],[890,580,0.8,'11s','2.8s'],[250,640,0.7,'15s','0.9s'],
      [720,260,1.0,'9s','3.6s'],[55,340,0.5,'13s','1.2s'],[550,160,1.3,'10s','0.4s'],
    ].map(([cx,cy,r,dur,delay],i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#c9963a" opacity="0">
        <animate attributeName="opacity" values="0;0.3;0" dur={dur} begin={delay} repeatCount="indefinite"/>
        <animate attributeName="cy" values={`${cy};${cy-50};${cy}`} dur={dur} begin={delay} repeatCount="indefinite"/>
      </circle>
    ))}
  </svg>
);

// ═════════════════════════════════════════════════════════════════════════════
export default function CinematicIntro({ onComplete }) {
  const sceneRef   = useRef(null);
  const wrapperRef = useRef(null);
  const coverRef   = useRef(null);
  const glowRef    = useRef(null);
  const overlayRef = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    gsap.set(wrapperRef.current, { scale: 0.58 });
    gsap.set(coverRef.current,   { rotateY: 0, transformOrigin: 'left center' });
    gsap.set(glowRef.current,    { opacity: 0, scale: 0.6 });
    gsap.set(overlayRef.current, { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.4, onComplete: () => { setDone(true); onComplete?.(); } });

    tl
      // 1. Zoom cinématique vers le livre
      .to(wrapperRef.current, {
        scale: 1.45,
        duration: 2.5,
        ease: 'power2.inOut',
      })
      // 2. Lueur pré-ouverture
      .to(glowRef.current, {
        opacity: 1, scale: 1.6,
        duration: 0.9, ease: 'power2.out',
      }, '-=0.7')
      // 3. Couverture s'ouvre
      .to(coverRef.current, {
        rotateY: -175,
        duration: 1.8,
        ease: 'power3.inOut',
      }, '-=0.5')
      // 4. Lueur s'efface
      .to(glowRef.current, {
        opacity: 0, duration: 0.7, ease: 'power2.in',
      }, '-=1.1')
      // 5. Pause (contempler les pages ouvertes)
      // 6. PLONGEON dans le livre : zoom agressif vers les pages
      .to(wrapperRef.current, {
        scale: 26,
        duration: 1.5,
        ease: 'power4.in',
      }, '+=0.45')
      // 7. Fondu crème qui commence pendant le plongeon
      .to(overlayRef.current, {
        opacity: 1,
        duration: 1.1,
        ease: 'power2.in',
      }, '-=1.05');

    return () => tl.kill();
  }, []); // eslint-disable-line

  if (done) return null;

  // ─── Pages intérieures ────────────────────────────────────────────────────
  const innerW = W - D / 2 - 6;
  const innerH = H - 10;

  return (
    <div ref={sceneRef} style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'#16100400',
      display:'flex', alignItems:'center', justifyContent:'center',
      perspective:'1200px', perspectiveOrigin:'50% 46%',
      overflow:'hidden',
    }}>
      {/* ── Fond sombre ── */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 90% 90% at 50% 50%, #221608 0%, #100b03 60%, #080501 100%)',
      }}/>

      {/* ── Vignette bords ── */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        background:'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 25%, rgba(0,0,0,0.75) 100%)',
      }}/>

      {/* ── Particules ── */}
      <Dust />

      {/* ── Halo bas ambiance ── */}
      <div style={{
        position:'absolute', bottom:'-8%', left:'50%', transform:'translateX(-50%)',
        width:700, height:180, pointerEvents:'none',
        background:'radial-gradient(ellipse, rgba(201,150,58,0.06) 0%, transparent 70%)',
      }}/>

      {/* ── Lueur ouverture ── */}
      <div ref={glowRef} style={{
        position:'absolute', width:380, height:380, borderRadius:'50%', pointerEvents:'none',
        background:'radial-gradient(circle, rgba(201,150,58,0.28) 0%, rgba(201,150,58,0.06) 45%, transparent 70%)',
      }}/>

      {/* ══ WRAPPER SCALÉ ═════════════════════════════════════════════════════ */}
      <div ref={wrapperRef} style={{ transformStyle:'preserve-3d', position:'relative' }}>

        {/* ── Ombre portée sous le livre ── */}
        <div style={{
          position:'absolute',
          bottom: -30, left: '10%',
          width: '80%', height: 24,
          background:'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 80%)',
          filter:'blur(6px)',
          transform:'rotateX(90deg) translateZ(-12px)',
          pointerEvents:'none',
        }}/>

        {/* ══ LIVRE 3D ══════════════════════════════════════════════════════════ */}
        <div style={{
          position:'relative', width:W, height:H,
          transformStyle:'preserve-3d',
          transform:'rotateY(-26deg) rotateX(9deg)',
        }}>

          {/* ── DOS (spine) ─────────────────────────────────────────────────── */}
          <div style={{
            position:'absolute', top:0, left: -D,
            width:D, height:H,
            transformOrigin:'right center',
            transform:'rotateY(-90deg)',
            background:'linear-gradient(90deg, #0f0a03 0%, #1e1509 15%, #2e200e 35%, #3a2a12 50%, #2e200e 65%, #1e1509 85%, #0f0a03 100%)',
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:8,
            boxShadow:'inset 4px 0 10px rgba(0,0,0,0.8), inset -2px 0 6px rgba(201,150,58,0.06)',
            borderLeft:'1px solid rgba(201,150,58,0.12)',
            borderRight:'1px solid rgba(201,150,58,0.25)',
          }}>
            {/* Ligne dorée haute */}
            <div style={{ width:1, height:16, background:'linear-gradient(180deg,transparent,#c9963a,transparent)', opacity:0.5 }}/>
            {/* Titre vertical */}
            <span style={{
              writingMode:'vertical-rl', transform:'rotate(180deg)',
              color:'#c9963a', fontSize:13,
              fontFamily:'"Times New Roman","Noto Naskh Arabic",Georgia,serif',
              letterSpacing:7, opacity:0.88,
              textShadow:'0 0 14px rgba(201,150,58,0.5)',
            }}>رقيب</span>
            {/* Ligne dorée basse */}
            <div style={{ width:1, height:16, background:'linear-gradient(180deg,transparent,#c9963a,transparent)', opacity:0.5 }}/>
          </div>

          {/* ── TRANCHE DROITE — pages empilées ─────────────────────────────── */}
          <div style={{
            position:'absolute', top:0, left:W,
            width:D, height:H,
            transformOrigin:'left center',
            transform:'rotateY(90deg)',
            overflow:'hidden',
            background:'linear-gradient(90deg, #b8a888, #ddd0b4, #ede0c6, #ddd0b4, #c8bca0)',
            boxShadow:'inset 4px 0 8px rgba(0,0,0,0.2)',
          }}>
            {/* Lignes pages */}
            {Array.from({ length: 34 }, (_, i) => (
              <div key={i} style={{
                position:'absolute', left:0, right:0,
                top: 1 + i * 10, height:1,
                background: i % 5 === 0
                  ? 'rgba(0,0,0,0.09)'
                  : 'rgba(0,0,0,0.04)',
              }}/>
            ))}
            {/* Ombre gauche (profondeur) */}
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(90deg, rgba(0,0,0,0.25) 0%, transparent 40%)',
            }}/>
          </div>

          {/* ── PLAT DE FOND ────────────────────────────────────────────────── */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(135deg, #1a1106, #120d04)',
            transform:'translateZ(-1px)',
          }}/>

          {/* ── PAGES INTÉRIEURES (révélées à l'ouverture) ──────────────────── */}
          <div style={{
            position:'absolute', top:5, left: D/2 + 2,
            width:innerW, height:innerH,
            background:'linear-gradient(155deg, #fef8ea 0%, #f6e9cc 45%, #eedec0 80%, #e8d5b4 100%)',
            transform:'translateZ(2px)',
            display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            gap:12, overflow:'hidden',
          }}>
            {/* Texture papier */}
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none', opacity:0.35,
              backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(0,0,0,0.025) 18px,rgba(0,0,0,0.025) 19px)`,
            }}/>
            {/* Marge intérieure légère */}
            <div style={{ position:'absolute', inset:12, border:'0.5px solid rgba(184,134,46,0.2)', pointerEvents:'none' }}/>

            <Divider w={100} opacity={0.8}/>

            {/* Titre arabe intérieur */}
            <div style={{
              color:'#9a6e1e', fontSize:60,
              fontFamily:'"Times New Roman","Noto Naskh Arabic",Georgia,serif',
              lineHeight:1.1, position:'relative', zIndex:1,
              textShadow:'0 1px 8px rgba(154,110,30,0.2)',
            }}>رقيب</div>

            <div style={{
              color:'#b8862e', fontSize:9, letterSpacing:10, marginLeft:10,
              fontFamily:'"Times New Roman",Georgia,serif', opacity:0.8,
            }}>RAQIB</div>

            <Divider w={100} opacity={0.8}/>

            <div style={{
              position:'absolute', bottom:14,
              color:'#b8862e', fontSize:7, letterSpacing:5,
              fontFamily:'serif', opacity:0.45,
            }}>ÉCOLE ARABE</div>
          </div>

          {/* ══ COUVERTURE (animée GSAP) ═══════════════════════════════════════ */}
          <div ref={coverRef} style={{
            position:'absolute', top:0, left:0, width:W, height:H,
            transformStyle:'preserve-3d',
          }}>

            {/* — Face extérieure — */}
            <div style={{
              position:'absolute', inset:0,
              backfaceVisibility:'hidden',
              transform:'translateZ(3px)',
              background:'linear-gradient(148deg, #2e2210 0%, #3e2e18 18%, #2c1f0d 40%, #3a2912 62%, #251c0a 85%, #1c1407 100%)',
              overflow:'hidden',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14,
            }}>
              {/* Reflet cuir */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none',
                background:'radial-gradient(ellipse 70% 55% at 35% 30%, rgba(255,200,100,0.07) 0%, transparent 65%)',
              }}/>
              {/* Grain texture */}
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none', opacity:0.12,
                backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='3' height='3'%3E%3Crect width='3' height='3' fill='%23000'/%3E%3Crect x='0' y='0' width='1' height='1' fill='%23fff' opacity='.08'/%3E%3C/svg%3E")`,
              }}/>

              {/* Double encadrement doré */}
              <div style={{ position:'absolute', inset:14, border:'1px solid rgba(201,150,58,0.4)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', inset:19, border:'0.5px solid rgba(201,150,58,0.18)', pointerEvents:'none' }}/>

              {/* Coins ornementaux */}
              <Corner style={{ position:'absolute', top:6,  left:6 }} />
              <Corner style={{ position:'absolute', top:6,  right:6,  transform:'scaleX(-1)' }} />
              <Corner style={{ position:'absolute', bottom:6, left:6,  transform:'scaleY(-1)' }} />
              <Corner style={{ position:'absolute', bottom:6, right:6, transform:'scale(-1,-1)' }} />

              {/* Filet horizontal haut */}
              <div style={{
                position:'absolute', top:36, left:28, right:28, height:1,
                background:'linear-gradient(90deg,transparent,rgba(201,150,58,0.3),transparent)',
              }}/>

              {/* Bismillah */}
              <div style={{
                position:'absolute', top:42, left:0, right:0, textAlign:'center',
                color:'#c9963a', fontSize:12,
                fontFamily:'"Times New Roman","Noto Naskh Arabic",serif',
                opacity:0.5, letterSpacing:1,
              }}>﷽</div>

              {/* Titre arabe couverture */}
              <div style={{
                color:'#c9963a', fontSize:70,
                fontFamily:'"Times New Roman","Noto Naskh Arabic",Georgia,serif',
                lineHeight:1, position:'relative', zIndex:1,
                textShadow:'0 0 50px rgba(201,150,58,0.35), 0 3px 10px rgba(0,0,0,0.8)',
              }}>رقيب</div>

              <Divider w={120}/>

              {/* Titre latin */}
              <div style={{
                color:'rgba(201,150,58,0.6)', fontSize:9, letterSpacing:9, marginLeft:9,
                fontFamily:'"Times New Roman",Georgia,serif',
              }}>RAQIB</div>

              {/* Filet horizontal bas */}
              <div style={{
                position:'absolute', bottom:36, left:28, right:28, height:1,
                background:'linear-gradient(90deg,transparent,rgba(201,150,58,0.3),transparent)',
              }}/>

              {/* Bas de page */}
              <div style={{
                position:'absolute', bottom:20, left:0, right:0, textAlign:'center',
                color:'rgba(201,150,58,0.38)', fontSize:7, letterSpacing:4,
                fontFamily:'"Times New Roman",serif',
              }}>ÉCOLE ARABE</div>
            </div>

            {/* — Face intérieure couverture — */}
            <div style={{
              position:'absolute', inset:0,
              backfaceVisibility:'hidden',
              transform:'rotateY(180deg) translateZ(3px)',
              background:'linear-gradient(135deg, #fdf6e4 0%, #eddfbe 100%)',
            }}/>
          </div>
          {/* ══ FIN COUVERTURE ═══════════════════════════════════════════════ */}

        </div>
        {/* ── Fin livre ─────────────────────────────────────────────────────── */}

      </div>
      {/* ══ Fin wrapper ════════════════════════════════════════════════════════ */}

      {/* ── Overlay fondu crème final ── */}
      <div ref={overlayRef} style={{
        position:'fixed', inset:0,
        background:'#fdf8f2',
        pointerEvents:'none',
      }}/>
    </div>
  );
}
