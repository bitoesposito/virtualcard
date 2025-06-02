import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * UserProfile entity representing a user's profile information
 * Maps to the 'user_profiles' table in the database
 */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  surname: string;

  @Column({ nullable: true, length: 10 })
  area_code: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ default: false })
  is_whatsapp_enabled: boolean;

  @Column({ default: false })
  is_website_enabled: boolean;

  @Column({ default: false })
  is_vcard_enabled: boolean;

  @Column({ nullable: true, unique: true })
  slug: string;

  @Column({ nullable: true })
  profile_photo: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 