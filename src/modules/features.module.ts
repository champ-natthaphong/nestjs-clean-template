import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { NotificationModule } from './notification/notification.module';

/**
 * 📦 Feature Modules Aggregator
 *
 * Import all feature modules here. AppModule imports only this module.
 *
 * Each feature module should follow: Controller → Manager → Service
 *
 *   modules/<feature>/
 *   ├── <feature>.module.ts
 *   ├── controllers/<feature>.controller.ts
 *   ├── managers/<feature>.manager.ts
 *   ├── services/<feature>.service.ts
 *   └── dtos/<feature>.dto.ts
 */
@Module({
  imports: [
    // Add feature modules here, e.g:
    // RegistrationModule,
    UsersModule,
    NotificationModule,
  ],
})
export class FeaturesModule {}
