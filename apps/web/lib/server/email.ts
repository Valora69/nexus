import { Resend } from 'resend';

// Lazy-init — avoid failing at import time if RESEND_API_KEY is unset.
let resend: Resend | null = null;
let from = '';

function init() {
  if (resend !== null || from !== '') return; // already initialised

  const apiKey = process.env.RESEND_API_KEY;
  from = process.env.EMAIL_FROM ?? 'MoneyApp <noreply@send.moneyapp.click>';

  if (!apiKey) {
    console.warn(
      'RESEND_API_KEY not set; email sending is disabled for this process.',
    );
    return;
  }

  resend = new Resend(apiKey);
}

interface FriendRequestEmailOptions {
  to: string;
  senderName: string;
  inviteUrl: string;
  isNewUser: boolean;
}

/**
 * Send a friend-request notification email. Port of
 * `apps/api/src/email/email.service.ts#sendFriendRequestEmail`.
 *
 * Fire-and-forget: errors are logged, never thrown.
 */
export async function sendFriendRequestEmail(
  options: FriendRequestEmailOptions,
): Promise<void> {
  init();

  const { to, senderName, inviteUrl, isNewUser } = options;

  if (!resend) {
    console.warn(`Skipping email to ${to} (Resend not configured)`);
    return;
  }

  const subject = `${senderName} wants to connect with you on Money App`;
  const html = buildFriendRequestHtml({ senderName, inviteUrl, isNewUser });

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`Resend rejected email to ${to}:`, error);
      return;
    }

    console.log(`Friend request email sent to ${to} (id: ${data?.id})`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    // Never rethrow — email failure is non-fatal.
  }
}

/** Escape user-controlled text (e.g. a display name) before it goes into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// MoneyApp dark theme (apps/web/app/globals.css `.dark`), inlined for email
// clients: black ground, near-black card, brand neon green (#00ff41).
const EMAIL = {
  ground: '#000000',
  card: '#0b0b0c',
  border: '#1f1f22',
  text: '#e8edf4',
  muted: '#8e97a9',
  accent: '#00ff41',
  onAccent: '#0a0a0a',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

export function buildFriendRequestHtml({
  senderName,
  inviteUrl,
  isNewUser,
}: Pick<
  FriendRequestEmailOptions,
  'senderName' | 'inviteUrl' | 'isNewUser'
>): string {
  const name = escapeHtml(senderName);
  const url = escapeHtml(inviteUrl);
  const heading = isNewUser ? "You've been invited" : 'New friend request';
  const lead = isNewUser
    ? 'wants you on MoneyApp — the calm way to split expenses with people you know.'
    : 'wants to connect with you on MoneyApp to split expenses together.';
  const cta = isNewUser ? 'Join MoneyApp' : 'Accept request';

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark">
      <meta name="supported-color-schemes" content="dark">
      <title>${heading}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${EMAIL.ground}; font-family: ${EMAIL.font};">
      <!-- Inbox preview text -->
      <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
        ${name} ${lead}
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${EMAIL.ground}" style="background-color: ${EMAIL.ground}; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">
              <!-- Wordmark -->
              <tr>
                <td style="padding: 0 4px 20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td width="28" height="28" align="center" valign="middle" bgcolor="${EMAIL.accent}" style="width: 28px; height: 28px; background-color: ${EMAIL.accent}; border-radius: 7px; color: ${EMAIL.onAccent}; font-size: 17px; font-weight: 800; line-height: 28px;">&#8599;</td>
                      <td style="padding-left: 10px; color: ${EMAIL.text}; font-size: 17px; font-weight: 700; letter-spacing: -0.3px;">
                        Money<span style="color: ${EMAIL.accent};">App</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Card -->
              <tr>
                <td bgcolor="${EMAIL.card}" style="background-color: ${EMAIL.card}; border: 1px solid ${EMAIL.border}; border-radius: 24px; padding: 36px 32px;">
                  <h1 style="margin: 0 0 14px; color: ${EMAIL.text}; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.25;">
                    ${heading}
                  </h1>
                  <p style="margin: 0 0 28px; color: ${EMAIL.muted}; font-size: 16px; line-height: 1.6;">
                    <strong style="color: ${EMAIL.text}; font-weight: 600;">${name}</strong> ${lead}
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td bgcolor="${EMAIL.accent}" style="background-color: ${EMAIL.accent}; border-radius: 999px;">
                        <a href="${url}" style="display: inline-block; padding: 14px 30px; color: ${EMAIL.onAccent}; text-decoration: none; font-size: 15px; font-weight: 700; letter-spacing: -0.2px;">
                          ${cta} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 28px 0 0; padding-top: 20px; border-top: 1px solid ${EMAIL.border}; color: ${EMAIL.muted}; font-size: 13px; line-height: 1.6;">
                    Button not working? Paste this link into your browser:<br>
                    <a href="${url}" style="color: ${EMAIL.accent}; text-decoration: none; word-break: break-all;">${url}</a>
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 4px 0; color: ${EMAIL.muted}; font-size: 12px; line-height: 1.6;">
                  This invite expires in 7 days. If you didn't expect it, you can safely ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
