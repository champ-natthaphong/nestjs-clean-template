import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByIdWithNotifications(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id },
      relations: { notifications: true },
    });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const user = this.repo.create(dto);
    return this.repo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User | null> {
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async existsById(id: string): Promise<boolean> {
    return this.repo.existsBy({ id });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }
}
