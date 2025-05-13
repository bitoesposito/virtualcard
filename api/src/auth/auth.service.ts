import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, ForgotPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
import { from, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetAttempts = new Map<string, { count: number; lastAttempt: Date }>();
  private readonly MAX_RESET_ATTEMPTS = 3;
  private readonly RESET_WINDOW_MS = 3600000; // 1 hour
  private readonly MAX_PASSWORD_LENGTH = 128;
  private readonly invalidatedTokens = new Map<string, number>(); // Map of token -> expiration timestamp

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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
    // Include solo le informazioni necessarie nel token
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

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      uuid: user.uuid,
      email: user.email,
      is_configured: user.is_configured,
      role: user.role,
    };

    const token = this.generateJwt(payload);

    return {
      message: 'Login successful',
      accessToken: token,
      is_configured: user.is_configured,
      role: user.role
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    this.checkRateLimit(dto.email);
    this.logger.log(`Password reset request for ${dto.email}`);
    
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return {
        message: "If the email address is registered, you will receive a password reset link",
        expiresIn: 600 // 10 minutes in seconds
      };
    }

    const payload: JwtPayload = {
      uuid: user.uuid,
      email: user.email,
      is_configured: user.is_configured,
      role: user.role,
    };

    const resetToken = this.generateResetToken(payload);
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/verify?token=${resetToken}`;

    this.logger.log(`Reset URL: ${resetUrl}`);

    return {
      message: "If the email address is registered, you will receive a password reset link",
      expiresIn: 600 // 10 minutes in seconds
    };
  }

  async updatePassword(dto: UpdatePasswordDto) {
    if (dto.new_password.length > this.MAX_PASSWORD_LENGTH) {
      throw new BadRequestException('Password is too long');
    }

    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      const payload = this.jwtService.verify(dto.token);
      
      if (!payload.reset) {
        throw new UnauthorizedException('Token is not valid for password reset');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const hashedPassword = await bcrypt.hash(dto.new_password, 12);
      await this.usersService.updatePassword(user.uuid, hashedPassword);

      // Invalidate all reset tokens for this user
      this.resetAttempts.delete(user.email);

      this.logger.log(`Password successfully updated for user ${user.email}`);

      return {
        message: 'Password updated successfully'
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.warn(`Attempt with expired token`);
        throw new UnauthorizedException('The reset token has expired. Please request a new reset link.');
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn(`Attempt with invalid token`);
        throw new UnauthorizedException('Invalid token. Please request a new reset link.');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating password: ${error.message}`);
      throw new UnauthorizedException('An error occurred while updating the password');
    }
  }

  async logout(user: JwtPayload) {
    try {
      // Get the token from the request
      const token = this.jwtService.sign(user);
      
      // Decode the token to get expiration
      const decoded = this.jwtService.decode(token) as { exp: number };
      
      // Store the token with its expiration time
      this.invalidatedTokens.set(token, decoded.exp);
      
      // Clean up expired tokens
      this.cleanupExpiredTokens();
      
      return {
        message: 'Logout successful'
      };
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
      throw new HttpException('Error during logout', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Helper method to check if a token is invalidated
  isTokenInvalidated(token: string): boolean {
    // Clean up expired tokens first
    this.cleanupExpiredTokens();
    
    // Check if token is in the invalidated list
    return this.invalidatedTokens.has(token);
  }

  private cleanupExpiredTokens() {
    const now = Math.floor(Date.now() / 1000);
    for (const [token, exp] of this.invalidatedTokens.entries()) {
      if (exp < now) {
        this.invalidatedTokens.delete(token);
      }
    }
  }
}