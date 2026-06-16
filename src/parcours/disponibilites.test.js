import { toggleDispo, weekLabel, weekendLabel, removeJour, DISPO_AUCUNE } from './disponibilites';

const MATIN = 'Matin (9h–11h)';
const SOIR = 'Soirée (18h–20h)';

describe('toggleDispo', () => {
  test('ajoute un créneau à une sélection vide', () => {
    expect(toggleDispo([], MATIN)).toEqual([MATIN]);
  });

  test('retire un créneau déjà sélectionné', () => {
    expect(toggleDispo([MATIN], MATIN)).toEqual([]);
  });

  test('permet plusieurs créneaux simultanés', () => {
    expect(toggleDispo([MATIN], SOIR)).toEqual([MATIN, SOIR]);
  });

  test('« Aucune préférence » vide tout le reste', () => {
    expect(toggleDispo([MATIN, SOIR], DISPO_AUCUNE)).toEqual([DISPO_AUCUNE]);
  });

  test('choisir un créneau retire « Aucune préférence »', () => {
    expect(toggleDispo([DISPO_AUCUNE], MATIN)).toEqual([MATIN]);
  });

  test('re-cliquer « Aucune préférence » la désélectionne', () => {
    expect(toggleDispo([DISPO_AUCUNE], DISPO_AUCUNE)).toEqual([]);
  });

  test('ne mute pas le tableau source', () => {
    const src = [MATIN];
    toggleDispo(src, SOIR);
    expect(src).toEqual([MATIN]);
  });
});

describe('weekLabel', () => {
  test('combine jour et créneau', () => {
    expect(weekLabel('Lundi', MATIN)).toBe('Lundi · Matin (9h–11h)');
  });
});

describe('weekendLabel', () => {
  test('combine jour et créneau entre parenthèses', () => {
    expect(weekendLabel('Samedi', '9h–12h')).toBe('Samedi (9h–12h)');
  });
});

describe('removeJour', () => {
  const sel = ['Lundi · Matin (9h–11h)', 'Lundi · Soirée (18h–20h)', 'Mardi · Matin (9h–11h)'];

  test('retire tous les créneaux d’un jour (semaine)', () => {
    expect(removeJour(sel, 'Lundi')).toEqual(['Mardi · Matin (9h–11h)']);
  });

  test('retire les créneaux d’un jour de week-end', () => {
    const wk = ['Samedi (9h–12h)', 'Samedi (9h–14h)', 'Dimanche (9h–12h)'];
    expect(removeJour(wk, 'Samedi')).toEqual(['Dimanche (9h–12h)']);
  });

  test('ne touche pas un jour absent', () => {
    expect(removeJour(sel, 'Vendredi')).toEqual(sel);
  });

  test('ne confond pas un préfixe partiel', () => {
    // « Mar » ne doit pas matcher « Mardi · … »
    expect(removeJour(['Mardi · Matin (9h–11h)'], 'Mar')).toEqual(['Mardi · Matin (9h–11h)']);
  });
});
