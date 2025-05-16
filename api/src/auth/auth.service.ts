import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, LoginDto, ForgotPasswordDto, UpdatePasswordDto, LoginResponse } from './dto/auth.dto';
import { from, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { MailService } from '../mail/mail.service';
import { ApiResponseDto } from '../common/dto/api-response.dto';

interface ForgotPasswordResponse {
    expiresIn: number;
    url?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private readonly MAX_RESET_ATTEMPTS = 3;
  private readonly RESET_WINDOW_MS = 3600000; // 1 hour
  private readonly MAX_PASSWORD_LENGTH = 128;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService
  ) { }

  private checkRateLimit(email: string): void {
    const now = new Date();
    const attempt = this.resetAttempts.get(email);

    if (attempt) {
      if (now.getTime() - attempt.lastAttempt.getTime() < this.RESET_WINDOW_MS) {
        if (attempt.count >= this.MAX_RESET_ATTEMPTS) {
          throw new HttpException('Too many password reset attempts. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
        }
        attempt.count++;
      } else {
        this.resetAttempts.set(email, { count: 1, lastAttempt: now });
      }
    } else {
      this.resetAttempts.set(email, { count: 1, lastAttempt: now });
    }
  }

  generateJwt(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  generateResetToken(payload: JwtPayload): string {
    const resetPayload = {
      sub: payload.uuid,
      email: payload.email,
      reset: true,
      iat: Math.floor(Date.now() / 1000)
    };
    
    return this.jwtService.sign(resetPayload, { 
      expiresIn: '10m',
      algorithm: 'HS256'
    });
  }

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  comparePassword(password: string, hash: string): Observable<boolean> {
    return from(bcrypt.compare(password, hash));
  }

  async login(email: string, password: string): Promise<ApiResponseDto<LoginResponse>> {
    try {
      const userResponse = await this.usersService.findByEmail(email);
      if (!userResponse.success || !userResponse.data) {
        return ApiResponseDto.error('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const user = userResponse.data;
      let isPasswordValid = false;
      
      try {
        isPasswordValid = await bcrypt.compare(password, user.password);
      } catch (e) {
        isPasswordValid = password === user.password;
        
        if (isPasswordValid) {
          await this.usersService.updatePassword(user.uuid, password);
        }
      }

      if (!isPasswordValid) {
        return ApiResponseDto.error('Invalid credentials', HttpStatus.UNAUTHORIZED);
      }

      const payload = { 
        sub: user.uuid, 
        email: user.email,
        role: user.role 
      };

      const result: LoginResponse = {
        access_token: this.jwtService.sign(payload),
        user: {
          uuid: user.uuid,
          email: user.email,
          role: user.role
        }
      };

      return ApiResponseDto.success(result, 'Login successful');
    } catch (error) {
      this.logger.error(`Login failed for user ${email}:`, error);
      return ApiResponseDto.error('An error occurred during login', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ApiResponseDto<ForgotPasswordResponse>> {
    try {
      this.checkRateLimit(dto.email);
      
      const userResponse = await this.usersService.findByEmail(dto.email);
      if (!userResponse.success || !userResponse.data) {
        return ApiResponseDto.success({ expiresIn: 600 }, 'If the email address is registered, you will receive a password reset link');
      }

      const user = userResponse.data;
      const payload = { 
        sub: user.uuid, 
        email: user.email,
        reset: true
      };
      
      const token = this.jwtService.sign(payload, { expiresIn: '10m' });
      const url = `http://localhost:3000/verify?token=${token}`;
      
      await this.mailService.sendPasswordResetEmail(user.email, url);

      return ApiResponseDto.success(
        { expiresIn: 600 },
        'If the email address is registered, you will receive a password reset link'
      );
    } catch (error) {
      if (error instanceof HttpException) {
        return ApiResponseDto.error(error.message, error.getStatus());
      }
      this.logger.error(`Password reset failed for email ${dto.email}:`, error);
      return ApiResponseDto.error('An error occurred during password reset', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(dto: UpdatePasswordDto): Promise<ApiResponseDto<null>> {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (!payload.reset) {
        return ApiResponseDto.error('Invalid token', HttpStatus.BAD_REQUEST);
      }

      const userResponse = await this.usersService.findByEmail(payload.email);
      if (!userResponse.success || !userResponse.data) {
        return ApiResponseDto.error('User not found', HttpStatus.NOT_FOUND);
      }

      const updateResponse = await this.usersService.updatePassword(userResponse.data.uuid, dto.new_password);
      if (!updateResponse.success) {
        return ApiResponseDto.error(updateResponse.message || 'Password update failed', HttpStatus.BAD_REQUEST);
      }

      return ApiResponseDto.success(null, 'Password has been updated successfully');
    } catch (error) {
      if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
        return ApiResponseDto.error('Invalid or expired token', HttpStatus.BAD_REQUEST);
      }
      this.logger.error('Password update failed:', error);
      return ApiResponseDto.error('An error occurred while updating password', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getTokenExpiration(token: string): number {
    try {
      const decoded = this.jwtService.decode(token);
      return typeof decoded === 'object' && decoded?.exp ? decoded.exp : 0;
    } catch {
      return 0;
    }
  }
}