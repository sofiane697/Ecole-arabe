import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
// FROM_EMAIL : surchargeable via un secret Supabase Edge `FROM_EMAIL` sans redéploiement.
// Défaut : onboarding@resend.dev — domaine de test Resend, fonctionne SANS vérification
// mais N'ACCEPTE d'envoyer QU'À l'email owner du compte Resend. Pour envoyer à n'importe
// qui, vérifier un vrai domaine sur https://resend.com/domains et poser la var
// FROM_EMAIL=École As-Safaa <noreply@ton-domaine.fr>.
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'École As-Safaa <onboarding@resend.dev>';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

// Échappement HTML pour toutes les valeurs injectées (nom, identifiant, mdp…).
// Protège contre l'injection si un champ admin contient < > & " '.
function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ParentBlock = { label: string; identifiant: string; password: string };

// ─── Dispatcher ─────────────────────────────────────────────────────────────
// `kind` discrimine le type de mail :
//   - 'welcome' (défaut) : mail de bienvenue élève, avec option parents créés
//   - 'attach'           : notification à un parent existant rattaché à un nouvel enfant
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const kind: string = body.kind || 'welcome';

    if (kind === 'attach') {
      return await handleAttach(body);
    }
    return await handleWelcome(body);
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});

// ─── Mail de bienvenue (élève + éventuels parents nouvellement créés) ───────
async function handleWelcome(body: any): Promise<Response> {
  const { email, prenom, nom, identifiant, tempPassword, classeNom, parents } = body;

  if (!email || !prenom || !nom || !identifiant || !tempPassword) {
    return jsonError('Paramètres manquants', 400);
  }

  const classeInfo = classeNom
    ? `dans la classe <strong>${escapeHtml(classeNom)}</strong>`
    : 'à l\'école';

  const parentsList: ParentBlock[] = Array.isArray(parents) ? parents : [];
  const parentsSectionHtml = parentsList.length === 0 ? '' : `
        <div style="height:1px;background:#eee;margin:28px 0;"></div>

        <h2 style="margin:0 0 6px;color:#1a1a1a;font-size:17px;font-weight:700;">
          ${parentsList.length === 1 ? 'Accès du parent' : 'Accès des parents'}
        </h2>
        <p style="margin:0 0 18px;color:#666;font-size:14px;line-height:1.6;">
          Voici également les identifiants du portail parent pour suivre la scolarité de
          <strong>${escapeHtml(prenom)}</strong> (notes, appréciations, devoirs, retards &amp; absences).
        </p>

        ${parentsList.map(p => `
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6ff;border:1px solid #c7dbff;border-radius:10px;margin-bottom:12px;">
            <tr><td style="padding:18px 22px;">
              <div style="font-size:12px;font-weight:700;color:#2c5cc4;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">
                ${escapeHtml(p.label || 'Parent')}
              </div>
              <div style="margin-bottom:10px;">
                <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Identifiant</div>
                <div style="font-size:18px;font-weight:700;color:#2c5cc4;font-family:monospace;letter-spacing:1.5px;">${escapeHtml(p.identifiant)}</div>
              </div>
              <div>
                <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">Mot de passe temporaire</div>
                <div style="font-size:18px;font-weight:700;color:#2c5cc4;font-family:monospace;letter-spacing:1.5px;">${escapeHtml(p.password)}</div>
              </div>
            </td></tr>
          </table>
        `).join('')}

        <p style="margin:6px 0 0;color:#666;font-size:13px;line-height:1.6;">
          Le portail parent est accessible à la page <strong>/parent/login</strong> du site de l'école.
          Chaque parent devra changer son mot de passe lors de sa première connexion.
        </p>
  `;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <tr><td style="background:#BF8A30;padding:32px 40px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🕌</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Bienvenue à l'École Raqib</h1>
        </td></tr>

        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">
            Bonjour <strong>${escapeHtml(prenom)} ${escapeHtml(nom)}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
            Votre inscription est confirmée ${classeInfo}. Voici vos identifiants pour accéder au portail élève :
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ee;border:1px solid #e8d9b0;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px 28px;">
              <div style="margin-bottom:14px;">
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Identifiant</div>
                <div style="font-size:22px;font-weight:700;color:#BF8A30;font-family:monospace;letter-spacing:2px;">${escapeHtml(identifiant)}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Mot de passe temporaire</div>
                <div style="font-size:22px;font-weight:700;color:#BF8A30;font-family:monospace;letter-spacing:2px;">${escapeHtml(tempPassword)}</div>
              </div>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;color:#cc3300;font-size:13px;line-height:1.6;background:#fff3f0;border-left:3px solid #cc3300;padding:10px 14px;border-radius:0 6px 6px 0;">
            ⚠️ Lors de votre <strong>première connexion</strong>, vous devrez changer ce mot de passe.
          </p>

          ${parentsSectionHtml}

          <p style="margin:24px 0 0;color:#666;font-size:14px;line-height:1.6;">
            À bientôt,<br/>
            <strong style="color:#1a1a1a;">L'équipe de l'École Raqib</strong>
          </p>
        </td></tr>

        <tr><td style="background:#f8f8f8;padding:16px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#aaa;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = parentsList.length > 0
    ? `Bienvenue à l'École Raqib — identifiants élève et parent`
    : `Bienvenue à l'École Raqib — vos identifiants de connexion`;

  return await sendResendEmail(email, subject, html);
}

// ─── Mail de rattachement : notifie un parent existant d'un nouvel enfant ──
async function handleAttach(body: any): Promise<Response> {
  const { email, foyerLabel, identifiant, elevePrenom, eleveNom, classeNom } = body;

  if (!email || !elevePrenom || !eleveNom) {
    return jsonError('Paramètres manquants', 400);
  }

  const classeInfo = classeNom
    ? ` dans la classe <strong>${escapeHtml(classeNom)}</strong>`
    : '';

  const identifiantBlock = identifiant ? `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f6ff;border:1px solid #c7dbff;border-radius:10px;margin-bottom:20px;">
          <tr><td style="padding:18px 22px;">
            <div style="font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">
              Votre identifiant de portail parent
            </div>
            <div style="font-size:20px;font-weight:700;color:#2c5cc4;font-family:monospace;letter-spacing:1.5px;">
              ${escapeHtml(identifiant)}
            </div>
            <p style="margin:10px 0 0;font-size:12px;color:#666;line-height:1.5;">
              Votre mot de passe actuel reste inchangé.
              Si vous l'avez oublié, contactez l'administration de l'école.
            </p>
          </td></tr>
        </table>
  ` : '';

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <tr><td style="background:#2c5cc4;padding:32px 40px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">👨‍👩‍👧</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nouveau rattachement — École Raqib</h1>
        </td></tr>

        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">
            Bonjour <strong>${escapeHtml(foyerLabel || 'cher parent')}</strong>,
          </p>
          <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.65;">
            Vous êtes désormais également rattaché(e) au compte de
            <strong>${escapeHtml(elevePrenom)} ${escapeHtml(eleveNom)}</strong>${classeInfo}.
            Vous aurez accès à sa scolarité depuis votre portail parent habituel :
            notes, appréciations, devoirs, retards &amp; absences.
          </p>

          ${identifiantBlock}

          <p style="margin:0 0 24px;color:#666;font-size:13px;line-height:1.6;">
            Le portail parent est accessible à la page <strong>/parent/login</strong> du site de l'école.
            Le sélecteur en haut de page vous permettra de basculer entre vos enfants.
          </p>

          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            À bientôt,<br/>
            <strong style="color:#1a1a1a;">L'équipe de l'École Raqib</strong>
          </p>
        </td></tr>

        <tr><td style="background:#f8f8f8;padding:16px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#aaa;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = `École Raqib — vous êtes désormais rattaché à ${elevePrenom} ${eleveNom}`;
  return await sendResendEmail(email, subject, html);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
async function sendResendEmail(to: string, subject: string, html: string): Promise<Response> {
  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: err }), {
      status: resendRes.status,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  const data = await resendRes.json();
  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
