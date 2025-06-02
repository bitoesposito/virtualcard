import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { EmailService } from 'src/common/services/email.service';
import { AuthService } from './auth.service';
import { SecurityHeadersInterceptor } from '../common/interceptors/security-headers.interceptor';
import { LoggerService } from '../common/services/logger.service';
import { SessionService } from '../common/services/session.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

/**
 * Authentication module configuration
 * Handles user authentication, JWT token generation, and role-based access control
 */
@Module({
    imports: [
        // Database configuration for User entity
        TypeOrmModule.forFeature([User]),
        
        // JWT configuration with async options
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        RolesGuard,
        EmailService,
        LoggerService,
        SessionService,
        {
            provide: APP_INTERCEPTOR,
            useClass: SecurityHeadersInterceptor,
        }
    ],
    exports: [AuthService, RolesGuard, EmailService, LoggerService, SessionService],
})
export class AuthModule {}