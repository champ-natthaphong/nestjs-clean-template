// src/shared/config/app-config.module.ts
import { Global, Module } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { removePathTraversalCharacters } from '../utils/sanitize';
import { APP_CONFIG, AppConfig } from './condfig.token';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: (): AppConfig => {
        const zone = removePathTraversalCharacters(process.env.ZONE ?? 'local');
        const filePath = join(
          process.cwd(),
          'assets',
          'config',
          'portal-service',
          `${zone}.config.yaml`,
        );
        return yaml.load(readFileSync(filePath, 'utf8')) as AppConfig;
      },
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
