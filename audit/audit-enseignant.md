# Audit — Portail Enseignant

**Date** : 2026-05-08
**Scorecard** : Sécurité 6.5/10 · Robustesse 5/10 · Cohérence DB 6/10 · Ownership 8/10 · **Global 6.4/10**

## Résumé exécutif

Le portail enseignant a été récemment migré vers un pattern **session_token** + RPCs `*_secure`, ce qui ferme la majorité des fuites RLS classiques. Cette base est saine mais quelques zones présentent des risques :

1. **Présence Teams-like fragile** : pas de heartbeat, écrasement systématique du statut à chaque rechargement (forcé `en_ligne`), `beforeunload` peu fiable sur mobile et fermeture brutale → un enseignant déconnecté peut rester affiché "en ligne" indéfiniment.
2. **`must_change_password` non appliqué** : `EnseignantApp` ne re-vérifie jamais ce flag.
3. **`updateDevoir` perd silencieusement le `classe_id`** : l'UI propose de changer la classe d'un devoir, mais la fonction côté client n'envoie pas `p_classe_id` à la RPC.
4. **Suppression d'observation sans confirmation** : un simple clic supprime définitivement (incohérent avec devoirs/évaluations/absences).
5. **Polling sans annulation** + **mark-as-read appelé toutes les 5 s** : flood serveur, races possibles.

Aucun XSS détecté (texte JSX pur, pas de `dangerouslySetInnerHTML`, pas de `innerHTML`).

---

## CRITIQUE

### C1. `must_change_password` n'est jamais vérifié dans `EnseignantApp`
- [src/enseignant/EnseignantApp.jsx:253-259](../src/enseignant/EnseignantApp.jsx#L253)
- `verifyEnseignantSession` valide le token, mais ne contrôle pas `user.must_change_password`.
- **Correction** : router vers un écran dédié si `must_change_password=true`. Faire vérifier ce flag côté serveur dans `_resolve_enseignant_session`.

### C2. `updateDevoir` ignore silencieusement le changement de classe
- [src/enseignant/supabaseEnseignant.js:243-253](../src/enseignant/supabaseEnseignant.js#L243), [src/enseignant/EnseignantDevoirs.jsx:178](../src/enseignant/EnseignantDevoirs.jsx#L178)
- Le formulaire d'édition expose un sélecteur de classe et envoie `classe_id: fClasse`. Mais `updateDevoir` ne propage pas `classe_id` à la RPC `update_devoir_secure`.
- **Impact** : illusion fonctionnelle, perte de données métier.
- **Correction** : soit retirer le sélecteur en mode édition, soit ajouter `p_classe_id` à la RPC et au wrapper.

### C3. Pas de heartbeat de présence, "en_ligne" persistant après crash
- [src/enseignant/EnseignantApp.jsx:262-271](../src/enseignant/EnseignantApp.jsx#L262)
- Présence mise à `en_ligne` au mount, `deconnecte` uniquement via `beforeunload`. Pas de `pagehide`, `visibilitychange`, ni heartbeat.
- **Impact** : élèves voient leur prof "en ligne" pendant des heures alors qu'il est offline.
- **Correction** : ajouter `pagehide` + `visibilitychange` + heartbeat serveur (`presence_updated_at < NOW()-2min` ⇒ statut `deconnecte`).

### C4. Statut de présence forcé `en_ligne` à chaque rechargement
- [src/enseignant/EnseignantApp.jsx:240](../src/enseignant/EnseignantApp.jsx#L240), [EnseignantApp.jsx:265](../src/enseignant/EnseignantApp.jsx#L265)
- `useState('en_ligne')` initialise le picker, et `updatePresence(u.id, 'en_ligne')` est appelé inconditionnellement à chaque mount. Si le prof avait choisi `non_joignable` ou `reunion`, choix écrasé.
- **Correction** : initialiser via une RPC `get_my_presence_secure`, ne re-pousser `en_ligne` que si `deconnecte`.

### C5. Suppression d'observation sans confirmation
- [src/enseignant/EnseignantObservations.jsx:160-165](../src/enseignant/EnseignantObservations.jsx#L160), [EnseignantObservations.jsx:276-278](../src/enseignant/EnseignantObservations.jsx#L276)
- Clic corbeille → `deleteObservation` direct, contrairement aux devoirs/évaluations/absences.
- **Correction** : aligner sur le pattern `confirmDel`.

---

## MAJEUR

### M1. Validation client absente sur le statut de présence
- [src/enseignant/supabaseEnseignant.js:509-513](../src/enseignant/supabaseEnseignant.js#L509)

### M2. `_enseignantId` paramètre vestigial non purgé sur 4 RPCs déclarations
- [src/enseignant/supabaseEnseignant.js:520-548](../src/enseignant/supabaseEnseignant.js#L520)
- 4 RPCs `declarations_*` non migrées (chantier 5). Bypass cross-prof sur même classe possible.

### M3. Polling messages : `markMessagesReadEnseignant` appelé toutes les 5s sans condition
- [src/enseignant/EnseignantMessages.jsx:124-132](../src/enseignant/EnseignantMessages.jsx#L124), [EnseignantMessages.jsx:142-154](../src/enseignant/EnseignantMessages.jsx#L142)
- Pas d'AbortController, races sur changement d'élève.

### M4. `fetchUnreadCountParEleve` : N+1 requêtes au mount + jamais rafraîchi
- [src/enseignant/EnseignantMessages.jsx:101-110](../src/enseignant/EnseignantMessages.jsx#L101)
- Pour 100 élèves, 100 round-trips.

### M5. Race condition sur `setEvaluations` après création
- [src/enseignant/EnseignantNotes.jsx:707-713](../src/enseignant/EnseignantNotes.jsx#L707)
- `created` peut ne pas avoir les jointures `enseignants(nom,prenom)`.

### M6. `EnseignantDevoirs` : `date_limite` indexé en string sans normalisation
- [src/enseignant/EnseignantDevoirs.jsx:148-156](../src/enseignant/EnseignantDevoirs.jsx#L148), [EnseignantDevoirs.jsx:167](../src/enseignant/EnseignantDevoirs.jsx#L167)
- Si `date_limite` est `TIMESTAMPTZ`, mismatch → devoirs invisibles dans le calendrier.

### M7. `todayISO()` utilise `toISOString()` → bug timezone hors UTC
- [src/shared/dateUtils.js:2-4](../src/shared/dateUtils.js#L2)
- En soirée en France, retourne le lendemain.

### M8. `EnseignantDevoirs` : `alert()` natif + erreurs non normalisées
- [src/enseignant/EnseignantDevoirs.jsx:182](../src/enseignant/EnseignantDevoirs.jsx#L182), [EnseignantDevoirs.jsx:191](../src/enseignant/EnseignantDevoirs.jsx#L191)

### M9. `EnseignantNotes` : `actionError` jamais nettoyé
- [src/enseignant/EnseignantNotes.jsx:618](../src/enseignant/EnseignantNotes.jsx#L618), [EnseignantNotes.jsx:740](../src/enseignant/EnseignantNotes.jsx#L740)
- Bandeau rouge reste affiché indéfiniment.

### M10. Optimistic update + race sur `toggleAbsent`
- [src/enseignant/EnseignantNotes.jsx:664-673](../src/enseignant/EnseignantNotes.jsx#L664)

### M11. Aucune validation : devoir avec date passée / absence dans le futur
- [src/enseignant/EnseignantDevoirs.jsx:171-184](../src/enseignant/EnseignantDevoirs.jsx#L171), [src/enseignant/EnseignantAbsences.jsx:141-168](../src/enseignant/EnseignantAbsences.jsx#L141)

### M12. Doublons d'absences silencieux pour un même couple (élève, date)
- [src/enseignant/EnseignantAbsences.jsx:141-168](../src/enseignant/EnseignantAbsences.jsx#L141)
- Pas de UNIQUE `(eleve_id, date, type)`.

### M13. Confusion d'expéditeur dans le chat 1-1 si plusieurs profs partagent une classe
- [src/enseignant/EnseignantMessages.jsx:524-548](../src/enseignant/EnseignantMessages.jsx#L524)
- `mine = m.sender_role === 'enseignant'` → tout message envoyé par n'importe quel prof apparaît à droite chez chaque prof.
- **Correction** : comparer `m.enseignant_id === user.id`, afficher le nom du prof si autre.

### M14. Pas d'AbortController sur charger fiche élève
- [src/enseignant/EnseignantEleveProfile.jsx:208-246](../src/enseignant/EnseignantEleveProfile.jsx#L208)

### M15. Dépendance forte à `location.state` pour la fiche élève
- [src/enseignant/EnseignantEleveProfile.jsx:193-249](../src/enseignant/EnseignantEleveProfile.jsx#L193)
- F5 ou ouverture URL directe → fiche affiche "—" partout.

### M16. `verifyEnseignantSession` exécuté en background non-bloquant
- [src/enseignant/EnseignantApp.jsx:253-259](../src/enseignant/EnseignantApp.jsx#L253)

---

## MINEUR

### m1. `useLocation` importé mais inutilisé dans `EnseignantClasse`
- [src/enseignant/EnseignantClasse.jsx:2](../src/enseignant/EnseignantClasse.jsx#L2), [EnseignantClasse.jsx:34](../src/enseignant/EnseignantClasse.jsx#L34)

### m2. `enseignant_id` passé inutilement dans 3 wrappers `_enseignantId`
- [src/enseignant/supabaseEnseignant.js:50](../src/enseignant/supabaseEnseignant.js#L50), [supabaseEnseignant.js:108](../src/enseignant/supabaseEnseignant.js#L108), [EnseignantDevoirs.jsx:176](../src/enseignant/EnseignantDevoirs.jsx#L176)

### m3. Duplication des `GRADES` entre `EnseignantNotes` et `EnseignantEleveProfile`
- [src/enseignant/EnseignantNotes.jsx:38-43](../src/enseignant/EnseignantNotes.jsx#L38), [EnseignantEleveProfile.jsx:12-17](../src/enseignant/EnseignantEleveProfile.jsx#L12)

### m4. `EleveAvatar`/`GradeBadge`/`PieChart` dupliqués
- [src/enseignant/EnseignantEleveProfile.jsx:21-80](../src/enseignant/EnseignantEleveProfile.jsx#L21), [EnseignantNotes.jsx:526-539](../src/enseignant/EnseignantNotes.jsx#L526)

### m5. Composants trop volumineux
- `EnseignantNotes.jsx` (1027 l), `EnseignantMessages.jsx` (572 l), `EnseignantEleveProfile.jsx` (546 l)

### m6. `confirmDel` non typé entre objets et entiers
- [src/enseignant/EnseignantDevoirs.jsx:110](../src/enseignant/EnseignantDevoirs.jsx#L110), [EnseignantDevoirs.jsx:189](../src/enseignant/EnseignantDevoirs.jsx#L189)

### m7. `fetchAllNiveauxForModuleEns` : N+1 + cascade de fetch sans cache
- [src/enseignant/supabaseEnseignant.js:476-496](../src/enseignant/supabaseEnseignant.js#L476), [EnseignantEleveProfile.jsx:230-235](../src/enseignant/EnseignantEleveProfile.jsx#L230)

### m8. `Promise.all([... .catch()])` masque les erreurs réseau
- [src/enseignant/EnseignantEleveProfile.jsx:213-220](../src/enseignant/EnseignantEleveProfile.jsx#L213)

### m9. `setSelClasse` reste sur ancienne classe quand la liste change
- [src/enseignant/EnseignantDevoirs.jsx:121-131](../src/enseignant/EnseignantDevoirs.jsx#L121)

### m10. `EnseignantMessages` : `eleves === null` comme sentinel + `eleves.length` plus tard
- [src/enseignant/EnseignantMessages.jsx:77](../src/enseignant/EnseignantMessages.jsx#L77), [EnseignantMessages.jsx:340](../src/enseignant/EnseignantMessages.jsx#L340)

### m11. Logout : navigate avant attente serveur
- [src/enseignant/EnseignantApp.jsx:301-306](../src/enseignant/EnseignantApp.jsx#L301)

### m12. `EnseignantMessages` : `setBroadcasts([])` sur changement de classe, mais polling en cours
- [src/enseignant/EnseignantMessages.jsx:188](../src/enseignant/EnseignantMessages.jsx#L188)

### m13. `unreadCount` du badge messages remis à 0 sur clic NavLink
- [src/enseignant/EnseignantApp.jsx:368](../src/enseignant/EnseignantApp.jsx#L368)

### m14. `declCount` peut rester non synchronisé après refus de la RPC
- [src/enseignant/EnseignantApp.jsx:291-299](../src/enseignant/EnseignantApp.jsx#L291), [EnseignantAbsences.jsx:295-300](../src/enseignant/EnseignantAbsences.jsx#L295)

### m15. Polling intervals pas suspendus en `document.hidden`
- [src/enseignant/EnseignantApp.jsx:281-299](../src/enseignant/EnseignantApp.jsx#L281), [EnseignantMessages.jsx:142-154](../src/enseignant/EnseignantMessages.jsx#L142)

### m16. Tri instable des évaluations (créées la même milliseconde)
- [src/enseignant/EnseignantNotes.jsx:643](../src/enseignant/EnseignantNotes.jsx#L643)
- Ajouter `order by created_at desc, id desc`.

### m17. Vérifier ON DELETE CASCADE sur `notes.evaluation_id`
- [src/enseignant/EnseignantNotes.jsx:720-731](../src/enseignant/EnseignantNotes.jsx#L720)

### m18. `EnseignantApp` : `document.body.style.background` mute global state
- [src/enseignant/EnseignantApp.jsx:248](../src/enseignant/EnseignantApp.jsx#L248)

### m19. `loadData` recrée notesMap entièrement après chaque changement de classe (N+1)
- [src/enseignant/EnseignantNotes.jsx:629-651](../src/enseignant/EnseignantNotes.jsx#L629)

### m20. `confirmDelete` sans timeout (rend possible cliquer après inactivité)
- [src/enseignant/EnseignantMessages.jsx:495-515](../src/enseignant/EnseignantMessages.jsx#L495)

### m21. Pas de feedback visuel pendant `markDeclarationVueEnseignant`
- [src/enseignant/EnseignantAbsences.jsx:294-309](../src/enseignant/EnseignantAbsences.jsx#L294)
