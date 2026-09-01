import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
  ) {}
  getUsers() {
    return this.usersRepository.findAll();
  }

  createUser(data: { name: string; email: string }) {
    return this.usersRepository.create(data);
  }
  getConfig() {
    return {
      appName: this.configService.get<string>('APP_NAME'),
      nodeEnv: this.configService.get<string>('NODE_ENV'),
      port: this.configService.get<number>('PORT'),
    };
  }
}
