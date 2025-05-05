import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

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
}