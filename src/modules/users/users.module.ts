import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserManager } from './managers/user.manager';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  controllers: [UserController],
  providers: [UserManager, UserService, UserRepository],
})
export class UsersModule {}
