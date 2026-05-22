import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { UpdateUserDto } from '../../modules/users/dto/update-user.dto';
import { UsersService } from '../../modules/users/users.service';
import { AdminGuard } from '../guards/admin.guard';
import { AdminUsersService } from '../admin-users.service';
import { AdminCreateUserDto, AdminAssignFamilyPlanDto } from '../dto/admin-create-user.dto';
import { AdminResetUserPasswordDto } from '../dto/admin-change-password.dto';

@ApiTags('Admin Users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('admin-jwt')
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  @Get()
  @ApiQuery({ name: 'search', required: false, description: 'Search name or email (server-side, all pages)' })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'email', required: false })
  findAll(
    @Query() query: PaginationQueryDto & { name?: string; email?: string; search?: string },
  ) {
    return this.usersService.findAll(query).then((data) => ({ success: true, data, message: 'Users fetched' }));
  }

  @Post()
  create(@Body() dto: AdminCreateUserDto) {
    return this.adminUsersService
      .createUser(dto)
      .then((data) => ({ success: true, data, message: 'User created' }));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id).then((data) => ({ success: true, data, message: 'User fetched' }));
  }

  @Patch(':id/password')
  resetPassword(@Param('id') id: string, @Body() dto: AdminResetUserPasswordDto) {
    return this.adminUsersService.resetUserPassword(id, dto.newPassword).then(() => ({
      success: true,
      data: { id },
      message: 'User password updated',
    }));
  }

  @Patch(':id/family-plan')
  assignPlan(@Param('id') id: string, @Body() dto: AdminAssignFamilyPlanDto) {
    return this.adminUsersService.assignFamilyPlan(id, dto.backendPlanId).then((data) => ({
      success: true,
      data,
      message: 'Family plan assigned',
    }));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto).then((data) => ({ success: true, data, message: 'User updated' }));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id).then((data) => ({ success: true, data, message: 'User deleted' }));
  }
}
