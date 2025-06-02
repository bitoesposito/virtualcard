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
import { EditUserDto } from './users.dto';

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

  /**
   * Updates a user's profile
   * 
   * @param email - Email of the user to update
   * @param editUserDto - Data transfer object containing profile update details
   * @param requestingUser - User making the request
   * @returns Promise<ApiResponseDto<UserProfile>> - Response containing updated profile
   * @throws ForbiddenException - If user doesn't have permission to update the profile
   */
  async editUser(email: string, editUserDto: EditUserDto, requestingUser: User): Promise<ApiResponseDto<UserProfile>> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Find user and verify it exists
      const user = await this.userRepository.findOne({ 
        where: { email }
      });

      if (!user) {
        this.logger.warn('User not found during profile update', { email });
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      // Check permissions
      if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
        this.logger.warn('Unauthorized profile update attempt', { 
          requestingUser: requestingUser.email,
          targetUser: email
        });
        return ApiResponseDto.error('You can only edit your own profile', HttpStatus.FORBIDDEN);
      }

      // Find profile
      const profile = await this.userProfileRepository.findOne({
        where: { uuid: user.profile_uuid }
      });

      if (!profile) {
        this.logger.error('Profile not found for user', { 
          userId: user.uuid,
          email: user.email
        });
        return ApiResponseDto.error('Profile not found', HttpStatus.NOT_FOUND);
      }

      // Validate required fields for first configuration
      if (!user.is_configured) {
        const missingFields: string[] = [];
        if (!editUserDto.name) missingFields.push('name');
        if (!editUserDto.surname) missingFields.push('surname');
        if (!editUserDto.area_code) missingFields.push('area_code');
        if (!editUserDto.phone) missingFields.push('phone');
        if (!editUserDto.slug) missingFields.push('slug');

        if (missingFields.length > 0) {
          this.logger.warn('Missing required fields for first configuration', {
            userId: user.uuid,
            missingFields
          });
          return ApiResponseDto.error(
            `Missing required fields for first configuration: ${missingFields.join(', ')}`, 
            HttpStatus.BAD_REQUEST
          );
        }
      }

      // Validate field lengths and formats
      try {
        if (editUserDto.name && (editUserDto.name.length < 2 || editUserDto.name.length > 50)) {
          throw new Error('Name must be between 2 and 50 characters');
        }
        if (editUserDto.surname && (editUserDto.surname.length < 2 || editUserDto.surname.length > 50)) {
          throw new Error('Surname must be between 2 and 50 characters');
        }
        if (editUserDto.area_code && (editUserDto.area_code.length < 2 || editUserDto.area_code.length > 10)) {
          throw new Error('Area code must be between 2 and 10 characters');
        }
        if (editUserDto.phone && (editUserDto.phone.length < 5 || editUserDto.phone.length > 20)) {
          throw new Error('Phone number must be between 5 and 20 characters');
        }
        if (editUserDto.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(editUserDto.website)) {
          throw new Error('Invalid website URL format');
        }
        if (editUserDto.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(editUserDto.slug)) {
          throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
        }
      } catch (validationError) {
        this.logger.warn('Validation error during profile update', {
          userId: user.uuid,
          error: validationError.message
        });
        return ApiResponseDto.error(validationError.message, HttpStatus.BAD_REQUEST);
      }

      // Check slug uniqueness if provided
      if (editUserDto.slug && editUserDto.slug !== profile.slug) {
        const existingProfile = await this.userProfileRepository.findOne({
          where: { slug: editUserDto.slug }
        });
        
        if (existingProfile && existingProfile.uuid !== profile.uuid) {
          this.logger.warn('Slug already taken during profile update', {
            userId: user.uuid,
            attemptedSlug: editUserDto.slug
          });
          return ApiResponseDto.error('This profile URL is already taken', HttpStatus.CONFLICT);
        }
      }

      // Sanitize input data
      const sanitizedDto = {
        ...editUserDto,
        name: editUserDto.name?.trim(),
        surname: editUserDto.surname?.trim(),
        area_code: editUserDto.area_code?.trim(),
        phone: editUserDto.phone?.trim(),
        website: editUserDto.website?.trim(),
        slug: editUserDto.slug?.trim().toLowerCase()
      };

      // Update profile fields
      Object.assign(profile, sanitizedDto);
      const updatedProfile = await queryRunner.manager.save(profile);

      // Update user's is_configured status if all required fields are filled
      const isConfigured = this.isProfileConfigured(updatedProfile);
      if (isConfigured !== user.is_configured) {
        user.is_configured = isConfigured;
        await queryRunner.manager.save(user);
      }

      await queryRunner.commitTransaction();
      return ApiResponseDto.success(updatedProfile, 'Profile updated successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to update profile:', {
        error: error.message,
        email
      });
      return ApiResponseDto.error('Failed to update profile', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Checks if a profile is fully configured
   * 
   * @param profile - User profile to check
   * @returns boolean - True if profile is configured
   */
  private isProfileConfigured(profile: UserProfile): boolean {
    return !!(
      profile.name &&
      profile.surname &&
      profile.area_code &&
      profile.phone &&
      profile.slug
    );
  }
} 