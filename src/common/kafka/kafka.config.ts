import { removePathTraversalCharacters } from '../../shared/utils/sanitize';
import { ConfigService } from '../config/config.service';

const configService = new ConfigService();

export function kafkaConfig() {
  return {
    client: {
      brokers: [process.env.BROKERS!],
      clientId: configService.get<string>('kafka.producer.client-id'),
      ssl: configService.get<boolean>('kafka.client.ssl'),
      sasl:
        removePathTraversalCharacters(process.env.ZONE) !== 'local'
          ? {
              mechanism: 'plain' as const,
              username: process.env.API_KEY!,
              password: process.env.API_SECRET!,
            }
          : undefined,
      requestTimeout: configService.get<number>('kafka.client.request-timeout'),
      enforceRequestTimeout: configService.get<boolean>('kafka.client.enforce-request-timeout'),
      retry: {
        initialRetryTime: configService.get<number>('kafka.client.initial-retry-time'),
        retries: configService.get<number>('kafka.client.retries'),
      },
      connectionTimeout: configService.get<number>('kafka.client.connection-timeout'),
    },
    consumer: {
      groupId: configService.get<string>('kafka.consumer.group-id'),
      allowAutoTopicCreation: configService.get<boolean>(
        'kafka.consumer.allow-auto-topic-creation',
      ),
    },
  };
}
