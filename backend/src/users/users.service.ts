import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './users.dto';
import { JwtService } from '@nestjs/jwt';
import { ApiResponseDto } from '../common/common.interface';
import { UserRole } from '../auth/auth.interface';
import { MailService } from 'src/common/services/mail.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ApiResponseDto<{ email: string }>> {
    try {
      if (!createUserDto.email) {
        return ApiResponseDto.error('Email is required', HttpStatus.BAD_REQUEST);
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ 
        where: { 
          email: createUserDto.email
        } 
      });

      if (existingUser) {
        return ApiResponseDto.error('User with this email already exists', HttpStatus.CONFLICT);
      }

      // Create new user with default values
      const user = this.userRepository.create({
        email: createUserDto.email,
        role: UserRole.user,
        is_configured: false,
        password: '', // Will be set when user verifies email
      });

      await this.userRepository.save(user);

      // Generate verification token
      const token = this.jwtService.sign(
        { 
          sub: user.uuid,
          email: user.email,
          reset: true,
          iat: Math.floor(Date.now() / 1000)
        },
        { expiresIn: '1h' }
      );

      // Send verification email
      await this.mailService.sendEmail(user.email, token, 'verification');

      return ApiResponseDto.success({ email: user.email }, 'User created successfully');
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        return ApiResponseDto.error('User with this email already exists', HttpStatus.CONFLICT);
      }
      return ApiResponseDto.error('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 