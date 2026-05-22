import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminLinksService } from '../admin-links.service';

@ApiTags('Admin Navigation')
@Controller('admin')
export class AdminLinksController {
  constructor(private readonly adminLinksService: AdminLinksService) {}

  @Get('links')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('admin-jwt')
  @ApiOkResponse({ description: 'Admin dashboard navigation links and API routes' })
  getLinks() {
    const data = this.adminLinksService.getNavigation();
    return { success: true, data, message: 'Admin links fetched' };
  }
}
