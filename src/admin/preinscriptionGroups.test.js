import { sectionOf, groupByFormat } from './preinscriptionGroups';

const enfant = (format, extra = {}) => ({ est_enfant: true, format, ...extra });
const adulte = (extra = {}) => ({ est_enfant: false, format: null, ...extra });

describe('sectionOf', () => {
  test('adulte (pas de format) → "adulte"', () => {
    expect(sectionOf(adulte())).toBe('adulte');
  });
  test('enfant autonomie → "autonomie"', () => {
    expect(sectionOf(enfant('autonomie'))).toBe('autonomie');
  });
  test('enfant visioconference → "visioconference"', () => {
    expect(sectionOf(enfant('visioconference'))).toBe('visioconference');
  });
  test('enfant particulier → "particulier"', () => {
    expect(sectionOf(enfant('particulier'))).toBe('particulier');
  });
  test('enfant format inconnu/null → "autres"', () => {
    expect(sectionOf(enfant(null))).toBe('autres');
    expect(sectionOf(enfant('bidon'))).toBe('autres');
  });
});

describe('groupByFormat', () => {
  test('respecte l\'ordre fixe et exclut les sections vides', () => {
    const list = [
      adulte({ id: 1 }),
      enfant('visioconference', { id: 2 }),
      enfant('autonomie', { id: 3 }),
    ];
    const groups = groupByFormat(list);
    expect(groups.map(g => g.key)).toEqual(['autonomie', 'visioconference', 'adulte']);
    expect(groups.map(g => g.label)).toEqual(['Autonomie', 'Visioconférence', 'Adulte — présentiel']);
  });

  test('conserve les items de chaque section', () => {
    const a1 = enfant('autonomie', { id: 1 });
    const a2 = enfant('autonomie', { id: 2 });
    const groups = groupByFormat([a1, a2]);
    expect(groups).toHaveLength(1);
    expect(groups[0].items).toEqual([a1, a2]);
  });

  test('liste vide → aucun groupe', () => {
    expect(groupByFormat([])).toEqual([]);
  });

  test('format inconnu → section "Autres" en dernier', () => {
    const groups = groupByFormat([enfant('bidon', { id: 1 }), adulte({ id: 2 })]);
    expect(groups.map(g => g.key)).toEqual(['adulte', 'autres']);
  });
});
