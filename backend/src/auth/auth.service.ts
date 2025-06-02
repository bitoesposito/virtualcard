import { Injectable, Logger, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { LoginResponse } from './auth.interface';
import { ApiResponseDto } from 'src/common/common.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) { }

  async login(email: string, password: string): Promise<ApiResponseDto<LoginResponse>> {
    try {
      this.logger.log(`Login attempt for email: ${email}`);

      // Verifica connessione al database
      try {
        await this.userRepository.query('SELECT 1');
      } catch (error) {
        this.logger.error(`Database connection error: ${error.message}`);
        throw new InternalServerErrorException('Database connection error');
      }

      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        this.logger.warn(`Login failed: User not found for email ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verifica password
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

      // Genera JWT
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

  // generateJwt(payload: JwtPayload) {
  //   return console.log('generateJwt');
  // }

  // private checkRateLimit(email: string) {
  //   return console.log('checkRateLimit');
  // }


  // generateResetToken(payload: JwtPayload) {
  //   return console.log('generateResetToken');
  // }

  // hashPassword(password: string): Observable<string> {
  //   return from(bcrypt.hash(password, 12));
  // }

  // comparePassword(password: string, hash: string): Observable<boolean> {
  //   return from(bcrypt.compare(password, hash));
  // }

  // async forgotPassword(dto: ForgotPasswordDto) {
  //   return console.log('forgotPassword');
  // }

  // async updatePassword(dto: UpdatePasswordDto) {
  //   return console.log('updatePassword');
  // }

  // async findByEmail(email: string) {
  //   return console.log('findByEmail');
  // }

  // private getTokenExpiration(token: string): number {
  //   try {
  //     const decoded = this.jwtService.decode(token);
  //     return typeof decoded === 'object' && decoded?.exp ? decoded.exp : 0;
  //   } catch {
  //     return 0;
  //   }
  // }
}