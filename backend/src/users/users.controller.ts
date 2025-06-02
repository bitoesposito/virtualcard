import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus, 
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
  Param,
  NotFoundException,
  Put,
  Delete,
  Request
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, EditUserDto, DeleteUserDto } from './users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/auth.interface';
import { UserRole } from '../auth/auth.interface';
import { ApiResponseDto } from '../common/common.interface';
import { Logger } from '@nestjs/common';

/**
 * Controller handling user-related HTTP requests
 * Provides endpoints for user management operations
 */
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user in the system
   * Requires admin role
   * 
   * @param createUserDto - Data transfer object containing user creation details
   * @returns Promise<ApiResponseDto<{ email: string }>> - Response containing created user's email
   * @throws ForbiddenException - If user doesn't have admin role
   */
  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Creating new user', { email: createUserDto.email });
    return await this.usersService.createUser(createUserDto);
  }

  /**
   * Retrieves a list of all non-admin users
   * Requires admin role
   * Returns only essential user information
   * 
   * @returns Promise<ApiResponseDto<Array<{ uuid: string, email: string, created_at: Date }>>>
   * @throws ForbiddenException - If user doesn't have admin role
   */
  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.OK)
  async listUsers() {
    this.logger.log('Retrieving users list');
    const response = await this.usersService.findAll();
    
    if (!response.success || !response.data) {
      this.logger.error('Failed to retrieve users list', { error: response.message });
      return response;
    }

    // Sanitize user data to return only essential information
    const formattedUsers = response.data.map(user => ({
      uuid: user.profile_uuid,
      email: user.email,
      is_configured: user.is_configured,
      created_at: user.created_at,
    }));

    this.logger.log('Users list retrieved successfully', { count: formattedUsers.length });
    return ApiResponseDto.success(formattedUsers, 'Users list retrieved successfully');
  }

  /**
   * Retrieves a specific user by UUID
   * Requires admin role
   * 
   * @param uuid - User's UUID
   * @returns Promise<ApiResponseDto<User>> - Response containing user details
   * @throws NotFoundException - If user is not found
   * @throws ForbiddenException - If user doesn't have admin role
   */
  @Get('by-id/:uuid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  @HttpCode(HttpStatus.OK)
  async getUser(@Param('uuid', ParseUUIDPipe) uuid: string) {
    this.logger.log('Retrieving user details', { uuid });
    try {
      const user = await this.usersService.findByUuid(uuid);
      return ApiResponseDto.success(user, 'User details retrieved successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn('User not found', { uuid });
        throw error;
      }
      this.logger.error('Failed to retrieve user details', { uuid, error: error.message });
      throw error;
    }
  }

  /**
   * Updates a user's profile
   * Requires authentication
   * 
   * @param editUserDto - Data transfer object containing profile update details
   * @param req - Request object containing authenticated user
   * @returns Promise<ApiResponseDto<UserProfile>> - Response containing updated profile
   * @throws ForbiddenException - If user doesn't have permission to update the profile
   */
  @Put('edit')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async editUser(@Body() editUserDto: EditUserDto, @Request() req) {
    this.logger.log('Updating user profile', { email: req.user.email });
    const response = await this.usersService.editUser(req.user.email, editUserDto, req.user);
    
    if (!response.success || !response.data) {
      this.logger.error('Failed to update profile', { 
        email: req.user.email, 
        error: response.message 
      });
      return response;
    }

    const profile = response.data;
    const formattedProfile = {
      uuid: profile.uuid,
      name: profile.name,
      surname: profile.surname,
      area_code: profile.area_code,
      phone: profile.phone,
      website: profile.website,
      is_whatsapp_enabled: profile.is_whatsapp_enabled,
      is_website_enabled: profile.is_website_enabled,
      is_vcard_enabled: profile.is_vcard_enabled,
      slug: profile.slug,
      profile_photo: profile.profile_photo,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    this.logger.log('Profile updated successfully', { profileId: profile.uuid });
    return ApiResponseDto.success(formattedProfile, 'Profile updated successfully');
  }

  /**
   * Deletes a user and their associated profile
   * Requires authentication
   * 
   * @param deleteUserDto - Data transfer object containing the email of the user to delete
   * @param req - Request object containing the authenticated user
   * @returns Promise<ApiResponseDto<undefined>> - Response indicating success or failure
   * @throws ForbiddenException - If user doesn't have permission to delete
   */
  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Body() deleteUserDto: DeleteUserDto, @Request() req) {
    this.logger.log('Deleting user', { email: deleteUserDto.email });
    return await this.usersService.deleteUser(deleteUserDto.email, req.user);
  }
} 