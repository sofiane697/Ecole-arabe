# Audit — Portail Élève

**Date** : 2026-05-08
**Scorecard** : Sécurité 3/10 · Robustesse 6/10 · Cohérence DB 5/10 · **Anti-triche QCM 0/10**

## Résumé exécutif

Le portail a fait un effort de durcissement (RPCs `*_secure` résolvant le `session_token` côté serveur — bonne pratique), mais la sécurité du **flux QCM est fondamentalement compromise**. Cinq problèmes méritent une attention immédiate :

1. **Triche QCM massive** : `fetchQCMEleve` appelle `qcm_questions` via PostgREST sans `select=` → la colonne `reponse_correcte` est livrée en clair au navigateur.
2. **Falsification de progression** : `save_progression_secure` reçoit `p_score` et `p_reussi` calculés côté client. Tout élève peut envoyer `score=100, reussi=true` directement via fetch console.
3. **Filtrage de niveau scolaire côté client uniquement** : un élève peut lire les contenus d'un autre niveau scolaire.
4. **Faille `must_change_password` contournable** : `PortailApp.jsx` ne contrôle jamais ce flag.
5. **XSS via Office Online iframe** : `c.contenu` injecté dans `view.officeapps.live.com/op/embed.aspx?src={URL}` sans validation.

---

## CRITIQUE

### C1. Bonnes réponses QCM exposées au client
- [src/portail/supabasePortail.js:127](../src/portail/supabasePortail.js#L127) — `fetchQCMEleve`
- L'endpoint `qcm_questions?niveau_id=eq.{id}` ne spécifie pas `select=` → retourne tous les champs dont `reponse_correcte`. Le calcul du score à [PortailModule.jsx:555](../src/portail/PortailModule.jsx#L555) compare `answers[i]` à `q.reponse_correcte` côté JS.
- **Impact** : triche triviale via Network tab, système de déverrouillage perd toute valeur.
- **Correction** : RPC `submit_qcm_secure(p_token, p_niveau_id, p_answers JSONB)` qui calcule le score côté SQL. La RPC `fetch_qcm_questions_for_eleve_secure` doit faire `SELECT id, question, choix, ordre` (pas `reponse_correcte`).

### C2. `save_progression_secure` accepte score/reussi arbitraires
- [src/portail/supabasePortail.js:351](../src/portail/supabasePortail.js#L351) — `saveProgression`
- L'élève envoie `p_score` et `p_reussi`. La RPC écrit aveuglément.
- **Correction** : supprimer cette RPC. Remplacer par `submit_qcm_secure` (cf. C1).

### C3. Filtrage niveau scolaire côté client (modules + thématiques)
- [src/portail/supabasePortail.js:109](../src/portail/supabasePortail.js#L109) (`fetchModulesEleve`) et [supabasePortail.js:151](../src/portail/supabasePortail.js#L151) (`fetchThematiquesEleve`)
- Tous les modules retournés, filtrage en JS. Combiné au RLS anon ouvert : `niveaux?lecon_id=eq.X` retourne aussi sans filtre.
- **Impact** : un élève de N1 lit tous les modules de N6.
- **Correction** : RPCs `fetch_modules_for_eleve_secure(p_token)` et `fetch_thematiques_for_eleve_secure(p_token, p_module_id)` avec jointure `niveau_scolaire_id` côté serveur.

### C4. `must_change_password` non vérifié dans la garde d'auth
- [src/portail/PortailApp.jsx:143](../src/portail/PortailApp.jsx#L143)
- Effet de garde vérifie uniquement `verifyEleveSession`. Flag jamais inspecté. Élève qui rafraîchit la page avec session valide mais flag vrai court-circuite l'écran de changement.
- **Correction** : lire `getEleveUser()?.must_change_password` après `verifyEleveSession`, rediriger.

### C5. URL `view.officeapps.live.com` non validée pour Word/PPT
- [src/portail/PortailModule.jsx:807](../src/portail/PortailModule.jsx#L807)
- `c.contenu` encodé via `encodeURIComponent` puis injecté en `src` de l'iframe Office Online. Aucun `isSafeCoverUrl`-équivalent. Pas de `sandbox`.
- **Correction** : valider que `c.contenu` commence par le préfixe storage Supabase + `sandbox="allow-scripts allow-same-origin"`.

---

## MAJEUR

### M1. Tracking de session falsifiable — `heartbeatSession`/`endSession` non sécurisés
- [src/portail/supabasePortail.js:484](../src/portail/supabasePortail.js#L484), [supabasePortail.js:495](../src/portail/supabasePortail.js#L495)
- Prennent juste `p_session_id` (UUID). Un attaquant qui devine le UUID peut prolonger/clore arbitrairement.

### M2. RLS anon ouvert : conséquences concrètes côté élève
- [src/portail/supabasePortail.js:5-9](../src/portail/supabasePortail.js#L5)
- Tables sensibles : `qcm_questions`, `eleve_progression`, `notes`, `observations`, `chat_messages`, `eleve_sessions`.

### M3. `verifyEleveSession` synchrone au démontage : flash de contenu
- [src/portail/PortailApp.jsx:143-149](../src/portail/PortailApp.jsx#L143)

### M4. Concurrence sur `eleve_progression` (UPSERT non garanti)
- [src/portail/PortailModule.jsx:566-577](../src/portail/PortailModule.jsx#L566)
- Garantir UNIQUE INDEX sur `(eleve_id, niveau_id)` et `ON CONFLICT (eleve_id, niveau_id) DO UPDATE`.

### M5. Score requis lu côté client (`selNiveau.score_requis`)
- [src/portail/PortailModule.jsx:564](../src/portail/PortailModule.jsx#L564), [PortailModule.jsx:648](../src/portail/PortailModule.jsx#L648)
- Élève peut PATCH `score_requis=0` via console.

### M6. Heartbeat 2 min : leak si onglet fermé brutalement (mobile)
- [src/portail/PortailApp.jsx:180-184](../src/portail/PortailApp.jsx#L180)
- Utiliser `visibilitychange` + `navigator.sendBeacon('end_session')`.

### M7. `PortailMessages.handleSend` envoie `'eleve'` comme `sender_role`
- [src/portail/PortailMessages.jsx:149](../src/portail/PortailMessages.jsx#L149)
- Vérifier que la RPC hardcode le rôle (commentaire indique oui).

### M8. `PortailDashboard` : aucun garde si `niveau_scolaire_id` n'est pas un UUID valide
- [src/portail/PortailDashboard.jsx:84-88](../src/portail/PortailDashboard.jsx#L84)
- Élève peut éditer `sessionStorage.eleve_user.niveau_scolaire_id`.

### M9. Reload en plein QCM : état complet perdu
- [src/portail/PortailModule.jsx:455-510](../src/portail/PortailModule.jsx#L455)
- Stocker `{niveauId, page, answers}` dans sessionStorage à chaque clic.

### M10. Polling 5 s sur les messages — gourmand
- [src/portail/PortailMessages.jsx:140](../src/portail/PortailMessages.jsx#L140)
- Utiliser Supabase Realtime ou ≥10 s + pause sur `document.hidden`.

### M11. `PortailMessages` : `eleveId` pas dans une ref
- [src/portail/PortailMessages.jsx:57](../src/portail/PortailMessages.jsx#L57)

### M12. Sidebar : compteurs de badges remis à 0 côté UI sans confirmation serveur
- [src/portail/PortailApp.jsx:294-297](../src/portail/PortailApp.jsx#L294)
- `localStorage.devoirs_seen_at_*` local → re-notification au changement de navigateur.

### M13. Concurrence niveau-scolaire : changement admin pendant la session
- [src/portail/PortailModule.jsx:113-124](../src/portail/PortailModule.jsx#L113)

### M14. Validation QCM : `selNiveau.score_requis || 80` traite 0 comme falsy
- [src/portail/PortailModule.jsx:563](../src/portail/PortailModule.jsx#L563)
- Utiliser `selNiveau.score_requis ?? 80`.

### M15. DOMPurify default config peut laisser passer iframe ou style:expression
- [src/portail/PortailModule.jsx:803](../src/portail/PortailModule.jsx#L803)
- Allowlist explicite `{ ALLOWED_TAGS: [...], FORBID_ATTR: ['style','onerror',...] }`.

### M16. Iframe YouTube : pas de `sandbox`, pas de `referrerpolicy`
- [src/portail/PortailModule.jsx:778-781](../src/portail/PortailModule.jsx#L778)

---

## MINEUR

### m1. Empty state classe CSS appliquée au lieu d'objet style
- [src/portail/PortailModule.jsx:288](../src/portail/PortailModule.jsx#L288) — `className={S.empty}` (objet) au lieu de `style={S.empty}`.

### m2. Pas de feedback de chargement entre changements de niveau
- [src/portail/PortailModule.jsx:500-520](../src/portail/PortailModule.jsx#L500)

### m3. Accessibilité QCM : navigation clavier incomplète
- [src/portail/PortailModule.jsx:691-704](../src/portail/PortailModule.jsx#L691)
- Pas de `role="radiogroup"`/`role="radio"`/`aria-checked`.

### m4. `joursRestants` : différence en ms divisée par 86400000 ignore DST
- [src/portail/PortailDevoirs.jsx:9-13](../src/portail/PortailDevoirs.jsx#L9)

### m5. `parseInt(score, 10)` redondant (score déjà entier)
- [src/portail/PortailResultats.jsx:79, 231, 237](../src/portail/PortailResultats.jsx#L79)

### m6. EvalCard utilise `key={i}` au lieu de `key={note.id}`
- [src/portail/PortailResultats.jsx:262](../src/portail/PortailResultats.jsx#L262)

### m7. `_salamHasAnimated` variable module-level non thread-safe React Strict Mode
- [src/portail/PortailDashboard.jsx:11](../src/portail/PortailDashboard.jsx#L11)

### m8. `coverImgStyle` ne valide pas `SUPABASE_URL` côté `isSafeCoverUrl`
- [src/shared/imageCrop.js:26-31](../src/shared/imageCrop.js#L26)

### m9. `PortailDevoirs.useEffect` deps mauvaises (warning lint)
- [src/portail/PortailDevoirs.jsx:99](../src/portail/PortailDevoirs.jsx#L99)

### m10. `PortailObservations` et `PortailResultats` : pas de retry/erreur visible
- [src/portail/PortailObservations.jsx:42-48](../src/portail/PortailObservations.jsx#L42), [PortailResultats.jsx:195-201](../src/portail/PortailResultats.jsx#L195)

### m11. `PortailLogin.useEffect` redirige vers /portail dès qu'une session existe
- [src/portail/PortailLogin.jsx:161-163](../src/portail/PortailLogin.jsx#L161)

### m12. `PortailModule` : DOM stale entre `byThematique`/`byLecon` (composant non remonté)
- [src/portail/PortailModule.jsx:69-95](../src/portail/PortailModule.jsx#L69)
- `key={fetchId}` recommandé.

### m13. Composant `PortailModule.jsx` trop gros (834 lignes)
- [src/portail/PortailModule.jsx](../src/portail/PortailModule.jsx)

### m14. `localStorage.portail_theme` partagé entre plusieurs élèves d'un même device
- [src/portail/PortailApp.jsx:121-124](../src/portail/PortailApp.jsx#L121)

### m15. Pas de protection CSRF apparente sur les RPCs (token bearer)
- [src/portail/supabasePortail.js:27-38](../src/portail/supabasePortail.js#L27)

### m16. `NiveauxView`: calcul de `passed` exclut niveaux SANS QCM
- [src/portail/PortailModule.jsx:595-597](../src/portail/PortailModule.jsx#L595)
- UX ambiguë : `2/3 niveaux` alors qu'il y en a 5 visibles.

### m17. Aucune limite de taille sur les messages de chat
- [src/portail/PortailMessages.jsx:144-157](../src/portail/PortailMessages.jsx#L144)

### m18. `PortailMessages.handleSend` envoie `'eleve'` comme `sender_role` (à confirmer côté SQL)
- [src/portail/PortailMessages.jsx:149](../src/portail/PortailMessages.jsx#L149)
