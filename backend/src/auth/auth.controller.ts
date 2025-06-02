import { Body, Controller, Post, HttpCode, HttpStatus, ValidationPipe, UsePipes, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { LoginResponse } from './auth.interface';
import { LoginDto } from './auth.dto';
import { AuthService } from './auth.service';
import { ApiResponseDto } from 'src/common/common.interface';

/**
 * Controller handling authentication-related endpoints
 * Manages user login and authentication processes
 */
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    /**
     * Handles user login requests
     * Validates input data and returns JWT token on success
     * 
     * @param loginDto - Login credentials (email and password)
     * @returns Promise<ApiResponseDto<LoginResponse>> - Login response with JWT token and user data
     * @throws BadRequestException - If input validation fails
     * @throws UnauthorizedException - If credentials are invalid
     * @throws InternalServerErrorException - If server error occurs
     */
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: (errors) => {
            const messages = errors.map(error => {
                if (error.constraints) {
                    return Object.values(error.constraints).join(', ');
                }
                return 'Invalid input';
            });
            throw new BadRequestException(messages.join(', '));
        }
    }))
    async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<LoginResponse>> {
        try {
            return await this.authService.login(loginDto.email, loginDto.password);
        } catch (error) {
            if (error instanceof UnauthorizedException) {
                return ApiResponseDto.error<LoginResponse>(error.message, HttpStatus.UNAUTHORIZED);
            }
            if (error instanceof InternalServerErrorException) {
                return ApiResponseDto.error<LoginResponse>(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return ApiResponseDto.error<LoginResponse>('An unexpected error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}