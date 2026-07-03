import { uploadElevePhoto, deleteElevePhoto } from './supabaseAdmin';

const ELEVE_ID = '11111111-2222-3333-4444-555555555555';
const ADMIN_ID = '99999999-8888-7777-6666-555555555555';
const ADMIN_TOKEN = 'tok-test-0123456789abcdef0123456789abcdef';

function makeFile({ name = 'photo.jpg', type = 'image/jpeg', size = 1024 } = {}) {
  const content = 'x'.repeat(size);
  return new File([content], name, { type });
}

/** Mock fetch — retourne successivement les réponses fournies. */
function mockFetchSequence(responses) {
  const calls = [];
  global.fetch = jest.fn((url, options) => {
    calls.push({ url, options });
    const next = responses.shift();
    const status = next?.status ?? (next?.ok !== false ? 200 : 500);
    return Promise.resolve({
      ok: next?.ok !== false && status < 400,
      status,
      json: () => Promise.resolve(next?.body ?? {}),
    });
  });
  return calls;
}

beforeEach(() => {
  sessionStorage.setItem('admin_session', JSON.stringify({ id: ADMIN_ID, token: ADMIN_TOKEN, identifiant: 'admin' }));
});

afterEach(() => {
  sessionStorage.clear();
  jest.resetAllMocks();
});

describe('uploadElevePhoto — validation côté client', () => {
  beforeEach(() => { global.fetch = jest.fn(); });

  test('rejette quand aucun fichier fourni', async () => {
    await expect(uploadElevePhoto(ELEVE_ID, null)).rejects.toThrow(/Aucun fichier/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejette un fichier non-image', async () => {
    const pdf = makeFile({ name: 'doc.pdf', type: 'application/pdf' });
    await expect(uploadElevePhoto(ELEVE_ID, pdf)).rejects.toThrow(/image/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejette une extension non autorisée', async () => {
    const gif = makeFile({ name: 'anim.gif', type: 'image/gif' });
    await expect(uploadElevePhoto(ELEVE_ID, gif)).rejects.toThrow(/Format/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejette un fichier trop lourd (> 3 Mo)', async () => {
    const big = makeFile({ name: 'gros.jpg', type: 'image/jpeg', size: 3 * 1024 * 1024 + 1 });
    await expect(uploadElevePhoto(ELEVE_ID, big)).rejects.toThrow(/3 Mo/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('rejette si la session admin est absente', async () => {
    sessionStorage.clear();
    const jpg = makeFile({ name: 'photo.jpg', type: 'image/jpeg' });
    await expect(uploadElevePhoto(ELEVE_ID, jpg)).rejects.toThrow(/Session admin/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('uploadElevePhoto — appel Edge Function', () => {
  test('appelle bien /functions/v1/eleve-photo avec les bons headers', async () => {
    const calls = mockFetchSequence([
      { ok: true, body: {
        photo_url: 'https://test.supabase.co/storage/v1/object/public/eleves-photos/profiles/abc/photo-1.jpg',
        photo_path: 'profiles/abc/photo-1.jpg',
      } },
    ]);
    const jpg = makeFile({ name: 'photo.jpg', type: 'image/jpeg' });
    const result = await uploadElevePhoto(ELEVE_ID, jpg);

    expect(calls.length).toBe(1);
    expect(calls[0].url).toMatch(/\/functions\/v1\/eleve-photo$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].options.headers['x-admin-token']).toBe(ADMIN_TOKEN);
    expect(calls[0].options.headers['x-op']).toBe('upload');
    expect(calls[0].options.headers['x-eleve-id']).toBe(ELEVE_ID);
    expect(calls[0].options.headers['x-ext']).toBe('jpg');
    expect(calls[0].options.headers['Content-Type']).toBe('image/jpeg');
    expect(calls[0].options.headers['apikey']).toBeDefined();

    expect(result).toHaveProperty('photo_url');
    expect(result).toHaveProperty('photo_path');
  });

  test('accepte .jpeg, .png, .webp', async () => {
    for (const { name, type, ext } of [
      { name: 'a.jpeg', type: 'image/jpeg', ext: 'jpeg' },
      { name: 'a.png',  type: 'image/png',  ext: 'png'  },
      { name: 'a.webp', type: 'image/webp', ext: 'webp' },
    ]) {
      const calls = mockFetchSequence([{ ok: true, body: { photo_url: 'x', photo_path: 'y' } }]);
      await uploadElevePhoto(ELEVE_ID, makeFile({ name, type }));
      expect(calls[0].options.headers['x-ext']).toBe(ext);
    }
  });

  test('propage l\'erreur retournée par l\'Edge Function', async () => {
    mockFetchSequence([
      { ok: false, status: 401, body: { error: 'Unauthorized' } },
    ]);
    const jpg = makeFile({ name: 'photo.jpg', type: 'image/jpeg' });
    await expect(uploadElevePhoto(ELEVE_ID, jpg)).rejects.toThrow(/Unauthorized/);
  });

  test('gère un body JSON absent (erreur générique avec le status)', async () => {
    global.fetch = jest.fn(() => Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('no body')),
    }));
    const jpg = makeFile({ name: 'photo.jpg', type: 'image/jpeg' });
    await expect(uploadElevePhoto(ELEVE_ID, jpg)).rejects.toThrow(/500/);
  });
});

describe('deleteElevePhoto — appel Edge Function', () => {
  test('appelle /functions/v1/eleve-photo avec op=delete', async () => {
    const calls = mockFetchSequence([{ ok: true, body: { ok: true } }]);
    await deleteElevePhoto(ELEVE_ID);
    expect(calls.length).toBe(1);
    expect(calls[0].url).toMatch(/\/functions\/v1\/eleve-photo$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].options.headers['x-op']).toBe('delete');
    expect(calls[0].options.headers['x-eleve-id']).toBe(ELEVE_ID);
    expect(calls[0].options.headers['x-admin-token']).toBe(ADMIN_TOKEN);
  });

  test('rejette si la session admin est absente', async () => {
    sessionStorage.clear();
    global.fetch = jest.fn();
    await expect(deleteElevePhoto(ELEVE_ID)).rejects.toThrow(/Session admin/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('propage l\'erreur retournée par l\'Edge Function', async () => {
    mockFetchSequence([
      { ok: false, status: 401, body: { error: 'Unauthorized' } },
    ]);
    await expect(deleteElevePhoto(ELEVE_ID)).rejects.toThrow(/Unauthorized/);
  });
});
