import { fetchNotesEleve, fetchRetardsAbsencesEleve, fetchObservationsEleve } from './supabaseAdmin';

const ELEVE_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function mockFetchOnce({ ok = true, status = 200, body = [] } = {}) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: ok && status < 400,
      status,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('fetchNotesEleve', () => {
  test("appelle /rest/v1/notes filtré par eleve_id avec la jointure évaluations", async () => {
    mockFetchOnce({ body: [] });
    await fetchNotesEleve(ELEVE_ID);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/rest/v1/notes');
    expect(url).toContain(`eleve_id=eq.${ELEVE_ID}`);
    expect(url).toContain('evaluation:evaluations');
    expect(url).toContain('order=created_at.desc');
    expect(url).toContain('limit=500');
    expect(url).toMatch(/select=[^&]*\bcommentaire\b/);
    expect(url).toMatch(/select=[^&]*\babsent\b/);
  });

  test('rejette un eleveId non-UUID (defense-in-depth contre injection PostgREST)', async () => {
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
        { id: 'n1', score: 4, absent: false, commentaire: null,
          evaluation: { id: 'e1', titre: 'Récitation', date_evaluation: '2026-03-15' } },
        { id: 'n2', score: 2, absent: false, commentaire: 'À retravailler',
          evaluation: { id: 'e2', titre: 'Vocabulaire', date_evaluation: '2026-02-10' } },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows).toHaveLength(2);
    expect(rows[0].evaluation.date).toBe('2026-03-15');
    expect(rows[1].evaluation.date).toBe('2026-02-10');
    expect(rows[0].evaluation.date_evaluation).toBeUndefined();
    expect(rows[1].evaluation.date_evaluation).toBeUndefined();
  });

  test('normalise date_evaluation → date dans evaluation', async () => {
    mockFetchOnce({
      body: [
        {
          id: 'n1', score: 4, absent: false, commentaire: 'Excellent',
          evaluation: { id: 'e1', titre: 'Récitation', date_evaluation: '2026-03-15' },
        },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows).toHaveLength(1);
    expect(rows[0].evaluation).toEqual({ id: 'e1', titre: 'Récitation', date: '2026-03-15' });
    expect(rows[0].evaluation.date_evaluation).toBeUndefined();
  });

  test("garde evaluation à null si l'évaluation a été supprimée", async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 3, absent: false, commentaire: null, evaluation: null },
      ],
    });
    const rows = await fetchNotesEleve(ELEVE_ID);
    expect(rows[0].evaluation).toBeNull();
  });

  test('préserve les champs score, absent, commentaire', async () => {
    mockFetchOnce({
      body: [
        { id: 'n1', score: 2, absent: true, commentaire: 'Absent justifié', evaluation: null },
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
  test('appelle /rest/v1/retards_absences filtré par eleve_id, trié par date desc, limit 500', async () => {
    mockFetchOnce({ body: [] });
    await fetchRetardsAbsencesEleve(ELEVE_ID);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/rest/v1/retards_absences');
    expect(url).toContain(`eleve_id=eq.${ELEVE_ID}`);
    expect(url).toContain('order=date.desc');
    expect(url).toContain('limit=500');
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
  test('appelle /rest/v1/observations filtré par eleve_id, trié par created_at desc, limit 500', async () => {
    mockFetchOnce({ body: [] });
    await fetchObservationsEleve(ELEVE_ID);
    const url = global.fetch.mock.calls[0][0];
    expect(url).toContain('/rest/v1/observations');
    expect(url).toContain(`eleve_id=eq.${ELEVE_ID}`);
    expect(url).toContain('order=created_at.desc');
    expect(url).toContain('limit=500');
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
