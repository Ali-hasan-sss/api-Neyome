import { ApiProperty } from '@nestjs/swagger';
import { registerDecorator, ValidationOptions } from 'class-validator';

function IsRequiredIdToken(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRequiredIdToken',
      target: object.constructor,
      propertyName,
      options: { message: 'idToken is required', ...validationOptions },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && value.trim().length > 0;
        },
      },
    });
  };
}

/**
 * Raw Google ID token from the Flutter Google Sign-In SDK.
 */
export class GoogleLoginDto {
  @ApiProperty({
    description:
      'Signed JWT issued by Google (Flutter Google SDK). Verified server-side with the web client ID as audience. Not a Google access token and not a Firebase Auth ID token.',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ii4...',
  })
  @IsRequiredIdToken()
  idToken: string;
}
