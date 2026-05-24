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

export interface AnswerToAskerEmailOpts {
  toEmail:           string;
  fromEmail:         string;
  bccEmail?:         string;
  replyToEmail?:     string;
  askerName:         string;
  questionContent:   string;
  answerTitle?:      string;
  answerContent:     string;
  referenceId?:      string;
  /** Who authored the answer — affects subject and body wording. 'רב' or 'מזכירות'. */
  writerType:        string;
  /** "View on site" button — set only when the question is publicly visible. */
  publicUrl?:        string;
  /** Always set. Points to the right follow-up form: public Q&A page when the question is published, askPage otherwise. */
  followUpUrl:       string;
  /** Affects wording of the footer CTA. */
  isPubliclyVisible: boolean;
}

export interface QuestionReceivedEmailOpts {
  toEmail:         string;
  fromEmail:       string;
  askerName:       string;
  questionContent: string;
  allowPublic:     boolean;
  referenceId?:    string;
  publicBaseUrl:   string;
}

export async function sendQuestionReceivedEmail(opts: QuestionReceivedEmailOpts): Promise<void> {
  const { toEmail, fromEmail, askerName, questionContent, allowPublic, referenceId, publicBaseUrl } = opts;
  await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    subject: `שאלתך התקבלה${referenceId ? ` — #${referenceId}` : ''}`,
    html:    buildQuestionReceivedHtml({ askerName, questionContent, allowPublic, referenceId, publicBaseUrl }),
  });
}

export async function sendAnswerToAskerEmail(opts: AnswerToAskerEmailOpts): Promise<void> {
  const { toEmail, fromEmail, bccEmail, replyToEmail, askerName, questionContent, answerTitle, answerContent, referenceId, writerType, publicUrl, followUpUrl, isPubliclyVisible } = opts;
  const isSecretariat = writerType === 'מזכירות';
  const subjectAttribution = isSecretariat ? 'ממזכירות לשכת הרב הראשי' : 'מלשכת הרב הראשי לישראל';
  await resend.emails.send({
    from:    fromEmail,
    to:      [toEmail],
    bcc:     bccEmail ? [bccEmail] : undefined,
    replyTo: replyToEmail || undefined,
    subject: `תשובה לשאלתך ${subjectAttribution}${referenceId ? ` — #${referenceId}` : ''}`,
    html:    buildAnswerToAskerHtml({ askerName, questionContent, answerTitle, answerContent, referenceId, writerType, publicUrl, followUpUrl, isPubliclyVisible }),
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

function buildQuestionReceivedHtml(opts: {
  askerName:       string;
  questionContent: string;
  allowPublic:     boolean;
  referenceId?:    string;
  publicBaseUrl:   string;
}): string {
  const { askerName, questionContent, allowPublic, referenceId, publicBaseUrl } = opts;
  const greetingName = askerName?.trim() ? escapeHtml(askerName.trim()) : 'שלום רב';
  const baseUrl = publicBaseUrl.replace(/\/$/, '');
  const publicBadge = allowPublic
    ? `<span style="display:inline-block;background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;border-radius:4px;padding:3px 10px;font-size:13px;font-weight:bold;">✓ אישרת פרסום</span>`
    : `<span style="display:inline-block;background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;border-radius:4px;padding:3px 10px;font-size:13px;font-weight:bold;">✗ לא אישרת פרסום</span>`;
  return `<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>שאלתך התקבלה</title>
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
              <h1 class="email-title" style="color:#C9A84C;margin:0;font-size:20px;font-weight:bold;">שאלתך התקבלה</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-pad" dir="rtl" style="padding:32px;text-align:right;">
              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">שלום ${greetingName},<br/>שאלתך התקבלה והועברה לעיון בלשכת הרב הראשי לישראל. נחזור אליך באימייל זה לאחר שתינתן תשובה.</p>

              ${referenceId ? `
              <div style="background:#FAF7EF;border:1px solid #C9A84C;border-radius:8px;padding:14px 18px;margin:18px 0;text-align:center;">
                <p style="margin:0 0 4px;color:#6B7280;font-size:13px;">מזהה השאלה שלך</p>
                <p style="margin:0;color:#1B2A4A;font-size:22px;font-weight:bold;letter-spacing:1px;font-family:monospace;">#${escapeHtml(referenceId)}</p>
              </div>` : ''}

              <p style="margin:0 0 8px;font-size:14px;color:#6B7280;">פרסום השאלה והתשובה באתר:</p>
              <p style="margin:0 0 18px;">${publicBadge}</p>

              <p style="font-weight:bold;margin:24px 0 8px;font-size:14px;color:#6B7280;">השאלה ששלחת:</p>
              <div style="background:#F9FAFB;border-right:3px solid #9CA3AF;padding:14px 16px;border-radius:0 6px 6px 0;line-height:1.7;font-size:14px;white-space:pre-wrap;word-wrap:break-word;color:#4B5563;">${escapeHtml(questionContent)}</div>

              ${referenceId ? `
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px;">
              <p style="margin:0;font-size:13px;color:#4B5563;line-height:1.7;">
                <strong style="color:#1B2A4A;">תיקון או עדכון לשאלה?</strong><br/>
                יש לשלוח שאלה חדשה דרך הטופס באתר ולציין בתוכן השאלה את המזהה <strong style="font-family:monospace;color:#1B2A4A;">#${escapeHtml(referenceId)}</strong>. נעדכן או נחליף את השאלה הקודמת.
              </p>` : ''}

              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#4B5563;">לשליחת שאלה נוספת:</p>
              <p style="margin:0 0 18px;"><a href="${escapeHtml(baseUrl)}/shaal-et-harav" style="color:#1B2A4A;text-decoration:underline;font-weight:bold;font-size:14px;">פתח טופס באתר ←</a></p>
              <p style="color:#9CA3AF;font-size:12px;margin:0;line-height:1.6;">הודעה זו נשלחה אוטומטית ממערכת ניהול האתר. אין להשיב לאימייל זה — הוא נשלח מכתובת שאינה מנוטרת.</p>
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

function buildAnswerToAskerHtml(opts: {
  askerName:         string;
  questionContent:   string;
  answerTitle?:      string;
  answerContent:     string;
  referenceId?:      string;
  writerType:        string;
  publicUrl?:        string;
  followUpUrl:       string;
  isPubliclyVisible: boolean;
}): string {
  const { askerName, questionContent, answerTitle, answerContent, referenceId, writerType, publicUrl, followUpUrl, isPubliclyVisible } = opts;
  const isSecretariat = writerType === 'מזכירות';
  const introLine = isSecretariat
    ? 'התקבל מענה ממזכירות לשכת הרב הראשי לשאלה ששלחת:'
    : 'התקבל מענה לשאלתך מלשכת הרב הראשי לישראל:';
  const answerLabel = isSecretariat ? 'מענה המזכירות:' : 'תשובת הרב:';
  const followUpLabel = isPubliclyVisible ? 'שלח שאלת המשך באתר ←' : 'פתח טופס שאלה חדשה ←';
  const followUpIntro = isPubliclyVisible
    ? 'לשליחת שאלת המשך, יש להשתמש בטופס שמתחת לשאלה באתר:'
    : 'לפניות נוספות, יש לשלוח שאלה חדשה דרך הטופס באתר:';
  const greetingName = askerName?.trim() ? escapeHtml(askerName.trim()) : 'שלום רב';
  return `<!DOCTYPE html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>תשובה לשאלתך</title>
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
              <h1 class="email-title" style="color:#C9A84C;margin:0;font-size:20px;font-weight:bold;">תשובה לשאלתך</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td class="email-pad" dir="rtl" style="padding:32px;text-align:right;">
              ${referenceId ? `<p style="color:#6B7280;font-size:13px;margin:0 0 16px;">מזהה שאלה: <strong>#${escapeHtml(referenceId)}</strong></p>` : ''}
              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;">שלום ${greetingName},<br/>${introLine}</p>

              <p style="font-weight:bold;margin:24px 0 8px;font-size:14px;color:#6B7280;">השאלה שלך:</p>
              <div style="background:#F9FAFB;border-right:3px solid #9CA3AF;padding:14px 16px;border-radius:0 6px 6px 0;line-height:1.7;font-size:14px;white-space:pre-wrap;word-wrap:break-word;color:#4B5563;">${escapeHtml(questionContent)}</div>

              <p style="font-weight:bold;margin:24px 0 8px;font-size:14px;color:#6B7280;">${answerLabel}</p>
              <div style="background:#FAF7EF;border-right:3px solid #C9A84C;padding:16px;border-radius:0 6px 6px 0;line-height:1.8;font-size:15px;white-space:pre-wrap;word-wrap:break-word;">
                ${answerTitle?.trim() ? `<p style="font-weight:bold;color:#1B2A4A;margin:0 0 10px;font-size:15px;">${escapeHtml(answerTitle.trim())}</p>` : ''}
                ${escapeHtml(answerContent)}
              </div>

              ${publicUrl ? `
              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
              <p style="margin:0 0 8px;font-size:14px;color:#4B5563;">השאלה והתשובה זמינות לצפיה באתר:</p>
              <p style="margin:0;"><a href="${escapeHtml(publicUrl)}" style="display:inline-block;background:#1B2A4A;color:#C9A84C;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:14px;">צפה באתר ←</a></p>` : ''}

              <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0 16px;">
              <p style="margin:0 0 8px;font-size:14px;color:#4B5563;">${followUpIntro}</p>
              <p style="margin:0 0 18px;"><a href="${escapeHtml(followUpUrl)}" style="color:#1B2A4A;text-decoration:underline;font-weight:bold;font-size:14px;">${followUpLabel}</a></p>
              <p style="color:#9CA3AF;font-size:12px;margin:0;line-height:1.6;">הודעה זו נשלחה אוטומטית ממערכת ניהול האתר. אין להשיב לאימייל זה — הוא נשלח מכתובת שאינה מנוטרת.</p>
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
