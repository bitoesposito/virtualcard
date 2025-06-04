# Database Structure

## Entities

### User (auth_users table)
| Field | Description |
|-|-:|
| uuid: string | Primary key, auto-generated |
| email: string | Unique |
| password: string | Hashed, nullable |
| role: UserRole | enum, default UserRole.USER |
| is_configured: boolean | default false |
| profile_uuid: string | Foreign key to user_profiles.uuid, nullable |
| reset_token: string | nullable |
| reset_token_expiry: Date | nullable |
| created_at: Date | auto-generated |
| updated_at: Date | auto-generated |

### UserProfile (user_profiles table)
| Field | Description |
|-|-:|
| uuid: string | Primary key, auto-generated |
| email: string | Unique |
| name: string | nullable, 2-50 characters |
| surname: string | nullable, 2-50 characters |
| area_code: string | nullable, 2-10 characters |
| phone: string | nullable, 5-20 characters |
| website: string | nullable, valid URL format |
| is_whatsapp_enabled: boolean | default false |
| is_website_enabled: boolean | default false |
| is_vcard_enabled: boolean | default false |
| slug: string | unique, nullable, 3-50 characters, format [a-z0-9-] |
| profile_photo: string | nullable |
| created_at: Date | auto-generated |
| updated_at: Date | auto-generated |

## Relationships
- One-to-One relationship between User and UserProfile
- User.profile_uuid references UserProfile.uuid

## DTO Interfaces

### UserResponseDto
#### Description

Used in: GET /users/:slug, GET /users/by-id/:uuid, GET /users/list to return public user data.

```typescript
export class UserResponseDto {
  uuid: string;
  name?: string;
  surname?: string;
  area_code?: string;
  phone?: string;
  website?: string;
  is_whatsapp_enabled: boolean;
  is_website_enabled: boolean;
  is_vcard_enabled: boolean;
  slug: string;
  profile_photo?: string;
  email?: string;  // Only for admin in users/list
  role?: string;   // Only for admin in users/list
  created_at: Date;
  updated_at: Date;
}
```

### CreateUserDto
#### Description

Used in: POST /users/create to create new users with USER role.

```typescript
export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
```

### EditUserDto
#### Description

Used in: PUT /users/edit to modify user profile, requires JWT authorization of the user modifying their own profile or an admin.

```typescript
export class EditUserDto {
  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Surname must be between 2 and 50 characters' })
  surname?: string;

  @IsString()
  @IsOptional()
  @Length(2, 10, { message: 'Area code must be between 2 and 10 characters' })
  area_code?: string;

  @IsString()
  @IsOptional()
  @Length(5, 20, { message: 'Phone number must be between 5 and 20 characters' })
  phone?: string;

  @IsString()
  @IsOptional()
  @Matches(
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    { message: 'Invalid website URL format' }
  )
  website?: string;

  @IsBoolean()
  @IsOptional()
  is_whatsapp_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_website_enabled?: boolean;

  @IsBoolean()
  @IsOptional()
  is_vcard_enabled?: boolean;

  @IsString()
  @IsOptional()
  @Matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    { message: 'Slug can only contain lowercase letters, numbers, and hyphens' }
  )
  slug?: string;
}
```

### LoginDto
#### Description

Used in: POST /auth/login for authentication, contains user credentials.

```typescript
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
```

### ForgotPasswordDto
#### Description

Used in: POST /auth/recover to send an email containing a temporary token for password recovery.

```typescript
export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
```

### ResetPasswordDto
#### Description

Used in: POST /auth/verify to verify a recovery token and update the password.

```typescript
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
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
```

### DeleteUserDto
#### Description

Used in: DELETE /users/delete to delete a user, can only be executed by the user themselves or an admin.

```typescript
export class DeleteUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
```