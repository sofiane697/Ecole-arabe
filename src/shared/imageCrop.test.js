import { coverImgStyle, isSafeCoverUrl } from './imageCrop';

describe('coverImgStyle', () => {
  test('valeurs par défaut quand item est vide', () => {
    expect(coverImgStyle({})).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('item null/undefined donne les valeurs par défaut', () => {
    expect(coverImgStyle(null)).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
    expect(coverImgStyle(undefined)).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('valeurs numériques normales', () => {
    expect(coverImgStyle({ image_scale: 1.5, image_pos_x: 30, image_pos_y: 70 })).toEqual({
      objectPosition: '30% 70%',
      transform: 'scale(1.5)',
      transformOrigin: 'center',
    });
  });

  test('valeurs stringifiées (PostgREST renvoie les NUMERIC en string)', () => {
    expect(coverImgStyle({ image_scale: '2.3', image_pos_x: '25.5', image_pos_y: '74.5' })).toEqual({
      objectPosition: '25.5% 74.5%',
      transform: 'scale(2.3)',
      transformOrigin: 'center',
    });
  });

  test('champs null/undefined/NaN retombent sur les défauts', () => {
    expect(coverImgStyle({ image_scale: null, image_pos_x: undefined, image_pos_y: NaN })).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('chaîne vide traitée comme défaut', () => {
    expect(coverImgStyle({ image_scale: '', image_pos_x: '', image_pos_y: '' })).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('chaîne non numérique invalide retombe sur les défauts', () => {
    expect(coverImgStyle({ image_scale: 'abc', image_pos_x: 'foo', image_pos_y: 'bar' })).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('scale à 0 est clampé au minimum (1) pour défense en profondeur', () => {
    // Un attaquant anon peut PATCH image_scale=0 directement en DB (RLS ouvert).
    // Le rendu re-clamp pour éviter un transform dégradé.
    expect(coverImgStyle({ image_scale: 0 }).transform).toBe('scale(1)');
  });

  test('scale hors bornes clampé à [1, 3]', () => {
    expect(coverImgStyle({ image_scale: 9999 }).transform).toBe('scale(3)');
    expect(coverImgStyle({ image_scale: -5 }).transform).toBe('scale(1)');
  });

  test('positions hors bornes clampées à [0, 100]', () => {
    expect(coverImgStyle({ image_pos_x: 999 }).objectPosition).toBe('100% 50%');
    expect(coverImgStyle({ image_pos_y: -50 }).objectPosition).toBe('50% 0%');
  });

  test('positions à 0 bien formées (piège classique 0 || fallback)', () => {
    expect(coverImgStyle({ image_pos_x: 0, image_pos_y: 0 })).toEqual({
      objectPosition: '0% 0%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('positions à 100 (bord max)', () => {
    expect(coverImgStyle({ image_pos_x: 100, image_pos_y: 100 })).toEqual({
      objectPosition: '100% 100%',
      transform: 'scale(1)',
      transformOrigin: 'center',
    });
  });

  test('seul image_scale renseigné — positions au défaut', () => {
    expect(coverImgStyle({ image_scale: 2 })).toEqual({
      objectPosition: '50% 50%',
      transform: 'scale(2)',
      transformOrigin: 'center',
    });
  });
});

describe('isSafeCoverUrl', () => {
  const SAFE_URL = `${process.env.REACT_APP_SUPABASE_URL || 'https://test.supabase.co'}/storage/v1/object/public/cours/module-1/cover.jpg`;

  test('accepte une URL Supabase Storage cours/', () => {
    expect(isSafeCoverUrl(SAFE_URL)).toBe(true);
  });

  test('rejette null, undefined, chaîne vide', () => {
    expect(isSafeCoverUrl(null)).toBe(false);
    expect(isSafeCoverUrl(undefined)).toBe(false);
    expect(isSafeCoverUrl('')).toBe(false);
  });

  test('rejette les URLs non-string', () => {
    expect(isSafeCoverUrl(123)).toBe(false);
    expect(isSafeCoverUrl({})).toBe(false);
    expect(isSafeCoverUrl([])).toBe(false);
  });

  test("rejette javascript: (XSS classique)", () => {
    expect(isSafeCoverUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeCoverUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  test("rejette data:text/html (XSS)", () => {
    expect(isSafeCoverUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
  });

  test('rejette une URL vers un autre bucket Supabase', () => {
    const evil = `${process.env.REACT_APP_SUPABASE_URL || 'https://test.supabase.co'}/storage/v1/object/public/eleves-photos/anything`;
    expect(isSafeCoverUrl(evil)).toBe(false);
  });

  test('rejette une URL tierce', () => {
    expect(isSafeCoverUrl('https://evil.example.com/cours/cover.jpg')).toBe(false);
  });

  test('accepte une URL avec query-string de cache-busting', () => {
    expect(isSafeCoverUrl(`${SAFE_URL}?v=5`)).toBe(true);
  });
});
