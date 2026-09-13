import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async getUserWithNotifications(id: string): Promise<User> {
    const user = await this.userRepository.findByIdWithNotifications(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const exists = await this.userRepository.existsByEmail(dto.email);
    if (exists) {
      throw new ConflictException(`Email ${dto.email} already exists`);
    }
    return this.userRepository.create(dto);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User | null> {
    await this.getUserById(id); // validate exists

    if (dto.email) {
      const emailExists = await this.userRepository.findByEmail(dto.email);
      if (emailExists && emailExists.id !== id) {
        throw new ConflictException(`Email ${dto.email} already exists`);
      }
    }

    return this.userRepository.update(id, dto);
  }

  async deleteUser(id: string): Promise<void> {
    await this.getUserById(id); // validate exists
    await this.userRepository.deleteById(id);
  }
}
