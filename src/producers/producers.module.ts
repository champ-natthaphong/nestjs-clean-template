import { Module, OnModuleInit } from '@nestjs/common';

// import { ConfigValidatorService } from '@corp-ais/rat-common-lib';

import { PRODUCER_TOPICS } from '../shared/constants/topics';

/**
 * Producers Module
 *
 * Provides Kafka producers for publishing events.
 * Each backend gets its own producer file in src/producers/<backend>/
 *
 * Validates all topic configs on startup via ConfigValidatorService.
 *
 * To add a new producer:
 *  1. Create producer in src/producers/<backend>/<backend>.producer.ts
 *     (extend BaseKafkaProducer from common-lib)
 *  2. Add topic in shared/constants/topics.ts
 *  3. Register as provider + export below
 */
@Module({
  providers: [
    // EsbAtnProducer,
  ],
  exports: [
    // EsbAtnProducer,
  ],
})
export class ProducersModule implements OnModuleInit {
  // constructor(private readonly validator: ConfigValidatorService) {}

  onModuleInit(): void {
    // this.validator.validateProducer(PRODUCER_TOPICS);
  }
}
