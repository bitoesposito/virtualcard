import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, LoginDto } from './dto/auth.dto';
import { from, Observable } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) { }

  generateJwt(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  hashPassword(password: string): Observable<string> {
    return from(bcrypt.hash(password, 12));
  }

  comparePassword(password: string, hash: string): Observable<boolean> {
    return from(bcrypt.compare(password, hash));
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = this.generateJwt(payload);

    return {
      message: 'Successfully logged in',
      accessToken: token,
      user: {
        id: user.id,
        slug: user.slug,
        name: user.name,
        surname: user.surname,
        is_whatsapp_enabled: user.is_whatsapp_enabled,
        is_website_enabled: user.is_website_enabled,
        is_vcard_enabled: user.is_vcard_enabled,
        website: user.website,
        area_code: user.area_code,
        phone: user.phone,
        created_at: user.created_at,
      },
    };
  }
}