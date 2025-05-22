import { Body, Controller, Post, Patch, UseGuards, Request, HttpCode, HttpStatus, ValidationPipe, UsePipes, BadRequestException } from '@nestjs/common';
import { LoginDto, ForgotPasswordDto, UpdatePasswordDto, LoginResponse } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiResponseDto } from '../common/dto/api-response.dto';

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
            return ApiResponseDto.error(messages.join(', '), HttpStatus.BAD_REQUEST);
        }
    }))
    async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<LoginResponse>> {
        return await this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('recover')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<ApiResponseDto<{ expiresIn: number }>> {
        return await this.authService.forgotPassword(forgotPasswordDto);
    }

    @Patch('verify')
    @HttpCode(HttpStatus.OK)
    async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
        return await this.authService.updatePassword(updatePasswordDto);
    }
}