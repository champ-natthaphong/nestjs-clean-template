// kafka-admin.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class KafkaAdminService {
  private readonly logger = new Logger(KafkaAdminService.name);
  private readonly configService = new ConfigService();

  private readonly kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID ?? 'nestjs-clean-template',
    brokers: (process.env.BROKERS ?? 'localhost:9092').split(','),
  });

  private getTopicsFromConfig(): string[] {
    const consume =
      this.configService.get<Record<string, Record<string, string>>>('topics.consume');
    // flatten nested object เช่น { atn: { new-registration-response: 'esb.atn...' } }
    return Object.values(consume).flatMap((group) => Object.values(group));
  }

  async ensureTopicsExist() {
    const admin = this.kafka.admin();
    const topics = ['notification.incoming', ...this.getTopicsFromConfig()];

    try {
      await admin.connect();

      const existing = await admin.listTopics();
      const toCreate = topics.filter((t) => !existing.includes(t));

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
