import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersManager } from './managers/users.manager';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  controllers: [UsersController],
  providers: [UsersManager, UsersService, UsersRepository],
})
export class UsersModule {}
