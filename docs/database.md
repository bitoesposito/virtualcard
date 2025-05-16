# Struttura database

## Entità
### Users

| entity | description |
|-|-:|
| uuid: string | Primary key, auto-generated |
| email: string | Unique, lowercase |
| password: string | Hashed |
| role: string | enum di UserRole, default UserRole.USER |
| is_configured: boolean | default false |
| name: string | nullable, 2-50 caratteri |
| surname: string | nullable, 2-50 caratteri |
| area_code: string | nullable, formato valido |
| phone: string | nullable, formato valido |
| website: string | nullable, formato valido |
| is_whatsapp_enabled: boolean | default false |
| is_website_enabled: boolean | default false |
| is_vcard_enabled: boolean | default false |
| slug: string | unique, nullable, 3-50 caratteri, formato [a-z0-9-] |
| created_at: Date | auto-generated |
| updated_at: Date | auto-generated |

## Interfacce DTO

### UserResponseDto
#### Descrizione

Usato in: GET /user/:slug, GET /user/by-id/:uuid, GET /user/list per restituire dati pubblici di un utente. 

export class UserResponseDto {
  uuid: string;
  name?: string;
  surname?: string;
  areaCode?: string;
  phone?: string;
  website?: string;
  isWhatsappEnabled: boolean;
  isWebsiteEnabled: boolean;
  isVcardEnabled: boolean;
  slug: string;
  email?: string;  // Solo per admin in user/list
  role?: string;   // Solo per admin in user/list
  createdAt: Date;
}

### CreateUserDto
#### Descrizione

Usato in: POST /user/create per creare nuovi utenti di ruolo USER.

export class CreateUserDto {
  @IsEmail()
  email: string;
}

### EditUserDto
#### Descrizione

Usato in: PUT /user/edit per la modifica del profilo utente, richiede l'autorizzazione JWT dell'utente che modifica il proprio profilo o di un admin.

export class EditUserDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsString()
  @Length(2, 50)
  surname: string;

  @IsString()
  @Matches(VALIDATION_PATTERNS.AREA_CODE)
  areaCode: string;

  @IsString()
  @Matches(VALIDATION_PATTERNS.PHONE)
  phone: string;

  @IsOptional()
  @IsString()
  @Matches(VALIDATION_PATTERNS.WEBSITE)
  website?: string;

  @IsOptional()
  @IsBoolean()
  isWhatsappEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isWebsiteEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isVcardEnabled?: boolean;

  @IsString()
  @Matches(VALIDATION_PATTERNS.SLUG)
  @Length(3, 50)
  slug: string;
}

### LoginDto
#### Descrizione

Usato in: POST /auth/login per l'autenticazione, contiene le credenziali utente.

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}

### ForgotPasswordDto
#### Descrizione

Usato in: POST /auth/recover per inviare una mail contenente un token temporaneo per il recupero password.

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

### UpdatePasswordDto
#### Descrizione

Usato in: POST /auth/verify per verificare un token di recupero e aggiornare la password.

export class UpdatePasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  new_password: string;
}

### DeleteUserDto
#### Descrizione 

Usato in: DELETE /user/delete per eliminare un utente, può essere eseguito solo dall'utente stesso o da un admin.

export class DeleteUserDto {
  @IsEmail()
  email: string;
}