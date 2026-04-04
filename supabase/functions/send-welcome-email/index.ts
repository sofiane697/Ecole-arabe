import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'École Raqib <noreply@ecole-raqib.fr>'; // à adapter à ton domaine vérifié sur Resend

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

serve(async (req) => {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { email, prenom, nom, identifiant, tempPassword, classeNom } = await req.json();

    if (!email || !prenom || !nom || !identifiant || !tempPassword) {
      return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400, headers: CORS_HEADERS });
    }

    const classeInfo = classeNom
      ? `dans la classe <strong>${classeNom}</strong>`
      : 'à l\'école';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <!-- En-tête doré -->
        <tr><td style="background:#BF8A30;padding:32px 40px;text-align:center;">
          <div style="font-size:32px;margin-bottom:8px;">🕌</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Bienvenue à l'École Raqib</h1>
        </td></tr>

        <!-- Corps -->
        <tr><td style="padding:36px 40px;">
          <p style="margin:0 0 16px;color:#1a1a1a;font-size:16px;">
            Bonjour <strong>${prenom} ${nom}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#444;font-size:15px;line-height:1.6;">
            Votre inscription est confirmée ${classeInfo}. Voici vos identifiants pour accéder au portail élève :
          </p>

          <!-- Bloc identifiants -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f5ee;border:1px solid #e8d9b0;border-radius:10px;margin-bottom:24px;">
            <tr><td style="padding:24px 28px;">
              <div style="margin-bottom:14px;">
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Identifiant</div>
                <div style="font-size:22px;font-weight:700;color:#BF8A30;font-family:monospace;letter-spacing:2px;">${identifiant}</div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Mot de passe temporaire</div>
                <div style="font-size:22px;font-weight:700;color:#BF8A30;font-family:monospace;letter-spacing:2px;">${tempPassword}</div>
              </div>
            </td></tr>
          </table>

          <p style="margin:0 0 24px;color:#cc3300;font-size:13px;line-height:1.6;background:#fff3f0;border-left:3px solid #cc3300;padding:10px 14px;border-radius:0 6px 6px 0;">
            ⚠️ Lors de votre <strong>première connexion</strong>, vous devrez changer ce mot de passe.
          </p>

          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            À bientôt,<br/>
            <strong style="color:#1a1a1a;">L'équipe de l'École Raqib</strong>
          </p>
        </td></tr>

        <!-- Pied de page -->
        <tr><td style="background:#f8f8f8;padding:16px 40px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;font-size:11px;color:#aaa;">Cet email a été envoyé automatiquement. Ne pas répondre.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Bienvenue à l'École Raqib — vos identifiants de connexion`,
        html,
      }),
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

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
