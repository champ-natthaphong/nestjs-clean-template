// src/shared/config/config.service.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { removePathTraversalCharacters } from '../../shared/utils/sanitize';

export class ConfigService {
  private readonly config: Record<string, any>;

  constructor() {
    const zone = removePathTraversalCharacters(process.env.ZONE ?? 'local');
    const filePath = join(
      process.cwd(),
      'assets',
      'config',
      'portal-service',
      `${zone}.config.yaml`,
    );
    this.config = yaml.load(readFileSync(filePath, 'utf8')) as Record<string, any>;
  }

  get<T>(path: string): T {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config) as T;
  }
}
