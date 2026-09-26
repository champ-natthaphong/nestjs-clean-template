import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async findAll(): Promise<UserEntity[]> {
    return this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByIdWithNotifications(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: { notifications: true },
    });
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserEntity | null> {
    await this.userRepo.update(id, dto);
    return this.userRepo.findOne({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }

  async existsById(id: string): Promise<boolean> {
    return this.userRepo.existsBy({ id });
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepo.existsBy({ email });
  }
  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }
}
