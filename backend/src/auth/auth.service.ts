import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { LoginResponse } from './auth.interface';
import { ApiResponseDto } from 'src/common/common.interface';

/**
 * Service handling authentication business logic
 * Manages user authentication, JWT token generation, and password verification
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  /**
   * Authenticates a user and generates a JWT token
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<ApiResponseDto<LoginResponse>> - Login response with JWT token and user data
   * @throws UnauthorizedException - If credentials are invalid
   * @throws InternalServerErrorException - If server error occurs
   */
  async login(email: string, password: string): Promise<ApiResponseDto<LoginResponse>> {
    try {
      this.logger.log(`Login attempt for email: ${email}`);

      // Verify database connection
      try {
        await this.userRepository.query('SELECT 1');
      } catch (error) {
        this.logger.error(`Database connection error: ${error.message}`);
        throw new InternalServerErrorException('Database connection error');
      }

      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        this.logger.warn(`Login failed: User not found for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      let isPasswordValid = false;
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (error) {
        this.logger.error(`Password comparison error: ${error.message}`);
        throw new InternalServerErrorException('Error verifying password');
      }

      if (!isPasswordValid) {
        this.logger.warn(`Login failed: Invalid password for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      let access_token: string;
      try {
        const payload = {
          sub: user.uuid,
          email: user.email,
          role: user.role
        };
        access_token = this.jwtService.sign(payload);
      } catch (error) {
        this.logger.error(`JWT generation error: ${error.message}`);
        throw new InternalServerErrorException('Error generating authentication token');
      }

      const result: LoginResponse = {
        access_token,
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role
        }
      };

      return ApiResponseDto.success(result, 'Login successful');

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(`Login error for ${email}: ${error.message}`);
      throw new InternalServerErrorException('An error occurred during login');
    }
  }
}