import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/common/common.interface';

/**
 * Data Transfer Object for user login
 * Contains validation rules for email and password
 */
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