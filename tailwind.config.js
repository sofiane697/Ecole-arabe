/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      /* ─── Couleurs mappées sur les CSS variables existantes ─── */
      colors: {
        /* Portail élève (--p-*) */
        'p-bg':       'var(--p-bg)',
        'p-bg-card':  'var(--p-bg-card)',
        'p-bg-hover': 'var(--p-bg-hover)',
        'p-bg-input': 'var(--p-bg-input)',
        'p-border':   'var(--p-border)',
        'p-gold':     'var(--p-gold)',
        'p-gold-l':   'var(--p-gold-l)',
        'p-fg':       'var(--p-fg)',
        'p-fg-mid':   'var(--p-fg-mid)',
        'p-fg-light': 'var(--p-fg-light)',
        'p-green':    'var(--p-green)',
        'p-blue':     'var(--p-blue)',
        'p-red':      'var(--p-red)',
        'p-yellow':   'var(--p-yellow)',

        /* Admin / Enseignant (--a-*) */
        'a-bg':       'var(--a-bg)',
        'a-bg-card':  'var(--a-bg-card)',
        'a-bg-hover': 'var(--a-bg-hover)',
        'a-bg-input': 'var(--a-bg-input)',
        'a-border':   'var(--a-border)',
        'a-gold':     'var(--a-gold)',
        'a-gold-l':   'var(--a-gold-l)',
        'a-fg':       'var(--a-fg)',
        'a-fg-mid':   'var(--a-fg-mid)',
        'a-fg-light': 'var(--a-fg-light)',
        'a-green':    'var(--a-green)',
        'a-blue':     'var(--a-blue)',
        'a-red':      'var(--a-red)',
        'a-yellow':   'var(--a-yellow)',

        /* Site public (sans préfixe) */
        'site-bg':        'var(--bg)',
        'site-bg-alt':    'var(--bg-alt)',
        'site-bg-card':   'var(--bg-card)',
        'site-fg':        'var(--fg)',
        'site-fg-title':  'var(--fg-title)',
        'site-fg-mid':    'var(--fg-mid)',
        'site-fg-light':  'var(--fg-light)',
        'site-gold':      'var(--gold)',
        'site-gold-l':    'var(--gold-light)',
        'site-gold-soft': 'var(--gold-soft)',
        'site-border':    'var(--border)',
      },

      /* ─── Ombres ─── */
      boxShadow: {
        'p-sm':   'var(--p-shadow-sm)',
        'p-md':   'var(--p-shadow-md)',
        'p-lg':   'var(--p-shadow-lg)',
        'p-gold': 'var(--p-shadow-gold)',
        'a-sm':   'var(--a-shadow-sm)',
        'a-md':   'var(--a-shadow-md)',
        'a-lg':   'var(--a-shadow-lg)',
        'a-gold': 'var(--a-shadow-gold)',
        'site-sm': 'var(--shadow-sm)',
        'site-md': 'var(--shadow-md)',
        'site-lg': 'var(--shadow-lg)',
        'site-xl': 'var(--shadow-xl)',
      },

      /* ─── Border radius ─── */
      borderRadius: {
        'p':      'var(--p-radius)',
        'p-sm':   'var(--p-radius-sm)',
        'a':      'var(--a-radius)',
        'a-sm':   'var(--a-radius-sm)',
        'site-sm': 'var(--radius-sm)',
        'site-md': 'var(--radius-md)',
        'site-lg': 'var(--radius-lg)',
        'site-xl': 'var(--radius-xl)',
      },

      /* ─── Polices ─── */
      fontFamily: {
        'p-display': ["'Plus Jakarta Sans'", "'Inter'", 'sans-serif'],
        'p-body':    ["'Inter'", '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'p-mono':    ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
        'arabic':    ["'Scheherazade New'", 'serif'],
        'a-display': ['Georgia', "'Times New Roman'", 'serif'],
        'a-body':    ["'DM Sans'", 'system-ui', 'sans-serif'],
        'a-mono':    ["'JetBrains Mono'", "'Fira Code'", 'monospace'],
        'site':      ['-apple-system', 'BlinkMacSystemFont', "'SF Pro Display'", "'Inter'", 'sans-serif'],
      },

      /* ─── Spacing custom ─── */
      spacing: {
        'sidebar':   '260px',
        'nav-h':     '72px',
      },

      /* ─── Keyframes ─── */
      keyframes: {
        /* Portail */
        bgFloat1: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.08' },
          '50%':      { transform: 'translateY(-20px) translateX(10px) rotate(2deg)', opacity: '0.12' },
        },
        bgFloat2: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.06' },
          '50%':      { transform: 'translateY(15px) translateX(-15px) rotate(-3deg)', opacity: '0.1' },
        },
        bgFloat3: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.07' },
          '50%':      { transform: 'translateY(-10px) translateX(-10px) rotate(1deg)', opacity: '0.11' },
        },
        bgFloat4: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: '0.05' },
          '50%':      { transform: 'translateY(12px) translateX(8px) rotate(-2deg)', opacity: '0.09' },
        },
        /* Admin */
        adminShimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        /* Site public */
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(40px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%':      { transform: 'translateY(-14px) rotate(1deg)' },
          '66%':      { transform: 'translateY(-6px) rotate(-1deg)' },
        },
        orbPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.2' },
          '50%':      { transform: 'scale(1.2)', opacity: '0.38' },
        },
        spinSlow: {
          from: { transform: 'translate(-50%,-50%) rotate(0deg)' },
          to:   { transform: 'translate(-50%,-50%) rotate(360deg)' },
        },
      },

      /* ─── Animations ─── */
      animation: {
        'bg-float-1':    'bgFloat1 12s ease-in-out infinite',
        'bg-float-2':    'bgFloat2 14s ease-in-out infinite',
        'bg-float-3':    'bgFloat3 10s ease-in-out infinite',
        'bg-float-4':    'bgFloat4 11s ease-in-out infinite',
        'admin-shimmer': 'adminShimmer 2s linear infinite',
        'fade-up':       'fadeUp 0.6s ease-out',
        'fade-in':       'fadeIn 0.4s ease-out',
        'scale-in':      'scaleIn 0.3s ease-out',
        'shimmer':       'shimmer 2s linear infinite',
        'float':         'float 8s ease-in-out infinite',
        'orb-pulse':     'orbPulse 6s ease-in-out infinite',
        'spin-slow':     'spinSlow 20s linear infinite',
      },

      /* ─── Easing custom ─── */
      transitionTimingFunction: {
        'app':     'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'app-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      /* ─── Breakpoints (union de tous les fichiers) ─── */
      screens: {
        'xs':  '480px',
        'sm':  '600px',
        'md':  '768px',
        'lg':  '900px',
        'xl':  '1024px',
        '2xl': '1100px',
      },
    },
  },
  plugins: [],
};
