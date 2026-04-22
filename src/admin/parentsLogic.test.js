import { emptyBloc, isBlocUtilisable, checkDuplicateParentForBloc, processParentBlocs } from './parentsLogic';
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

  test('false si email vide', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('false si téléphone vide', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: 'a@b.c' };
    expect(isBlocUtilisable(b)).toBe(false);
  });

  test('false si email uniquement des espaces', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: '   ', telephone: '06' };
    expect(isBlocUtilisable(b)).toBe(false);
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

  test('false si téléphone contient uniquement des espaces', () => {
    const b = { ...emptyBloc(), has_pere: true, pere_nom: 'Dupont', pere_prenom: 'Jean', email: 'a@b.c', telephone: '   ' };
    expect(isBlocUtilisable(b)).toBe(false);
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
    expect(arg.identifiant).toMatch(/^JuD\d{4}$/); // Jean Dupont
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
    expect(arg.identifiant).toMatch(/^MuD\d{4}$/); // Marie Durand
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
    expect(id1).toMatch(/^JuD\d{4}$/);
    expect(id2).toMatch(/^MuD\d{4}$/);
  });
});
