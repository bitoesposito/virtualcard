import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../auth.interface';

/**
 * JWT Strategy for Passport authentication
 * Handles JWT token validation and user authentication
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService
  ) {
    super({
      // Extract JWT from Authorization header as Bearer token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Don't ignore expired tokens
      ignoreExpiration: false,
      
      // Get JWT secret from environment variables with fallback
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
      
      // Pass the request object to the validate method
      passReqToCallback: true,
    });
  }

  /**
   * Validates the JWT payload and returns user information
   * 
   * @param request - The HTTP request object
   * @param payload - The decoded JWT payload
   * @returns Object containing user information (uuid, email, role)
   * @throws UnauthorizedException if validation fails
   */
  async validate(request: any, payload: JwtPayload) {
    return {
      uuid: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}