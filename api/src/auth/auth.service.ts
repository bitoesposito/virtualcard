import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dto/auth.dto';
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
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    };

    const token = this.generateJwt(payload);

    return {
      message: 'Successfully logged in',
      accessToken: token,
      role: user.role
    };
  }
}