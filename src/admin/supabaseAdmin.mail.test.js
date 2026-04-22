import { sendWelcomeEmail, sendParentAttachEmail } from './supabaseAdmin';

const ADMIN_ID = '99999999-8888-7777-6666-555555555555';

function mockFetchOnce({ ok = true, status = 200, body = {} } = {}) {
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
  // Les 2 fonctions mail appellent requireAdminId() qui lit la session admin.
  sessionStorage.setItem('admin_session', JSON.stringify({ id: ADMIN_ID, identifiant: 'admin' }));
});

afterEach(() => {
  jest.restoreAllMocks();
  sessionStorage.clear();
});

describe('sendWelcomeEmail', () => {
  test('POST vers /functions/v1/send-welcome-email avec kind:welcome', async () => {
    const calls = mockFetchOnce({ body: { ok: true, id: 'abc' } });
    await sendWelcomeEmail({
      email: 'test@test.fr', prenom: 'Sarah', nom: 'Dupont',
      identifiant: 'SaD1234', tempPassword: 'Pwd!abcd',
      classeNom: '6e A',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toMatch(/\/functions\/v1\/send-welcome-email$/);
    expect(calls[0].options.method).toBe('POST');
    expect(calls[0].body.kind).toBe('welcome');
    expect(calls[0].body.email).toBe('test@test.fr');
    expect(calls[0].body.prenom).toBe('Sarah');
    expect(calls[0].body.identifiant).toBe('SaD1234');
    expect(calls[0].body.tempPassword).toBe('Pwd!abcd');
    expect(calls[0].body.classeNom).toBe('6e A');
  });

  test('parents omis → envoyé comme tableau vide côté Edge', async () => {
    const calls = mockFetchOnce();
    await sendWelcomeEmail({
      email: 'e@e.f', prenom: 'P', nom: 'N',
      identifiant: 'PnN0001', tempPassword: 'x',
    });
    expect(calls[0].body.parents).toEqual([]);
  });

  test('parents fournis → transmis tels quels', async () => {
    const calls = mockFetchOnce();
    const parents = [
      { label: 'M. Dupont', identifiant: 'JmD4821', password: 'Xk3!abcd' },
      { label: 'Mme Durand', identifiant: 'MaD7193', password: 'Py9@wxyz' },
    ];
    await sendWelcomeEmail({
      email: 'e@e.f', prenom: 'Sarah', nom: 'Dupont',
      identifiant: 'SaD0001', tempPassword: 'temp', parents,
    });
    expect(calls[0].body.parents).toEqual(parents);
  });

  test('parents non-tableau (valeur invalide) → normalisé en []', async () => {
    const calls = mockFetchOnce();
    await sendWelcomeEmail({
      email: 'e@e.f', prenom: 'P', nom: 'N',
      identifiant: 'X', tempPassword: 'y',
      parents: 'pas-un-tableau',
    });
    expect(calls[0].body.parents).toEqual([]);
  });

  test('throw si la Edge function répond en erreur', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(sendWelcomeEmail({
      email: 'e@e.f', prenom: 'P', nom: 'N',
      identifiant: 'X', tempPassword: 'y',
    })).rejects.toThrow(/Erreur envoi email 500/);
  });

  test('envoie le header x-admin-id pour authentifier l\'appel côté Edge', async () => {
    const calls = mockFetchOnce();
    await sendWelcomeEmail({
      email: 'e@e.f', prenom: 'P', nom: 'N',
      identifiant: 'X', tempPassword: 'y',
    });
    expect(calls[0].options.headers['x-admin-id']).toBe(ADMIN_ID);
  });

  test('throw si aucune session admin en sessionStorage', async () => {
    sessionStorage.clear();
    await expect(sendWelcomeEmail({
      email: 'e@e.f', prenom: 'P', nom: 'N',
      identifiant: 'X', tempPassword: 'y',
    })).rejects.toThrow(/Session admin invalide/);
  });
});

describe('sendParentAttachEmail', () => {
  test('POST avec kind:attach et les champs spécifiques au rattachement', async () => {
    const calls = mockFetchOnce({ body: { ok: true, id: 'xyz' } });
    await sendParentAttachEmail({
      email: 'parent@test.fr',
      foyerLabel: 'M. et Mme Dupont',
      identifiant: 'JmD4821',
      elevePrenom: 'Ali',
      eleveNom: 'Dupont',
      classeNom: '4e B',
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].body.kind).toBe('attach');
    expect(calls[0].body.email).toBe('parent@test.fr');
    expect(calls[0].body.foyerLabel).toBe('M. et Mme Dupont');
    expect(calls[0].body.identifiant).toBe('JmD4821');
    expect(calls[0].body.elevePrenom).toBe('Ali');
    expect(calls[0].body.eleveNom).toBe('Dupont');
    expect(calls[0].body.classeNom).toBe('4e B');
  });

  test('pas de `parents`/`tempPassword` transmis (sanity : pas de fuite depuis l\'appelant)', async () => {
    const calls = mockFetchOnce();
    await sendParentAttachEmail({
      email: 'x@y.z',
      foyerLabel: 'M. X',
      identifiant: 'X',
      elevePrenom: 'E', eleveNom: 'L',
    });
    expect(calls[0].body.tempPassword).toBeUndefined();
    expect(calls[0].body.parents).toBeUndefined();
  });

  test('throw si la Edge function répond en erreur', async () => {
    mockFetchOnce({ ok: false, status: 400 });
    await expect(sendParentAttachEmail({
      email: 'x@y.z',
      foyerLabel: 'M. X', identifiant: 'X',
      elevePrenom: 'E', eleveNom: 'L',
    })).rejects.toThrow(/Erreur envoi email \(attach\) 400/);
  });
});
