// src/shared/config/config.token.ts
export const APP_CONFIG = Symbol('APP_CONFIG');

interface ILogFileProperties {
  dirname: string;
  filename: string;
  datePattern: string;
  extension: string;
}

interface ILogChannel {
  level: string;
  enableFileLogging: boolean;
  logFileProperties: ILogFileProperties;
}

// Type ตาม YAML structure
export interface AppConfig {
  app: {
    name: string;
    port: number;
    zone: string;
    componentName: string;
    description: string;
    version: string;
    baseApiVersion: string;
    schemaVersion: string;
    authToken: string;
  };
  database: {
    uri: string;
  };
  kafka: {
    brokers: string[];
    consumer: { groupId: string };
    producer: { clientId: string };
  };
  topics: {
    consume: {
      notification: Record<string, string>;
    };
    produce: {
      notification: Record<string, string>;
    };
  };
  externalServices: Record<string, { baseUrl: string; timeout: number }>;
  throttler: {
    ttl: number;
    limit: number;
  };
  log: {
    detail: ILogChannel;
    summary: ILogChannel;
  };
  featureFlags: {
    enableNewNotificationFlow: boolean;
    enableKafkaConsumer: boolean;
  };
}
