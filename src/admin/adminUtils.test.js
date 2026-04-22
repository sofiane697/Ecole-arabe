import { calcAge, normalizeTelephone, formatFoyer, generateIdentifiant, generateTempPassword } from './adminUtils';

describe('calcAge', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-22T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('retourne null pour une valeur nulle ou undefined', () => {
    expect(calcAge(null)).toBeNull();
    expect(calcAge(undefined)).toBeNull();
    expect(calcAge('')).toBeNull();
  });

  test('retourne null pour une date invalide', () => {
    expect(calcAge('pas-une-date')).toBeNull();
    expect(calcAge('2026-13-45')).toBeNull();
  });

  test('calcule correctement un âge de base (anniversaire passé)', () => {
    // Aujourd'hui = 22 avril 2026, né le 1er janvier 2010 → 16 ans
    expect(calcAge('2010-01-01')).toBe(16);
  });

  test('calcule correctement un âge quand anniversaire pas encore passé', () => {
    // Aujourd'hui = 22 avril 2026, né le 30 juin 2010 → 15 ans (pas encore 16)
    expect(calcAge('2010-06-30')).toBe(15);
  });

  test("le jour même de l'anniversaire l'âge augmente", () => {
    // Aujourd'hui = 22 avril 2026, né le 22 avril 2010 → 16 ans
    expect(calcAge('2010-04-22')).toBe(16);
  });

  test("la veille de l'anniversaire l'âge n'a pas encore augmenté", () => {
    // Aujourd'hui = 22 avril 2026, né le 23 avril 2010 → 15 ans
    expect(calcAge('2010-04-23')).toBe(15);
  });

  test('accepte un format ISO complet', () => {
    expect(calcAge('2010-01-01T00:00:00.000Z')).toBe(16);
  });

  test('retourne null pour une date dans le futur', () => {
    expect(calcAge('2030-01-01')).toBeNull();
  });

  test('retourne null pour un âge absurde (> 130 ans)', () => {
    expect(calcAge('1800-01-01')).toBeNull();
  });

  test('âge 0 pour un bébé né cette année', () => {
    expect(calcAge('2026-01-01')).toBe(0);
  });

  test('immunisé au décalage timezone (jour fixe UTC quelle que soit la frontière)', () => {
    // Ancien bug : new Date("2010-04-23") parse en UTC ; selon l'heure locale de now,
    // getDate() pouvait se désaligner. Avec le parsing manuel, plus de bascule.
    // 22 avril 12:00 UTC, né le 23 avril → 15 ans (pas encore 16)
    expect(calcAge('2010-04-23')).toBe(15);
  });

  test('accepte format ISO long avec heure/fuseau', () => {
    expect(calcAge('2010-04-22T23:59:59+02:00')).toBe(16);
    expect(calcAge('2010-04-22T00:00:00.000Z')).toBe(16);
  });
});

describe('normalizeTelephone', () => {
  test('retourne une chaîne vide pour null/undefined/vide', () => {
    expect(normalizeTelephone(null)).toBe('');
    expect(normalizeTelephone(undefined)).toBe('');
    expect(normalizeTelephone('')).toBe('');
  });

  test('retire les espaces', () => {
    expect(normalizeTelephone('06 12 34 56 78')).toBe('0612345678');
  });

  test('retire les tirets, points et parenthèses', () => {
    expect(normalizeTelephone('06-12-34-56-78')).toBe('0612345678');
    expect(normalizeTelephone('06.12.34.56.78')).toBe('0612345678');
    expect(normalizeTelephone('(06)12345678')).toBe('0612345678');
  });

  test('convertit +33 en 0', () => {
    expect(normalizeTelephone('+33612345678')).toBe('0612345678');
    expect(normalizeTelephone('+33 6 12 34 56 78')).toBe('0612345678');
  });

  test('laisse intact un numéro déjà propre', () => {
    expect(normalizeTelephone('0612345678')).toBe('0612345678');
  });

  test('gère les numéros partiels (utilisé pour recherche doublon en cours de frappe)', () => {
    expect(normalizeTelephone('0612')).toBe('0612');
  });

  test('coerce les entrées non-string', () => {
    expect(normalizeTelephone(612345678)).toBe('612345678');
  });
});

describe('formatFoyer', () => {
  test('retourne une chaîne vide si rien fourni', () => {
    expect(formatFoyer()).toBe('');
    expect(formatFoyer({})).toBe('');
    expect(formatFoyer({ pere_nom: '', mere_nom: '' })).toBe('');
  });

  test('père seul', () => {
    expect(formatFoyer({ pere_prenom: 'Jean', pere_nom: 'Dupont' })).toBe('M. Jean Dupont');
  });

  test('mère seule', () => {
    expect(formatFoyer({ mere_prenom: 'Marie', mere_nom: 'Durand' })).toBe('Mme Marie Durand');
  });

  test('couple avec même nom de famille → "M. et Mme <nom>"', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean', pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'Dupont',
    })).toBe('M. et Mme Dupont');
  });

  test('couple avec noms différents → noms complets de chacun', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean', pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'Durand',
    })).toBe('M. Jean Dupont et Mme Marie Durand');
  });

  test('insensible à la casse du nom de famille pour la détection du "même nom"', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean',  pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'DUPONT',
    })).toBe('M. et Mme Dupont');
  });

  test('père avec juste le prénom (pas de nom)', () => {
    expect(formatFoyer({ pere_prenom: 'Jean' })).toBe('M. Jean');
  });

  test('mère avec juste le nom (pas de prénom)', () => {
    expect(formatFoyer({ mere_nom: 'Durand' })).toBe('Mme Durand');
  });
});

describe('generateIdentifiant', () => {
  test('applique le pattern {prenom[0].upper}{nom[1].lower}{nom[0].upper}{4 chiffres}', () => {
    // Jean Dupont → J + u + D + XXXX
    expect(generateIdentifiant('Jean', 'Dupont')).toMatch(/^JuD\d{4}$/);
  });

  test('4 chiffres en suffixe, entre 1000 et 9999', () => {
    const id = generateIdentifiant('Sofiane', 'Djeddi');
    const digits = id.slice(3);
    const n = parseInt(digits, 10);
    expect(digits).toHaveLength(4);
    expect(n).toBeGreaterThanOrEqual(1000);
    expect(n).toBeLessThanOrEqual(9999);
  });

  test('gère un nom à une seule lettre (réutilise [0] pour [1])', () => {
    const id = generateIdentifiant('Ali', 'X');
    // P1=A, P2=X (fallback [0]), P3=X
    expect(id).toMatch(/^AxX\d{4}$/);
  });

  test('fallback "X" pour un prénom/nom vide', () => {
    const id = generateIdentifiant('', '');
    expect(id).toMatch(/^XxX\d{4}$/);
  });

  test('tolère les espaces dans prénom/nom', () => {
    const id = generateIdentifiant(' Jean ', ' Dupont ');
    expect(id).toMatch(/^JuD\d{4}$/);
  });
});

describe('generateTempPassword', () => {
  test('longueur 8', () => {
    expect(generateTempPassword()).toHaveLength(8);
  });

  test('contient au moins 1 majuscule', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/[A-Z]/);
    }
  });

  test('contient au moins 1 chiffre', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/\d/);
    }
  });

  test('contient au moins 1 caractère spécial', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateTempPassword()).toMatch(/[!@#$%&*?]/);
    }
  });

  test('deux appels successifs donnent des valeurs différentes', () => {
    const a = generateTempPassword();
    const b = generateTempPassword();
    expect(a).not.toBe(b);
  });
});
