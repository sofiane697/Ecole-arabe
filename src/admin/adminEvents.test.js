import {
  ADMIN_EVENT_INSCRIPTIONS_CHANGED,
  ADMIN_EVENT_MESSAGES_CHANGED,
  ADMIN_EVENT_DECLARATIONS_CHANGED,
  emitInscriptionsChanged,
  emitMessagesChanged,
  emitDeclarationsChanged,
} from './adminEvents';

describe('adminEvents — noms stables', () => {
  // Les noms sont consommés par AdminApp et par des pages potentiellement
  // externes (Inscriptions, Messages). Un renommage silencieux casserait
  // les badges sans erreur visible — d'où ce test de stabilité.
  test('noms des évènements figés', () => {
    expect(ADMIN_EVENT_INSCRIPTIONS_CHANGED).toBe('inscriptions:changed');
    expect(ADMIN_EVENT_MESSAGES_CHANGED).toBe('messages:changed');
    expect(ADMIN_EVENT_DECLARATIONS_CHANGED).toBe('declarations:changed');
  });
});

describe('adminEvents — dispatch et écoute', () => {
  const cases = [
    ['inscriptions', emitInscriptionsChanged, ADMIN_EVENT_INSCRIPTIONS_CHANGED],
    ['messages',     emitMessagesChanged,     ADMIN_EVENT_MESSAGES_CHANGED],
    ['declarations', emitDeclarationsChanged, ADMIN_EVENT_DECLARATIONS_CHANGED],
  ];

  test.each(cases)("emit %s déclenche un listener attaché", (_label, emit, eventName) => {
    const handler = jest.fn();
    window.addEventListener(eventName, handler);
    try {
      emit();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBeInstanceOf(CustomEvent);
      expect(handler.mock.calls[0][0].type).toBe(eventName);
    } finally {
      window.removeEventListener(eventName, handler);
    }
  });

  test('chaque emit est indépendant (listener d\'un autre type non appelé)', () => {
    const insHandler = jest.fn();
    const msgHandler = jest.fn();
    window.addEventListener(ADMIN_EVENT_INSCRIPTIONS_CHANGED, insHandler);
    window.addEventListener(ADMIN_EVENT_MESSAGES_CHANGED, msgHandler);
    try {
      emitInscriptionsChanged();
      expect(insHandler).toHaveBeenCalledTimes(1);
      expect(msgHandler).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(ADMIN_EVENT_INSCRIPTIONS_CHANGED, insHandler);
      window.removeEventListener(ADMIN_EVENT_MESSAGES_CHANGED, msgHandler);
    }
  });

  test('emit sans listener attaché ne lève pas', () => {
    // Sanité : aucune erreur si personne n'écoute (cas du composant démonté).
    expect(() => emitInscriptionsChanged()).not.toThrow();
  });
});
