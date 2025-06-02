import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RolesGuard } from './guards/roles.guard';

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
    providers: [AuthService, RolesGuard],
    exports: [AuthService, RolesGuard],
})
export class AuthModule {}