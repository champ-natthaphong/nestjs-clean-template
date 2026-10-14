import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'champ' })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'lamp' })
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'champ@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'champ' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'lamp' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'champ@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: 'admin', enum: ['user', 'admin'] })
  @IsString()
  @IsIn(['user', 'admin'])
  role!: string;
}
