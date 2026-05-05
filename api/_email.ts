import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NewQuestionEmailOpts {
  toEmail:         string;
  fromEmail:       string;
  askerName:       string;
  questionContent: string;
  referenceId?:    string;
}

export async function sendNewQuestionEmail(opts: NewQuestionEmailOpts): Promise<void> {
  const { toEmail, fromEmail, askerName, questionContent, referenceId } = opts;
  await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    subject: `שאלה חדשה התקבלה${referenceId ? ` — #${referenceId}` : ''}`,
    html:    buildHtml({ askerName, questionContent, referenceId }),
  });
}

function buildHtml(opts: {
  askerName:       string;
  questionContent: string;
  referenceId?:    string;
}): string {
  const { askerName, questionContent, referenceId } = opts;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><title>שאלה חדשה</title></head>
<body style="font-family:Arial,sans-serif;color:#1B2A4A;background:#F7F4EE;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;border:1px solid #E5E7EB;overflow:hidden;">
    <div style="background:#1B2A4A;padding:24px 32px;">
      <h1 style="color:#C9A84C;margin:0;font-size:20px;font-weight:bold;">שאלה חדשה התקבלה</h1>
    </div>
    <div style="padding:32px;">
      ${referenceId ? `<p style="color:#6B7280;font-size:13px;margin-top:0;">מזהה שאלה: <strong>#${escapeHtml(referenceId)}</strong></p>` : ''}
      <p style="margin:0 0 16px;"><strong>שם השואל:</strong> ${escapeHtml(askerName)}</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
      <p style="font-weight:bold;margin-bottom:8px;">תוכן השאלה:</p>
      <div style="background:#F9FAFB;border-right:3px solid #C9A84C;padding:16px;border-radius:0 6px 6px 0;line-height:1.8;white-space:pre-wrap;">${escapeHtml(questionContent)}</div>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0;">
      <p style="color:#9CA3AF;font-size:12px;margin:0;">הודעה זו נשלחה אוטומטית ממערכת ניהול האתר.</p>
    </div>
  </div>
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
