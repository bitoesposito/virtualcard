import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { UserEmailDto, EditUserDto } from './dto/users.dto';
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

  async createUser(createUserDto: UserEmailDto) {
    if (!createUserDto.email) {
      throw new BadRequestException('Email is required');
    }

    try {
      // Check if user already exists (including soft-deleted ones)
      const existingUser = await this.userRepository.findOne({ 
        where: { 
          email: createUserDto.email
        } 
      });

      if (existingUser) {
        if (existingUser.deleted_at) {
          // If user exists but is soft-deleted, restore it
          await this.userRepository.update(existingUser.uuid, {
            deleted_at: undefined,
            role: UserRole.user,
            is_configured: false,
            password: '', // Reset password as it's a new registration
            updated_at: new Date()
          });

          // Generate verification token for restored user
          const token = this.jwtService.sign(
            { 
              sub: existingUser.uuid,
              email: existingUser.email,
              reset: true,
              iat: Math.floor(Date.now() / 1000)
            },
            { expiresIn: '1h' }
          );

          // Log token to console
          this.logger.log(`Verification token for restored user ${existingUser.email}: ${token}`);

          const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
          const verificationUrl = `${baseUrl}/verify?token=${token}`;

          return {
            message: "Your account has been restored. Please set a new password",
            email: existingUser.email,
            url: verificationUrl
          };
        } else {
          // If user exists and is not deleted, throw conflict
          throw new ConflictException('User with this email already exists');
        }
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

      // Log token to console
      this.logger.log(`Verification token for ${user.email}: ${token}`);

      const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify?token=${token}`;

      return {
        message: "If the email address is registered, you will receive a password reset link",
        email: user.email,
        url: verificationUrl
      };
    } catch (error) {
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ 
      where: { 
        email,
        deleted_at: IsNull()
      } 
    });
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

  private async isSlugTaken(slug: string, excludeUuid?: string): Promise<boolean> {
    const query = this.userRepository.createQueryBuilder('user')
      .where('user.slug = :slug', { slug })
      .andWhere('user.deleted_at IS NULL');

    if (excludeUuid) {
      query.andWhere('user.uuid != :uuid', { uuid: excludeUuid });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async deleteUser(email: string, requestingUser: User): Promise<void> {
    // Find the user to delete
    const userToDelete = await this.findByEmail(email);
    if (!userToDelete) {
      throw new NotFoundException('User not found');
    }

    // Check if the requesting user has permission to delete
    if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
      throw new ForbiddenException('You can only delete your own account');
    }

    // If trying to delete an admin, check if it's the last one
    if (userToDelete.role === UserRole.admin) {
      const adminCount = await this.userRepository.count({
        where: {
          role: UserRole.admin,
          deleted_at: IsNull()
        }
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot delete the last admin user in the system');
      }
    }

    // Soft delete the user
    await this.userRepository.softDelete(userToDelete.uuid);
  }

  async editUser(email: string, editUserDto: EditUserDto, requestingUser: User): Promise<User> {
    // Find the user to edit
    const userToEdit = await this.findByEmail(email);
    if (!userToEdit) {
      throw new NotFoundException('User not found');
    }

    // Check if the requesting user has permission to edit
    if (requestingUser.role !== UserRole.admin && requestingUser.email !== email) {
      throw new ForbiddenException('You can only edit your own profile');
    }

    // Validate required fields for first configuration
    if (!userToEdit.is_configured) {
      if (!editUserDto.name || !editUserDto.surname || !editUserDto.areaCode || !editUserDto.phone || !editUserDto.slug) {
        throw new BadRequestException('All required fields must be provided for first configuration');
      }
    }

    // Check if slug is already taken (if being updated)
    if (editUserDto.slug && editUserDto.slug !== userToEdit.slug) {
      const isTaken = await this.isSlugTaken(editUserDto.slug, userToEdit.uuid);
      if (isTaken) {
        throw new ConflictException({
          message: 'This profile URL is already taken',
          field: 'slug',
          value: editUserDto.slug
        });
      }
    }

    // Update user fields
    const updatedUser = await this.userRepository.update(
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

    if (updatedUser.affected === 0) {
      throw new NotFoundException('Failed to update user');
    }

    const updatedUserData = await this.findByEmail(email);
    if (!updatedUserData) {
      throw new NotFoundException('User not found after update');
    }

    return updatedUserData;
  }
}