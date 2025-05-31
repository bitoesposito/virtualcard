

import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/common/common.interface';

export enum UserRole {
    admin = 'admin',
    user = 'user',
}

export class LoginDto {
    @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL })
    @IsNotEmpty({ message: 'Email is required' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
        {
            message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
        }
    )
    password: string;
}

export interface JwtPayload {
    uuid: string;
    email: string;
    role: UserRole;
    reset?: boolean;
    iat?: number;
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL })
    @IsNotEmpty({ message: 'Email is required' })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    email: string;
}

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Token is required' })
    @MaxLength(1000, { message: 'Invalid token' })
    token: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
        {
            message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
        }
    )
    new_password: string;

    @IsString()
    @IsNotEmpty({ message: 'Password confirmation is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
        {
            message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
        }
    )
    confirm_password: string;
}

export interface LoginResponse {
    access_token: string;
    user: {
        uuid: string;
        email: string;
        role: string;
    };
}

interface ForgotPasswordResponse {
  expiresIn: number;
  url?: string;
}