// Edge Function: eleve-photo
// Proxifie l'upload/suppression de photos de profil élèves.
// - Vérifie l'admin_session via RPC SQL avant toute opération.
// - Utilise la service_role key (bypass RLS storage) pour écrire dans le bucket
//   eleves-photos, dont les INSERT/DELETE sont bloqués pour anon/authenticated.
// - Met à jour la table profils_eleves dans la même transaction logique,
//   avec rollback storage si l'update DB échoue (évite les orphelins).
//
// verify_jwt: false — le projet utilise une auth bcrypt custom (pas Supabase Auth).
// La confiance repose sur verify_admin_session(p_id) côté DB.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUCKET = 'eleves-photos';
const ALLOWED_EXT  = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES    = 3 * 1024 * 1024;
const MIN_BYTES    = 64;

// CORS : restreint via la variable `ALLOWED_ORIGINS` (séparée par virgules).
// Défaut localhost pour le dev. En prod, poser ALLOWED_ORIGINS=https://ton-domaine.fr.
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '');
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-id, x-op, x-eleve-id, x-ext',
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, cors);
  }

  const adminId = req.headers.get('x-admin-id');
  const op      = req.headers.get('x-op');
  const eleveId = req.headers.get('x-eleve-id');
  const ext     = (req.headers.get('x-ext') || '').toLowerCase();

  if (!adminId || !op || !eleveId) {
    return jsonResponse({ error: 'Missing headers (x-admin-id, x-op, x-eleve-id)' }, 400, cors);
  }
  if (!UUID_RE.test(adminId) || !UUID_RE.test(eleveId)) {
    return jsonResponse({ error: 'Invalid UUID' }, 400, cors);
  }
  if (op !== 'upload' && op !== 'delete') {
    return jsonResponse({ error: 'Unknown op' }, 400, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured' }, 500, cors);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Vérification admin_session via RPC
  const { data: isAdmin, error: verifyErr } = await supabase
    .rpc('verify_admin_session', { p_id: adminId });
  if (verifyErr || isAdmin !== true) {
    return jsonResponse({ error: 'Unauthorized' }, 401, cors);
  }

  const prefix = `profiles/${eleveId}`;

  // Purge récursive du dossier profiles/{eleveId}/ (avec pagination)
  const purge = async (): Promise<void> => {
    let offset = 0;
    const PAGE = 100;
    const allPaths: string[] = [];
    while (true) {
      const { data: items, error } = await supabase.storage
        .from(BUCKET)
        .list(prefix, { limit: PAGE, offset });
      if (error) {
        console.warn('[eleve-photo] list error', error.message);
        break;
      }
      if (!items || items.length === 0) break;
      for (const it of items) {
        if (it.id) allPaths.push(`${prefix}/${it.name}`);
      }
      if (items.length < PAGE) break;
      offset += PAGE;
    }
    if (allPaths.length > 0) {
      const { error } = await supabase.storage.from(BUCKET).remove(allPaths);
      if (error) console.warn('[eleve-photo] remove error', error.message);
    }
  };

  // ─── DELETE ──────────────────────────────────────────────────────────
  if (op === 'delete') {
    await purge();
    const { error } = await supabase
      .from('profils_eleves')
      .update({ photo_url: null, photo_path: null })
      .eq('id', eleveId);
    if (error) {
      return jsonResponse({ error: 'DB update failed: ' + error.message }, 500, cors);
    }
    return jsonResponse({ ok: true }, 200, cors);
  }

  // ─── UPLOAD ──────────────────────────────────────────────────────────
  if (!ext || !ALLOWED_EXT.includes(ext)) {
    return jsonResponse({ error: 'Invalid ext (jpg|jpeg|png|webp)' }, 400, cors);
  }
  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  if (!ALLOWED_MIME.includes(contentType)) {
    return jsonResponse({ error: 'Invalid content-type (image/jpeg|png|webp)' }, 400, cors);
  }

  const body = await req.arrayBuffer();
  if (body.byteLength < MIN_BYTES) {
    return jsonResponse({ error: 'File too small' }, 400, cors);
  }
  if (body.byteLength > MAX_BYTES) {
    return jsonResponse({ error: 'File too large (3 Mo max)' }, 413, cors);
  }

  // Purge avant nouvel upload
  await purge();

  const path = `${prefix}/photo-${Date.now()}.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, {
      contentType,
      cacheControl: '60',
      upsert: false,
    });
  if (uploadErr) {
    return jsonResponse({ error: 'Upload failed: ' + uploadErr.message }, 500, cors);
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const photo_url = pub.publicUrl;

  // Update DB — rollback storage si échoue
  const { error: dbErr } = await supabase
    .from('profils_eleves')
    .update({ photo_url, photo_path: path })
    .eq('id', eleveId);
  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
    return jsonResponse({ error: 'DB update failed: ' + dbErr.message }, 500, cors);
  }

  return jsonResponse({ photo_url, photo_path: path }, 200, cors);
});
