import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { removePathTraversalCharacters } from '../../shared/utils/sanitize';

export class ConfigService {
  private readonly config: Record<string, unknown>;

  constructor() {
    const zone = removePathTraversalCharacters(process.env.ZONE ?? 'local');
    const filePath = join(process.cwd(), 'assets', 'config', `${zone}.config.yaml`);

    try {
      const fileContents = readFileSync(filePath, 'utf8');
      const parsedConfig = yaml.load(fileContents);
      if (typeof parsedConfig !== 'object' || parsedConfig === null) {
        throw new Error(`Invalid YAML structure in configuration file: ${filePath}`);
      }

      this.config = parsedConfig as Record<string, unknown>;
    } catch (error: unknown) {
      this.config = {};
    }
  }

  get<T>(path: string, defaultValue?: T): T {
    const valueFromYaml = path.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, this.config);

    if (valueFromYaml !== undefined) {
      return valueFromYaml as T;
    }

    const envKey = path.toUpperCase().replace(/\./g, '_');
    const valueFromEnv = process.env[envKey];

    if (valueFromEnv !== undefined) {
      return valueFromEnv as unknown as T;
    }

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return undefined as unknown as T;
  }
  getOrThrow<T = string>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined || value === null || value === '') {
      throw new Error(`Missing required config: ${key}`);
    }
    return value;
  }
  getDatabaseUrl(): string {
    const user = process.env.DATABASE_USER;
    const password = process.env.DATABASE_PASSWORD;
    const host = process.env.DATABASE_HOST;
    const port = process.env.DATABASE_PORT ?? '5432';
    const name = process.env.DATABASE_NAME;

    if (!user || password === undefined || !host || !name) {
      throw new Error('Missing required database environment variables');
    }
    const credentials = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
    return `postgresql://${credentials}@${host}:${port}/${encodeURIComponent(name)}`;
  }
}
