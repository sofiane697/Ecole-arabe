import { calcAge, normalizeTelephone, formatFoyer, generateIdentifiant, generateTempPassword, safeMailtoHref, safeTelHref, getParentInitials } from './adminUtils';

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

  test('père seul — prénom capitalisé, nom en MAJUSCULES', () => {
    expect(formatFoyer({ pere_prenom: 'Jean', pere_nom: 'Dupont' })).toBe('M. Jean DUPONT');
  });

  test('mère seule — prénom capitalisé, nom en MAJUSCULES', () => {
    expect(formatFoyer({ mere_prenom: 'Marie', mere_nom: 'Durand' })).toBe('Mme Marie DURAND');
  });

  test('couple avec même nom de famille → "M. et Mme NOM"', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean', pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'Dupont',
    })).toBe('M. et Mme DUPONT');
  });

  test('couple avec noms différents → noms complets en MAJUSCULES', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean', pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'Durand',
    })).toBe('M. Jean DUPONT et Mme Marie DURAND');
  });

  test('insensible à la casse pour la détection "même nom"', () => {
    expect(formatFoyer({
      pere_prenom: 'Jean',  pere_nom: 'Dupont',
      mere_prenom: 'Marie', mere_nom: 'DUPONT',
    })).toBe('M. et Mme DUPONT');
  });

  test('père avec juste le prénom (pas de nom)', () => {
    expect(formatFoyer({ pere_prenom: 'Jean' })).toBe('M. Jean');
  });

  test('mère avec juste le nom (pas de prénom)', () => {
    expect(formatFoyer({ mere_nom: 'Durand' })).toBe('Mme DURAND');
  });

  test('normalise les casses bizarres (tout minuscule → formatage propre)', () => {
    expect(formatFoyer({ pere_prenom: 'jean', pere_nom: 'dupont' })).toBe('M. Jean DUPONT');
    expect(formatFoyer({ pere_prenom: 'JEAN', pere_nom: 'DuPOnt' })).toBe('M. Jean DUPONT');
  });

  test('préserve les prénoms composés (Jean-Paul, Marie-Ange)', () => {
    expect(formatFoyer({ pere_prenom: 'jean-paul', pere_nom: 'dupont' })).toBe('M. Jean-Paul DUPONT');
    expect(formatFoyer({ mere_prenom: 'MARIE-ANGE', mere_nom: 'DURAND' })).toBe('Mme Marie-Ange DURAND');
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

// ─── Sécurité : bloque les schemes dangereux (javascript:, data:, vbscript:…)
describe('safeMailtoHref', () => {
  test('renvoie mailto: pour un email valide', () => {
    expect(safeMailtoHref('jean@exemple.fr')).toBe('mailto:jean@exemple.fr');
  });
  test('renvoie null pour un email vide', () => {
    expect(safeMailtoHref('')).toBeNull();
    expect(safeMailtoHref(null)).toBeNull();
    expect(safeMailtoHref(undefined)).toBeNull();
  });
  test('renvoie null pour un email invalide (sans @)', () => {
    expect(safeMailtoHref('notanemail')).toBeNull();
  });
  test('renvoie null pour une tentative XSS (javascript:)', () => {
    expect(safeMailtoHref('javascript:alert(1)')).toBeNull();
  });
  test('renvoie null si email contient des caractères dangereux (<, >, ")', () => {
    expect(safeMailtoHref('x@y.com"><script>')).toBeNull();
    expect(safeMailtoHref("x'@y.com")).toBeNull();
  });
  test('trim les espaces', () => {
    expect(safeMailtoHref('  jean@exemple.fr  ')).toBe('mailto:jean@exemple.fr');
  });
});

describe('safeTelHref', () => {
  test('renvoie tel: pour un numéro normal', () => {
    expect(safeTelHref('+33 6 12 34 56 78')).toBe('tel:+33612345678');
    expect(safeTelHref('06 12 34 56 78')).toBe('tel:0612345678');
  });
  test('renvoie null pour un téléphone vide', () => {
    expect(safeTelHref('')).toBeNull();
    expect(safeTelHref(null)).toBeNull();
  });
  test('renvoie null pour une tentative XSS', () => {
    expect(safeTelHref('javascript:alert(1)')).toBeNull();
  });
  test('renvoie null si moins de 4 chiffres après nettoyage', () => {
    expect(safeTelHref('abc')).toBeNull();
    expect(safeTelHref('12')).toBeNull();
  });
  test('filtre les caractères non autorisés', () => {
    expect(safeTelHref('06<script>12345')).toBe('tel:0612345');
  });
});

describe('getParentInitials', () => {
  test('initiales père+nom', () => {
    expect(getParentInitials({ pere_prenom: 'Jean', pere_nom: 'Dupont' })).toBe('JD');
  });
  test('initiales mère seule', () => {
    expect(getParentInitials({ mere_prenom: 'Marie', mere_nom: 'Durand' })).toBe('MD');
  });
  test('fallback P si aucun nom', () => {
    expect(getParentInitials({})).toBe('P');
    expect(getParentInitials(null)).toBe('P');
    expect(getParentInitials(undefined)).toBe('P');
  });
  test('priorise père si les deux présents', () => {
    expect(getParentInitials({ pere_prenom: 'Jean', pere_nom: 'Dupont', mere_prenom: 'Marie', mere_nom: 'Durand' })).toBe('JD');
  });
});
