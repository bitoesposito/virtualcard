import { Injectable, UnauthorizedException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ApiResponseDto } from 'src/common/common.interface';
import { EmailService } from 'src/common/services/email.service';
import { User } from './entities/user.entity';
import { LoginResponse, LoginAttempt, SecurityConfig } from './auth.interface';
import { ResetPasswordDto } from './auth.dto';
import { LoggerService } from '../common/services/logger.service';
import { SessionService } from '../common/services/session.service';

/**
 * Response interface for forgot password endpoint
 */
interface ForgotPasswordResponse {
  expiresIn: number;
}

/**
 * Service handling authentication business logic
 * Manages user authentication, JWT token generation, and password recovery
 */
@Injectable()
export class AuthService {
  private readonly loginAttempts = new Map<string, LoginAttempt>();
  private readonly rateLimitMap = new Map<string, { count: number; timestamp: number }>();
  
  private readonly securityConfig: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    rateLimitWindow: 3600000, // 1 hour
    maxRequestsPerWindow: 3
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
    private readonly sessionService: SessionService
  ) { }

  /**
   * Checks if an account is locked
   * @param email - Email to check
   * @throws HttpException if account is locked
   */
  private checkAccountLock(email: string): void {
    const attempt = this.loginAttempts.get(email);
    if (attempt?.lockedUntil && attempt.lockedUntil > Date.now()) {
      const remainingTime = Math.ceil((attempt.lockedUntil - Date.now()) / 1000 / 60);
      throw new HttpException(
        `Account is locked. Please try again in ${remainingTime} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  /**
   * Records a failed login attempt
   * @param email - Email of the failed attempt
   */
  private recordFailedAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, timestamp: Date.now() };
    attempt.count++;
    
    if (attempt.count >= this.securityConfig.maxLoginAttempts) {
      attempt.lockedUntil = Date.now() + this.securityConfig.lockoutDuration;
      this.logger.warn('Account locked due to too many failed attempts', 'AuthService', { email });
    }
    
    this.loginAttempts.set(email, attempt);
  }

  /**
   * Resets failed login attempts for an email
   * @param email - Email to reset attempts for
   */
  private resetFailedAttempts(email: string): void {
    this.loginAttempts.delete(email);
  }

  /**
   * Checks if the email has exceeded the rate limit
   * @param email - Email address to check
   * @throws HttpException if rate limit is exceeded
   */
  private checkRateLimit(email: string): void {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(email);

    if (userLimit) {
      if (now - userLimit.timestamp < this.securityConfig.rateLimitWindow) {
        if (userLimit.count >= this.securityConfig.maxRequestsPerWindow) {
          throw new HttpException('Too many requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }
        userLimit.count++;
      } else {
        this.rateLimitMap.set(email, { count: 1, timestamp: now });
      }
    } else {
      this.rateLimitMap.set(email, { count: 1, timestamp: now });
    }
  }

  /**
   * Authenticates a user and generates a JWT token
   * 
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise<ApiResponseDto<LoginResponse>> - Login response with JWT token and user data
   * @throws UnauthorizedException - If credentials are invalid
   * @throws InternalServerErrorException - If server error occurs
   */
  async login(email: string, password: string, deviceInfo?: string): Promise<ApiResponseDto<LoginResponse>> {
    try {
      this.logger.info('Login attempt', 'AuthService', { email });
      this.checkAccountLock(email);
      this.checkRateLimit(email);

      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        this.recordFailedAttempt(email);
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.recordFailedAttempt(email);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.resetFailedAttempts(email);

      const session = await this.sessionService.createSession(user.uuid, deviceInfo);
      
      const result: LoginResponse = {
        access_token: session.token,
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role
        }
      };

      this.logger.info('Login successful', 'AuthService', { userId: user.uuid });
      return ApiResponseDto.success(result, 'Login successful');

    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error('Login error', 'AuthService', { email, error: error.message });
      throw new InternalServerErrorException('An error occurred during authentication');
    }
  }
  
  /**
   * Initiates the password recovery process
   * 
   * @param email - User's email address
   * @returns Promise<ApiResponseDto<ForgotPasswordResponse>> - Success response with token expiry
   * @throws HttpException - If rate limit exceeded or other errors occur
   */
  async forgotPassword(email: string): Promise<ApiResponseDto<any>> {
    try {
      this.checkRateLimit(email);
      
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return ApiResponseDto.success(
          { expiresIn: 600 },
          'If email is registered, will receive a reset link'
        );
      }

      const payload = { 
        sub: user.uuid, 
        email: user.email,
        reset: true
      };
      
      const token = this.jwtService.sign(payload, { expiresIn: '10m' });
      
      user.reset_token = token;
      user.reset_token_expiry = new Date(Date.now() + 10 * 60 * 1000);
      await this.userRepository.save(user);
      
      await this.emailService.sendEmail(user.email, token, 'password-reset');
      this.logger.info('Password reset email sent', 'AuthService', { userId: user.uuid });

      return ApiResponseDto.success(
        { expiresIn: 600 },
        'If email is registered, will receive a reset link'
      );
    } catch (error) {
      this.logger.error('Password reset failed', 'AuthService', { email, error: error.message });
      if (error instanceof HttpException) {
        return ApiResponseDto.error(error.message, error.getStatus());
      }
      return ApiResponseDto.error('An error occurred during password reset', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Resets user password using a valid reset token
   * 
   * @param resetPasswordDto - Reset password data (token and new password)
   * @returns Promise<ApiResponseDto<null>> - Success response
   * @throws HttpException - If token is invalid or expired
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<ApiResponseDto<null>> {
    try {
      let decodedToken: any;
      try {
        decodedToken = this.jwtService.verify(resetPasswordDto.token);
      } catch (error) {
        throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
      }

      if (!decodedToken.reset) {
        throw new HttpException('Invalid token type', HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepository.findOne({
        where: { uuid: decodedToken.sub }
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (user.reset_token !== resetPasswordDto.token || 
          !user.reset_token_expiry || 
          user.reset_token_expiry < new Date()) {
        throw new HttpException('Invalid or expired token', HttpStatus.BAD_REQUEST);
      }

      const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

      user.password = hashedPassword;
      user.reset_token = null;
      user.reset_token_expiry = null;
      await this.userRepository.save(user);

      // Invalidate all existing sessions
      await this.sessionService.invalidateAllUserSessions(user.uuid);
      
      this.logger.info('Password reset successful', 'AuthService', { userId: user.uuid });
      return ApiResponseDto.success(null, 'Password has been reset successfully');
    } catch (error) {
      this.logger.error('Password reset failed', 'AuthService', { error: error.message });
      if (error instanceof HttpException) {
        return ApiResponseDto.error(error.message, error.getStatus());
      }
      return ApiResponseDto.error('An error occurred during password reset', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}