import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export enum UserRole {
    admin = 'admin',
    user = 'user',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    uuid: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column({ type: 'enum', enum: UserRole, default: UserRole.user })
    role: UserRole;

    @Column({ default: false })
    is_configured: boolean;
  
    @Column({ nullable: true })
    name: string;
  
    @Column({ nullable: true })
    surname: string;
  
    @Column({ nullable: true })
    area_code: string;
  
    @Column({ nullable: true })
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
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }
  