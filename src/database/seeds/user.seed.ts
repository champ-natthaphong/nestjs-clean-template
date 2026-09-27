import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../modules/users/entities/user.entity';

export const seedUsers = async (dataSource: DataSource): Promise<void> => {
  const userRepository = dataSource.getRepository(UserEntity);

  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('Users already seeded, skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const users = userRepository.create([
    {
      firstName: 'natthaphong',
      lastName: 'thammabut',
      email: 'natthaphong@backend.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
    {
      firstName: 'champ',
      lastName: 'lamp',
      email: 'champ@backend.com',
      password: hashedPassword,
      role: 'user',
      isActive: true,
    },
    {
      firstName: 'momo',
      lastName: 'nanthawan',
      email: 'momo@backend.com',
      password: hashedPassword,
      role: 'user',
      isActive: false,
    },
  ]);

  await userRepository.save(users);
  console.log('Users seeded successfully!');
};
