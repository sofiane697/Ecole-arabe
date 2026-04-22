import { getInitials, isSafePhotoUrl } from './EleveAvatar';

describe('getInitials', () => {
  test('renvoie les initiales classiques (PN)', () => {
    expect(getInitials({ prenom: 'Sofiane', nom: 'Djoudi' })).toBe('SD');
  });

  test('gère les espaces et casse variables', () => {
    expect(getInitials({ prenom: '  alice  ', nom: 'dupont' })).toBe('AD');
    expect(getInitials({ prenom: 'ALICE', nom: 'DuPoNt' })).toBe('AD');
  });

  test('gère les accents (première lettre prénom)', () => {
    expect(getInitials({ prenom: 'Émilie', nom: 'Martin' })).toBe('ÉM');
  });

  test("renvoie chaîne vide quand l'élève est vide/null", () => {
    expect(getInitials(null)).toBe('');
    expect(getInitials(undefined)).toBe('');
    expect(getInitials({})).toBe('');
    expect(getInitials({ prenom: '', nom: '' })).toBe('');
  });

  test('ne prend que la première lettre si prénom composé', () => {
    expect(getInitials({ prenom: 'Jean-Pierre', nom: 'Dubois' })).toBe('JD');
  });

  test('fonctionne avec un seul champ renseigné', () => {
    expect(getInitials({ prenom: 'Sofiane', nom: '' })).toBe('S');
    expect(getInitials({ prenom: '', nom: 'Djoudi' })).toBe('D');
  });

  test("nom toujours en majuscule, prénom capitalisé", () => {
    // L'implémentation upper-case le prénom complet puis prend le [0].
    // Donc peu importe la casse d'origine, le résultat est en majuscule.
    const r = getInitials({ prenom: 'sofiane', nom: 'djoudi' });
    expect(r).toBe(r.toUpperCase());
  });
});

describe('isSafePhotoUrl', () => {
  const VALID = 'https://test.supabase.co/storage/v1/object/public/eleves-photos/profiles/abc/photo-1.jpg';

  test('accepte une URL du bucket eleves-photos sous profiles/', () => {
    expect(isSafePhotoUrl(VALID)).toBe(true);
  });

  test('rejette null/undefined/chaîne vide', () => {
    expect(isSafePhotoUrl(null)).toBe(false);
    expect(isSafePhotoUrl(undefined)).toBe(false);
    expect(isSafePhotoUrl('')).toBe(false);
  });

  test('rejette les schémas javascript: et data:', () => {
    expect(isSafePhotoUrl('javascript:alert(1)')).toBe(false);
    expect(isSafePhotoUrl('data:image/svg+xml,<svg onload="alert(1)"/>')).toBe(false);
  });

  test('rejette une URL externe même HTTPS', () => {
    expect(isSafePhotoUrl('https://evil.com/storage/v1/object/public/eleves-photos/profiles/abc/x.jpg')).toBe(false);
  });

  test('rejette une URL qui ne pointe pas vers eleves-photos (mauvais bucket)', () => {
    expect(isSafePhotoUrl('https://test.supabase.co/storage/v1/object/public/cours/abc/x.jpg')).toBe(false);
  });

  test('rejette une URL pointant vers un autre chemin que profiles/', () => {
    expect(isSafePhotoUrl('https://test.supabase.co/storage/v1/object/public/eleves-photos/other/abc/x.jpg')).toBe(false);
  });

  test('rejette les types non-string', () => {
    expect(isSafePhotoUrl(42)).toBe(false);
    expect(isSafePhotoUrl({})).toBe(false);
    expect(isSafePhotoUrl([])).toBe(false);
  });
});
