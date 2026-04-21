// Tests — Commentaire sur les notes
//
// Couche API testée :
//   - upsertNote (supabaseEnseignant.js) : payload + URL + gestion erreur
//   - fetchMesNotes (supabasePortail.js) : select inclut 'commentaire'
//   - Logique UI pure : trim + vide → null (CommentModal)
//
// Exécution : node --test test/notes-commentaire.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

process.env.REACT_APP_SUPABASE_URL  = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON = 'anon-test-key';

// ── Utilitaires de mock ──────────────────────────────────────────────────────

let fetchCalls = [];
let fetchResponder = () => ({ ok: true, status: 200, arr: [] });

globalThis.fetch = async (url, opts) => {
  fetchCalls.push({ url, opts });
  const r = fetchResponder({ url, opts });
  return {
    ok: r.ok,
    status: r.status ?? 200,
    json: async () => r.arr ?? [],
    text: async () => r.text ?? '',
  };
};

function resetFetch() {
  fetchCalls = [];
  fetchResponder = () => ({ ok: true, status: 200, arr: [] });
}

// ── Import des modules source via data URL (évite "type":"module" global) ────

async function loadModule(relPath) {
  const src = readFileSync(new URL(relPath, import.meta.url), 'utf-8');
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(src).toString('base64');
  return import(dataUrl);
}

const enseignant = await loadModule('../src/enseignant/supabaseEnseignant.js');
const portail    = await loadModule('../src/portail/supabasePortail.js');

// ═════════════════════════════════════════════════════════════════════════════
// upsertNote
// ═════════════════════════════════════════════════════════════════════════════

test('upsertNote — inclut commentaire dans le body quand fourni', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, status: 200,
    arr: [{ id: 'n1', ...JSON.parse(opts.body) }],
  });

  const result = await enseignant.upsertNote(
    'eval-42', 'eleve-7', 3, false, 'Très bon travail sur la lecture',
  );

  assert.equal(fetchCalls.length, 1);
  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.deepEqual(body, {
    evaluation_id: 'eval-42',
    eleve_id: 'eleve-7',
    score: 3,
    absent: false,
    commentaire: 'Très bon travail sur la lecture',
  });
  assert.equal(result.commentaire, 'Très bon travail sur la lecture');
});

test('upsertNote — rétro-compatible (4 arguments) envoie commentaire=null', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, arr: [{ id: 'n2', ...JSON.parse(opts.body) }],
  });

  await enseignant.upsertNote('eval-1', 'eleve-1', 2, false);

  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.equal(body.commentaire, null,
    'le 5ᵉ argument doit avoir une valeur par défaut null pour ne rien casser');
  assert.equal(body.score, 2);
  assert.equal(body.absent, false);
});

test('upsertNote — accepte null explicite pour effacer un commentaire', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, arr: [{ id: 'n3', ...JSON.parse(opts.body) }],
  });

  await enseignant.upsertNote('eval-1', 'eleve-1', 4, false, null);

  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.equal(body.commentaire, null);
});

test('upsertNote — URL vise le bon endpoint avec on_conflict', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, arr: [{ id: 'n4', ...JSON.parse(opts.body) }],
  });

  await enseignant.upsertNote('eval-1', 'eleve-1', 1, true, null);

  const url = fetchCalls[0].url;
  assert.match(url, /\/rest\/v1\/notes\?on_conflict=evaluation_id,eleve_id$/);
  assert.equal(fetchCalls[0].opts.method, 'POST');
  assert.match(
    fetchCalls[0].opts.headers['Prefer'],
    /resolution=merge-duplicates.*return=representation/,
  );
});

test('upsertNote — remonte une erreur quand fetch échoue', async () => {
  resetFetch();
  fetchResponder = () => ({ ok: false, status: 500, text: 'boom' });

  await assert.rejects(
    () => enseignant.upsertNote('eval-1', 'eleve-1', 3, false, 'x'),
    /Erreur 500/,
  );
});

test('upsertNote — fallback si réponse vide (arr[0] undefined) garde commentaire', async () => {
  resetFetch();
  fetchResponder = () => ({ ok: true, arr: [] });

  const result = await enseignant.upsertNote(
    'eval-1', 'eleve-1', 3, false, 'ma note',
  );

  assert.equal(result.commentaire, 'ma note');
  assert.equal(result.score, 3);
  assert.equal(result.absent, false);
});

// ═════════════════════════════════════════════════════════════════════════════
// fetchMesNotes (portail élève)
// ═════════════════════════════════════════════════════════════════════════════

test('fetchMesNotes — demande la colonne commentaire dans le select', async () => {
  resetFetch();
  fetchResponder = () => ({ ok: true, arr: [] });

  await portail.fetchMesNotes('eleve-123');

  assert.equal(fetchCalls.length, 1);
  const url = fetchCalls[0].url;
  assert.match(url, /eleve_id=eq\.eleve-123/);
  assert.match(url, /select=score,absent,commentaire,evaluation_id/,
    'le select doit inclure commentaire pour remonter l\'appréciation au portail élève');
});

test('fetchMesNotes — propage commentaire dans le résultat jointé', async () => {
  resetFetch();
  let callIdx = 0;
  fetchResponder = () => {
    callIdx += 1;
    if (callIdx === 1) {
      return { ok: true, arr: [
        { score: 3, absent: false, commentaire: 'Bon travail',    evaluation_id: 'e1' },
        { score: 2, absent: false, commentaire: null,             evaluation_id: 'e2' },
      ]};
    }
    return { ok: true, arr: [
      { id: 'e1', titre: 'Contrôle 1', date_evaluation: '2026-04-10', score_max: 4 },
      { id: 'e2', titre: 'Contrôle 2', date_evaluation: '2026-04-17', score_max: 4 },
    ]};
  };

  const notes = await portail.fetchMesNotes('eleve-x');

  assert.equal(notes.length, 2);
  assert.equal(notes[0].commentaire, 'Bon travail');
  assert.equal(notes[0].evaluation.titre, 'Contrôle 1');
  assert.equal(notes[1].commentaire, null);
  assert.equal(notes[1].evaluation.titre, 'Contrôle 2');
});

// ═════════════════════════════════════════════════════════════════════════════
// Logique UI pure — CommentModal : trim + vide → null
// ═════════════════════════════════════════════════════════════════════════════

// Réplique de la logique dans EnseignantNotes.jsx (CommentModal.handleSave)
function normalizeCommentInput(raw) {
  const trimmed = (raw ?? '').trim();
  return trimmed ? trimmed : null;
}

test('CommentModal — chaîne vide → null (suppression du commentaire)', () => {
  assert.equal(normalizeCommentInput(''),        null);
  assert.equal(normalizeCommentInput('   '),     null);
  assert.equal(normalizeCommentInput('\n\t  '),  null);
  assert.equal(normalizeCommentInput(undefined), null);
  assert.equal(normalizeCommentInput(null),      null);
});

test('CommentModal — texte non vide → trimé mais conservé', () => {
  assert.equal(normalizeCommentInput('bon travail'),        'bon travail');
  assert.equal(normalizeCommentInput('  espaces bords  '),  'espaces bords');
  assert.equal(normalizeCommentInput('ligne 1\nligne 2'),   'ligne 1\nligne 2');
});

// ═════════════════════════════════════════════════════════════════════════════
// Préservation du commentaire dans saveNote / toggleAbsent
// ═════════════════════════════════════════════════════════════════════════════

// Ces callbacks (dans EnseignantNotes.jsx) passent current?.commentaire ?? null
// comme 5ᵉ argument à upsertNote. On vérifie le contrat côté API en simulant
// la chaîne d'appels attendue.

test('saveNote — préserve le commentaire existant lors du changement de note', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, arr: [{ id: 'n', ...JSON.parse(opts.body) }],
  });

  // Simule notesMap[key] = { ..., commentaire: "Déjà là" }
  const currentCommentaire = 'Déjà là avant changement de note';

  // L'enseignant clique sur ECA → saveNote appelle upsertNote avec
  // (evalId, eleveId, 2, false, current?.commentaire ?? null)
  await enseignant.upsertNote('eval-1', 'eleve-1', 2, false, currentCommentaire);

  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.equal(body.score, 2);
  assert.equal(body.commentaire, currentCommentaire,
    'le commentaire existant doit être renvoyé pour ne pas être écrasé');
});

test('toggleAbsent — préserve le commentaire existant lors du passage absent', async () => {
  resetFetch();
  fetchResponder = ({ opts }) => ({
    ok: true, arr: [{ id: 'n', ...JSON.parse(opts.body) }],
  });

  const currentCommentaire = 'Absence justifiée par la famille';

  // toggleAbsent → upsertNote(evalId, eleveId, null, true, current?.commentaire ?? null)
  await enseignant.upsertNote('eval-1', 'eleve-1', null, true, currentCommentaire);

  const body = JSON.parse(fetchCalls[0].opts.body);
  assert.equal(body.absent, true);
  assert.equal(body.score, null);
  assert.equal(body.commentaire, currentCommentaire);
});
