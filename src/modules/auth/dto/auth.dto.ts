import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'champ' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'lamp' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'champ@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGci...' })
  @IsString()
  refreshToken!: string;
}

export class AuthResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}
