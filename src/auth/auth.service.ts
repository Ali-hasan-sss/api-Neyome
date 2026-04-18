import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { Family } from '../entities/family.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateFamilyMemberDto } from './dto/create-family-member.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  isParent: boolean;
  familyId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Family)
    private readonly familyRepo: Repository<Family>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Register a new parent user with email and password
   */
  async register(dto: RegisterDto): Promise<{ user: Partial<User>; accessToken: string; family: Family }> {
    // Check if email already exists
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate UUID if not provided
    const userId = dto.id || crypto.randomUUID();

    // Create family for the parent
    const family = await this.createFamilyWithUniqueCode({
      id: crypto.randomUUID(),
      name: `${dto.name}'s Family`,
      creatorId: userId,
      ownerId: userId,
      createdAt: new Date(),
    });

    // Create parent user
    const user = this.userRepo.create({
      id: userId,
      email: dto.email,
      password: hashedPassword,
      name: dto.name,
      isParent: true,
      familyId: family.id,
      familyCode: family.familyCode,
      locale: dto.locale || 'en',
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.userRepo.save(user);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isParent: true,
      familyId: family.id,
    };
    const accessToken = this.jwtService.sign(payload);

    // Remove sensitive fields
    const { password, magicLinkToken, ...safeUser } = user;

    return { user: safeUser, accessToken, family };
  }

  /**
   * Login parent user with email and password
   */
  async login(dto: LoginDto): Promise<{ user: Partial<User>; accessToken: string }> {
    // Find user with password field
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .andWhere('user.isParent = :isParent', { isParent: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isParent: true,
      familyId: user.familyId,
    };
    const accessToken = this.jwtService.sign(payload);

    // Remove sensitive fields
    const { password, magicLinkToken, ...safeUser } = user;

    return { user: safeUser, accessToken };
  }

  /**
   * Create a family member (child) and generate auto sign-in URL
   */
  async createFamilyMember(
    parentId: string,
    dto: CreateFamilyMemberDto,
  ): Promise<{ user: Partial<User>; autoSignInUrl: string }> {
    // Get parent user to find their family
    const parent = await this.userRepo.findOne({ where: { id: parentId, isParent: true } });
    if (!parent || !parent.familyId) {
      throw new NotFoundException('Parent or family not found');
    }

    // Generate magic link token
    const magicLinkToken = crypto.randomBytes(32).toString('hex');
    const magicLinkExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry

    // Generate UUID if not provided
    const userId = dto.id || crypto.randomUUID();

    if (dto.age !== undefined && dto.age > 6 && !dto.pin) {
      throw new BadRequestException('PIN is required for children older than 6');
    }

    let pinHash: string | undefined;
    if (dto.pin) {
      pinHash = await bcrypt.hash(dto.pin, 10);
    }

    // Create family member
    const user = this.userRepo.create({
      id: userId,
      name: dto.name,
      isParent: false,
      familyId: parent.familyId,
      familyCode: parent.familyCode,
      magicLinkToken,
      magicLinkExpiresAt,
      age: dto.age,
      pinHash,
      emojiOption: dto.emojiOption,
      profileImageUrl: dto.profileImageUrl,
      points: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.userRepo.save(user);

    // Generate auto sign-in URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const autoSignInUrl = `${baseUrl}/auth/auto-signin/${magicLinkToken}`;

    // Remove sensitive fields
    const { password, magicLinkToken: token, pinHash: _pinHash, ...safeUser } = user as any;

    return { user: safeUser, autoSignInUrl };
  }

  /**
   * List family members by familyCode (used for manual child sign-in when QR is unavailable)
   */
  async getFamilyMembersByFamilyCode(familyCode: string): Promise<Partial<User>[]> {
    const family = await this.familyRepo.findOne({ where: { familyCode } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const members = await this.userRepo.find({
      where: { familyId: family.id, isParent: false },
      order: { createdAt: 'ASC' as any },
    });

    return members;
  }

  /**
   * Manual child sign-in by familyCode + childId (+ PIN if required)
   */
  async familyCodeChildSignIn(params: {
    familyCode: string;
    childId: string;
    pin?: string;
  }): Promise<{ user: Partial<User>; accessToken: string }> {
    const family = await this.familyRepo.findOne({ where: { familyCode: params.familyCode } });
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    const child = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.pinHash')
      .where('user.id = :childId', { childId: params.childId })
      .andWhere('user.familyId = :familyId', { familyId: family.id })
      .andWhere('user.isParent = :isParent', { isParent: false })
      .getOne();

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    if ((child.age ?? 0) > 6) {
      if (!params.pin) {
        throw new BadRequestException('PIN is required for children older than 6');
      }
      if (!child.pinHash) {
        throw new BadRequestException('PIN is not set for this child');
      }
      const isPinValid = await bcrypt.compare(params.pin, child.pinHash);
      if (!isPinValid) {
        throw new UnauthorizedException('Invalid PIN');
      }
    }

    const payload: JwtPayload = {
      sub: child.id,
      email: child.email,
      isParent: child.isParent || false,
      familyId: child.familyId,
    };
    const accessToken = this.jwtService.sign(payload);

    const { password, magicLinkToken, pinHash, ...safeUser } = child as any;
    return { user: safeUser, accessToken };
  }

  /**
   * Auto sign-in using magic link token
   */
  async autoSignIn(token: string): Promise<{ user: Partial<User>; accessToken: string }> {
    // Find user with magic link token
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.magicLinkToken')
      .where('user.magicLinkToken = :token', { token })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid or expired sign-in link');
    }

    // Check if token is expired
    if (user.magicLinkExpiresAt && new Date() > user.magicLinkExpiresAt) {
      throw new UnauthorizedException('Sign-in link has expired');
    }

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isParent: user.isParent || false,
      familyId: user.familyId,
    };
    const accessToken = this.jwtService.sign(payload);

    // Remove sensitive fields
    const { password, magicLinkToken, ...safeUser } = user;

    return { user: safeUser, accessToken };
  }

  /**
   * Regenerate magic link for a family member
   */
  async regenerateMagicLink(
    parentId: string,
    memberId: string,
  ): Promise<{ autoSignInUrl: string }> {
    // Verify parent owns this family member
    const parent = await this.userRepo.findOne({ where: { id: parentId, isParent: true } });
    if (!parent || !parent.familyId) {
      throw new NotFoundException('Parent or family not found');
    }

    const member = await this.userRepo.findOne({
      where: { id: memberId, familyId: parent.familyId, isParent: false },
    });
    if (!member) {
      throw new NotFoundException('Family member not found');
    }

    // Generate new magic link token
    const magicLinkToken = crypto.randomBytes(32).toString('hex');
    const magicLinkExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry

    await this.userRepo.update(memberId, { magicLinkToken, magicLinkExpiresAt });

    // Generate auto sign-in URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const autoSignInUrl = `${baseUrl}/auth/auto-signin/${magicLinkToken}`;

    return { autoSignInUrl };
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(payload: JwtPayload): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: payload.sub } });
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: { family: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Get family members for a parent
   */
  async getFamilyMembers(parentId: string): Promise<Partial<User>[]> {
    const parent = await this.userRepo.findOne({ where: { id: parentId, isParent: true } });
    if (!parent || !parent.familyId) {
      throw new NotFoundException('Parent or family not found');
    }

    const members = await this.userRepo.find({
      where: { familyId: parent.familyId, isParent: false },
    });

    return members;
  }

  /**
   * Generate a unique family code
   */
  private generateFamilyCode(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private isUniqueConstraintError(err: any): boolean {
    return err && (err.code === '23505' || err.code === 23505);
  }

  private async createFamilyWithUniqueCode(
    base: Pick<Family, 'id' | 'name' | 'creatorId' | 'ownerId' | 'createdAt' | 'plan'>,
  ): Promise<Family> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const familyCode = this.generateFamilyCode();
      const family: Family = this.familyRepo.create({
        ...base,
        familyCode,
      });

      try {
        return await this.familyRepo.save(family);
      } catch (err: any) {
        if (this.isUniqueConstraintError(err)) {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException('Failed to generate a unique family code');
  }

  /**
   * Generate a 6-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Request password reset - sends OTP to user's email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    // Find user by email (only parent users can reset password)
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isParent: true },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      throw new NotFoundException('If an account with this email exists, you will receive a password reset OTP');
    }

    // Generate OTP and set expiry (10 minutes)
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Hash OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save OTP to user record
    await this.userRepo.update(user.id, {
      passwordResetOtp: hashedOtp,
      passwordResetOtpExpiresAt: otpExpiresAt,
    });

    // Send OTP via email
    await this.mailService.sendPasswordResetOtp(user.email!, otp, user.name);
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    // Find user with OTP field
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordResetOtp')
      .where('user.email = :email', { email: dto.email })
      .andWhere('user.isParent = :isParent', { isParent: true })
      .getOne();

    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    // Check if OTP exists
    if (!user.passwordResetOtp) {
      throw new BadRequestException('No password reset request found. Please request a new OTP');
    }

    // Check if OTP is expired
    if (user.passwordResetOtpExpiresAt && new Date() > user.passwordResetOtpExpiresAt) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(dto.otp, user.passwordResetOtp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password and clear OTP fields
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      passwordResetOtp: null as any,
      passwordResetOtpExpiresAt: null as any,
      updatedAt: new Date(),
    });
  }
}
