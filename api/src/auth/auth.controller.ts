import { Body, Controller, Post, Patch, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
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

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Request() req) {
        return await this.authService.logout(req.user);
    }
}