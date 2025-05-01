import { DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from 'src/users/users.entity';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  synchronize: false,
  logging: true,
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
};
