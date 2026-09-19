import { Module } from '@nestjs/common';
import { KafkaAdminService } from './kafka-admin.service';

@Module({
  providers: [KafkaAdminService],
  exports: [KafkaAdminService],
})
export class KafkaModule {}
