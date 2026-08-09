import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}
  getUsers() {
    return this.usersRepository.findAll();
  }

  createUser(data: { name: string; email: string }) {
    return this.usersRepository.create(data);
  }
}
