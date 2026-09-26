import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MaxLength(100)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class UpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['user', 'admin'])
  role!: string;
}
