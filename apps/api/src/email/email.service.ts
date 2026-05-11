import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface FriendRequestEmailOptions {
  to: string;
  senderName: string;
  inviteUrl: string;
  isNewUser: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name, { timestamp: true });
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  async sendFriendRequestEmail(options: FriendRequestEmailOptions): Promise<void> {
    const { to, senderName, inviteUrl, isNewUser } = options;

    const subject = `${senderName} wants to connect with you on Money App`;

    const html = `
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
              <!-- Main Container -->
              <table width="100%" style="max-width: 600px; background-color: #0a0a0a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Hero Image -->
                <tr>
                </tr>
                
                <!-- Content Section -->
                <tr>
                  <td style="padding: 48px 40px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <!-- Title -->
                          <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 12px; letter-spacing: -0.5px;">
                            Friend Request
                          </h1>
                          
                          <!-- Subtitle -->
                          <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; font-weight: 400;">
                            Someone wants to connect with you
                          </p>
                          
                          <!-- Main Message -->
                          <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 8px; font-weight: 500;">
                            <span style="color: #00ff41; font-weight: 700;">${senderName}</span> wants to add you
                          </p>
                          <p style="color: #ffffff; font-size: 18px; line-height: 1.6; margin: 0 0 32px; font-weight: 500;">
                            as a friend on Money App
                          </p>
                          
                          <!-- Description -->
                          <p style="color: #a1a1aa; font-size: 15px; margin: 0 0 32px; line-height: 1.5;">
                            ${isNewUser ? 'Create an account to connect and start splitting expenses together' : 'Accept their request to start splitting expenses together'}
                          </p>
                          
                          <!-- CTA Button -->
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
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 32px 40px; background-color: #000000; border-top: 1px solid #1a1a1a;">
                    <p style="color: #71717a; font-size: 13px; margin: 0 0 16px; text-align: center; line-height: 1.5;">
                      This link expires in 7 days. If you didn't expect this email, you can safely ignore it.
                    </p>
                    <p style="color: #71717a; font-size: 11px; margin: 0; text-align: center;">
                      Money App is regulated by the Financial Technology Association
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Logo Footer -->
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

    try {
      await this.transporter.sendMail({
        from: `"MoneyApp" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
      this.logger.log(`Friend request email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      // Don't throw - email failure shouldn't block the friend request
    }
  }
}
