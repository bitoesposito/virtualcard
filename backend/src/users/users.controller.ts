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
  ForbiddenException
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './users.dto';
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
      uuid: user.uuid,
      email: user.email,
      created_at: user.created_at
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
} 