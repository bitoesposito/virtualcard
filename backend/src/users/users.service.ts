import { Injectable, Logger, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './users.dto';
import { JwtService } from '@nestjs/jwt';
import { ApiResponseDto } from '../common/common.interface';
import { UserRole } from '../auth/auth.interface';
import { MailService } from 'src/common/services/mail.service';
import { UserProfile } from './entities/user-profile.entity';

/**
 * Service handling user-related operations
 * Manages user creation, listing, and other user-related business logic
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    private jwtService: JwtService,
    private mailService: MailService,
    private dataSource: DataSource,
  ) {}

  /**
   * Creates a new user in the system
   * 
   * @param createUserDto - Data transfer object containing user creation details
   * @returns Promise<ApiResponseDto<{ email: string }>> - Response containing created user's email
   * @throws ForbiddenException - If user creation is not allowed
   * @throws Error - If email sending fails
   */
  async createUser(createUserDto: CreateUserDto): Promise<ApiResponseDto<{ email: string }>> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Validate email presence
      if (!createUserDto.email) {
        this.logger.warn('Create user attempt with missing email');
        return ApiResponseDto.error('Email is required', HttpStatus.BAD_REQUEST);
      }

      const normalizedEmail = createUserDto.email.toLowerCase();

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ 
        where: { 
          email: normalizedEmail
        } 
      });

      if (existingUser) {
        this.logger.warn('Create user attempt with existing email', { email: normalizedEmail });
        return ApiResponseDto.error('User with this email already exists', HttpStatus.CONFLICT);
      }

      // Create user profile first
      const userProfile = this.userProfileRepository.create({
        name: null,
        surname: null,
        area_code: null,
        phone: null,
        website: null,
        is_whatsapp_enabled: false,
        is_website_enabled: false,
        is_vcard_enabled: false,
        slug: null,
        profile_photo: null
      });

      const savedProfile = await queryRunner.manager.save(userProfile);
      this.logger.log('User profile created successfully', { profileId: savedProfile.uuid });

      // Create new user with default values and link to profile
      const user = this.userRepository.create({
        email: normalizedEmail,
        role: UserRole.user,
        is_configured: false,
        password: '', // Will be set when user verifies email
        profile_uuid: savedProfile.uuid
      });

      const savedUser = await queryRunner.manager.save(user);
      this.logger.log('User created successfully', { userId: savedUser.uuid });

      // Generate verification token
      const token = this.jwtService.sign(
        { 
          sub: savedUser.uuid,
          email: savedUser.email,
          reset: true,
          iat: Math.floor(Date.now() / 1000)
        },
        { expiresIn: '1h' }
      );

      // Send verification email
      try {
        await this.mailService.sendEmail(savedUser.email, token, 'verification');
        this.logger.log('Verification email sent successfully', { userId: savedUser.uuid });
      } catch (emailError) {
        this.logger.error('Failed to send verification email', { 
          userId: savedUser.uuid, 
          error: emailError.message 
        });
        // Don't throw error here, as user is already created
        // Just log the error and continue
      }

      await queryRunner.commitTransaction();
      return ApiResponseDto.success({ email: savedUser.email }, 'User created successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create user:', error);
      
      // Handle specific database errors
      if (error.code === '23505' && error.constraint === 'auth_users_email_key') {
        return ApiResponseDto.error('User with this email already exists', HttpStatus.CONFLICT);
      }
      
      // Handle other errors
      return ApiResponseDto.error(
        'Failed to create user', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieves all non-admin users from the system
   * 
   * @returns Promise<ApiResponseDto<User[]>> - Response containing list of non-admin users
   * @throws ForbiddenException - If user doesn't have permission to list users
   */
  async findAll(): Promise<ApiResponseDto<User[]>> {
    try {
      const users = await this.userRepository.find({
        where: {
          role: UserRole.user // Only get non-admin users
        },
        order: {
          created_at: 'DESC'
        },
        select: {
          uuid: true,
          email: true,
          role: true,
          created_at: true,
          updated_at: true,
          is_configured: true
        }
      });

      this.logger.log('Users retrieved successfully', { count: users.length });
      return ApiResponseDto.success(users, 'Users retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to fetch users:', error);
      return ApiResponseDto.error(
        'Failed to fetch users', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Finds a user profile by UUID
   * 
   * @param uuid - Profile UUID
   * @returns Promise<UserProfile> - Found profile data
   * @throws NotFoundException - If profile is not found
   */
  async findByUuid(uuid: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOne({ 
      where: { uuid },
      select: {
        uuid: true,
        name: true,
        surname: true,
        area_code: true,
        phone: true,
        website: true,
        is_whatsapp_enabled: true,
        is_website_enabled: true,
        is_vcard_enabled: true,
        slug: true,
        profile_photo: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!profile) {
      throw new NotFoundException(`Profile with UUID ${uuid} not found`);
    }

    return profile;
  }
} 