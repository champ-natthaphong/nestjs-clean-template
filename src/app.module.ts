import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database-registry.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { FeaturesModule } from './modules/features.module';
import { AppConfigModule } from './shared/config/app-config.module';
import { CommonModule } from './common/common.module';
import { KafkaModule } from './common/kafka/kafka.module';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
      ],
    }),
    CommonModule,
    DatabaseModule,
    KafkaModule,
    FeaturesModule,
  ],
})
export class AppModule {}
