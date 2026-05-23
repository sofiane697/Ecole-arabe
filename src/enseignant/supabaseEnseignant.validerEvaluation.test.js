import { validerEvaluation } from './supabaseEnseignant';

const FAKE_TOKEN = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const EVAL_ID    = '11111111-2222-3333-4444-555555555555';

function mockRpc({ ok = true, status = 200, body = null } = {}) {
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
  sessionStorage.setItem('enseignant_user', JSON.stringify({ session_token: FAKE_TOKEN }));
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

describe('validerEvaluation', () => {
  test('appelle valider_evaluation_secure avec token, eval_id et flag valider=true', async () => {
    const calls = mockRpc({ body: '2026-05-23T14:30:00.000Z' });
    await validerEvaluation(EVAL_ID, true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/valider_evaluation_secure$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].body).toEqual({
      p_token: FAKE_TOKEN,
      p_evaluation_id: EVAL_ID,
      p_valider: true,
    });
  });

  test('passe p_valider=false pour dévalider', async () => {
    const calls = mockRpc({ body: null });
    await validerEvaluation(EVAL_ID, false);
    expect(calls[0].body.p_valider).toBe(false);
  });

  test('retourne le timestamp ISO renvoyé par la RPC quand on valide', async () => {
    mockRpc({ body: '2026-05-23T14:30:00.000Z' });
    const result = await validerEvaluation(EVAL_ID, true);
    expect(result).toBe('2026-05-23T14:30:00.000Z');
  });

  test('retourne null quand on dévalide', async () => {
    mockRpc({ body: null });
    const result = await validerEvaluation(EVAL_ID, false);
    expect(result).toBeNull();
  });

  test('throw "Session expirée" si aucun token en sessionStorage', async () => {
    sessionStorage.clear();
    await expect(validerEvaluation(EVAL_ID, true)).rejects.toThrow('Session expirée');
  });

  test('throw avec le message du serveur si la RPC répond en erreur', async () => {
    mockRpc({ ok: false, status: 403, body: { message: 'Modification interdite' } });
    await expect(validerEvaluation(EVAL_ID, true)).rejects.toThrow(/Modification interdite/);
  });

  test('throw message générique si l\'API renvoie un statut sans message', async () => {
    mockRpc({ ok: false, status: 500, body: {} });
    await expect(validerEvaluation(EVAL_ID, true)).rejects.toThrow(/Erreur 500/);
  });
});
