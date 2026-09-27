import { AppDataSource } from './data-source';
import { runSeeds } from './seeds';

const run = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    await runSeeds(AppDataSource);

    await AppDataSource.destroy();
    console.log('Database disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

run();
