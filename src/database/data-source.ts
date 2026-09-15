import { DataSource } from 'typeorm';
import { UserEntity } from '../modules/users/entities/user.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entity';
import 'dotenv/config';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/nestjs_template',
  entities: [UserEntity, NotificationEntity],
  migrations: ['src/database/migrations/*.ts'],
});
