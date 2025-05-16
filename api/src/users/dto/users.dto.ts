import { IsEmail, IsString, IsBoolean, IsOptional, Matches, Length, MaxLength } from 'class-validator';
import { VALIDATION_PATTERNS, VALIDATION_MESSAGES } from '../../config/constants';

export class UserEmailDto {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  email: string;
}

export class EditUserDto {
    @IsString()
    @Length(2, 50, { message: 'Name must be between 2 and 50 characters' })
    name: string;

    @IsString()
    @Length(2, 50, { message: 'Surname must be between 2 and 50 characters' })
    surname: string;

    @IsString()
    @Matches(VALIDATION_PATTERNS.AREA_CODE, { message: VALIDATION_MESSAGES.AREA_CODE })
    areaCode: string;

    @IsString()
    @Matches(VALIDATION_PATTERNS.PHONE, { message: VALIDATION_MESSAGES.PHONE })
    phone: string;

    @IsOptional()
    @IsString()
    @Matches(VALIDATION_PATTERNS.WEBSITE, { message: VALIDATION_MESSAGES.WEBSITE })
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
    @Matches(VALIDATION_PATTERNS.SLUG, { message: VALIDATION_MESSAGES.SLUG })
    @Length(3, 50, { message: 'Slug must be between 3 and 50 characters' })
    slug: string;
} 