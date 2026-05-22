import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiBody,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  CreateFamilyMemberDto,
  FamilyCodeMembersDto,
  FamilyCodeChildSignInDto,
  RegisterResponseDto,
  LoginResponseDto,
  CreateFamilyMemberResponseDto,
  AutoSignInResponseDto,
  RegenerateLinkResponseDto,
  CurrentUserResponseDto,
  FamilyMembersResponseDto,
  ErrorResponseDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  RequestEmailChangeDto,
  VerifyEmailChangeDto,
  ChildDevicePinDataDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ParentGuard } from './parent.guard';

@ApiTags('Auth')
@ApiExtraModels(ChildDevicePinDataDto)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new parent account',
    description: `
Register a new parent user with email and password authentication.
This creates:
- A new parent user account
- A new family associated with the parent
- A JWT access token for immediate authentication

The parent can then create family members (children) who will use auto sign-in URLs.
    `,
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Parent registered successfully',
    type: RegisterResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already registered',
    type: ErrorResponseDto,
  })
  async register(@Body() dto: RegisterDto) {
    const data = await this.authService.register(dto);
    return { success: true, data, message: 'Registration successful' };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: `
Authenticate a parent user using email and password.
Returns a JWT access token valid for 7 days (configurable via JWT_EXPIRES_IN env var).

**Note:** Only parent users can login with email/password. Family members use auto sign-in URLs.
    `,
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: ErrorResponseDto,
  })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { success: true, data, message: 'Login successful' };
  }

  @Post('family-members')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a family member',
    description: `
Create a new family member (child) in the parent's family.
Returns the created user and an auto sign-in URL that can be shared with the family member.

**Authentication:** Requires JWT token from a parent user.

**PIN rules:**
- Age **≤ 6**: optional **emoji PIN** — exactly **4 characters** (e.g. \`🌟🎈🐻🎨\`). Numeric \`1234\` also allowed.
- Age **> 6**: **4-digit numeric PIN** required (e.g. \`1234\`); no parent recoverable copy.
- Age **≤ 6** with \`pin\`: bcrypt hash + **encrypted recoverable copy** — parent reads via \`GET /auth/family-members/:childId/device-pin\`.

**Auto Sign-In URL:**
- Valid for 1 year
- Can be regenerated if needed
- Allows the family member to sign in without email/password
    `,
  })
  @ApiBody({ type: CreateFamilyMemberDto })
  @ApiCreatedResponse({
    description: 'Family member created successfully',
    type: CreateFamilyMemberResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only parents can create family members',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Parent or family not found',
    type: ErrorResponseDto,
  })
  async createFamilyMember(@Request() req: any, @Body() dto: CreateFamilyMemberDto) {
    const data = await this.authService.createFamilyMember(req.user.sub, dto);
    return { success: true, data, message: 'Family member created' };
  }

  @Get('family-members/:childId/device-pin')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get recoverable device PIN (child age 6 or under)',
    description: `
Returns the child's stored PIN (emoji or numeric) when:
- The signed-in user is a **parent**
- The child belongs to the parent's family
- The child's **age is 6 or under** (\`age ≤ 6\`)
- A recoverable ciphertext was stored when the child was created (**send \`pin\` with \`age ≤ 6\`** on \`POST /auth/family-members\`)

**Storage model:** bcrypt hash remains used where applicable; recoverable copy is **AES-256-GCM** using \`DEVICE_PIN_ENCRYPTION_KEY\` (recommended) or \`JWT_SECRET\` (min 16 chars). Rotating the key makes existing ciphertext undecryptable.

Treat the response as secret — do not log.
    `,
  })
  @ApiParam({ name: 'childId', format: 'uuid', description: 'Child user id' })
  @ApiOkResponse({
    description: 'Wrapped PIN',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Device PIN retrieved' },
        data: { $ref: getSchemaPath(ChildDevicePinDataDto) },
      },
    },
    examples: {
      sample: {
        summary: 'Success',
        value: { success: true, message: 'Device PIN retrieved', data: { pin: '🌟🎈🐻🎨' } },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Caller is not a parent, or child age is over 6',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Child not in family, or no recoverable PIN was stored',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Ciphertext cannot be decrypted (wrong DEVICE_PIN_ENCRYPTION_KEY / JWT_SECRET)',
    type: ErrorResponseDto,
  })
  async getChildDevicePin(@Request() req: any, @Param('childId') childId: string) {
    const data = await this.authService.getRecoverableDevicePinForParent(req.user.sub, childId);
    return { success: true, data, message: 'Device PIN retrieved' };
  }

  @Post('family-code/members')
  @ApiOperation({
    summary: 'List family members by family code',
    description: `
Allows a child to manually enter a family code (when QR scan is unavailable) and receive the list of children in that family.

**Flow:**
1. Child enters family code
2. App lists all children in that family
3. Child selects their profile
4. If child age > 6, app asks for **4-digit numeric PIN**; if age ≤ 6 and a PIN was set, **4-character emoji PIN** may be used
    `,
  })
  @ApiBody({ type: FamilyCodeMembersDto })
  @ApiOkResponse({
    description: 'Family members list for this family code',
    type: FamilyMembersResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Family code not found',
    type: ErrorResponseDto,
  })
  async getFamilyMembersByFamilyCode(@Body() dto: FamilyCodeMembersDto) {
    const data = await this.authService.getFamilyMembersByFamilyCode(dto.familyCode);
    return { success: true, data, message: 'Family members fetched' };
  }

  @Post('family-code/signin')
  @ApiOperation({
    summary: 'Child sign-in by family code and PIN',
    description: `
Manual child sign-in flow using family code and child selection.

**Requirements:**
- Valid family code
- Valid child id within that family
- If child age > 6: **4-digit numeric PIN** is required
- If child age ≤ 6 and a PIN was configured: **4-character emoji PIN** (or digits) when signing in with PIN
    `,
  })
  @ApiBody({ type: FamilyCodeChildSignInDto })
  @ApiOkResponse({
    description: 'Child sign-in successful',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid PIN',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Family or child not found',
    type: ErrorResponseDto,
  })
  async familyCodeChildSignIn(@Body() dto: FamilyCodeChildSignInDto) {
    const data = await this.authService.familyCodeChildSignIn(dto);
    return { success: true, data, message: 'Login successful' };
  }

  @Get('auto-signin/:token')
  @ApiOperation({
    summary: 'Auto sign-in via magic link',
    description: `
Sign in a family member using their unique magic link token.
This is the authentication method for non-parent family members.

**How it works:**
1. Parent creates a family member and receives an auto sign-in URL
2. Parent shares the URL with the family member
3. Family member opens the URL to get authenticated
4. Returns a JWT token for subsequent API calls

**Token validity:** 1 year from creation (can be regenerated by parent)
    `,
  })
  @ApiParam({
    name: 'token',
    description: 'Magic link token from the auto sign-in URL',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  })
  @ApiOkResponse({
    description: 'Auto sign-in successful',
    type: AutoSignInResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired sign-in link',
    type: ErrorResponseDto,
  })
  async autoSignIn(@Param('token') token: string) {
    const data = await this.authService.autoSignIn(token);
    return { success: true, data, message: 'Sign-in successful' };
  }

  @Post('family-members/:id/regenerate-link')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Regenerate auto sign-in URL',
    description: `
Generate a new auto sign-in URL for an existing family member.
This invalidates the previous URL and creates a new one valid for 1 year.

**Use cases:**
- Original URL was compromised
- URL expired
- Family member lost access

**Authentication:** Requires JWT token from the parent of the family.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Family member user ID',
    example: '8f6a9c0e-4c7a-4c72-8a3d-1b3fc0f0aa11',
  })
  @ApiOkResponse({
    description: 'Link regenerated successfully',
    type: RegenerateLinkResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only parents can regenerate links',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Family member not found or not in your family',
    type: ErrorResponseDto,
  })
  async regenerateMagicLink(@Request() req: any, @Param('id') memberId: string) {
    const data = await this.authService.regenerateMagicLink(req.user.sub, memberId);
    return { success: true, data, message: 'Link regenerated' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user',
    description: `
Retrieve the currently authenticated user's profile information.
Works for both parent and family member users.

**Authentication:** Requires valid JWT token.
    `,
  })
  @ApiOkResponse({
    description: 'Current user data',
    type: CurrentUserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    type: ErrorResponseDto,
  })
  async getCurrentUser(@Request() req: any) {
    const data = await this.authService.getCurrentUser(req.user.sub);
    return { success: true, data, message: 'User fetched' };
  }

  @Get('family-members')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List family members',
    description: `
Get all family members (children) in the parent's family.
Does not include the parent user in the response.

**Authentication:** Requires JWT token from a parent user.
    `,
  })
  @ApiOkResponse({
    description: 'Family members list',
    type: FamilyMembersResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid JWT token',
    type: ErrorResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Only parents can list family members',
    type: ErrorResponseDto,
  })
  async getFamilyMembers(@Request() req: any) {
    const data = await this.authService.getFamilyMembers(req.user.sub);
    return { success: true, data, message: 'Family members fetched' };
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset OTP',
    description: `
Request a password reset OTP to be sent to the user's email.
Only works for parent accounts (not family members).

**Flow:**
1. User provides their email address
2. System checks if a parent account exists with that email
3. If found, a 6-digit OTP is generated and sent via email
4. OTP is valid for 10 minutes
5. User uses the OTP with reset-password endpoint to set new password
    `,
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({
    description: 'Password reset OTP sent successfully',
    type: ForgotPasswordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No account found with this email',
    type: ErrorResponseDto,
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto);
    return { success: true, message: 'Password reset OTP sent to your email' };
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password using OTP',
    description: `
Reset the user's password using the OTP received via email.

**Requirements:**
- Valid email address of a parent account
- 6-digit OTP received via email (valid for 10 minutes)
- New password (minimum 8 characters)

**Note:** After successful reset, the OTP is invalidated and cannot be reused.
    `,
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({
    description: 'Password reset successfully',
    type: ResetPasswordResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Invalid email or OTP',
    type: ErrorResponseDto,
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
    return { success: true, message: 'Password reset successfully' };
  }

  @Post('change-email/request')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request email change (sends OTP to new email)',
    description: `
Parent users can change their login email in two steps:

1. **POST /auth/change-email/request** — provide \`newEmail\`; a 6-digit OTP is sent to the **new** address (valid 10 minutes).
2. **POST /auth/change-email/verify** — provide \`newEmail\` and \`otp\` to confirm; returns updated user and a new JWT.

Requires authentication (parent with email/password account).
    `,
  })
  @ApiBody({ type: RequestEmailChangeDto })
  @ApiOkResponse({
    description: 'Verification code sent to new email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Verification code sent to your new email' },
        data: {
          type: 'object',
          properties: { expiresInMinutes: { type: 'number', example: 10 } },
        },
      },
    },
  })
  @ApiConflictResponse({ description: 'Email already in use', type: ErrorResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request', type: ErrorResponseDto })
  async requestEmailChange(@Request() req: any, @Body() dto: RequestEmailChangeDto) {
    const data = await this.authService.requestEmailChange(req.user.sub, dto);
    return {
      success: true,
      data,
      message: 'Verification code sent to your new email',
    };
  }

  @Post('change-email/verify')
  @UseGuards(JwtAuthGuard, ParentGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify OTP and apply new email',
    description: 'Confirms the pending email change using the OTP sent to the new address.',
  })
  @ApiBody({ type: VerifyEmailChangeDto })
  @ApiOkResponse({
    description: 'Email updated; new JWT issued',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email updated successfully' },
        data: {
          type: 'object',
          properties: {
            user: { type: 'object' },
            accessToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid or expired OTP', type: ErrorResponseDto })
  async verifyEmailChange(@Request() req: any, @Body() dto: VerifyEmailChangeDto) {
    const data = await this.authService.verifyEmailChange(req.user.sub, dto);
    return { success: true, data, message: 'Email updated successfully' };
  }
}
