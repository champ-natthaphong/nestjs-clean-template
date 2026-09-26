import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AuthManager } from './managers/auth.manager';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { UserRepository } from '../users/repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'secret',
      signOptions: { expiresIn: '1d' },
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthManager, AuthService, UserRepository, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
