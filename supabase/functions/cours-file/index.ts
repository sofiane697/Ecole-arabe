// Edge Function: cours-file
// Proxifie les opérations storage du bucket `cours` pour le portail admin.
// Créée à l'audit 2026-07-03 (S3) : les policies storage publiques (read/
// upload/delete ouverts à anon) sont supprimées — toute écriture passe ici,
// authentifiée par le token de session admin (_is_admin), avec la service_role
// key côté serveur. La lecture des fichiers reste par URL publique exacte
// (bucket public, URLs connues uniquement via les RPCs contenus token-gated).
//
// Ops (header x-op) :
//   - upload           : body = fichier brut, header x-path (chemin encodé)
//   - delete-folder    : body JSON { prefix } — purge récursive
//   - delete-old-cover : body JSON { prefix } — supprime cover.* du dossier

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = 'cours';
const MAX_BYTES = 100 * 1024 * 1024; // pdf/pptx/docx de cours potentiellement lourds
const MIN_BYTES = 16;

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'https://ecole-arabe.vercel.app,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token, x-op, x-path',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function jsonResponse(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// Chemins générés par toSlug côté admin : ascii, tirets, points, slashes.
// Refuse toute traversée (`..`) ou chemin absolu.
const PATH_RE = /^[\w\-./]{1,300}$/;
function isValidPath(p: string): boolean {
  return PATH_RE.test(p) && !p.includes('..') && !p.startsWith('/') && !p.endsWith('/');
}
function isValidPrefix(p: string): boolean {
  return PATH_RE.test(p) && !p.includes('..') && !p.startsWith('/');
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500, cors);
  }
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Auth : token de session admin vérifié côté serveur (jamais un simple UUID).
  const token = req.headers.get('x-admin-token');
  if (!token || token.length < 16 || token.length > 500) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
  }
  const { data: isAdmin, error: authErr } = await supabase.rpc('_is_admin', { p_admin_token: token });
  if (authErr || isAdmin !== true) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
  }

  const op = req.headers.get('x-op');

  // ─── UPLOAD ──────────────────────────────────────────────────────────
  if (op === 'upload') {
    let path = '';
    try { path = decodeURIComponent(req.headers.get('x-path') || ''); } catch { /* invalide */ }
    if (!isValidPath(path)) {
      return jsonResponse({ error: 'Invalid path' }, 400, cors);
    }
    const bytes = await req.arrayBuffer();
    if (bytes.byteLength < MIN_BYTES || bytes.byteLength > MAX_BYTES) {
      return jsonResponse({ error: 'Invalid file size' }, 400, cors);
    }
    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) {
      return jsonResponse({ error: 'Upload failed: ' + error.message }, 500, cors);
    }
    return jsonResponse({
      ok: true,
      url: `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${path}`,
    }, 200, cors);
  }

  // Les deux ops de suppression prennent un préfixe JSON.
  let prefix = '';
  try {
    const body = await req.json();
    prefix = String(body?.prefix || '');
  } catch { /* body invalide */ }
  if (!isValidPrefix(prefix)) {
    return jsonResponse({ error: 'Invalid prefix' }, 400, cors);
  }
  prefix = prefix.replace(/\/+$/, '');

  // ─── DELETE-FOLDER (purge récursive, avec pagination) ────────────────
  if (op === 'delete-folder') {
    const purge = async (dir: string, depth: number): Promise<void> => {
      if (depth > 6) return; // garde-fou anti-boucle
      let offset = 0;
      const PAGE = 100;
      const files: string[] = [];
      const folders: string[] = [];
      while (true) {
        const { data: items, error } = await supabase.storage
          .from(BUCKET)
          .list(dir, { limit: PAGE, offset });
        if (error || !items || items.length === 0) break;
        for (const it of items) {
          if (it.id) files.push(`${dir}/${it.name}`);
          else if (it.name) folders.push(`${dir}/${it.name}`);
        }
        if (items.length < PAGE) break;
        offset += PAGE;
      }
      for (const sub of folders) await purge(sub, depth + 1);
      if (files.length > 0) {
        await supabase.storage.from(BUCKET).remove(files);
      }
    };
    await purge(prefix, 0);
    return jsonResponse({ ok: true }, 200, cors);
  }

  // ─── DELETE-OLD-COVER ────────────────────────────────────────────────
  if (op === 'delete-old-cover') {
    const { data: items, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 20, offset: 0 });
    if (!error && Array.isArray(items)) {
      const covers = items
        .filter((i) => i.id && i.name.startsWith('cover.'))
        .map((i) => `${prefix}/${i.name}`);
      if (covers.length > 0) {
        await supabase.storage.from(BUCKET).remove(covers);
      }
    }
    return jsonResponse({ ok: true }, 200, cors);
  }

  return jsonResponse({ error: 'Unknown op' }, 400, cors);
});
