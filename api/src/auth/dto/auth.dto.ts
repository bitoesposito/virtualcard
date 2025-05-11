import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @IsEmail({}, { message: 'Email non valida' })
    @IsNotEmpty({ message: 'L\'email è obbligatoria' })
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'La password è obbligatoria' })
    @MinLength(6, { message: 'La password deve avere almeno 6 caratteri' })
    @MaxLength(128, { message: 'La password non può superare i 128 caratteri' })
    password: string;
}

export interface JwtPayload {
    uuid: string;
    email: string;
    is_configured: boolean;
    role: string;
}

export class ForgotPasswordDto {
    @IsEmail({}, { message: 'Email non valida' })
    @IsNotEmpty({ message: 'L\'email è obbligatoria' })
    @MaxLength(255, { message: 'L\'email non può superare i 255 caratteri' })
    email: string;
}

export class UpdatePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Il token è obbligatorio' })
    @MaxLength(1000, { message: 'Token non valido' })
    token: string;

    @IsString()
    @IsNotEmpty({ message: 'La nuova password è obbligatoria' })
    @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' })
    @MaxLength(128, { message: 'La password non può superare i 128 caratteri' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale'
        }
    )
    new_password: string;

    @IsString()
    @IsNotEmpty({ message: 'La conferma password è obbligatoria' })
    @MinLength(8, { message: 'La password deve avere almeno 8 caratteri' })
    @MaxLength(128, { message: 'La password non può superare i 128 caratteri' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale'
        }
    )
    confirm_password: string;
}