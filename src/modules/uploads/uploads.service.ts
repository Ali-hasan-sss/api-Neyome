import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif',
]);

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_DIMENSION = 512;
const AVATAR_WEBP_QUALITY = 85;
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadsRoot: string;
  private readonly avatarsDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadsRoot = path.resolve(
      this.configService.get<string>('UPLOADS_DIR') || path.join(process.cwd(), 'uploads'),
    );
    this.avatarsDir = path.join(this.uploadsRoot, 'avatars');
  }

  getAvatarsDirectory(): string {
    return this.avatarsDir;
  }

  /**
   * Public origin used in avatar URLs returned to clients.
   * Prefer PUBLIC_BASE_URL, then APP_BASE_URL. Localhost is ignored in production
   * so a misconfigured APP_BASE_URL=http://localhost:3000 does not leak into clients.
   */
  getPublicBaseUrl(): string {
    const candidates = [
      this.configService.get<string>('PUBLIC_BASE_URL'),
      this.configService.get<string>('APP_BASE_URL'),
      this.configService.get<string>('BASE_URL'),
    ];
    const isProd = (this.configService.get<string>('NODE_ENV') || '').toLowerCase() === 'production';

    for (const raw of candidates) {
      const value = raw?.trim();
      if (!value) continue;
      if (isProd && this.isLocalhostUrl(value)) {
        this.logger.warn(`Ignoring localhost base URL in production: ${value}`);
        continue;
      }
      return value.replace(/\/$/, '');
    }

    if (isProd) {
      this.logger.warn(
        'PUBLIC_BASE_URL / APP_BASE_URL is not set (or is localhost). Avatar URLs will be relative paths like /uploads/avatars/...',
      );
      return '';
    }
    return 'http://localhost:3000';
  }

  buildAvatarUrl(userId: string): string {
    const baseUrl = this.getPublicBaseUrl();
    const relative = `/uploads/avatars/${userId}.webp`;
    return baseUrl ? `${baseUrl}${relative}` : relative;
  }

  /**
   * Rewrite stored avatar URLs that still point at localhost (or a stale host)
   * so GET /users/me works even before rows are re-uploaded.
   */
  resolveProfileImageUrl(profileImageUrl?: string | null): string | null | undefined {
    if (profileImageUrl == null || profileImageUrl === '') return profileImageUrl;
    if (!profileImageUrl.includes('/uploads/avatars/')) return profileImageUrl;

    const filename = path.basename(profileImageUrl.split('?')[0]);
    if (!filename.endsWith('.webp')) return profileImageUrl;

    const userId = filename.replace(/\.webp$/i, '');
    if (!userId) return profileImageUrl;

    const publicBase = this.getPublicBaseUrl();
    if (!publicBase) {
      return `/uploads/avatars/${filename}`;
    }
    if (this.isLocalhostUrl(profileImageUrl) || !profileImageUrl.startsWith(publicBase)) {
      return `${publicBase}/uploads/avatars/${filename}`;
    }
    return profileImageUrl;
  }

  validateAvatarFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Profile image file is required');
    }
    if (file.size > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Profile image must be 5 MB or smaller');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Profile image must be JPEG, PNG, WebP, HEIC, or AVIF');
    }
  }

  async saveAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    this.validateAvatarFile(file);
    await fs.mkdir(this.avatarsDir, { recursive: true });

    const outputPath = path.join(this.avatarsDir, `${userId}.webp`);
    const tmpPath = `${outputPath}.${Date.now()}.tmp`;

    try {
      await sharp(file.buffer)
        .rotate()
        .resize(AVATAR_MAX_DIMENSION, AVATAR_MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: AVATAR_WEBP_QUALITY, effort: 4 })
        .toFile(tmpPath);

      await fs.rename(tmpPath, outputPath);
      return this.buildAvatarUrl(userId);
    } catch (err) {
      await fs.unlink(tmpPath).catch(() => undefined);
      this.logger.error(`Failed to process avatar for user ${userId}: ${err}`);
      throw new BadRequestException('Failed to process profile image');
    }
  }

  async deleteLocalAvatar(profileImageUrl?: string | null): Promise<void> {
    if (!profileImageUrl) return;
    if (!profileImageUrl.includes('/uploads/avatars/')) return;

    const filename = path.basename(profileImageUrl.split('?')[0]);
    if (!filename || filename.includes('..')) return;

    const filePath = path.join(this.avatarsDir, filename);
    await fs.unlink(filePath).catch(() => undefined);
  }

  private isLocalhostUrl(value: string): boolean {
    try {
      const host = new URL(value).hostname.toLowerCase();
      return LOCALHOST_HOSTS.has(host);
    } catch {
      return /localhost|127\.0\.0\.1/i.test(value);
    }
  }
}
