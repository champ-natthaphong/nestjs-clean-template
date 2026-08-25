import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database-registry.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ModulesModule } from './modules/modules.module';

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
    // --- Database (Mongoose + startup log) ------------------
    DatabaseModule,
    // --- Feature Modules ------------------------------------
    ModulesModule,
  ],
})
export class AppModule {}
