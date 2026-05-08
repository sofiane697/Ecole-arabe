# Audit code — ENT Institut As-Safaa

**Date** : 2026-05-08
**Périmètre** : 4 portails (Admin, Enseignant, Élève, Parent)
**Méthode** : 4 agents d'audit en parallèle, lecture seule

## Scorecard global

| Portail | Sécurité | Robustesse | Cohérence DB | Spécifique |
|---|:---:|:---:|:---:|:---:|
| Admin | 3/10 | 5/10 | 4/10 | — |
| Enseignant | 6.5/10 | 5/10 | 6/10 | Ownership 8/10 |
| Élève | 3/10 | 6/10 | 5/10 | **Anti-triche QCM 0/10** |
| Parent | 3/10 | 6/10 | 5/10 | **Isolation 2/10** |

## Rapports détaillés

- [audit-admin.md](./audit-admin.md) — 50 problèmes
- [audit-enseignant.md](./audit-enseignant.md) — 39 problèmes
- [audit-eleve.md](./audit-eleve.md) — 23 problèmes
- [audit-parent.md](./audit-parent.md) — 38 problèmes

## Les 5 problèmes systémiques (cross-portails)

1. **RLS anon ouvert sur toutes les tables** — clé anon publique → exfiltration directe via PostgREST.
2. **`verify_admin_session` ne vérifie qu'un UUID** — pas de vraie session admin.
3. **QCM compromis** — réponses livrées au client + `save_progression` accepte score arbitraire.
4. **`must_change_password` non appliqué** dans les 4 portails après login.
5. **Mots de passe provisoires fuités via WhatsApp `wa.me/?text=...`** (historique navigateur, logs proxy).

## Bugs runtime certains

- B1 — `sendWelcomeEmail` non importé dans `Eleves.jsx:230`
- B2 — `updateDevoir` ignore silencieusement `classe_id`
- B3 — Conflit signature `_parent_owns_eleve` (UUID vs BOOLEAN) dans les 2 migrations parents
- B4 — Présence enseignant écrasée à `en_ligne` à chaque reload
- B5 — Pas de heartbeat → prof reste "en ligne" après crash
- B6 — Suppression d'observation sans confirmation
- B7 — `Classes.jsx:456` ferme la modale même si la suppression échoue
