import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../auth/auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private adminTokenExpiresIn(): string {
    return this.configService.get<string>('ADMIN_JWT_EXPIRES_IN') || '30d';
  }

  async login(dto: AdminLoginDto): Promise<{ user: Partial<User>; accessToken: string }> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: dto.email })
      .andWhere('user.isAdmin = :isAdmin', { isAdmin: true })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password || '');
    if (!valid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isParent: false,
      isAdmin: true,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.adminTokenExpiresIn() as any,
    });
    const { password, magicLinkToken, pinHash, devicePinEnc, ...safeUser } = user;
    return { user: safeUser, accessToken };
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .andWhere('user.isAdmin = :isAdmin', { isAdmin: true })
      .getOne();

    if (!user) throw new UnauthorizedException('Admin user not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.password || '');
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.updatedAt = new Date();
    await this.userRepo.save(user);
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepo.findOne({ where: { id: userId, isAdmin: true } });
    if (!user) {
      throw new UnauthorizedException('Admin user not found');
    }
    return user;
  }
}
