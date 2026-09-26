import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

/** Web client ID — audience of the Google ID token sent by the Flutter app. */
export const DEFAULT_GOOGLE_WEB_CLIENT_ID =
  '461238717581-kus9cn1nqgcm7smhoo0kf409t1f3f08s.apps.googleusercontent.com';

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;
  private clientId: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verify a Google ID token locally with Google's public certs (google-auth-library).
   * Audience must be the web client ID configured for the Flutter app.
   */
  async verifyIdToken(idToken: string): Promise<TokenPayload> {
    const audience = this.resolveClientId();
    try {
      const ticket = await this.getClient(audience).verifyIdToken({
        idToken,
        audience,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || payload.email_verified !== true) {
        throw new UnauthorizedException('Invalid Google token');
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private resolveClientId(): string {
    const configured = this.configService.get<string>('GOOGLE_WEB_CLIENT_ID')?.trim();
    return configured || DEFAULT_GOOGLE_WEB_CLIENT_ID;
  }

  private getClient(clientId: string): OAuth2Client {
    if (!this.client || this.clientId !== clientId) {
      this.clientId = clientId;
      this.client = new OAuth2Client(clientId);
    }
    return this.client;
  }
}
