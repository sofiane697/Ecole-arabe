import { acknowledgeNote, fetchNoteAcks } from './supabaseParent';

const FAKE_TOKEN = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
const ELEVE_ID   = '11111111-2222-3333-4444-555555555555';
const NOTE_ID    = '99999999-8888-7777-6666-555555555555';

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

// ─── acknowledgeNote ────────────────────────────────────────────────────────

describe('acknowledgeNote', () => {
  test('appelle parent_acknowledge_note avec token + note_id', async () => {
    const calls = mockRpc({ body: { success: true } });
    await acknowledgeNote(NOTE_ID);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/parent_acknowledge_note$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].body.p_token).toBe(FAKE_TOKEN);
    expect(calls[0].body.p_note_id).toBe(NOTE_ID);
  });

  test('retourne la réponse de la RPC', async () => {
    mockRpc({ body: { success: true } });
    const result = await acknowledgeNote(NOTE_ID);
    expect(result).toEqual({ success: true });
  });

  test('throw si la RPC répond en erreur', async () => {
    mockRpc({ ok: false, status: 403, body: { message: 'Accès refusé : cette note ne correspond pas à un de vos enfants' } });
    await expect(acknowledgeNote(NOTE_ID)).rejects.toThrow(/Accès refusé/);
  });

  test('throw si aucune session parent en sessionStorage', async () => {
    sessionStorage.clear();
    await expect(acknowledgeNote(NOTE_ID)).rejects.toThrow('Session parent expirée');
  });

  test('throw avec message générique si l\'API renvoie un statut sans message', async () => {
    mockRpc({ ok: false, status: 500, body: {} });
    await expect(acknowledgeNote(NOTE_ID)).rejects.toThrow(/Erreur 500/);
  });
});

// ─── fetchNoteAcks ──────────────────────────────────────────────────────────

describe('fetchNoteAcks', () => {
  test('appelle fetch_note_acks_for_parent avec token + eleve_id', async () => {
    const calls = mockRpc({ body: [] });
    await fetchNoteAcks(ELEVE_ID);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/rpc\/fetch_note_acks_for_parent$/);
    expect(calls[0].body.p_token).toBe(FAKE_TOKEN);
    expect(calls[0].body.p_eleve_id).toBe(ELEVE_ID);
  });

  test('retourne { data: [], error: null } quand la RPC retourne []', async () => {
    mockRpc({ body: [] });
    const result = await fetchNoteAcks(ELEVE_ID);
    expect(result).toEqual({ data: [], error: null });
  });

  test('retourne les acks quand la RPC retourne des données', async () => {
    const acks = [
      { note_id: 'note-a', created_at: '2026-05-23T10:00:00Z' },
      { note_id: 'note-b', created_at: '2026-05-22T15:30:00Z' },
    ];
    mockRpc({ body: acks });
    const result = await fetchNoteAcks(ELEVE_ID);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].note_id).toBe('note-a');
    expect(result.error).toBeNull();
  });

  test('retourne { data: [], error: message } si RPC en erreur', async () => {
    mockRpc({ ok: false, status: 500, body: { message: 'Erreur serveur' } });
    const result = await fetchNoteAcks(ELEVE_ID);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  test('retourne erreur session si pas de token', async () => {
    sessionStorage.clear();
    const result = await fetchNoteAcks(ELEVE_ID);
    expect(result.data).toEqual([]);
    expect(result.error).toMatch(/expir/i);
  });

  test('retourne { data: [] } même si la RPC retourne null', async () => {
    mockRpc({ body: null });
    const result = await fetchNoteAcks(ELEVE_ID);
    expect(result.data).toEqual([]);
  });
});
