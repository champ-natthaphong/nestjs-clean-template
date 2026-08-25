import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
      ],
    }),
    ConfigModule.forRoot({
      envFilePath: ['.env.development.local'],
    }),
    DatabaseModule,
    UsersModule,
  ],
})
export class AppModule {}
