// src/common/health/health-check.builder.ts
import { Logger } from '@nestjs/common';
import * as http from 'http';
import { Kafka } from 'kafkajs';
import { KafkaOptions } from '@nestjs/microservices';
import { Pool } from 'pg';

const logger = new Logger('HealthCheck');

export interface DbConfig {
  dbName: string;
  connectionString: string;
}

export class HealthCheckBuilder {
  private port: number = 3001;
  private dbs: DbConfig[] = [];
  private kafkaOpt?: KafkaOptions['options'];

  setPort(port: number): this {
    this.port = port;
    return this;
  }

  setDbs(dbs: DbConfig[]): this {
    this.dbs = dbs;
    return this;
  }

  setKafkaOpt(opt: KafkaOptions['options']): this {
    this.kafkaOpt = opt;
    return this;
  }

  build() {
    return { port: this.port, dbs: this.dbs, kafkaOpt: this.kafkaOpt };
  }
}

export class HealthCheck {
  static async startHealthCheckWithDependenciesService(builder: HealthCheckBuilder): Promise<void> {
    const { port, dbs, kafkaOpt } = builder.build();

    const server = http.createServer(async (_req, res) => {
      const checks: Record<string, 'ok' | 'error'> = {};

      for (const db of dbs) {
        const pool = new Pool({
          connectionString: db.connectionString,
          connectionTimeoutMillis: 5000,
        });

        try {
          await pool.query('SELECT 1');
          checks[db.dbName] = 'ok';
          logger.log(`Database "${db.dbName}" connected successfully`);
        } catch (error: unknown) {
          checks[db.dbName] = 'error';
          const message = error instanceof Error ? error.message : String(error);
          logger.error(`Database "${db.dbName}" connection failed: ${message}`);
        } finally {
          await pool.end().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : String(error);
            logger.warn(`Failed to close pool for database "${db.dbName}": ${message}`);
          });
        }
      }

      if (kafkaOpt?.client) {
        try {
          const kafka = new Kafka(kafkaOpt.client as any);
          const admin = kafka.admin();
          await admin.connect();
          await admin.disconnect();
          checks['kafka'] = 'ok';
        } catch {
          checks['kafka'] = 'error';
        }
      }

      const allOk = Object.values(checks).every((v) => v === 'ok');
      const status = allOk ? 200 : 503;

      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: allOk ? 'ok' : 'error',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          checks,
        }),
      );
    });

    server.listen(port, () => {
      logger.log(`Health check server listening on port ${port}`);
      logger.log(`Databases configured: ${dbs.map((db) => db.dbName).join(', ') || 'none'}`);
    });
  }
}
