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

      // Check DBs
      for (const db of dbs) {
        try {
          const pool = new Pool({ connectionString: db.connectionString });
          await pool.query('SELECT 1');
          await pool.end();
          checks[db.dbName] = 'ok';
        } catch {
          checks[db.dbName] = 'error';
        }
      }

      // Check Kafka
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
      logger.log(`Health check listening on port ${port}`);
    });
  }
}
