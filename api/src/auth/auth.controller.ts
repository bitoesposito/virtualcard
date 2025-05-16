import { Body, Controller, Post, Patch, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { LoginDto, ForgotPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
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
    async login(@Body() loginDto: LoginDto) {
        const result = await this.authService.login(loginDto.email, loginDto.password);
        return ApiResponseDto.success(result, 'Login successful');
    }

    @Post('recover')
    @HttpCode(HttpStatus.OK)
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        const result = await this.authService.forgotPassword(forgotPasswordDto);
        return ApiResponseDto.success(
            { expiresIn: result.expiresIn },
            'If the email address is registered, you will receive a password reset link'
        );
    }

    @Patch('verify')
    @HttpCode(HttpStatus.OK)
    async updatePassword(@Body() updatePasswordDto: UpdatePasswordDto) {
        const result = await this.authService.updatePassword(updatePasswordDto);
        return ApiResponseDto.success(result, 'Password has been updated successfully');
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        const result = await this.authService.logout(req.user);
        return ApiResponseDto.success(result, 'Session terminated successfully');
    }
}