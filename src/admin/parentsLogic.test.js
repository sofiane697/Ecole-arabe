import { emptyBloc, isBlocUtilisable, checkDuplicateParentForBloc, processParentBlocs, checkDuplicatesOnSubmit, initialBlocMode, excludedParentIdsFor } from './parentsLogic';
import * as supabaseAdmin from './supabaseAdmin';

describe('emptyBloc', () => {
  test('retourne une structure avec tous les champs initialisés', () => {
    const b = emptyBloc();
    expect(b).toEqual({
      has_pere: false, pere_nom: '', pere_prenom: '',
      has_mere: false, mere_nom: '', mere_prenom: '',
      email: '', telephone: '',
      lien: 'parents',
      matchedParent: null,
      useExisting: false,
    });
  });

  test('retourne un nouvel objet à chaque appel (pas de partage de référence)', () => {
    const a = emptyBloc();
    const b = emptyBloc();
    expect(a).not.toBe(b);
    a.email = 'a@test.fr';
    expect(b.email).toBe('');
  });
});

describe('isBlocUtilisable', () => {
  test('false pour null/undefined', () => {
    expect(isBlocUtilisable(null)).toBe(false);
    expect(isBlocUtilisable(undefined)).toBe(false);
  });

  test('false si aucun parent coché', () => {
    const b = { ...emptyBloc(), email: 'a@b.c', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('false si père coché mais nom/prénom vides', () => {
    const b = { ...emptyBloc(), has_pere: true, email: 'a@b.c', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('true si seulement téléphone (email vide)', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('true si seulement email (téléphone vide)', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: 'a@b.c' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('false si ni email ni téléphone', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('true si email vide mais téléphone rempli (email = espaces)', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: '   ', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('true quand père complet + email + tel', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: 'a@b.c', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('true quand mère seule complète + email + tel', () => {
    const b = { ...emptyBloc(), has_mere: true, mere_nom: 'Durand', mere_prenom: 'Marie', email: 'a@b.c', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('true quand père + mère complets', () => {
    const b = {
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      has_mere: true, mere_nom: 'Dupont', mere_prenom: 'Marie',
      email: 'a@b.c', telephone: '06',
    };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('false si père coché avec juste un des deux champs', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', email: 'a@b.c', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('true si téléphone = espaces mais email rempli', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: 'a@b.c', telephone: '   ' };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('true quand useExisting + matchedParent, même si tous les champs sont vides', () => {
    // Cas typique : l'admin tape un email reconnu, clique "Rattacher à ce compte"
    // → les champs du formulaire ne sont pas remplis mais le bloc est valide.
    const b = {
      ...emptyBloc(),
      useExisting: true,
      matchedParent: { id: 'uuid', identifiant: 'JoM6835', email: 'x@y.z' },
    };
    expect(isBlocUtilisable(b)).toBe(true);
  });

  test('false si useExisting=true mais matchedParent=null (désynchro, fallback création)', () => {
    const b = { ...emptyBloc(), useExisting: true, matchedParent: null };
    expect(isBlocUtilisable(b)).toBe(false);
  });
});

describe('checkDuplicateParentForBloc', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  test("retourne un bloc avec matchedParent=null si aucun email ni tel", async () => {
    const spy = jest.spyOn(supabaseAdmin, 'adminFindParentByContact');
    const b = emptyBloc();
    const res = await checkDuplicateParentForBloc(b, '', '');
    expect(res.matchedParent).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  test("appelle adminFindParentByContact avec email+téléphone normalisé", async () => {
    const spy = jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockResolvedValue([]);
    await checkDuplicateParentForBloc(emptyBloc(), ' Jean@Test.fr ', '+33 6 12 34 56 78');
    expect(spy).toHaveBeenCalledWith('Jean@Test.fr', '0612345678');
  });

  test("propage le premier match trouvé", async () => {
    const match = { id: 'uuid', identifiant: 'JmD4821', email: 'a@b.c' };
    jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockResolvedValue([match, { id: 'other' }]);
    const res = await checkDuplicateParentForBloc(emptyBloc(), 'a@b.c', null);
    expect(res.matchedParent).toBe(match);
  });

  test("retourne matchedParent=null si aucun match", async () => {
    jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockResolvedValue([]);
    const res = await checkDuplicateParentForBloc(emptyBloc(), 'a@b.c', null);
    expect(res.matchedParent).toBeNull();
  });

  test("retourne matchedParent=null si la RPC jette (réseau, auth, etc.)", async () => {
    jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockRejectedValue(new Error('down'));
    const res = await checkDuplicateParentForBloc(emptyBloc(), 'a@b.c', null);
    expect(res.matchedParent).toBeNull();
  });

  test("conserve les autres champs du bloc d'origine", async () => {
    jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockResolvedValue([]);
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont' };
    const res = await checkDuplicateParentForBloc(b, 'a@b.c', null);
    expect(res.has_pere).toBe(true);
    expect(res.pere_nom).toBe('Dupont');
  });
});

describe('processParentBlocs', () => {
  afterEach(() => { jest.restoreAllMocks(); });

  test("liste vide → retourne une liste vide (aucun appel API)", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent');
    const linkSpy   = jest.spyOn(supabaseAdmin, 'adminLinkParentEleve');
    const results = await processParentBlocs('eleve-uuid', []);
    expect(results).toEqual([]);
    expect(createSpy).not.toHaveBeenCalled();
    expect(linkSpy).not.toHaveBeenCalled();
  });

  test("useExisting=true → appelle adminLinkParentEleve et retourne kind:linked", async () => {
    const linkSpy = jest.spyOn(supabaseAdmin, 'adminLinkParentEleve').mockResolvedValue();
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent');
    const bloc = {
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'a@b.c', telephone: '0612',
      useExisting: true,
      matchedParent: { id: 'parent-uuid', identifiant: 'JmD4821', email: 'jean@exist.fr' },
      lien: 'pere',
    };
    const results = await processParentBlocs('eleve-1', [bloc]);
    expect(linkSpy).toHaveBeenCalledWith('parent-uuid', 'eleve-1', 'pere');
    expect(createSpy).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].kind).toBe('linked');
    expect(results[0].identifiant).toBe('JmD4821');
    // L'email du parent existant doit être propagé dans le result pour que
    // le flow admin puisse envoyer le mail de rattachement.
    expect(results[0].email).toBe('jean@exist.fr');
  });

  test("bloc neuf → appelle adminCreateParent avec identifiant et mdp générés", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent').mockResolvedValue('new-uuid');
    const bloc = {
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: ' jean@test.fr ', telephone: '+33 6 12 34 56 78',
    };
    const results = await processParentBlocs('eleve-1', [bloc]);
    expect(createSpy).toHaveBeenCalledTimes(1);
    const arg = createSpy.mock.calls[0][0];
    expect(arg.eleve_id).toBe('eleve-1');
    expect(arg.pere_nom).toBe('Dupont');
    expect(arg.pere_prenom).toBe('Jean');
    expect(arg.mere_nom).toBeNull();
    expect(arg.email).toBe('jean@test.fr');       // trimmé
    expect(arg.telephone).toBe('0612345678');      // normalisé
    expect(arg.identifiant).toMatch(/^jud\d{4}$/); // Jean Dupont — stocké en lowercase (cf. bug login parent résolu en avril 2026)
    expect(arg.password).toMatch(/.{8}/);          // 8 chars au moins
    expect(results[0].kind).toBe('created');
    expect(results[0].identifiant).toBe(arg.identifiant);
    expect(results[0].password).toBe(arg.password);
  });

  test("utilise le prénom/nom de la mère si seule la mère est cochée", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent').mockResolvedValue('new-uuid');
    const bloc = {
      ...emptyBloc(),
      has_mere: true, mere_nom: 'Durand', mere_prenom: 'Marie',
      email: 'marie@test.fr', telephone: '0612',
    };
    await processParentBlocs('eleve-1', [bloc]);
    const arg = createSpy.mock.calls[0][0];
    expect(arg.identifiant).toMatch(/^mud\d{4}$/); // Marie Durand — lowercase
    expect(arg.pere_nom).toBeNull();
    expect(arg.mere_nom).toBe('Durand');
  });

  test("continue même si un bloc échoue (reporting partiel)", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent')
      .mockRejectedValueOnce(new Error('Collision identifiant'))
      .mockResolvedValueOnce('ok-uuid');
    const blocs = [
      {
        ...emptyBloc(),
        has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
        email: 'jean@test.fr', telephone: '0612',
      },
      {
        ...emptyBloc(),
        has_mere: true, mere_nom: 'Durand', mere_prenom: 'Marie',
        email: 'marie@test.fr', telephone: '0713',
      },
    ];
    const results = await processParentBlocs('eleve-1', blocs);
    expect(createSpy).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results[0].kind).toBe('failed');
    expect(results[0].error).toBe('Collision identifiant');
    expect(results[1].kind).toBe('created');
  });

  test("useExisting=true mais matchedParent=null → fallback en création (pas de crash)", async () => {
    // Désynchro théorique : si le UI bugge et pose useExisting=true sans match
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent').mockResolvedValue('uuid');
    const linkSpy = jest.spyOn(supabaseAdmin, 'adminLinkParentEleve');
    const bloc = {
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'a@b.c', telephone: '0612',
      useExisting: true,
      matchedParent: null,  // désynchro
    };
    const results = await processParentBlocs('eleve-1', [bloc]);
    expect(linkSpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(results[0].kind).toBe('created');
  });

  test("bloc sans lien → valeur par défaut 'parents' envoyée à la RPC", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent').mockResolvedValue('uuid');
    const bloc = {
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'a@b.c', telephone: '0612',
      lien: undefined,
    };
    await processParentBlocs('eleve-1', [bloc]);
    expect(createSpy.mock.calls[0][0].lien).toBe('parents');
  });

  test("deux blocs cas B → deux identifiants distincts", async () => {
    const createSpy = jest.spyOn(supabaseAdmin, 'adminCreateParent').mockResolvedValue('uuid');
    const blocs = [
      {
        ...emptyBloc(),
        has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
        email: 'jean@test.fr', telephone: '0612',
      },
      {
        ...emptyBloc(),
        has_mere: true, mere_nom: 'Durand', mere_prenom: 'Marie',
        email: 'marie@test.fr', telephone: '0713',
      },
    ];
    await processParentBlocs('eleve-1', blocs);
    const id1 = createSpy.mock.calls[0][0].identifiant;
    const id2 = createSpy.mock.calls[1][0].identifiant;
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^jud\d{4}$/);
    expect(id2).toMatch(/^mud\d{4}$/);
  });
});

// ─── Check duplicate au submit — anti-doublon silencieux si onBlur skippé ───
describe('checkDuplicatesOnSubmit', () => {
  beforeEach(() => {
    jest.spyOn(supabaseAdmin, 'adminFindParentByContact').mockResolvedValue([]);
  });
  afterEach(() => { jest.restoreAllMocks(); });

  test('bloc vide → needsReview=false, bloc inchangé', async () => {
    const blocs = [emptyBloc()];
    const { refreshedBlocs, needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(false);
    expect(refreshedBlocs[0]).toEqual(blocs[0]);
  });

  test('bloc avec contacts et aucun match → needsReview=false', async () => {
    supabaseAdmin.adminFindParentByContact.mockResolvedValue([]);
    const blocs = [{
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'jean@nouveau.fr', telephone: '0611',
    }];
    const { needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(false);
    expect(supabaseAdmin.adminFindParentByContact).toHaveBeenCalled();
  });

  test('bloc avec match → needsReview=true + matchedParent posé', async () => {
    const matched = { id: 'parent-xyz', identifiant: 'JeD1234', email: 'jean@exist.fr' };
    supabaseAdmin.adminFindParentByContact.mockResolvedValue([matched]);
    const blocs = [{
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'jean@exist.fr', telephone: '0611',
    }];
    const { refreshedBlocs, needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(true);
    expect(refreshedBlocs[0].matchedParent).toEqual(matched);
  });

  test('bloc avec useExisting + matchedParent déjà posé → needsReview=false (admin a déjà choisi)', async () => {
    const blocs = [{
      ...emptyBloc(),
      useExisting: true,
      matchedParent: { id: 'parent-xyz', identifiant: 'JeD1234' },
    }];
    const { needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(false);
    expect(supabaseAdmin.adminFindParentByContact).not.toHaveBeenCalled();
  });

  test('bloc avec matchedParent posé sans useExisting → needsReview=true (admin doit arbitrer)', async () => {
    const matched = { id: 'parent-xyz', identifiant: 'JeD1234' };
    const blocs = [{
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: 'jean@exist.fr', telephone: '0611',
      matchedParent: matched, useExisting: false,
    }];
    const { needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(true);
  });

  test('bloc sans email ni téléphone → pas de recherche, pas de match', async () => {
    const blocs = [{
      ...emptyBloc(),
      has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean',
      email: '', telephone: '',
    }];
    const { needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(false);
    expect(supabaseAdmin.adminFindParentByContact).not.toHaveBeenCalled();
  });

  test('plusieurs blocs — un seul match → needsReview=true', async () => {
    const matched = { id: 'parent-xyz', identifiant: 'JeD1234' };
    supabaseAdmin.adminFindParentByContact
      .mockResolvedValueOnce([])           // 1er bloc : pas de match
      .mockResolvedValueOnce([matched]);   // 2ème bloc : match
    const blocs = [
      { ...emptyBloc(), has_pere: true, pere_nom: 'A', pere_prenom: 'Aa', email: 'a@x.fr', telephone: '0611' },
      { ...emptyBloc(), has_mere: true, mere_nom: 'B', mere_prenom: 'Bb', email: 'b@x.fr', telephone: '0622' },
    ];
    const { refreshedBlocs, needsReview } = await checkDuplicatesOnSubmit(blocs);
    expect(needsReview).toBe(true);
    expect(refreshedBlocs[0].matchedParent).toBe(null);
    expect(refreshedBlocs[1].matchedParent).toEqual(matched);
  });
});

// ─── Mode UI initial d'un ParentBloc ───────────────────────────────────────
describe('initialBlocMode', () => {
  test('bloc null/undefined → search', () => {
    expect(initialBlocMode(null)).toBe('search');
    expect(initialBlocMode(undefined)).toBe('search');
  });

  test('bloc vide (emptyBloc) → search', () => {
    expect(initialBlocMode(emptyBloc())).toBe('search');
  });

  test('bloc avec has_pere coché → create', () => {
    expect(initialBlocMode({ ...emptyBloc(), has_pere: true })).toBe('create');
  });

  test('bloc avec has_mere coché → create', () => {
    expect(initialBlocMode({ ...emptyBloc(), has_mere: true })).toBe('create');
  });

  test('bloc avec email saisi → create', () => {
    expect(initialBlocMode({ ...emptyBloc(), email: 'a@b.c' })).toBe('create');
  });

  test('bloc avec téléphone saisi → create', () => {
    expect(initialBlocMode({ ...emptyBloc(), telephone: '0611' })).toBe('create');
  });

  test('bloc avec un seul nom (sans has_pere) → create', () => {
    expect(initialBlocMode({ ...emptyBloc(), pere_nom: 'Dupont' })).toBe('create');
    expect(initialBlocMode({ ...emptyBloc(), mere_prenom: 'Marie' })).toBe('create');
  });
});

// ─── Exclusion cross-bloc pour la recherche parent ─────────────────────────
describe('excludedParentIdsFor', () => {
  test('tableau vide si aucun bloc', () => {
    expect(excludedParentIdsFor([], 0)).toEqual([]);
  });

  test('array non fourni → retourne []', () => {
    expect(excludedParentIdsFor(null, 0)).toEqual([]);
    expect(excludedParentIdsFor(undefined, 0)).toEqual([]);
  });

  test('bloc unique — exclut rien (self)', () => {
    const b = { ...emptyBloc(), matchedParent: { id: 'p1' } };
    expect(excludedParentIdsFor([b], 0)).toEqual([]);
  });

  test('2 blocs, Parent I matched — Parent II doit exclure le parent de I', () => {
    const blocs = [
      { ...emptyBloc(), matchedParent: { id: 'p1', identifiant: 'A' } },
      { ...emptyBloc() },
    ];
    expect(excludedParentIdsFor(blocs, 0)).toEqual([]);
    expect(excludedParentIdsFor(blocs, 1)).toEqual(['p1']);
  });

  test('2 blocs matchés — chacun exclut l\'autre', () => {
    const blocs = [
      { ...emptyBloc(), matchedParent: { id: 'p1' } },
      { ...emptyBloc(), matchedParent: { id: 'p2' } },
    ];
    expect(excludedParentIdsFor(blocs, 0)).toEqual(['p2']);
    expect(excludedParentIdsFor(blocs, 1)).toEqual(['p1']);
  });

  test('ignore les blocs sans matchedParent', () => {
    const blocs = [
      { ...emptyBloc(), matchedParent: { id: 'p1' } },
      { ...emptyBloc() }, // pas de matched
      { ...emptyBloc(), matchedParent: { id: 'p3' } },
    ];
    expect(excludedParentIdsFor(blocs, 1)).toEqual(['p1', 'p3']);
  });

  test('matchedParent sans id → filtré (robustesse)', () => {
    const blocs = [
      { ...emptyBloc(), matchedParent: { identifiant: 'A' } }, // pas d'id
      { ...emptyBloc() },
    ];
    expect(excludedParentIdsFor(blocs, 1)).toEqual([]);
  });
});
