import { Body, Controller, Post, HttpCode, HttpStatus, ValidationPipe, UsePipes, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { LoginDto, LoginResponse } from './auth.interface';
import { AuthService } from './auth.service';
import { ApiResponseDto } from 'src/common/common.interface';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

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