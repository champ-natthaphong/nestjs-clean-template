import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseModule } from './database/database-registry.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { FeaturesModule } from './modules/features.module';
import { AppConfigModule } from './shared/config/app-config.module';
import { CommonModule } from './common/common.module';
import { KafkaModule } from './common/kafka/kafka.module';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { runSeeds } from './database/seeds';
import { AuthModule } from './modules/auth/auth.module';
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
    AuthModule,
    CommonModule,
    DatabaseModule,
    KafkaModule,
    FeaturesModule,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    if (process.env.ZONE === 'local') {
      this.logger.log('Running seeds...');
      await runSeeds(this.dataSource);
      this.logger.log('Seeds completed!');
    }
  }
}
