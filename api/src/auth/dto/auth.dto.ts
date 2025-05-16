import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty, IsOptional } from 'class-validator';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from '../../config/constants';
import { UserRole } from '../../users/users.entity';

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
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Password must include an uppercase letter, a lowercase letter, a number, and a special character'
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
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Password must include an uppercase letter, a lowercase letter, a number, and a special character'
        }
    )
    new_password: string;

    @IsString()
    @IsNotEmpty({ message: 'Password confirmation is required' })
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Password must include an uppercase letter, a lowercase letter, a number, and a special character'
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