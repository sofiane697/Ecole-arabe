import { fetchNotesEleve, fetchRetardsAbsencesEleve, fetchObservationsEleve, adminCreateObservation, adminCreateRetardAbsence } from './supabaseAdmin';

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

const CLASSE_ID = 'cccccccc-dddd-eeee-ffff-000000000000';

describe('adminCreateObservation', () => {
  test('appelle admin_create_observation avec les bons paramètres', async () => {
    mockFetchOnce({ body: 'new-uuid-obs' });
    await adminCreateObservation({ eleve_id: ELEVE_ID, classe_id: CLASSE_ID, type: 'general', contenu: 'Très sérieux' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/admin_create_observation');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(body.p_eleve_id).toBe(ELEVE_ID);
    expect(body.p_classe_id).toBe(CLASSE_ID);
    expect(body.p_type).toBe('general');
    expect(body.p_contenu).toBe('Très sérieux');
  });

  test('passe p_classe_id à null si classe_id est undefined', async () => {
    mockFetchOnce({ body: 'new-uuid-obs' });
    await adminCreateObservation({ eleve_id: ELEVE_ID, classe_id: undefined, type: 'comportement', contenu: 'OK' });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.p_classe_id).toBeNull();
  });

  test('accepte les 3 types valides', async () => {
    for (const type of ['general', 'comportement', 'progression']) {
      mockFetchOnce({ body: 'uuid' });
      await adminCreateObservation({ eleve_id: ELEVE_ID, classe_id: null, type, contenu: 'test' });
      const body = JSON.parse(global.fetch.mock.calls.at(-1)[1].body);
      expect(body.p_type).toBe(type);
    }
  });

  test('throw sur erreur HTTP', async () => {
    mockFetchOnce({ ok: false, status: 403 });
    await expect(adminCreateObservation({ eleve_id: ELEVE_ID, classe_id: null, type: 'general', contenu: 'x' }))
      .rejects.toThrow(/Erreur ajout appréciation/);
  });
});

describe('adminCreateRetardAbsence', () => {
  test('appelle admin_create_retard_absence avec les bons paramètres', async () => {
    mockFetchOnce({ body: 'new-uuid-abs' });
    await adminCreateRetardAbsence({ eleve_id: ELEVE_ID, classe_id: CLASSE_ID, type: 'retard', date: '2026-05-20', commentaire: '10 min' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/rest/v1/rpc/admin_create_retard_absence');
    expect(opts.method).toBe('POST');
    const body = JSON.parse(opts.body);
    expect(body.p_admin_token).toBe(ADMIN_TOKEN);
    expect(body.p_eleve_id).toBe(ELEVE_ID);
    expect(body.p_classe_id).toBe(CLASSE_ID);
    expect(body.p_type).toBe('retard');
    expect(body.p_date).toBe('2026-05-20');
    expect(body.p_commentaire).toBe('10 min');
  });

  test('passe p_commentaire à null si commentaire est undefined', async () => {
    mockFetchOnce({ body: 'new-uuid-abs' });
    await adminCreateRetardAbsence({ eleve_id: ELEVE_ID, classe_id: null, type: 'absence', date: '2026-05-21', commentaire: undefined });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.p_commentaire).toBeNull();
  });

  test('passe p_classe_id à null si classe_id est undefined', async () => {
    mockFetchOnce({ body: 'new-uuid-abs' });
    await adminCreateRetardAbsence({ eleve_id: ELEVE_ID, classe_id: undefined, type: 'retard', date: '2026-05-22', commentaire: null });
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.p_classe_id).toBeNull();
  });

  test('throw sur erreur HTTP', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(adminCreateRetardAbsence({ eleve_id: ELEVE_ID, classe_id: null, type: 'absence', date: '2026-05-20', commentaire: null }))
      .rejects.toThrow(/Erreur ajout retard\/absence/);
  });
});
