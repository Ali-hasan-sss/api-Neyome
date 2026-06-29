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

  buildAvatarUrl(userId: string): string {
    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      this.configService.get<string>('BASE_URL') ||
      'http://localhost:3000';
    return `${baseUrl.replace(/\/$/, '')}/uploads/avatars/${userId}.webp`;
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

    const baseUrl =
      this.configService.get<string>('APP_BASE_URL') ||
      this.configService.get<string>('BASE_URL') ||
      'http://localhost:3000';
    const prefix = `${baseUrl.replace(/\/$/, '')}/uploads/avatars/`;
    if (!profileImageUrl.startsWith(prefix)) return;

    const filename = path.basename(profileImageUrl);
    const filePath = path.join(this.avatarsDir, filename);
    await fs.unlink(filePath).catch(() => undefined);
  }
}
