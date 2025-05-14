import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { CreateUserDto } from './dto/users.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    if (!createUserDto.email) {
      throw new BadRequestException('Email is required');
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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
      { uuid: user.uuid, email: user.email },
      { expiresIn: '1h' }
    );

    // Log token to console
    this.logger.log(`Verification token for ${user.email}: ${token}`);

    // TODO: Send email with verification link
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify?token=${token}`;

    return {
      message: "If the email address is registered, you will receive a password reset link",
      email: user.email,
      url: verificationUrl
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
        where: {
            deleted_at: IsNull()
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

  async findBySlug(slug: string): Promise<User | null> {
    if (!slug) {
      throw new BadRequestException('Slug is required');
    }

    return this.userRepository.findOne({
      where: {
        slug: slug,
        deleted_at: IsNull()
      }
    });
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        uuid: uuid,
        deleted_at: IsNull()
      }
    });
  }
}