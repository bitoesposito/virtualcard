import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, ForgotPasswordDto, UpdatePasswordDto } from './auth.interface';
import { from, Observable } from 'rxjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailService } from 'src/services/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly resetAttempts = new Map<string, { count: number; lastAttempt: Date }>();

  get maxResetAttempts(): number {
    return this.configService.get<number>('AUTH_MAX_RESET_ATTEMPTS', 3);
  }

  get resetWindowMs(): number {
    return this.configService.get<number>('AUTH_RESET_WINDOW_MS', 3600000);
  }

  get maxPasswordLength(): number {
    return this.configService.get<number>('AUTH_MAX_PASSWORD_LENGTH', 128);
  }

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  private checkRateLimit(email: string) {
    return console.log('checkRateLimit');
  }

  generateJwt(payload: JwtPayload) {
    return console.log('generateJwt');
  }

  generateResetToken(payload: JwtPayload) {
    return console.log('generateResetToken');
  }

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  comparePassword(password: string, hash: string): Observable<boolean> {
    return from(bcrypt.compare(password, hash));
  }

  async login(email: string, password: string) {
    return console.log('login');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    return console.log('forgotPassword');
  }

  async updatePassword(dto: UpdatePasswordDto) {
    return console.log('updatePassword');
  }

  async findByEmail(email: string) {
    return console.log('findByEmail');
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