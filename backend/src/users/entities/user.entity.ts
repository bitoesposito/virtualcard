import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { UserRole } from '../../auth/auth.interface';
import { UserProfile } from './user-profile.entity';

@Entity('auth_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.user
  })
  role: UserRole;

  @Column({ default: false })
  is_configured: boolean;

  @Column({ nullable: true })
  profile_uuid: string;

  @Column({ nullable: true, type: 'varchar' })
  reset_token: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  reset_token_expiry: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => UserProfile, profile => profile.user)
  profile: UserProfile;
} 