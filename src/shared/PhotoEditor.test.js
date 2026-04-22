import { clamp, normalizeCrop, SCALE_MIN, SCALE_MAX } from './PhotoEditor';

describe('clamp', () => {
  test('retourne la valeur si elle est dans la plage', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(1.5, 1, 3)).toBe(1.5);
  });

  test("borne par le min si la valeur est en dessous", () => {
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(0.5, 1, 3)).toBe(1);
  });

  test("borne par le max si la valeur est au-dessus", () => {
    expect(clamp(250, 0, 100)).toBe(100);
    expect(clamp(5, 1, 3)).toBe(3);
  });

  test('gère les bornes égales aux valeurs limites', () => {
    expect(clamp(0, 0, 100)).toBe(0);
    expect(clamp(100, 0, 100)).toBe(100);
    expect(clamp(SCALE_MIN, SCALE_MIN, SCALE_MAX)).toBe(SCALE_MIN);
    expect(clamp(SCALE_MAX, SCALE_MIN, SCALE_MAX)).toBe(SCALE_MAX);
  });
});

describe('normalizeCrop', () => {
  test('valeurs par défaut passent telles quelles', () => {
    expect(normalizeCrop(1, 50, 50)).toEqual({ scale: 1, posX: 50, posY: 50 });
  });

  test('clamp les valeurs de scale hors plage', () => {
    expect(normalizeCrop(0.5, 50, 50).scale).toBe(SCALE_MIN);
    expect(normalizeCrop(5, 50, 50).scale).toBe(SCALE_MAX);
    expect(normalizeCrop(-1, 50, 50).scale).toBe(SCALE_MIN);
  });

  test('clamp les positions hors plage [0, 100]', () => {
    expect(normalizeCrop(1, -50, 50).posX).toBe(0);
    expect(normalizeCrop(1, 150, 50).posX).toBe(100);
    expect(normalizeCrop(1, 50, -10).posY).toBe(0);
    expect(normalizeCrop(1, 50, 999).posY).toBe(100);
  });

  test('scale arrondi à 2 décimales', () => {
    expect(normalizeCrop(1.123456, 50, 50).scale).toBe(1.12);
    expect(normalizeCrop(2.999, 50, 50).scale).toBe(3);
    expect(normalizeCrop(1.005, 50, 50).scale).toBe(1.01);
  });

  test('positions arrondies à 1 décimale', () => {
    expect(normalizeCrop(1, 33.333, 66.666).posX).toBe(33.3);
    expect(normalizeCrop(1, 33.333, 66.666).posY).toBe(66.7);
    expect(normalizeCrop(1, 49.95, 50.05).posX).toBe(50);
  });

  test('cas combinés (scale max + position extrême)', () => {
    expect(normalizeCrop(10, -100, 200)).toEqual({ scale: 3, posX: 0, posY: 100 });
  });

  test('valeurs entières restent entières', () => {
    const n = normalizeCrop(2, 75, 25);
    expect(n.scale).toBe(2);
    expect(n.posX).toBe(75);
    expect(n.posY).toBe(25);
  });
});
