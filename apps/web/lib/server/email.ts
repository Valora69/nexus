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

function buildFriendRequestHtml({
  senderName,
  inviteUrl,
  isNewUser,
}: Pick<
  FriendRequestEmailOptions,
  'senderName' | 'inviteUrl' | 'isNewUser'
>): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">💰 MoneyApp</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: #1a1a1a; margin: 0 0 16px; font-size: 20px; font-weight: 600;">
                    ${isNewUser ? "You've been invited!" : 'New friend request'}
                  </h2>
                  <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                    <strong>${senderName}</strong> wants to connect with you on MoneyApp
                    ${isNewUser ? '— the easiest way to split expenses with friends.' : ' to split expenses together.'}
                  </p>
                  <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px;">
                        <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                          ${isNewUser ? 'Join MoneyApp' : 'Accept Request'}
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #999999; font-size: 13px; margin: 24px 0 0; text-align: center;">
                    If you didn't expect this invite, you can safely ignore it.
                  </p>
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
