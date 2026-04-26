// ─── Today as YYYY-MM-DD (local timezone) ────────────────────────────────────
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Format a DATE-only string (YYYY-MM-DD) without timezone shift ────────────
// new Date('2026-05-10') is parsed as UTC midnight and can show May 9 in UTC+2.
export function fmtDateLong(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fmtDateShort(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function fmtDateWeekday(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── Calcul de l'âge à partir d'une date de naissance ──────────────────────
// Parse YYYY-MM-DD manuellement pour éviter les décalages de timezone
// entre `new Date(str)` (UTC par défaut) et `new Date()` (local).
export function calcAge(dateNaissance) {
  if (!dateNaissance) return null;
  const s = String(dateNaissance).slice(0, 10);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y  = +m[1];
  const mo = +m[2];
  const da = +m[3];
  // Vérifier que c'est une date réelle (rejeter 2026-13-45)
  const check = new Date(Date.UTC(y, mo - 1, da));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== da) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const md = (now.getMonth() + 1) - mo;
  if (md < 0 || (md === 0 && now.getDate() < da)) age--;
  return age >= 0 && age < 130 ? age : null;
}
