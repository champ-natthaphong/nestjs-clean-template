import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });

    super({
      adapter,
    });
  }

  async onModuleInit(): Promise<void> {
    console.log('--> Database is connected');

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    console.log('<-- Database is disconnected!');

    await this.$disconnect();
  }
}
