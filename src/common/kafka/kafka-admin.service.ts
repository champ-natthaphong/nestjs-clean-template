import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaAdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KafkaAdminService.name);

  private readonly kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'nestjs-clean-template',
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
  });

  private readonly topics = [
    'notification.incoming',
    // เพิ่ม topic อื่นๆ ที่นี่
  ];

  async onApplicationBootstrap() {
    const admin = this.kafka.admin();

    try {
      await admin.connect();

      const existing = await admin.listTopics();
      const toCreate = this.topics.filter((t) => !existing.includes(t));

      if (toCreate.length === 0) {
        this.logger.log('All Kafka topics already exist');
        return;
      }

      await admin.createTopics({
        waitForLeaders: true,
        topics: toCreate.map((topic) => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        })),
      });

      this.logger.log(`Created Kafka topics: ${toCreate.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to create Kafka topics', error);
      throw error;
    } finally {
      await admin.disconnect();
    }
  }
}
