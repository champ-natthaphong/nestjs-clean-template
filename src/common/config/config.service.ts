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
      // สามารถใช้ Logger หรือ fallback เป็น object ว่างได้ตามความเหมาะสม
      this.config = {};
    }
  }

  /**
   * ดึงค่า configuration พร้อมรองรับ Default Value และ fallback ไปยัง process.env
   */
  get<T>(path: string, defaultValue?: T): T {
    // 1. ลองดึงค่าจาก nested path ใน YAML config
    const valueFromYaml = path.split('.').reduce<unknown>((obj, key) => {
      if (obj && typeof obj === 'object' && key in obj) {
        return (obj as Record<string, unknown>)[key];
      }
      return undefined;
    }, this.config);

    if (valueFromYaml !== undefined) {
      return valueFromYaml as T;
    }

    // 2. Fallback: ลองดึงจาก process.env (แปลง path เช่น 'database.url' -> 'DATABASE_URL')
    const envKey = path.toUpperCase().replace(/\./g, '_');
    const valueFromEnv = process.env[envKey];

    if (valueFromEnv !== undefined) {
      return valueFromEnv as unknown as T;
    }

    // 3. Fallback: ส่งค่า defaultValue
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    return undefined as unknown as T;
  }
}
