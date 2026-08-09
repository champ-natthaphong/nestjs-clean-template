import { Controller, Get } from '@nestjs/common';
import { UsersManager } from '../managers/users.manager';

@Controller('users')
export class UsersController {
  constructor(private readonly usersManager: UsersManager) {}

  @Get()
  getUsers() {
    return this.usersManager.getUsers();
  }
}
