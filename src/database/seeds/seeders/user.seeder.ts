import { DataSource, DeepPartial } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { BaseSeeder } from '../base.seeder';
import { UserEntity } from '../../../modules/users/entities/user.entity';

export class UserSeeder extends BaseSeeder<UserEntity> {
  entity() {
    return UserEntity;
  }

  fileName() {
    return 'users';
  }

  // hash password ก่อน save

  async transform(data: DeepPartial<UserEntity>[]): Promise<DeepPartial<UserEntity>[]> {
    return Promise.all(
      data.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password!, 10),
      })),
    );
  }
}
