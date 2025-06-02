import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for creating a new user
 */
export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
} 