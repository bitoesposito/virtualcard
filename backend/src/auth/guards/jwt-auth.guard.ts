import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Extends Passport's AuthGuard to protect routes requiring JWT authentication
 * Uses the 'jwt' strategy defined in JwtStrategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    /**
     * Determines if the request can be activated
     * Delegates to the parent class's canActivate method
     * 
     * @param context - Execution context containing request information
     * @returns Promise<boolean> - True if request is authorized
     */
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }
}