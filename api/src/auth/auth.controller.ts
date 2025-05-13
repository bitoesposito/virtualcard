import { Body, Controller, Post, Patch, UseGuards, Request } from '@nestjs/common';
import { LoginDto, ForgotPasswordDto, UpdatePasswordDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService
    ) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        console.log('Login request received:', loginDto);
        return this.authService.login(loginDto.email, loginDto.password);
    }

    @Post('recover')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Patch('verify')
    async updatePassword(@Body() dto: UpdatePasswordDto) {
        return this.authService.updatePassword(dto);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    async logout(@Request() req) {
        return this.authService.logout(req.user);
    }
}