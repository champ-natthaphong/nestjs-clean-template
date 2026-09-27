import { DataSource } from 'typeorm';
import { BaseSeeder } from './base.seeder';
import { UserSeeder } from './seeders/user.seeder';
import { NotificationSeeder } from './seeders/notification.seeder';

export const getRegisteredSeeders = (dataSource: DataSource): BaseSeeder<any>[] => [
  new UserSeeder(dataSource),
  new NotificationSeeder(dataSource),
];
