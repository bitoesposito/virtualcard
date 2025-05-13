import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload) {
    // Get the token from the request
    const token = request.headers.authorization?.split(' ')[1];
    
    // Check if the token has been invalidated
    if (token && this.authService.isTokenInvalidated(token)) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return {
      uuid: payload.uuid,
      email: payload.email,
      role: payload.role,
    };
  }
}