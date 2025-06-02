import { IsEmail, IsNotEmpty, IsString, IsOptional, IsBoolean, Length, Matches } from 'class-validator';

/**
 * Data Transfer Object for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

/**
 * Data Transfer Object for editing user profile
 */
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