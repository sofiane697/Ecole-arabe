// Re-export pour compat descendante (anciens imports via ./adminUtils)
export { calcAge } from '../shared/dateUtils';

// ─── Génération identifiant : 1ère lettre prénom + 2ème lettre nom + 1ère lettre nom + 4 chiffres
export function generateIdentifiant(prenom, nom) {
  const p = prenom.trim().replace(/\s/g, '');
  const n = nom.trim().replace(/\s/g, '');
  const part1 = (p[0] || 'X').toUpperCase();
  const part2 = (n[1] || n[0] || 'X').toLowerCase();
  const part3 = (n[0] || 'X').toUpperCase();
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const digits = String(1000 + (arr[0] % 9000));
  return `${part1}${part2}${part3}${digits}`;
}

// ─── Génération mot de passe provisoire (8 chars, 1 majuscule, 1 chiffre, 1 spécial)
export function generateTempPassword() {
  const chars    = 'abcdefghijkmnpqrstuvwxyz';
  const upper    = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits   = '23456789';
  const specials = '!@#$%&*?';
  const rnd = (max) => {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  };
  let pwd = '';
  pwd += upper[rnd(upper.length)];
  pwd += chars[rnd(chars.length)];
  pwd += digits[rnd(digits.length)];
  pwd += specials[rnd(specials.length)];
  for (let i = 0; i < 4; i++) pwd += chars[rnd(chars.length)];
  // Mélange cryptographiquement sûr (Fisher-Yates)
  const arr = pwd.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
