# Audit — Portail Admin

**Date** : 2026-05-08
**Scorecard** : Sécurité 3/10 · Robustesse 5/10 · Cohérence DB 4/10

## Résumé exécutif

Portail globalement bien structuré (DOMPurify, magic bytes pour images, helpers `safeMailtoHref`/`safeTelHref`, edge functions avec service_role + vérification admin, `safeEleveId` UUID-checké), mais cinq problèmes graves dominent :

1. **`verifyAdminSession` ne vérifie que l'existence d'une UUID** : aucun secret partagé, aucun token. La clé anon étant publique, n'importe qui qui obtient un `id` admin (via fuite, console, exfiltration depuis sessionStorage, ou via la table — RLS ouvert anon) peut se forger une session admin valide. Effondrement complet du modèle d'auth.
2. **RLS « ouvert pour anon »** sur toutes les tables : la clé anon est embarquée dans le bundle JS, permet à un attaquant non authentifié de SELECT/INSERT/UPDATE/DELETE directement via PostgREST sur `profils_eleves`, `parents`, `notes`, `chat_messages`, etc. La couche admin_* SECURITY DEFINER ne protège rien tant que les tables sous-jacentes restent ouvertes.
3. **`Eleves.jsx:230` appelle `sendWelcomeEmail` non importé** : ReferenceError à l'activation d'un élève → le handler crash, l'élève est activé en DB sans qu'aucun mail ne parte, et l'UI tombe en erreur.
4. **Aucun `must_change_password` côté admin** : `login_admin_custom` retourne directement la session sans drapeau de premier login. Pas d'UI de changement. L'admin par défaut `admin / Admin123!` (documenté) n'est jamais forcé de changer son mdp.
5. **`deleteEleve` n'est PAS transactionnel** : 4 requêtes REST séparées sans rollback. Aucun nettoyage explicite de `parent_eleves`, `notes`, `observations`, `retards_absences`, `eleve_sessions`, `inscriptions.eleve_id`, `evaluations`.

---

## CRITIQUE

### 1. `verify_admin_session` n'est pas une vérification de session — c'est juste une recherche par UUID
- [src/admin/supabaseAdmin.js:68](../src/admin/supabaseAdmin.js#L68) + [src/admin/AdminApp.jsx:91](../src/admin/AdminApp.jsx#L91)
- La RPC est appelée avec `p_id` seul. Aucun token, aucun secret, aucune expiration. Un attaquant qui devine/exfiltre une UUID admin (table `profils_admins` lisible via anon) ouvre `sessionStorage.admin_session = {id:'<uuid>'}` et le portail entier l'accepte.
- **Impact** : prise de contrôle totale du portail admin par n'importe quel anonyme connaissant la clé anon (publique) + la table `profils_admins` (lisible).
- **Correction** : modèle de session avec table `admin_sessions` (token opaque comme `parent_sessions`), TTL, RLS strict bloquant la lecture de `profils_admins`.

### 2. RLS « ouvert anon » côté serveur
- [CLAUDE.md:57](../CLAUDE.md#L57) (documenté)
- La clé anon est dans le bundle. Toute table avec policy `USING (true) WITH CHECK (true)` pour `anon` est entièrement publique en lecture/écriture/suppression.
- **Impact** : exfiltration totale (élèves, parents, hashes bcrypt, messages contact, chat élève↔enseignant), modification arbitraire.
- **Correction** : restreindre RLS pour `anon` à ce qui est strictement public (formulaire d'inscription/contact en INSERT only). Tout le reste passe par RPC SECURITY DEFINER.

### 3. `sendWelcomeEmail` n'est pas importé dans `Eleves.jsx`
- [src/admin/Eleves.jsx:230](../src/admin/Eleves.jsx#L230)
- `handleToggleActif` appelle `sendWelcomeEmail({...})` sans avoir importé la fonction. ReferenceError au runtime.
- **Impact** : aucun mail de bienvenue envoyé via cette voie ; UI plante.
- **Correction** : utiliser `dispatchPostCreationEmails` (déjà importé) ou ajouter l'import direct.

### 4. Aucun changement de mot de passe forcé pour les admins
- [src/admin/AdminLogin.jsx:148](../src/admin/AdminLogin.jsx#L148) + [src/admin/supabaseAdmin.js:55](../src/admin/supabaseAdmin.js#L55)
- Aucune lecture de `must_change_password`. Pas d'UI. L'admin par défaut documenté reste valide indéfiniment.
- **Correction** : ajouter `must_change_password` à `profils_admins`, route `/admin/change-password`, blocage de toute autre action tant que le flag est vrai.

### 5. Suppression d'élève non transactionnelle, cascade incomplète
- [src/admin/supabaseAdmin.js:484](../src/admin/supabaseAdmin.js#L484)
- 4 appels séquentiels sans rollback. Pas de nettoyage explicite de `notes`, `observations`, `retards_absences`, `eleve_sessions`, `parent_eleves`, `inscriptions.eleve_id`.
- **Correction** : RPC `admin_delete_eleve` SECURITY DEFINER en transaction unique.

### 6. `deleteEleve` ne purge pas les relations parent — partiel (CASCADE existe sur `parent_eleves`)
- `parent_eleves` a `ON DELETE CASCADE` côté `eleve_id`, mais les `notes`, `observations`, `retards_absences`, `evaluations`, `devoirs` ne sont pas explicitement supprimées.
- **Correction** : RPC unique `admin_delete_eleve`.

### 7. Mots de passe en clair persistants en mémoire et stockés dans `setState`
- [src/admin/Eleves.jsx:1384](../src/admin/Eleves.jsx#L1384), [src/admin/Enseignants.jsx:146](../src/admin/Enseignants.jsx#L146), [src/admin/Parents.jsx:740](../src/admin/Parents.jsx#L740), [src/admin/Inscriptions.jsx:212](../src/admin/Inscriptions.jsx#L212)
- Le mdp provisoire est conservé dans le state, copié dans WhatsApp URL et clipboard, écrit dans le DOM via `document.write` (printWin).
- **Impact** : extension navigateur malveillante, presse-papier partagé, historique navigateur (wa.me URL en `?text=`), capture imprimante.
- **Correction** : ne plus interpoler les mdp dans les URL/clipboard automatiquement ; effacer le state au démontage.

### 8. Mot de passe envoyé via URL WhatsApp (historique navigateur)
- [src/admin/Eleves.jsx:682](../src/admin/Eleves.jsx#L682), [Eleves.jsx:1471](../src/admin/Eleves.jsx#L1471), [src/admin/Enseignants.jsx:312](../src/admin/Enseignants.jsx#L312)
- `window.open('https://wa.me/?text=' + encodeURIComponent(...))` met le mdp en clair dans l'URL → historique, logs proxy/DNS.
- **Correction** : passer par l'API WhatsApp Cloud côté serveur, ou ne pas pré-remplir le password.

### 9. RichTextEditor accepte `<img src="/...">` (chemin relatif) sans validation d'origine
- [src/admin/RichTextEditor.jsx:189](../src/admin/RichTextEditor.jsx#L189)
- `isSafeImageUrl` autorise `^/[^/]` → SSRF léger, fingerprinting, exfiltration via image-beacon.
- **Correction** : restreindre à `^https://<projet>.supabase.co/storage/v1/object/public/cours/...`.

### 10. `document.execCommand('foreColor'...)` produit du HTML avec `style` non whitelisté par DOMPurify config par défaut
- [src/admin/RichTextEditor.jsx:174](../src/admin/RichTextEditor.jsx#L174) + [RichTextEditor.jsx:610](../src/admin/RichTextEditor.jsx#L610)
- Pas d'allowlist explicite des styles ni des attributs. UI hijack possible via `style="position:fixed;..."`.
- **Correction** : `DOMPurify.sanitize(html, { ALLOWED_TAGS: [...], FORBID_ATTR: ['style', 'onerror'] })`.

### 11. Le HTML coloré du RichTextEditor est rendu côté élève sans re-sanitization documentée
- XSS stockée via admin compromis (cf. point 1 + 10).
- **Correction** : sanitization au rendu côté élève + serveur-side allowlist.

### 12. Suppression de questions/contenus n'efface jamais les fichiers Storage rattachés
- [src/admin/Cours.jsx:377](../src/admin/Cours.jsx#L377), [Cours.jsx:415](../src/admin/Cours.jsx#L415)
- Stockage Supabase saturé silencieusement par les fichiers orphelins ; les fichiers restent publics.
- **Correction** : extraire l'URL avant DELETE et appeler `DELETE /storage/v1/object/cours`.

### 13. Edge function `send-welcome-email` accepte n'importe quel admin pour envoyer un mail à n'importe quelle adresse
- [supabase/functions/send-welcome-email/index.ts:90](../supabase/functions/send-welcome-email/index.ts#L90)
- `body.email` validé regex mais pas contre une whitelist (eleve/parent en DB). Pas de rate-limiting.
- **Impact** : utilisation comme mail relay pour phishing en se faisant passer pour `Institut As-Safaa`.
- **Correction** : signature HMAC partagée admin↔edge, rate-limit, vérification que l'email correspond à un eleve/parent en DB.

---

## MAJEUR

### 14. `loginAdmin` n'envoie pas l'`Authorization: Bearer` — incohérent avec `authFetch`
- [src/admin/supabaseAdmin.js:56](../src/admin/supabaseAdmin.js#L56)

### 15. Race condition sur `handleConvertToEleve` — parents non créés si étape 5 échoue
- [src/admin/Inscriptions.jsx:142](../src/admin/Inscriptions.jsx#L142)
- 5 étapes séquentielles sans rollback. RPC unique `admin_convert_inscription` recommandée.

### 16. Identifiant aléatoire 4 chiffres — collisions probables
- [src/admin/adminUtils.js:5](../src/admin/adminUtils.js#L5)
- 9000 valeurs possibles, paradoxe des anniversaires : >50% collision dès 113 tentatives. Pas de retry.

### 17. `adminCreateEnseignantAccount` — password en clair dans le body POST → REST log Supabase
- [src/admin/supabaseAdmin.js:686](../src/admin/supabaseAdmin.js#L686)
- Tout admin Supabase ayant accès aux logs voit les mdp provisoires.

### 18. `verifyAdminSession` asynchrone : Outlet rendu pendant la vérification
- [src/admin/AdminApp.jsx:88](../src/admin/AdminApp.jsx#L88)
- Un attaquant peut faire des actions avant la redirection.

### 19. `Classes.jsx:456` exécute `onClose()` après `onConfirm()` même si ce dernier lance
- [src/admin/Classes.jsx:456](../src/admin/Classes.jsx#L456)
- Modale se ferme même sur échec, admin pense la suppression réussie.

### 20. `handleDeleteThematique`/`handleDeleteNiveau`/`handleDeleteLecon` n'efface pas les progressions élèves
- [src/admin/Cours.jsx:296](../src/admin/Cours.jsx#L296), [324](../src/admin/Cours.jsx#L324), [352](../src/admin/Cours.jsx#L352)

### 21. `setEnseignantClasses` non transactionnel : DELETE puis INSERT
- [src/admin/supabaseAdmin.js:673](../src/admin/supabaseAdmin.js#L673)
- Si l'INSERT échoue, l'enseignant est démuni de toutes ses classes.

### 22. `resetProgressionNiveau` appelé APRÈS `deleteQuestion` — race window
- [src/admin/Cours.jsx:403](../src/admin/Cours.jsx#L403)

### 23. Polling `setInterval` non débrayé en cas de désactivation
- [src/admin/AdminSurveillance.jsx:75](../src/admin/AdminSurveillance.jsx#L75), [src/admin/Eleves.jsx:172](../src/admin/Eleves.jsx#L172)
- ~10K requêtes/jour par session admin, quota free Supabase saturé.

### 24. `fetchAllConversations` charge TOUS les chat_messages sans pagination
- [src/admin/supabaseAdmin.js:758](../src/admin/supabaseAdmin.js#L758)

### 25. `fetchEleves` / `fetchEnseignants` / `fetchInscriptions` / `fetchMessages` sans pagination
- [src/admin/supabaseAdmin.js:241](../src/admin/supabaseAdmin.js#L241), [642](../src/admin/supabaseAdmin.js#L642), [19](../src/admin/supabaseAdmin.js#L19), [26](../src/admin/supabaseAdmin.js#L26)
- Supabase plafonne à 1000 par défaut → silence sur les disparus.

### 26. `mailto:` / `tel:` interpolés sans validation
- [src/admin/Inscriptions.jsx:434](../src/admin/Inscriptions.jsx#L434), [Inscriptions.jsx:442](../src/admin/Inscriptions.jsx#L442), [Messages.jsx:351](../src/admin/Messages.jsx#L351), [Messages.jsx:411](../src/admin/Messages.jsx#L411)
- Helpers `safeMailtoHref`/`safeTelHref` existent mais ignorés.

### 27. CSRF inexistant sur les Edge Functions
- [supabase/functions/send-welcome-email/index.ts:90](../supabase/functions/send-welcome-email/index.ts#L90), [eleve-photo/index.ts:58](../supabase/functions/eleve-photo/index.ts#L58)

### 28. `Cours.jsx:1186` upload sans deleteOldCover pour les contenus
- [src/admin/Cours.jsx:1186](../src/admin/Cours.jsx#L1186)

### 29. `Eleves.jsx:1486` `window.open('', '_blank')` puis `document.write` : pop-up bloqué casse silencieusement
- [src/admin/Eleves.jsx:1486](../src/admin/Eleves.jsx#L1486)

### 30. `safeEleveId` non appliqué à `fetchEleveProgression`, `fetchEleveActivite`, `updateEleve`, `deleteEleve`
- [src/admin/supabaseAdmin.js:248](../src/admin/supabaseAdmin.js#L248), [745](../src/admin/supabaseAdmin.js#L745), [499](../src/admin/supabaseAdmin.js#L499), [484](../src/admin/supabaseAdmin.js#L484)

### 31. `Cours.jsx:1184` upload utilise `niveauTitre` sans toSlug pour la racine — chemin inconsistent
- [src/admin/Cours.jsx:1184](../src/admin/Cours.jsx#L1184)

### 32. `Inscriptions.jsx:159` `calcAge` est défini APRÈS son utilisation (TDZ-fragile)
- [src/admin/Inscriptions.jsx:159](../src/admin/Inscriptions.jsx#L159) (utilisation), [257](../src/admin/Inscriptions.jsx#L257) (définition)

### 33. Pas de protection contre les pop-ups multiples / double-clic sur création élève
- [src/admin/Eleves.jsx:1334](../src/admin/Eleves.jsx#L1334)

### 34. Edge function `eleve-photo` sans rate-limit
- [supabase/functions/eleve-photo/index.ts:48](../supabase/functions/eleve-photo/index.ts#L48)

### 35. `Eleves.jsx:172` : timer `setInterval(load, 300_000)` non clear sur `selectedEleve === null`
- [src/admin/Eleves.jsx:172](../src/admin/Eleves.jsx#L172)

### 36. `RichTextEditor.jsx:118` ne re-sanitize pas sur changement externe de `value`
- [src/admin/RichTextEditor.jsx:118](../src/admin/RichTextEditor.jsx#L118)

### 37. Absence de validation côté serveur pour `score_requis`, `ordre`, `niveaux_scolaires_ids`
- [src/admin/supabaseAdmin.js:91](../src/admin/supabaseAdmin.js#L91)

---

## MINEUR

### 38. `mockData.js` toujours présent dans le bundle (mort)
- [src/admin/mockData.js](../src/admin/mockData.js)

### 39. Couverture composants UI = 0%
- Aucun test pour `Eleves.jsx`, `Cours.jsx`, `Inscriptions.jsx`, `RichTextEditor.jsx`. Le bug B1 (sendWelcomeEmail) aurait été détecté.

### 40. Composants > 500 lignes
- `Eleves.jsx` (1702), `Cours.jsx` (1654), `ParentsSection.jsx` (1043), `Parents.jsx` (980), `Inscriptions.jsx` (725), `RichTextEditor.jsx` (617)

### 41. Duplication massive entre `Eleves.jsx`, `Enseignants.jsx`, `Parents.jsx`
- Modal "Compte créé" dupliqué 3 fois. Helpers `fmtPrenom`/`fmtNom` redéfinis dans `Enseignants.jsx:14` alors qu'un import partagé existe.

### 42. `Classes.jsx:165` : ConfirmModal local alors que `ConfirmModal` global existe
- [src/admin/Classes.jsx:448](../src/admin/Classes.jsx#L448) vs [src/admin/ConfirmModal.jsx:101](../src/admin/ConfirmModal.jsx#L101)

### 43. `useLayoutEffect` dans `AdminLogin.jsx` injecte un `<style>` sans cleanup
- [src/admin/AdminLogin.jsx:126](../src/admin/AdminLogin.jsx#L126)

### 44. `EleveAvatar` `key={editForm.photo_url}` — re-mount à chaque PATCH
- [src/admin/Eleves.jsx:460](../src/admin/Eleves.jsx#L460)

### 45. Pas de feedback visuel pendant `verifyAdminSession` dans AdminApp
- [src/admin/AdminApp.jsx:88](../src/admin/AdminApp.jsx#L88)

### 46. `Eleves.jsx:172` : commentaire "30s" vs code `300_000` (5 minutes). Désync.
- [src/admin/Eleves.jsx:172](../src/admin/Eleves.jsx#L172)

### 47. Édition concurrente de niveau scolaire silencieuse (pas de versioning)
- [src/admin/Classes.jsx:170](../src/admin/Classes.jsx#L170)

### 48. `RichTextEditor.jsx:610` rend l'aperçu via `dangerouslySetInnerHTML` sans clé de cache
- [src/admin/RichTextEditor.jsx:610](../src/admin/RichTextEditor.jsx#L610)

### 49. `Cours.jsx:415` `Promise.all(questions.map(deleteQuestion))` lance N requêtes parallèles
- [src/admin/Cours.jsx:415](../src/admin/Cours.jsx#L415)

### 50. `escapeHtml` (Eleves.jsx:1250) duplicate avec celui de l'edge function
- [src/admin/Eleves.jsx:1250](../src/admin/Eleves.jsx#L1250) vs [send-welcome-email/index.ts:61](../supabase/functions/send-welcome-email/index.ts#L61)
