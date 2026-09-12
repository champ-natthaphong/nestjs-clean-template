import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    console.log('--> Database is connecting...');

    await this.$connect();

    console.log('--> Database is connected');
  }

  async onModuleDestroy(): Promise<void> {
    console.log('<-- Database is disconnecting...');

    await this.$disconnect();
    await this.pool.end();

    console.log('<-- Database is disconnected');
  }
}
