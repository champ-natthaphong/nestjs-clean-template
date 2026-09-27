import { Logger } from '@nestjs/common';
import { DataSource, DeepPartial, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export abstract class BaseSeeder<T extends ObjectLiteral> {
  protected repository: Repository<T>;
  protected dataSource: DataSource;
  protected readonly logger = new Logger(BaseSeeder.name);

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.repository = dataSource.getRepository(this.entity());
  }

  abstract entity(): EntityTarget<T>;
  abstract fileName(): string;

  async transform(data: DeepPartial<T>[]): Promise<DeepPartial<T>[]> {
    return data;
  }

  async shouldSkip(): Promise<boolean> {
    const count = await this.repository.count();
    return count > 0;
  }

  protected loadData(): DeepPartial<T>[] {
    const filePath = path.join(
      process.cwd(),
      'src',
      'database',
      'seeds',
      'data',
      `${this.fileName()}.json`,
    );

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`[${this.fileName()}] Seed file not found, skipping...`);
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async run(): Promise<void> {
    const name = this.fileName();

    if (await this.shouldSkip()) {
      this.logger.log(`[${name}] Already seeded, skipping...`);
      return;
    }

    const rawData = this.loadData();
    const transformed = await this.transform(rawData);
    const entities = this.repository.create(transformed);
    await this.repository.save(entities);

    this.logger.log(`[${name}] Seeded ${entities.length} records`);
  }
}
