import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../users/repositories/user.repository';
import { RegisterDto, LoginDto, AuthResponseDto, RefreshTokenDto } from '../dto/auth.dto';
import { ConfigService } from '../../../common';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const exists = await this.userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`Email ${dto.email} already exists`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    return this.buildAuthResponse(user.id, user.email, user.role, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userRepository.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    return this.buildAuthResponse(user.id, user.email, user.role, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    // verify refresh token
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // เช็ค refresh token ใน DB
    const user = await this.userRepository.findByIdWithRefreshToken(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await bcrypt.compare(dto.refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.buildAuthResponse(user.id, user.email, user.role, {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.updateRefreshToken(userId, null);
  }

  private async buildAuthResponse(
    id: string,
    email: string,
    role: string,
    user: AuthResponseDto['user'],
  ): Promise<AuthResponseDto> {
    const accessToken = this.generateAccessToken(id, email, role);
    const refreshToken = this.generateRefreshToken(id, email, role);

    // hash refresh token ก่อนเก็บ DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.updateRefreshToken(id, hashedRefreshToken);

    return { accessToken, refreshToken, user };
  }

  private generateAccessToken(id: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: id, email, role },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: 86400, // 1d = 86400 seconds
      },
    );
  }

  private generateRefreshToken(id: string, email: string, role: string): string {
    return this.jwtService.sign(
      { sub: id, email, role },
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),

        expiresIn: 604800, // 7d = 604800 seconds
      },
    );
  }
}
