import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../modules/users/entities/user.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: parseInt(process.env.DATABASE_PORT ?? '5432'),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        entities: [UserEntity, NotificationEntity],
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false,
        migrationsTableName: 'migrations',
        extra: {
          min: parseInt(process.env.DATABASE_POOL_MIN ?? '2'),
          max: parseInt(process.env.DATABASE_POOL_MAX ?? '10'),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
        synchronize: process.env.ZONE === 'local',
        logging: process.env.ZONE !== 'local',
        ssl: process.env.ZONE === 'production' ? { rejectUnauthorized: false } : false,
      }),
    }),
  ],
})
export class DatabaseModule {}
