import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
  } from 'typeorm';
  
  export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
  }
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;
  
    @Column({ nullable: true })
    name: string;
  
    @Column({ nullable: true })
    surname: string;
  
    @Column({ nullable: true })
    areaCode: string;
  
    @Column({ nullable: true })
    phone: string;
  
    @Column({ nullable: true })
    website: string;
  
    @Column({ default: false })
    isWhatsappEnabled: boolean;
  
    @Column({ default: false })
    isWebsiteEnabled: boolean;
  
    @Column({ default: false })
    isVcardEnabled: boolean;
  
    @Column({ nullable: true, unique: true })
    slug: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @DeleteDateColumn()
    deletedAt: Date;
  }
  