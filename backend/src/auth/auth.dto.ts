import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/common/common.interface';

export class LoginDto {
    @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL })
    @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
    email: string;

    @IsString()
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