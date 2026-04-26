import { createDeclarationParent, fetchDeclarationsParent } from './supabaseParent';

const FAKE_TOKEN = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const ELEVE_ID   = '11111111-2222-3333-4444-555555555555';

function mockRpc({ ok = true, status = 200, body = {} } = {}) {
  const calls = [];
  global.fetch = jest.fn((url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return Promise.resolve({
      ok, status,
      json: () => Promise.resolve(body),
    });
  });
  return calls;
}

beforeEach(() => {
  sessionStorage.setItem('parent_user', JSON.stringify({ session_token: FAKE_TOKEN }));
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

// ─── createDeclarationParent ─────────────────────────────────────────────────

describe('createDeclarationParent', () => {
  test('appelle create_declaration_parent avec les bons paramètres (absence)', async () => {
    const calls = mockRpc({ body: { success: true, id: 'decl-uuid' } });
    await createDeclarationParent({
      eleveId: ELEVE_ID,
      type: 'absence',
      date: '2026-05-10',
      heurePrevue: null,
      motif: 'Maladie',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/create_declaration_parent$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].body.p_token).toBe(FAKE_TOKEN);
    expect(calls[0].body.p_eleve_id).toBe(ELEVE_ID);
    expect(calls[0].body.p_type).toBe('absence');
    expect(calls[0].body.p_date).toBe('2026-05-10');
    expect(calls[0].body.p_heure_prevue).toBeNull();
    expect(calls[0].body.p_motif).toBe('Maladie');
  });

  test('transmet heure_prevue pour un retard', async () => {
    const calls = mockRpc({ body: { success: true, id: 'decl-uuid' } });
    await createDeclarationParent({
      eleveId: ELEVE_ID,
      type: 'retard',
      date: '2026-05-10',
      heurePrevue: '09:30',
      motif: null,
    });
    expect(calls[0].body.p_heure_prevue).toBe('09:30');
    expect(calls[0].body.p_motif).toBeNull();
  });

  test('remplace heurePrevue vide par null', async () => {
    const calls = mockRpc({ body: { success: true, id: 'decl-uuid' } });
    await createDeclarationParent({
      eleveId: ELEVE_ID, type: 'retard', date: '2026-05-10',
      heurePrevue: '', motif: '',
    });
    expect(calls[0].body.p_heure_prevue).toBeNull();
    expect(calls[0].body.p_motif).toBeNull();
  });

  test('retourne les données de la RPC', async () => {
    mockRpc({ body: { success: true, id: 'decl-uuid-abc' } });
    const result = await createDeclarationParent({
      eleveId: ELEVE_ID, type: 'absence', date: '2026-05-10',
    });
    expect(result).toEqual({ success: true, id: 'decl-uuid-abc' });
  });

  test('throw si la RPC répond en erreur', async () => {
    mockRpc({ ok: false, status: 400, body: { message: 'La date ne peut pas être dans le passé' } });
    await expect(createDeclarationParent({
      eleveId: ELEVE_ID, type: 'absence', date: '2026-01-01',
    })).rejects.toThrow('La date ne peut pas être dans le passé');
  });

  test('throw si aucune session parent en sessionStorage', async () => {
    sessionStorage.clear();
    await expect(createDeclarationParent({
      eleveId: ELEVE_ID, type: 'absence', date: '2026-05-10',
    })).rejects.toThrow('Session parent expirée');
  });
});

// ─── fetchDeclarationsParent ──────────────────────────────────────────────────

describe('fetchDeclarationsParent', () => {
  test('appelle fetch_declarations_parent avec token et eleveId', async () => {
    const calls = mockRpc({ body: [] });
    await fetchDeclarationsParent(ELEVE_ID);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/fetch_declarations_parent$/);
    expect(calls[0].body.p_token).toBe(FAKE_TOKEN);
    expect(calls[0].body.p_eleve_id).toBe(ELEVE_ID);
  });

  test('retourne { data: [], error: null } quand la RPC retourne []', async () => {
    mockRpc({ body: [] });
    const result = await fetchDeclarationsParent(ELEVE_ID);
    expect(result).toEqual({ data: [], error: null });
  });

  test('retourne les déclarations quand la RPC retourne des données', async () => {
    const decls = [
      { id: 'a', type: 'retard', date: '2026-05-10', heure_prevue: '09:30', motif: 'RDV', created_at: '2026-04-26T10:00:00Z' },
      { id: 'b', type: 'absence', date: '2026-05-11', heure_prevue: null, motif: null, created_at: '2026-04-26T11:00:00Z' },
    ];
    mockRpc({ body: decls });
    const result = await fetchDeclarationsParent(ELEVE_ID);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].type).toBe('retard');
    expect(result.data[1].type).toBe('absence');
  });

  test('retourne { data: [], error: message } si RPC en erreur', async () => {
    mockRpc({ ok: false, status: 500, body: { message: 'Erreur serveur' } });
    const result = await fetchDeclarationsParent(ELEVE_ID);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  test('retourne erreur session si pas de token', async () => {
    sessionStorage.clear();
    const result = await fetchDeclarationsParent(ELEVE_ID);
    expect(result.data).toEqual([]);
    expect(result.error).toMatch(/expir/i);
  });
});
