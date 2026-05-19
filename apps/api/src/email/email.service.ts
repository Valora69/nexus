import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Resend } from 'resend';

interface FriendRequestEmailOptions {
  to: string;
  senderName: string;
  inviteUrl: string;
  isNewUser: boolean;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name, { timestamp: true });
  private resend: Resend | null = null;
  private from = '';

  onModuleInit() {
    const apiKey = process.env.RESEND_API_KEY;
    this.from =
      process.env.EMAIL_FROM ?? 'MoneyApp <noreply@send.moneyapp.click>';

    if (!apiKey) {
      // Don't crash boot — outbound email is non-critical. Log and degrade
      // to no-op sends so the API still serves requests.
      this.logger.warn(
        'RESEND_API_KEY not set; email sending is disabled for this process.',
      );
      return;
    }
    this.resend = new Resend(apiKey);
  }

  async sendFriendRequestEmail(
    options: FriendRequestEmailOptions,
  ): Promise<void> {
    const { to, senderName, inviteUrl, isNewUser } = options;

    if (!this.resend) {
      this.logger.warn(`Skipping email to ${to} (Resend not configured)`);
      return;
    }

    const subject = `${senderName} wants to connect with you on Money App`;
    const html = this.buildFriendRequestHtml({ senderName, inviteUrl, isNewUser });

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (error) {
        this.logger.error(`Resend rejected email to ${to}`, error);
        return;
      }
      this.logger.log(`Friend request email sent to ${to} (id: ${data?.id})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      // Never rethrow — caller is fire-and-forget, email failure is non-fatal.
    }
  }

  private buildFriendRequestHtml({
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
              <table width="100%" style="max-width: 600px; background-color: #0a0a0a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 48px 40px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.5px;">
                            Friend Request
                          </h1>
                          <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; font-weight: 400;">
                            Someone wants to connect with you
                          </p>
                          <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 8px; font-weight: 500;">
                            <span style="color: #00ff41; font-weight: 700;">${senderName}</span> wants to add you
                          </p>
                          <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 32px; font-weight: 500;">
                            as a friend on Money App
                          </p>
                          <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; line-height: 1.5;">
                            ${isNewUser ? 'Create an account to connect and start splitting expenses together' : 'Accept their request to start splitting expenses together'}
                          </p>
                          <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                            <tr>
                              <td align="center" style="border-radius: 8px; background-color: #00ff41;">
                                <a href="${inviteUrl}" style="display: inline-block; padding: 16px 48px; color: #000000; text-decoration: none; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">
                                  ${isNewUser ? 'Join Now' : 'Accept Request'}
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 40px; background-color: #000000; border-top: 1px solid #1a1a1a;">
                    <p style="color: #71717a; font-size: 13px; margin: 0 0 16px; text-align: center; line-height: 1.5;">
                      Accept mo na bilis!
                    </p>
                    <p style="color: #71717a; font-size: 11px; margin: 0; text-align: center;">
                      Money App is regulated by BANSAG
                    </p>
                  </td>
                </tr>
              </table>
              <table width="100%" style="max-width: 600px; margin-top: 32px;">
                <tr>
                  <td align="center">
                    <p style="color: #0a0a0a; font-size: 16px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; letter-spacing: 2px;">
                      MONEY APP
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
}
