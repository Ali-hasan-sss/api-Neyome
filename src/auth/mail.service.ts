import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

const PLACEHOLDER_SMTP_HOSTS = ['smtp.example.com', 'example.com', 'localhost.example'];
const EMAIL_UNAVAILABLE_MESSAGE = 'Email service is temporarily unavailable. Please try again later.';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private readonly host?: string;

  constructor(private readonly configService: ConfigService) {
    this.host = this.configService.get<string>('SMTP_HOST')?.trim() || undefined;
    const port = Number(this.configService.get<string>('SMTP_PORT')) || 587;
    // Env values are strings: "false" must not turn TLS on.
    const secureRaw = String(this.configService.get<string>('SMTP_SECURE') ?? '').trim().toLowerCase();
    const secure = secureRaw ? secureRaw === 'true' || secureRaw === '1' : port === 465;
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host: this.host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }

  private get isConfigured(): boolean {
    return !!this.host && !PLACEHOLDER_SMTP_HOSTS.includes(this.host.toLowerCase());
  }

  onModuleInit() {
    if (!this.isConfigured) {
      this.logger.warn(
        `SMTP is not configured (SMTP_HOST=${this.host ?? '<empty>'}). Password reset and email change will fail until real SMTP settings are provided.`,
      );
      return;
    }
    this.transporter
      .verify()
      .then(() => this.logger.log(`SMTP connection to ${this.host} verified`))
      .catch((err) => this.logger.warn(`SMTP verification failed for ${this.host}: ${err?.message ?? err}`));
  }

  /** Logs the real cause; callers only ever see a generic 503. */
  private async send(mailOptions: nodemailer.SendMailOptions, purpose: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.error(`Cannot send ${purpose} to ${mailOptions.to}: SMTP is not configured`);
      throw new ServiceUnavailableException(EMAIL_UNAVAILABLE_MESSAGE);
    }
    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`${purpose} sent to ${mailOptions.to}`);
    } catch (error) {
      const err = error as Error & { code?: string };
      this.logger.error(`Failed to send ${purpose} to ${mailOptions.to}: ${err.code ?? ''} ${err.message}`, err.stack);
      throw new ServiceUnavailableException(EMAIL_UNAVAILABLE_MESSAGE);
    }
  }

  async sendPasswordResetOtp(email: string, otp: string, userName?: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@neyome.com';
    const appName = this.configService.get<string>('APP_NAME') || 'Neyome';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `${appName} - Password Reset OTP`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello${userName ? ` ${userName}` : ''},</p>
          <p>We received a request to reset your password. Use the following OTP to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
        </div>
      `,
      text: `Your password reset OTP is: ${otp}. This OTP is valid for 10 minutes.`,
    };

    await this.send(mailOptions, 'Password reset OTP');
  }

  async sendEmailChangeOtp(email: string, otp: string, userName?: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SMTP_FROM') || 'noreply@neyome.com';
    const appName = this.configService.get<string>('APP_NAME') || 'Neyome';

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${appName}" <${fromEmail}>`,
      to: email,
      subject: `${appName} - Verify your new email`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirm your new email</h2>
          <p>Hello${userName ? ` ${userName}` : ''},</p>
          <p>Use this verification code to confirm your new email address for ${appName}:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${otp}</span>
          </div>
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          <p>If you did not request this change, ignore this email.</p>
        </div>
      `,
      text: `Your email verification code is: ${otp}. Valid for 10 minutes.`,
    };

    await this.send(mailOptions, 'Email change OTP');
  }
}
