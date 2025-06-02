import { Body, Controller, Post, HttpCode, HttpStatus, ValidationPipe, UsePipes, BadRequestException } from '@nestjs/common';
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
        return await this.authService.login(loginDto.email, loginDto.password);
    }
}