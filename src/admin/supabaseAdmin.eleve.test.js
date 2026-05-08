import { fetchNotesEleve, fetchRetardsAbsencesEleve, fetchObservationsEleve } from './supabaseAdmin';

const ELEVE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const ADMIN_ID = '11111111-2222-3333-4444-555555555555';
// Phase 3 : les RPCs admin_* prennent un token, pas un UUID.
const ADMIN_TOKEN = 'test-admin-token-' + 'f'.repeat(48);

function mockFetchOnce({ ok = true, status = 200, body = [] } = {}) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: ok && status < 400,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

beforeEach(() => {
  // requireAdminId() lit sessionStorage.admin_session — Jest+jsdom fournit déjà
  // un sessionStorage fonctionnel, on y pose juste une session admin de test.
  sessionStorage.setItem('admin_session', JSON.stringify({ id: ADMIN_ID, token: ADMIN_TOKEN }));
});

afterEach(() => {
  jest.resetAllMocks();
  sessionStorage.clear();
});

// Phase RLS #2.C : les 3 wrappers passent désormais par RPC SECURITY DEFINER
// (`admin_fetch_notes_eleve`, `admin_fetch_observations_eleve`,
// `admin_fetch_retards_absences_eleve`) au lieu de fetch REST direct.

describe('fetchNotesEleve', () => {
  test('appelle la RPC admin_fetch_notes_eleve avec p_admin_id + p_eleve_id', async () => {
    mockFetchOnce({ body: [] });
    await fetchNotesEleve(ELEVE_ID);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/admin_fetch_notes_eleve');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(body.p_eleve_id).toBe(ELEVE_ID);
  });

  test('rejette un eleveId non-UUID (defense-in-depth contre injection)', async () => {
    global.fetch = jest.fn();
    await expect(fetchNotesEleve('not-a-uuid')).rejects.toThrow(/eleveId invalide/);
    await expect(fetchNotesEleve('xxx&select=*&fake=')).rejects.toThrow(/eleveId invalide/);
    await expect(fetchNotesEleve(null)).rejects.toThrow(/eleveId invalide/);
    await expect(fetchNotesEleve(undefined)).rejects.toThrow(/eleveId invalide/);
    await expect(fetchNotesEleve(123)).rejects.toThrow(/eleveId invalide/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('normalise plusieurs lignes en gardant l\'ordre', async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 4, absent: false, commentaire: null, created_at: '2026-03-15T10:00:00Z',
          evaluation_id: 'e1', eval_titre: 'Récitation', eval_date: '2026-03-15', eval_score_max: 4 },
        { id: 'n2', score: 2, absent: false, commentaire: 'À retravailler', created_at: '2026-02-10T10:00:00Z',
          evaluation_id: 'e2', eval_titre: 'Vocabulaire', eval_date: '2026-02-10', eval_score_max: 4 },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows).toHaveLength(2);
    expect(rows[0].evaluation.date).toBe('2026-03-15');
    expect(rows[1].evaluation.date).toBe('2026-02-10');
  });

  test('reformate evaluation_id/eval_titre/eval_date en evaluation imbriquée', async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 4, absent: false, commentaire: 'Excellent', created_at: '2026-03-15T10:00:00Z',
          evaluation_id: 'e1', eval_titre: 'Récitation', eval_date: '2026-03-15', eval_score_max: 4 },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0].evaluation).toEqual({ id: 'e1', titre: 'Récitation', date: '2026-03-15' });
  });

  test('garde evaluation à null si evaluation_id est null', async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 3, absent: false, commentaire: null, created_at: '2026-03-15T10:00:00Z',
          evaluation_id: null, eval_titre: null, eval_date: null, eval_score_max: null },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows[0].evaluation).toBeNull();
  });

  test('préserve les champs score, absent, commentaire', async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 2, absent: true, commentaire: 'Absent justifié', created_at: '2026-03-15T10:00:00Z',
          evaluation_id: null, eval_titre: null, eval_date: null, eval_score_max: null },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows[0]).toMatchObject({ id: 'n1', score: 2, absent: true, commentaire: 'Absent justifié' });
  });

  test('renvoie un tableau vide si aucune note', async () => {
    mockFetchOnce({ body: [] });
    expect(await fetchNotesEleve(ELEVE_ID)).toEqual([]);
  });

  test('throw sur erreur HTTP', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(fetchNotesEleve(ELEVE_ID)).rejects.toThrow(/Erreur 500/);
  });
});

describe('fetchRetardsAbsencesEleve', () => {
  test('appelle la RPC admin_fetch_retards_absences_eleve avec p_admin_id + p_eleve_id', async () => {
    mockFetchOnce({ body: [] });
    await fetchRetardsAbsencesEleve(ELEVE_ID);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/admin_fetch_retards_absences_eleve');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(body.p_eleve_id).toBe(ELEVE_ID);
  });

  test('rejette un eleveId non-UUID', async () => {
    global.fetch = jest.fn();
    await expect(fetchRetardsAbsencesEleve('inj&q=1')).rejects.toThrow(/eleveId invalide/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('renvoie les données telles quelles', async () => {
    const items = [
      { id: 'a1', type: 'retard',  date: '2026-04-01', commentaire: '10 min de retard' },
      { id: 'a2', type: 'absence', date: '2026-03-20', commentaire: null },
    ];
    mockFetchOnce({ body: items });
    expect(await fetchRetardsAbsencesEleve(ELEVE_ID)).toEqual(items);
  });

  test('throw sur erreur HTTP', async () => {
    mockFetchOnce({ ok: false, status: 503 });
    await expect(fetchRetardsAbsencesEleve(ELEVE_ID)).rejects.toThrow(/Erreur 503/);
  });
});

describe('fetchObservationsEleve', () => {
  test('appelle la RPC admin_fetch_observations_eleve avec p_admin_id + p_eleve_id', async () => {
    mockFetchOnce({ body: [] });
    await fetchObservationsEleve(ELEVE_ID);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/admin_fetch_observations_eleve');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(body.p_eleve_id).toBe(ELEVE_ID);
  });

  test('rejette un eleveId non-UUID', async () => {
    global.fetch = jest.fn();
    await expect(fetchObservationsEleve('')).rejects.toThrow(/eleveId invalide/);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('renvoie les données telles quelles', async () => {
    const items = [
      { id: 'o1', type: 'general',      contenu: 'Très impliqué',  created_at: '2026-04-10T12:00:00Z' },
      { id: 'o2', type: 'comportement', contenu: 'Bavarde en cours', created_at: '2026-04-05T09:00:00Z' },
      { id: 'o3', type: 'progression',  contenu: 'Progresse bien',  created_at: '2026-04-01T08:00:00Z' },
    ];
    mockFetchOnce({ body: items });
    expect(await fetchObservationsEleve(ELEVE_ID)).toEqual(items);
  });

  test('throw sur erreur HTTP', async () => {
    mockFetchOnce({ ok: false, status: 401 });
    await expect(fetchObservationsEleve(ELEVE_ID)).rejects.toThrow(/Erreur 401/);
  });
});
