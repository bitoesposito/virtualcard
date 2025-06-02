import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { SetMetadata } from '@nestjs/common';

export enum UserRole {
    admin = 'admin',
    user = 'user',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    iat?: number;
}

export interface LoginResponse {
    access_token: string;
    user: {
        uuid: string;
        email: string;
        role: string;
    };
}

export class LoginDto {
    @IsEmail({}, { message: 'Invalid email format' })
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
            message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
        }
    )
    password: string;
}

// export class ForgotPasswordDto {
//     @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL })
//     @IsNotEmpty({ message: 'Email is required' })
//     @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
//     email: string;
// }

// export class UpdatePasswordDto {
//     @IsString()
//     @IsNotEmpty({ message: 'Token is required' })
//     @MaxLength(1000, { message: 'Invalid token' })
//     token: string;

//     @IsString()
//     @IsNotEmpty({ message: 'New password is required' })
//     @MinLength(8, { message: 'Password must be at least 8 characters' })
//     @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
//     @Matches(
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
//         {
//             message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
//         }
//     )
//     new_password: string;

//     @IsString()
//     @IsNotEmpty({ message: 'Password confirmation is required' })
//     @MinLength(8, { message: 'Password must be at least 8 characters' })
//     @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
//     @Matches(
//         /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,
//         {
//             message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?])'
//         }
//     )
//     confirm_password: string;
// }

// interface ForgotPasswordResponse {
//   expiresIn: number;
//   url?: string;
// }

