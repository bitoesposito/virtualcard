import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
        where: {
            deleted_ad: IsNull()
        },
        order: {
            created_at: 'DESC'
        }
    });
}

  async updatePassword(uuid: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(uuid, {
      password: hashedPassword,
      updated_at: new Date()
    });
  }
}