import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException, ForbiddenException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { UserEmailDto, EditUserDto } from './dto/users.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) {}

  async createUser(createUserDto: UserEmailDto): Promise<ApiResponseDto<{ email: string }>> {
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

  async findAll(): Promise<ApiResponseDto<User[]>> {
    try {
      const users = await this.userRepository.find({
        order: {
          created_at: 'DESC'
        }
      });
      return ApiResponseDto.success(users, 'Users retrieved successfully');
    } catch (error) {
      this.logger.error('Failed to fetch users:', error);
      return ApiResponseDto.error('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmail(email: string): Promise<ApiResponseDto<User | null>> {
    try {
      const user = await this.userRepository.findOne({ 
        where: { email }
      });
      if (!user) {
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }
      return ApiResponseDto.success(user, 'User found');
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      return ApiResponseDto.error('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(uuid: string, password: string): Promise<ApiResponseDto<undefined>> {
    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      await this.userRepository.update(uuid, {
        password: hashedPassword,
        updated_at: new Date()
      });
      return ApiResponseDto.success(undefined, 'Password updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update password for user ${uuid}:`, error);
      return ApiResponseDto.error('Failed to update password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findBySlug(slug: string): Promise<ApiResponseDto<User | null>> {
    try {
      if (!slug) {
        return ApiResponseDto.error('Slug is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepository.findOne({
        where: { slug }
      });

      if (!user) {
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      return ApiResponseDto.success(user, 'User found');
    } catch (error) {
      this.logger.error(`Failed to find user by slug ${slug}:`, error);
      return ApiResponseDto.error('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        uuid: uuid
      }
    });
  }

  async checkSlugAvailability(slug: string): Promise<ApiResponseDto<{ available: boolean }>> {
    try {
      if (!slug) {
        return ApiResponseDto.error('Slug is required', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepository.findOne({
        where: { slug }
      });

      return ApiResponseDto.success({ available: !user }, 'Slug availability checked successfully');
    } catch (error) {
      this.logger.error(`Failed to check slug availability for ${slug}:`, error);
      return ApiResponseDto.error('Failed to check slug availability', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async isSlugTaken(slug: string, excludeUuid?: string): Promise<boolean> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.slug = :slug', { slug });

    if (excludeUuid) {
      query.andWhere('user.uuid != :uuid', { uuid: excludeUuid });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async deleteUser(email: string, requestingUser: User): Promise<ApiResponseDto<undefined>> {
    try {
      const userToDelete = await this.userRepository.findOne({ where: { email } });
      if (!userToDelete) {
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
        return ApiResponseDto.error('You can only delete your own account', HttpStatus.FORBIDDEN);
      }

      if (userToDelete.role === UserRole.admin) {
        const adminCount = await this.userRepository.count({
          where: { role: UserRole.admin }
        });

        if (adminCount <= 1) {
          return ApiResponseDto.error('Cannot delete the last admin user', HttpStatus.FORBIDDEN);
        }
      }

      await this.userRepository.delete(userToDelete.uuid);
      return ApiResponseDto.success(undefined, 'User deleted successfully');
    } catch (error) {
      this.logger.error(`Failed to delete user ${email}:`, error);
      return ApiResponseDto.error('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async editUser(email: string, editUserDto: EditUserDto, requestingUser: User): Promise<ApiResponseDto<User>> {
    try {
      const userToEdit = await this.userRepository.findOne({ where: { email } });
      if (!userToEdit) {
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
        return ApiResponseDto.error('You can only edit your own profile', HttpStatus.FORBIDDEN);
      }

      if (!userToEdit.is_configured) {
        if (!editUserDto.name || !editUserDto.surname || !editUserDto.areaCode || !editUserDto.phone || !editUserDto.slug) {
          return ApiResponseDto.error('All required fields must be provided for first configuration', HttpStatus.BAD_REQUEST);
        }
      }

      if (editUserDto.slug && editUserDto.slug !== userToEdit.slug) {
        const isTaken = await this.isSlugTaken(editUserDto.slug, userToEdit.uuid);
        if (isTaken) {
          return ApiResponseDto.error('This profile URL is already taken', HttpStatus.CONFLICT);
        }
      }

      const updateResult = await this.userRepository.update(
        { uuid: userToEdit.uuid },
        {
          name: editUserDto.name,
          surname: editUserDto.surname,
          area_code: editUserDto.areaCode,
          phone: editUserDto.phone,
          website: editUserDto.website,
          is_whatsapp_enabled: editUserDto.isWhatsappEnabled,
          is_website_enabled: editUserDto.isWebsiteEnabled,
          is_vcard_enabled: editUserDto.isVcardEnabled,
          slug: editUserDto.slug,
          is_configured: true,
          updated_at: new Date()
        }
      );

      if (updateResult.affected === 0) {
        return ApiResponseDto.error('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      const updatedUser = await this.userRepository.findOne({ where: { email } });
      if (!updatedUser) {
        return ApiResponseDto.error('User not found after update', HttpStatus.NOT_FOUND);
      }

      return ApiResponseDto.success(updatedUser, 'User updated successfully');
    } catch (error) {
      this.logger.error(`Failed to edit user ${email}:`, error);
      return ApiResponseDto.error('Failed to edit user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}