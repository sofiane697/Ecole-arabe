import { calcAge } from './adminUtils';

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
