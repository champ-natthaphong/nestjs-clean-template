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
        url:
          process.env.DATABASE_URL ??
          'postgresql://postgres:postgres@localhost:5432/nestjs_template',
        entities: [UserEntity, NotificationEntity],
        synchronize: process.env.ZONE === 'local', // ← auto migrate dev only
        logging: process.env.ZONE === 'local',
      }),
    }),
  ],
})
export class DatabaseModule {}
