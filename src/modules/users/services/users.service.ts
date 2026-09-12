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
    console.log('users repository ');
    console.log({ clss: this.configService });
    const appName = this.configService.get<string>('APP_NAME');
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const port = this.configService.get<string>('PORT');

    console.log({ appName, nodeEnv, port });
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
