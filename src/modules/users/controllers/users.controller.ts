import { Controller, Get, Body, Post } from '@nestjs/common';
import { UsersManager } from '../managers/users.manager';
import { CreateUserDto } from '../dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersManager: UsersManager) {}

  @Get()
  getUsers() {
    return this.usersManager.getUsers();
  }
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersManager.createUser(createUserDto);
  }
}
