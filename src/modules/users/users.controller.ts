import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOkResponse, ApiQuery, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ApiOkWrappedPaginatedResponse, ApiOkWrappedResponse, ApiCreatedWrappedResponse, ApiPaginationQueries, ApiErrorResponses } from '../../common/swagger/api';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ParentGuard } from '../../auth/parent.guard';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateMeMultipartDto, UploadAvatarDto } from './dto/update-me-multipart.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

const AVATAR_UPLOAD_OPTIONS = {
  limits: { fileSize: 5 * 1024 * 1024 },
};

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(ParentGuard)
  @ApiPaginationQueries()
  @ApiQuery({ name: 'name', required: false, description: 'Filter by name (contains)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedPaginatedResponse(CreateUserDto, {
    items: [
      {
        id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
        name: 'Ali',
        email: 'ali@example.com',
        isParent: true,
        familyId: '2f1a9f4e-1111-2222-3333-aaaaaaaaaaaa',
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  })
  @ApiErrorResponses()
  findAll(
    @Request() req: any,
    @Query() query: PaginationQueryDto & { name?: string },
  ) {
    // Parents can only see users in their family
    return this.usersService.findAllForFamily(req.user.familyId, query).then((res) => ({ success: true, data: res, message: 'Users fetched' }));
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user (app user or admin). Use the same Bearer token from login.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(UserProfileDto, {
    id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
    name: 'Ali',
    email: 'ali@example.com',
    isParent: true,
    profileImageUrl: 'http://localhost:3000/uploads/avatars/8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11.webp',
  })
  @ApiErrorResponses()
  getMe(@Request() req: any) {
    return this.usersService.findOne(req.user.sub).then((data) => ({ success: true, data, message: 'User fetched' }));
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Update name, locale, emoji, and/or profile image. Send `multipart/form-data` when uploading an image, or `application/json` for text fields only. Works for app users and admins.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: UpdateMeMultipartDto })
  @UseInterceptors(FileInterceptor('profileImage', AVATAR_UPLOAD_OPTIONS))
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(UserProfileDto, {
    id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
    name: 'Ali Updated',
    email: 'ali@example.com',
    profileImageUrl: 'http://localhost:3000/uploads/avatars/8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11.webp',
  })
  @ApiErrorResponses()
  updateMe(
    @Request() req: any,
    @Body() dto: UpdateMeDto,
    @UploadedFile() profileImage?: Express.Multer.File,
  ) {
    return this.usersService
      .updateMe(req.user.sub, dto, profileImage)
      .then((data) => ({ success: true, data, message: 'User updated' }));
  }

  @Post('me/avatar')
  @ApiOperation({
    summary: 'Upload profile image only',
    description: 'Upload and process a profile image for the authenticated user. Image is resized to max 512px and saved as WebP.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  @UseInterceptors(FileInterceptor('profileImage', AVATAR_UPLOAD_OPTIONS))
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiOkWrappedResponse(UserProfileDto, {
    id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
    profileImageUrl: 'http://localhost:3000/uploads/avatars/8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11.webp',
  })
  @ApiErrorResponses()
  uploadAvatar(@Request() req: any, @UploadedFile() profileImage: Express.Multer.File) {
    return this.usersService
      .updateAvatar(req.user.sub, profileImage)
      .then((data) => ({ success: true, data, message: 'Profile image updated' }));
  }

  @Get(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedResponse(CreateUserDto, {
    id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
    name: 'Ali',
    email: 'ali@example.com',
    isParent: true,
  })
  @ApiErrorResponses()
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findOneForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'User fetched' }));
  }

  @Patch(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkWrappedResponse(CreateUserDto, {
    id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
    name: 'Ali Updated',
    email: 'ali@example.com',
  })
  @ApiErrorResponses()
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateForFamily(id, req.user.familyId, dto).then((data) => ({ success: true, data, message: 'User updated' }));
  }

  @Delete(':id')
  @UseGuards(ParentGuard)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Parents only' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'User deleted' },
        data: {
          type: 'object',
          properties: { id: { type: 'string', format: 'uuid', example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' } },
        },
      },
    },
    examples: {
      default: {
        summary: 'Wrapped delete response',
        value: { success: true, message: 'User deleted', data: { id: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11' } },
      },
    },
  })
  @ApiErrorResponses()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.usersService.removeForFamily(id, req.user.familyId).then((data) => ({ success: true, data, message: 'User deleted' }));
  }
}
