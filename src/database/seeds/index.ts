import { DataSource } from 'typeorm';
import { getRegisteredSeeders } from './seeder.registry';

export const runSeeds = async (dataSource: DataSource): Promise<void> => {
  const seeders = getRegisteredSeeders(dataSource);
  for (const seeder of seeders) {
    await seeder.run();
  }
};
