import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, LoginDto, ForgotPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
import { from, Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { MailService } from '../mail/mail.service';

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
  private readonly invalidatedTokens = new Map<string, number>(); // Map of token -> expiration timestamp

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
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: user.uuid, 
      email: user.email,
      role: user.role 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        uuid: user.uuid,
        email: user.email,
        role: user.role
      }
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Return success even if user doesn't exist for security
      return {
        expiresIn: 600
      };
    }

    const payload = { 
      sub: user.uuid, 
      email: user.email,
      reset: true
    };
    
    const token = this.jwtService.sign(payload, { expiresIn: '10m' });
    const url = `http://localhost:3000/verify?token=${token}`;
    
    // Send email with reset link
    await this.mailService.sendPasswordResetEmail(user.email, url);

    return {
      expiresIn: 600,
      url // This will be logged but not sent in the response
    };
  }

  async updatePassword(dto: UpdatePasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (!payload.reset) {
        throw new BadRequestException('Invalid token');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.usersService.updatePassword(user.uuid, dto.new_password);
      return { success: true };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async logout(user: any) {
    // In a real application, you might want to blacklist the token
    return { success: true };
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