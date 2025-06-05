import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async initializeDatabase() {
    // Create tables if they don't exist
    await this.createTables();
    
    // Check if admin exists, if not create it
    await this.createAdminIfNotExists();
  }

  private async createTables() {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Create user_profiles table first
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255),
          surname VARCHAR(255),
          area_code VARCHAR(10),
          phone VARCHAR(20),
          website VARCHAR(255),
          is_whatsapp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          is_website_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          is_vcard_enabled BOOLEAN NOT NULL DEFAULT FALSE,
          slug VARCHAR(255) UNIQUE,
          profile_photo VARCHAR(1024),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create auth_users table after user_profiles
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(10) CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
          is_configured BOOLEAN NOT NULL DEFAULT FALSE,
          profile_uuid UUID REFERENCES user_profiles(uuid) ON DELETE SET NULL,
          reset_token VARCHAR(511),
          reset_token_expiry TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create updated_at trigger function
      await queryRunner.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);

      // Create triggers for both tables
      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_auth_users_updated_at ON auth_users;
        CREATE TRIGGER update_auth_users_updated_at
          BEFORE UPDATE ON auth_users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      await queryRunner.query(`
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at
          BEFORE UPDATE ON user_profiles
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async createAdminIfNotExists() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminRole = this.configService.get<string>('ADMIN_ROLE');

    if (!adminEmail || !adminPassword || !adminRole) {
      throw new Error('Missing required environment variables for admin user creation');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Check if admin exists
      const existingAdmin = await queryRunner.query(
        'SELECT 1 FROM auth_users WHERE email = $1',
        [adminEmail]
      );

      if (!existingAdmin.length) {
        // Create admin profile first
        const adminProfile = await queryRunner.query(
          `INSERT INTO user_profiles (email, is_whatsapp_enabled, is_website_enabled, is_vcard_enabled)
           VALUES ($1, false, false, false)
           RETURNING uuid`,
          [adminEmail]
        );

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        // Create admin user with profile reference
        await queryRunner.query(
          `INSERT INTO auth_users (email, password, role, is_configured, profile_uuid)
           VALUES ($1, $2, $3, false, $4)`,
          [adminEmail, hashedPassword, adminRole, adminProfile[0].uuid]
        );

        this.logger.log('Admin user and profile created successfully', { email: adminEmail });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create admin user:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
} 