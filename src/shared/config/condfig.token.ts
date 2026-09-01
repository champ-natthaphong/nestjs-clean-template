// src/shared/config/config.token.ts
export const APP_CONFIG = Symbol('APP_CONFIG');

// Type ตาม YAML structure
export interface AppConfig {
  app: {
    name: string;
    port: number;
    zone: string;
    componentName: string;
    description: string;
    version: string;
    collectionName: string;
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
  externalServices: Record<string, { baseUrl: string; timeout: number }>;
  throttler: {
    ttl: number;
    limit: number;
  };
  log: {
    detail: {
      level: string;
      enableFileLogging: boolean;
      logFileProperties: {
        dirname: string;
        filename: string;
        datePattern: string;
        extension: string;
      };
    };
    summary: {
      level: string;
      enableFileLogging: boolean;
      logFileProperties: {
        dirname: string;
        filename: string;
        datePattern: string;
        extension: string;
      };
    };
  };
  featureFlags: {
    enableNewRegistration: boolean;
    enablePaymentFlow: boolean;
    enableKafkaConsumer: boolean;
  };
}
