import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserManager } from './managers/user.manager';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [UserController],
  providers: [UserManager, UserService, UserRepository],
})
export class UsersModule {}
