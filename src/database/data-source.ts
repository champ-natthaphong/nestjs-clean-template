import { DataSource } from 'typeorm';
import { UserEntity } from '../modules/users/entities/user.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development.local' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432'),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'postgres',
  database: process.env.DATABASE_NAME ?? 'nestjs_clean_template',
  entities: [UserEntity, NotificationEntity],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
