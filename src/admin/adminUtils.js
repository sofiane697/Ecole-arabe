// ─── Génération identifiant : 1ère lettre prénom + 2ème lettre nom + 1ère lettre nom + 4 chiffres
export function generateIdentifiant(prenom, nom) {
  const p = prenom.trim().replace(/\s/g, '');
  const n = nom.trim().replace(/\s/g, '');
  const part1 = (p[0] || 'X').toUpperCase();
  const part2 = (n[1] || n[0] || 'X').toLowerCase();
  const part3 = (n[0] || 'X').toUpperCase();
  const digits = String(Math.floor(1000 + Math.random() * 9000));
  return `${part1}${part2}${part3}${digits}`;
}

// ─── Génération mot de passe provisoire (8 chars, 1 majuscule, 1 chiffre, 1 spécial)
export function generateTempPassword() {
  const chars    = 'abcdefghijkmnpqrstuvwxyz';
  const upper    = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits   = '23456789';
  const specials = '!@#$%&*?';
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  for (let i = 0; i < 4; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
}
