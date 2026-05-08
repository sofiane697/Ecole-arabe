import { adminFetchDeclarations, adminCountNouvellesDeclarations, adminMarkDeclarationsVues } from './supabaseAdmin';

const ADMIN_ID = '99999999-8888-7777-6666-555555555555';
// Phase 3 : les RPCs admin_* prennent un token, pas un UUID.
const ADMIN_TOKEN = 'test-admin-token-' + 'a'.repeat(48);

function mockRpc({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  global.fetch = jest.fn((url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return Promise.resolve({
      ok, status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(''),
    });
  });
  return calls;
}

beforeEach(() => {
  sessionStorage.setItem('admin_session', JSON.stringify({ id: ADMIN_ID, identifiant: 'admin', token: ADMIN_TOKEN }));
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

// ─── adminFetchDeclarations ───────────────────────────────────────────────────

describe('adminFetchDeclarations', () => {
  test('appelle admin_fetch_declarations avec p_admin_id et pagination par défaut', async () => {
    const calls = mockRpc({ body: [] });
    await adminFetchDeclarations();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/admin_fetch_declarations$/);
    expect(calls[0].body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(calls[0].body.p_limit).toBe(25);
    expect(calls[0].body.p_offset).toBe(0);
  });

  test('transmet les paramètres de pagination personnalisés', async () => {
    const calls = mockRpc({ body: [] });
    await adminFetchDeclarations({ limit: 10, offset: 50 });
    expect(calls[0].body.p_limit).toBe(10);
    expect(calls[0].body.p_offset).toBe(50);
  });

  test('throw si la RPC répond en erreur', async () => {
    mockRpc({ ok: false, status: 403, body: { message: 'Accès refusé' } });
    await expect(adminFetchDeclarations()).rejects.toThrow('Accès refusé');
  });

  test('retourne les lignes si la RPC réussit', async () => {
    const rows = [
      { id: 'a', eleve_prenom: 'Ali', eleve_nom: 'Martin', type: 'retard', date: '2026-05-01', vue_admin: false, total_count: 1 },
    ];
    mockRpc({ body: rows });
    const result = await adminFetchDeclarations();
    expect(result).toHaveLength(1);
    expect(result[0].eleve_prenom).toBe('Ali');
  });

  test('throw si aucune session admin', async () => {
    sessionStorage.clear();
    await expect(adminFetchDeclarations()).rejects.toThrow(/Session admin invalide/);
  });
});

// ─── adminCountNouvellesDeclarations ─────────────────────────────────────────

describe('adminCountNouvellesDeclarations', () => {
  test('appelle admin_count_nouvelles_declarations avec p_admin_id', async () => {
    const calls = mockRpc({ body: 3 });
    await adminCountNouvellesDeclarations();
    expect(calls[0].url).toMatch(/\/rpc\/admin_count_nouvelles_declarations$/);
    expect(calls[0].body.p_admin_token).toBe(ADMIN_TOKEN);
  });

  test('retourne le nombre de déclarations non vues', async () => {
    mockRpc({ body: 7 });
    const count = await adminCountNouvellesDeclarations();
    expect(count).toBe(7);
  });

  test('retourne 0 si la RPC répond en erreur', async () => {
    mockRpc({ ok: false, status: 500 });
    const count = await adminCountNouvellesDeclarations();
    expect(count).toBe(0);
  });

  test('retourne 0 si la RPC retourne une valeur non numérique', async () => {
    mockRpc({ body: null });
    const count = await adminCountNouvellesDeclarations();
    expect(count).toBe(0);
  });

  test('throw si aucune session admin', async () => {
    sessionStorage.clear();
    await expect(adminCountNouvellesDeclarations()).rejects.toThrow(/Session admin invalide/);
  });
});

// ─── adminMarkDeclarationsVues ────────────────────────────────────────────────

describe('adminMarkDeclarationsVues', () => {
  test('appelle admin_mark_declarations_vues avec p_admin_id', async () => {
    const calls = mockRpc({ body: null });
    await adminMarkDeclarationsVues();
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/admin_mark_declarations_vues$/);
    expect(calls[0].body.p_admin_token).toBe(ADMIN_TOKEN);
  });

  test('ne throw pas si la RPC répond en erreur (fire-and-forget)', async () => {
    mockRpc({ ok: false, status: 500, body: {} });
    await expect(adminMarkDeclarationsVues()).resolves.not.toThrow();
  });

  test('throw si aucune session admin', async () => {
    sessionStorage.clear();
    await expect(adminMarkDeclarationsVues()).rejects.toThrow(/Session admin invalide/);
  });
});
