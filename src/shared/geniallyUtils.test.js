import { normalizeGeniallyUrl, isValidGeniallyUrl } from './geniallyUtils';

// ─── normalizeGeniallyUrl ────────────────────────────────────────────────────

describe('normalizeGeniallyUrl — entrées vides / invalides', () => {
  it('retourne null pour null', () => {
    expect(normalizeGeniallyUrl(null)).toBeNull();
  });

  it('retourne null pour une chaîne vide', () => {
    expect(normalizeGeniallyUrl('')).toBeNull();
  });

  it('retourne null pour une chaîne de blancs', () => {
    expect(normalizeGeniallyUrl('   ')).toBeNull();
  });

  it('retourne null pour une URL non-Genially', () => {
    expect(normalizeGeniallyUrl('https://www.youtube.com/watch?v=abc123')).toBeNull();
  });

  it('retourne null pour un nom de domaine similaire (typosquatting)', () => {
    expect(normalizeGeniallyUrl('https://view.genially.org/abc123')).toBeNull();
    expect(normalizeGeniallyUrl('https://view.genially-fake.com/abc123')).toBeNull();
    expect(normalizeGeniallyUrl('https://evil.com/view.genially.com/abc123')).toBeNull();
  });

  it('retourne null pour une URL javascript: (injection)', () => {
    expect(normalizeGeniallyUrl('javascript:alert(1)')).toBeNull();
  });

  it('retourne null pour une URL data: (injection)', () => {
    expect(normalizeGeniallyUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });
});

describe('normalizeGeniallyUrl — URL directe', () => {
  it('accepte une URL https view.genially.com valide', () => {
    const url = 'https://view.genially.com/abc123def456';
    expect(normalizeGeniallyUrl(url)).toBe(url);
  });

  it('accepte un ID hexadécimal long (24 caractères)', () => {
    const url = 'https://view.genially.com/6508e4d1234567890abcdef0';
    expect(normalizeGeniallyUrl(url)).toBe(url);
  });

  it('ignore les espaces en début et fin', () => {
    const url = 'https://view.genially.com/abc123';
    expect(normalizeGeniallyUrl(`  ${url}  `)).toBe(url);
  });

  it('rejette une URL http (non sécurisée)', () => {
    expect(normalizeGeniallyUrl('http://view.genially.com/abc123')).toBeNull();
  });

  it('rejette une URL sans ID après le domaine', () => {
    expect(normalizeGeniallyUrl('https://view.genially.com/')).toBeNull();
    expect(normalizeGeniallyUrl('https://view.genially.com')).toBeNull();
  });
});

describe('normalizeGeniallyUrl — code iframe (guillemets doubles)', () => {
  it('extrait l\'URL depuis un code iframe minimal', () => {
    const input = '<iframe src="https://view.genially.com/abc123"></iframe>';
    expect(normalizeGeniallyUrl(input)).toBe('https://view.genially.com/abc123');
  });

  it('extrait l\'URL depuis le code d\'intégration complet fourni par Genially', () => {
    const input = [
      '<div style="width: 100%;">',
      '<div style="position: relative; padding-bottom: 56.25%; height: 0;">',
      '<iframe title="Ma présentation" frameborder="0" width="1200" height="675"',
      'style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"',
      'src="https://view.genially.com/6508e4d1234567890abcdef0"',
      'type="text/html" allowscriptaccess="always" allowfullscreen="true"',
      'scrolling="yes" allownetworking="all"></iframe>',
      '</div></div>',
    ].join(' ');
    expect(normalizeGeniallyUrl(input)).toBe('https://view.genially.com/6508e4d1234567890abcdef0');
  });

  it('retourne null si le src de l\'iframe ne pointe pas vers Genially', () => {
    const input = '<iframe src="https://vimeo.com/abc123"></iframe>';
    expect(normalizeGeniallyUrl(input)).toBeNull();
  });

  it('retourne null pour un iframe sans attribut src', () => {
    const input = '<iframe title="test" width="100%"></iframe>';
    expect(normalizeGeniallyUrl(input)).toBeNull();
  });
});

describe('normalizeGeniallyUrl — code iframe (guillemets simples)', () => {
  it('extrait l\'URL depuis un iframe avec guillemets simples', () => {
    const input = "<iframe src='https://view.genially.com/abc123'></iframe>";
    expect(normalizeGeniallyUrl(input)).toBe('https://view.genially.com/abc123');
  });

  it('extrait l\'URL depuis un iframe complet avec guillemets simples', () => {
    const input = "<iframe src='https://view.genially.com/abc123' width='100%' height='600'></iframe>";
    expect(normalizeGeniallyUrl(input)).toBe('https://view.genially.com/abc123');
  });
});

// ─── isValidGeniallyUrl ──────────────────────────────────────────────────────

describe('isValidGeniallyUrl', () => {
  it('retourne true pour une URL Genially valide', () => {
    expect(isValidGeniallyUrl('https://view.genially.com/abc123')).toBe(true);
  });

  it('retourne false pour null', () => {
    expect(isValidGeniallyUrl(null)).toBe(false);
  });

  it('retourne false pour une chaîne vide', () => {
    expect(isValidGeniallyUrl('')).toBe(false);
  });

  it('retourne false pour une URL non-Genially', () => {
    expect(isValidGeniallyUrl('https://www.youtube.com/watch?v=abc')).toBe(false);
  });

  it('retourne false pour un code iframe (non encore normalisé)', () => {
    // Les URLs stockées en base sont déjà normalisées — un iframe brut ne doit pas passer
    const raw = '<iframe src="https://view.genially.com/abc123"></iframe>';
    expect(isValidGeniallyUrl(raw)).toBe(false);
  });

  it('retourne false pour une URL javascript:', () => {
    expect(isValidGeniallyUrl('javascript:alert(1)')).toBe(false);
  });
});
