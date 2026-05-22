import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminAuthService } from '../admin-auth.service';
import { AdminLoginDto } from '../dto/admin-login.dto';
import { AdminChangePasswordDto } from '../dto/admin-change-password.dto';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOkResponse({ description: 'Admin login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: AdminLoginDto) {
    const data = await this.adminAuthService.login(dto);
    return { success: true, data, message: 'Admin login successful' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('admin-jwt')
  async me(@Request() req: { user: { sub: string } }) {
    const data = await this.adminAuthService.getProfile(req.user.sub);
    return { success: true, data, message: 'Admin profile fetched' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('admin-jwt')
  async changePassword(
    @Request() req: { user: { sub: string } },
    @Body() dto: AdminChangePasswordDto,
  ) {
    await this.adminAuthService.changePassword(req.user.sub, dto);
    return { success: true, data: null, message: 'Password updated' };
  }
}
