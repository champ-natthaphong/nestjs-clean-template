import { Injectable } from '@nestjs/common';
import { UsersService } from '../services/users.service';

@Injectable()
export class UsersManager {
  constructor(private readonly usersService: UsersService) {}
  getUsers() {
    console.log('UsersManager.getUsers() called');
    return this.usersService.getUsers();
  }

  createUser(data: { name: string; email: string }) {
    return this.usersService.createUser(data);
  }
}
