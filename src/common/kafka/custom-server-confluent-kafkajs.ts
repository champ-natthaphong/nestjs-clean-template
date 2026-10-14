// src/common/kafka/custom-server-confluent-kafkajs.ts
import { CustomTransportStrategy, Server } from '@nestjs/microservices';
import { Kafka, Consumer } from 'kafkajs';

export interface ConfluentKafkaConsumerOptions {
  'group.id': string;
  'allow.auto.create.topics'?: boolean;
}

const logger = new (require('@nestjs/common').Logger)('CustomServerConfluentKafkaJS');

export class CustomServerConfluentKafkaJS extends Server implements CustomTransportStrategy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly options: ConfluentKafkaConsumerOptions) {
    super();
    this.kafka = new Kafka({
      brokers: (process.env.BROKERS ?? 'localhost:9092').split(','),
      clientId: process.env.KAFKA_CLIENT_ID ?? 'nestjs-app',
      ssl: process.env.ZONE !== 'local',
      sasl:
        process.env.ZONE !== 'local'
          ? {
              mechanism: 'plain' as const,
              username: process.env.API_KEY!,
              password: process.env.API_SECRET!,
            }
          : undefined,
    });

    this.consumer = this.kafka.consumer({
      groupId: options['group.id'],
      allowAutoTopicCreation: options['allow.auto.create.topics'] ?? false,
    });
  }

  async listen(callback: () => void): Promise<void> {
    try {
      await this.consumer.connect();
      logger.log('Kafka consumer connected');
      const handlers = this.getHandlers();
      const topics = Array.from(handlers.keys());
      logger.log(`Registered patterns: ${JSON.stringify(topics)}`);
      for (const topic of topics) {
        logger.log(`Subscribing to Kafka topic: "${topic}"`);
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.log(`Subscribed to topic: ${topic}`);
      }

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const handler = this.getHandlerByPattern(topic);
          if (!handler) {
            logger.warn(`No handler found for topic: ${topic}`);
            return;
          }

          let payload: any;
          try {
            const raw = message.value?.toString() ?? '{}';
            payload = JSON.parse(raw);
          } catch {
            logger.error(`Failed to parse message from topic: ${topic}`);
            return;
          }

          logger.debug(`[KAFKA] topic: ${topic} | partition: ${partition}`);

          try {
            await handler(payload, {});
          } catch (error) {
            logger.error(`Handler error for topic: ${topic} | ${(error as Error)?.message}`);
          }
        },
      });

      callback();
    } catch (error) {
      logger.error(`Kafka listen error: ${(error as Error)?.message}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      await this.consumer.disconnect();
      logger.log('Kafka consumer disconnected');
    } catch (error) {
      logger.error(`Kafka close error: ${(error as Error)?.message}`);
    }
  }

  on<EventKey extends string = string>(_event: EventKey, _callback: Function): any {}
  unwrap<T>(): T {
    return this.consumer as unknown as T;
  }
}
