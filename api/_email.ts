import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewQuestionEmailOpts {
  toEmail:         string;
  fromEmail:       string;
  askerName:       string;
  askerEmail:      string;
  questionContent: string;
  allowPublic:     boolean;
  referenceId?:    string;
}

export async function sendNewQuestionEmail(opts: NewQuestionEmailOpts): Promise<void> {
  const { toEmail, fromEmail, askerName, askerEmail, questionContent, allowPublic, referenceId } = opts;
  await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    subject: `שאלה חדשה התקבלה${referenceId ? ` — #${referenceId}` : ''}`,
    html:    buildHtml({ askerName, askerEmail, questionContent, allowPublic, referenceId }),
  });
}

export interface FollowUpEmailOpts {
  toEmail:         string;
  fromEmail:       string;
  askerName:       string;
  askerEmail:      string;
  questionContent: string;
  followUpContent: string;
  referenceId?:    string;
}

export async function sendFollowUpEmail(opts: FollowUpEmailOpts): Promise<void> {
  const { toEmail, fromEmail, askerName, askerEmail, questionContent, followUpContent, referenceId } = opts;
  await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    subject: `שאלת המשך${referenceId ? ` — #${referenceId}` : ''}`,
    html:    buildFollowUpHtml({ askerName, askerEmail, questionContent, followUpContent, referenceId }),
  });
}

function buildHtml(opts: {
  askerName:       string;
  askerEmail:      string;
  questionContent: string;
  allowPublic:     boolean;
  referenceId?:    string;
}): string {
  const { askerName, askerEmail, questionContent, allowPublic, referenceId } = opts;
  const publicBadge = allowPublic
    ? `<span style="display:inline-block;background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;border-radius:4px;padding:3px 10px;font-size:13px;font-weight:bold;">✓ אישר פרסום</span>`
    : `<span style="display:inline-block;background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;border-radius:4px;padding:3px 10px;font-size:13px;font-weight:bold;">✗ לא אישר פרסום</span>`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>שאלה חדשה</title>
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; }
    a { color:#1B2A4A; }
    @media only screen and (max-width:600px) {
      .email-container { width:100% !important; }
      .email-pad      { padding:20px !important; }
      .email-head-pad { padding:20px !important; }
      .email-title    { font-size:18px !important; }
    }
  </style>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#F7F4EE;">
  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" dir="rtl" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1B2A4A;">
          <!-- Header -->
          <tr>
            <td class="email-head-pad" dir="rtl" style="background:#1B2A4A;padding:24px 32px;text-align:right;">
              <h1 class="email-title" style="color:#C9A84C;margin:0;font-size:20px;font-weight:bold;">שאלה חדשה התקבלה</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-pad" dir="rtl" style="padding:32px;text-align:right;">
              ${referenceId ? `<p style="color:#6B7280;font-size:13px;margin:0 0 16px;">מזהה שאלה: <strong>#${escapeHtml(referenceId)}</strong></p>` : ''}
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>שם השואל:</strong> ${escapeHtml(askerName)}</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>אימייל:</strong> <a href="mailto:${escapeHtml(askerEmail)}" style="color:#1B2A4A;direction:ltr;unicode-bidi:embed;word-break:break-all;">${escapeHtml(askerEmail)}</a></p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;"><strong>פרסום:</strong> ${publicBadge}</p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
              <p style="font-weight:bold;margin:0 0 8px;font-size:15px;">תוכן השאלה:</p>
              <div style="background:#F9FAFB;border-right:3px solid #C9A84C;padding:16px;border-radius:0 6px 6px 0;line-height:1.8;font-size:15px;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(questionContent)}</div>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
              <p style="color:#9CA3AF;font-size:12px;margin:0;">הודעה זו נשלחה אוטומטית ממערכת ניהול האתר.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildFollowUpHtml(opts: {
  askerName:       string;
  askerEmail:      string;
  questionContent: string;
  followUpContent: string;
  referenceId?:    string;
}): string {
  const { askerName, askerEmail, questionContent, followUpContent, referenceId } = opts;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>שאלת המשך</title>
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; }
    a { color:#1B2A4A; }
    @media only screen and (max-width:600px) {
      .email-container { width:100% !important; }
      .email-pad      { padding:20px !important; }
      .email-head-pad { padding:20px !important; }
      .email-title    { font-size:18px !important; }
    }
  </style>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#F7F4EE;">
  <table role="presentation" dir="rtl" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" dir="rtl" class="email-container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1B2A4A;">
          <!-- Header -->
          <tr>
            <td class="email-head-pad" dir="rtl" style="background:#1B2A4A;padding:24px 32px;text-align:right;">
              <h1 class="email-title" style="color:#C9A84C;margin:0;font-size:20px;font-weight:bold;">שאלת המשך התקבלה</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-pad" dir="rtl" style="padding:32px;text-align:right;">
              ${referenceId ? `<p style="color:#6B7280;font-size:13px;margin:0 0 16px;">מזהה שאלה: <strong>#${escapeHtml(referenceId)}</strong></p>` : ''}
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;"><strong>שם השואל:</strong> ${escapeHtml(askerName) || '<em style="color:#9CA3AF;">לא צוין</em>'}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;"><strong>אימייל:</strong> ${askerEmail ? `<a href="mailto:${escapeHtml(askerEmail)}" style="color:#1B2A4A;direction:ltr;unicode-bidi:embed;word-break:break-all;">${escapeHtml(askerEmail)}</a>` : '<em style="color:#9CA3AF;">לא צוין</em>'}</p>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
              <p style="font-weight:bold;margin:0 0 8px;font-size:15px;">השאלה המקורית:</p>
              <div style="background:#F9FAFB;border-right:3px solid #9CA3AF;padding:16px;border-radius:0 6px 6px 0;line-height:1.8;font-size:14px;white-space:pre-wrap;word-wrap:break-word;color:#4B5563;">${escapeHtml(questionContent)}</div>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
              <p style="font-weight:bold;margin:0 0 8px;font-size:15px;">שאלת המשך:</p>
              <div style="background:#F9FAFB;border-right:3px solid #C9A84C;padding:16px;border-radius:0 6px 6px 0;line-height:1.8;font-size:15px;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(followUpContent)}</div>
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
              <p style="color:#9CA3AF;font-size:12px;margin:0;">הודעה זו נשלחה אוטומטית ממערכת ניהול האתר. שאלת ההמשך אינה מתפרסמת באתר באופן אוטומטי.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
