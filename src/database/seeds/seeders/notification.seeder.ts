import { DataSource } from 'typeorm';
import { BaseSeeder } from '../base.seeder';
import { NotificationEntity } from '../../../modules/notification/entities/notification.entity';
import { UserEntity } from '../../../modules/users/entities/user.entity';

export class NotificationSeeder extends BaseSeeder<NotificationEntity> {
  entity() {
    return NotificationEntity;
  }

  fileName() {
    return 'notifications';
  }

  async run(): Promise<void> {
    const name = this.fileName();

    if (await this.shouldSkip()) {
      this.logger.log(`[${name}] Already seeded, skipping...`);
      return;
    }

    // ดึง admin user มาใช้เป็น userId
    const userRepository = this.dataSource.getRepository(UserEntity);
    const adminUser = await userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      this.logger.warn(`[${name}] Admin user not found, skipping...`);
      return;
    }

    const rawData = this.loadData();
    const entities = this.repository.create(
      rawData.map((item) => ({ ...item, userId: adminUser.id })),
    );
    await this.repository.save(entities);

    this.logger.log(`[${name}] Seeded ${entities.length} records`);
  }
}
