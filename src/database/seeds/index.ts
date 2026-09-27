import { DataSource } from 'typeorm';
import { getRegisteredSeeders } from './seeder.registry';

export const runSeeds = async (dataSource: DataSource): Promise<void> => {
  console.log('Running seeds...\n');
  const seeders = getRegisteredSeeders(dataSource);
  for (const seeder of seeders) {
    await seeder.run();
  }
  console.log('\nAll seeds completed!');
};
