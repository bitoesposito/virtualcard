import { Injectable, Logger, HttpStatus, NotFoundException, ForbiddenException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
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
      const userProfileData: DeepPartial<UserProfile> = {
        email: normalizedEmail,
        name: undefined,
        surname: undefined,
        area_code: undefined,
        phone: undefined,
        website: undefined,
        is_whatsapp_enabled: false,
        is_website_enabled: false,
        is_vcard_enabled: false,
        slug: undefined,
        profile_photo: undefined
      };

      const userProfile = this.userProfileRepository.create(userProfileData);
      const savedProfile = await queryRunner.manager.save(userProfile);
      this.logger.log('User profile created successfully', { profileId: savedProfile.uuid });

      // Create new user with default values, link to profile and set reset token
      const user = this.userRepository.create({
        email: normalizedEmail,
        role: UserRole.user,
        is_configured: false,
        password: '', // Will be set when user verifies email
        profile_uuid: savedProfile.uuid
      });

      const savedUser = await queryRunner.manager.save(user);
      this.logger.log('User created successfully', { userId: savedUser.uuid });

      // Generate verification token with user UUID
      const token = this.jwtService.sign(
        { 
          sub: savedUser.uuid,
          email: normalizedEmail,
          reset: true,
          iat: Math.floor(Date.now() / 1000)
        },
        { expiresIn: '100y' } // Set a very long expiration (100 years)
      );

      // Update user with reset token
      savedUser.reset_token = token;
      savedUser.reset_token_expiry = null; // No expiration for new user verification
      await queryRunner.manager.save(savedUser);

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
        order: {
          created_at: 'DESC'
        },
        select: {
          profile_uuid: true,
          email: true,
          created_at: true,
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
   * @param uuid - User UUID
   * @returns Promise<UserProfile> - Found profile data
   * @throws NotFoundException - If profile is not found
   */
  async findByUuid(uuid: string): Promise<UserProfile> {
    // First try to find a user with this UUID
    const user = await this.userRepository.findOne({ 
      where: { uuid }
    });

    let profileUuid: string;

    if (user) {
      // If we found a user, use their profile_uuid
      if (!user.profile_uuid) {
        throw new NotFoundException(`User with UUID ${uuid} has no profile`);
      }
      profileUuid = user.profile_uuid;
    } else {
      // If no user found, assume the UUID is a profile UUID
      profileUuid = uuid;
    }

    // Find the profile using the profile_uuid
    const profile = await this.userProfileRepository.findOne({ 
      where: { uuid: profileUuid },
      select: {
        uuid: true,
        email: true,
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
      throw new NotFoundException(`Profile with UUID ${profileUuid} not found`);
    }

    return profile;
  }

  /**
   * Finds a user profile by slug
   * 
   * @param slug - Profile slug
   * @returns Promise<ApiResponseDto<UserProfile | null>> - Response containing found profile or null
   * @throws ForbiddenException - If user doesn't have permission to access the profile
   */
  async findBySlug(slug: string): Promise<ApiResponseDto<UserProfile | null>> {
    try {
      if (!slug) {
        return ApiResponseDto.error('Slug is required', HttpStatus.BAD_REQUEST);
      }

      const profile = await this.userProfileRepository.findOne({
        where: { slug },
        relations: ['user']
      });

      if (!profile) {
        return ApiResponseDto.error('User profile not found', HttpStatus.NOT_FOUND);
      }

      // Verifica che l'utente abbia abilitato la visibilità pubblica
      if (!profile.user.is_configured) {
        return ApiResponseDto.error('User profile is not configured', HttpStatus.NOT_FOUND);
      }

      return ApiResponseDto.success(profile, 'User profile found');
    } catch (error) {
      this.logger.error(`Failed to find user profile by slug ${slug}:`, error);
      return ApiResponseDto.error('Failed to find user profile', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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

  /**
   * Deletes a user and their associated profile
   * 
   * @param email - Email of the user to delete
   * @param requestingUser - User making the request
   * @returns Promise<ApiResponseDto<undefined>> - Response indicating success or failure
   * @throws ForbiddenException - If user doesn't have permission to delete
   */
  async deleteUser(email: string, requestingUser: User): Promise<ApiResponseDto<undefined>> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      this.logger.log('Starting user deletion process', { email });

      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Find user and verify it exists
      const userToDelete = await this.userRepository.findOne({ 
        where: { email: email.toLowerCase() }
      });

      if (!userToDelete) {
        this.logger.warn('User not found during deletion', { email });
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      // Check permissions
      if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
        this.logger.warn('Unauthorized deletion attempt', { 
          requestingUser: requestingUser.email,
          targetUser: email
        });
        return ApiResponseDto.error('You can only delete your own account', HttpStatus.FORBIDDEN);
      }

      // Prevent deletion of last admin
      if (userToDelete.role === UserRole.admin) {
        const adminCount = await this.userRepository.count({
          where: { role: UserRole.admin }
        });

        if (adminCount <= 1) {
          this.logger.warn('Attempt to delete last admin user', { email });
          return ApiResponseDto.error('Cannot delete the last admin user', HttpStatus.FORBIDDEN);
        }
      }

      // Find and delete profile
      if (userToDelete.profile_uuid) {
        const profile = await this.userProfileRepository.findOne({
          where: { uuid: userToDelete.profile_uuid }
        });

        if (profile) {
          await queryRunner.manager.remove(profile);
          this.logger.log('User profile deleted', { 
            profileId: profile.uuid,
            userId: userToDelete.uuid
          });
        }
      }

      // Delete user
      await queryRunner.manager.remove(userToDelete);
      this.logger.log('User deleted successfully', { 
        userId: userToDelete.uuid,
        email: userToDelete.email
      });

      await queryRunner.commitTransaction();
      return ApiResponseDto.success(undefined, 'User deleted successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to delete user:', {
        error: error.message,
        email
      });
      return ApiResponseDto.error('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Checks if a slug is available for use
   * 
   * @param slug - Slug to check
   * @param currentProfileUuid - Optional UUID of the current user's profile
   * @returns Promise<ApiResponseDto<{ available: boolean }>> - Response indicating if slug is available
   */
  async checkSlugAvailability(slug: string, currentProfileUuid?: string): Promise<ApiResponseDto<{ available: boolean }>> {
    try {
      // Validazione base dello slug
      if (!slug) {
        this.logger.warn('Slug check attempted with empty value');
        return ApiResponseDto.error('Slug is required', HttpStatus.BAD_REQUEST);
      }

      // Validazione formato slug
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(slug)) {
        this.logger.warn('Invalid slug format', { slug });
        return ApiResponseDto.error(
          'Slug can only contain lowercase letters, numbers, and hyphens',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validazione lunghezza slug
      if (slug.length < 3 || slug.length > 50) {
        this.logger.warn('Invalid slug length', { slug, length: slug.length });
        return ApiResponseDto.error(
          'Slug must be between 3 and 50 characters',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validazione UUID se fornito
      if (currentProfileUuid) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(currentProfileUuid)) {
          this.logger.warn('Invalid UUID format', { uuid: currentProfileUuid });
          return ApiResponseDto.error('Invalid profile UUID format', HttpStatus.BAD_REQUEST);
        }
      }

      this.logger.debug('Checking slug availability', { 
        slug, 
        currentProfileUuid,
        timestamp: new Date().toISOString()
      });

      const query = this.userProfileRepository.createQueryBuilder('profile')
        .where('profile.slug = :slug', { slug });

      if (currentProfileUuid) {
        query.andWhere('profile.uuid != :uuid', { uuid: currentProfileUuid });
      }

      const count = await query.getCount();
      const isAvailable = count === 0;

      this.logger.debug('Slug availability check result', { 
        slug, 
        isAvailable,
        count,
        timestamp: new Date().toISOString()
      });

      return ApiResponseDto.success(
        { available: isAvailable }, 
        isAvailable ? 'Slug is available' : 'Slug is already taken'
      );
    } catch (error) {
      this.logger.error('Failed to check slug availability', { 
        slug, 
        currentProfileUuid,
        error: error.message,
        stack: error.stack
      });

      if (error instanceof HttpException) {
        return ApiResponseDto.error(error.message, error.getStatus());
      }

      return ApiResponseDto.error(
        'An error occurred while checking slug availability', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 