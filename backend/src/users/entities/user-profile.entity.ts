import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * UserProfile entity representing a user's profile information
 * Maps to the 'user_profiles' table in the database
 */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'varchar', nullable: true })
  surname: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  area_code: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @Column({ type: 'boolean', default: false })
  is_whatsapp_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  is_website_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  is_vcard_enabled: boolean;

  @Column({ type: 'varchar', nullable: true, unique: true })
  slug: string | null;

  @Column({ type: 'varchar', nullable: true })
  profile_photo: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
} 