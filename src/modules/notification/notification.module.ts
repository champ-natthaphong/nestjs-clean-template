import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationController } from './controllers/notification.controller';
import { NotificationConsumerController } from './controllers/notification-consumer.controller';
import { NotificationManager } from './managers/notification.manager';
import { NotificationService } from './services/notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { SummaryFlush } from '../../common';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationController, NotificationConsumerController],
  providers: [NotificationManager, NotificationService, NotificationRepository, SummaryFlush],
  exports: [NotificationService],
})
export class NotificationModule {}
