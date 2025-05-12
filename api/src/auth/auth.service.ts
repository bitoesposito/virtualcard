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
          throw new HttpException('Troppi tentativi di reset password. Riprova più tardi.', HttpStatus.TOO_MANY_REQUESTS);
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
      throw new UnauthorizedException('Credenziali non valide');
    }

    const payload: JwtPayload = {
      uuid: user.uuid,
      email: user.email,
      is_configured: user.is_configured,
      role: user.role,
    };

    const token = this.generateJwt(payload);

    return {
      message: 'Login effettuato con successo',
      accessToken: token,
      is_configured: user.is_configured,
      role: user.role
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    this.checkRateLimit(dto.email);
    this.logger.log(`Richiesta reset password per ${dto.email}`);
    
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return {
        message: 'Se l\'indirizzo email è registrato, riceverai un link per il reset della password',
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

    this.logger.log(`URL di reset: ${resetUrl}`);

    return {
      message: 'Se l\'indirizzo email è registrato, riceverai un link per il reset della password',
      expiresIn: 600 // 10 minutes in seconds
    };
  }

  async updatePassword(dto: UpdatePasswordDto) {
    if (dto.new_password.length > this.MAX_PASSWORD_LENGTH) {
      throw new BadRequestException('La password è troppo lunga');
    }

    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException('Le password non coincidono');
    }

    try {
      const payload = this.jwtService.verify(dto.token);
      
      if (!payload.reset) {
        throw new UnauthorizedException('Token non valido per il reset della password');
      }

      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Token non valido');
      }

      const hashedPassword = await bcrypt.hash(dto.new_password, 12);
      await this.usersService.updatePassword(user.uuid, hashedPassword);

      // Invalida tutti i token di reset per questo utente
      this.resetAttempts.delete(user.email);

      this.logger.log(`Password aggiornata con successo per l'utente ${user.email}`);

      return {
        message: 'Password aggiornata con successo'
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.warn(`Tentativo con token scaduto`);
        throw new UnauthorizedException('Il token di reset è scaduto. Richiedi un nuovo link di reset.');
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn(`Tentativo con token non valido`);
        throw new UnauthorizedException('Token non valido. Richiedi un nuovo link di reset.');
      }
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Errore durante l'aggiornamento della password: ${error.message}`);
      throw new UnauthorizedException('Si è verificato un errore durante l\'aggiornamento della password');
    }
  }
}