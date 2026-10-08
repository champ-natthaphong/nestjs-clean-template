import { Module, OnModuleInit } from '@nestjs/common';
import { API_PATHS } from './constants/api-paths';

/**
 * External Services Module
 *
 * Provides HTTP clients for external API calls (e.g. third-party APIs backends).
 * Each backend gets its own service file in src/external-services/<backend>/
 *
 * Validates all API endpoints on startup via ConfigValidatorService.
 *
 * To add a new external service:
 *  1. Create service in src/external-services/<backend>/<backend>.service.ts
 *     (extend BaseExternalService from common-lib)
 *  2. Add config path in constants/api-paths.ts
 *  3. Register as provider + export below
 */

@Module({
  providers: [
    // EsbAtnService,
  ],
  exports: [
    // EsbAtnService,
  ],
})
export class ExternalServicesModule implements OnModuleInit {
  constructor(
    // private readonly config: ConfigService,
    // private readonly validator: ConfigValidatorService,
  ) {}

  onModuleInit(): void {
    // this.validator.validateExternal(this.config, API_PATHS);
  }
}
