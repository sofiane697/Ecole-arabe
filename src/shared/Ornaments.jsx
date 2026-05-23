/* Coupole v1 — Ornements géométriques SVG */

export function Star8({ size = 16, color = 'currentColor' }) {
  const s = size * 0.8;
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <g fill={color}>
        <rect x="-40" y="-40" width="80" height="80" />
        <rect x="-40" y="-40" width="80" height="80" transform="rotate(45)" />
      </g>
    </svg>
  );
}

export function Star5({ size = 11, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100" aria-hidden="true">
      <path
        d="M 0 -50 L 14 -14 L 50 -8 L 22 14 L 32 50 L 0 30 L -32 50 L -22 14 L -50 -8 L -14 -14 Z"
        fill={filled ? 'var(--c-gold)' : 'transparent'}
        stroke="var(--c-gold-soft)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Flourish({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size * 0.32}
      viewBox="0 0 32 10"
      fill="none"
      stroke="var(--c-gold)"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M 0 5 Q 6 5 10 2 T 22 5 T 32 5" />
      <circle cx="30" cy="5" r="1.4" fill="var(--c-gold)" stroke="none" />
    </svg>
  );
}

export function Rosette({ size = 64, opacity = 0.15 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="none"
      stroke="var(--c-gold-light)"
      strokeWidth="1"
      opacity={opacity}
      aria-hidden="true"
    >
      <circle cx="0" cy="0" r="44" />
      <circle cx="0" cy="0" r="30" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <line
          key={i}
          x1="0" y1="0"
          x2="0" y2="-44"
          transform={`rotate(${i * 45})`}
        />
      ))}
      <rect x="-22" y="-22" width="44" height="44" />
      <rect x="-22" y="-22" width="44" height="44" transform="rotate(45)" />
    </svg>
  );
}

export function Diamond({ size = 8, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <rect
        x="1.5" y="1.5"
        width="7" height="7"
        transform="rotate(45 5 5)"
        fill={color}
      />
    </svg>
  );
}
