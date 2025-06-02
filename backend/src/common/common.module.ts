import { Module, Global } from '@nestjs/common';
import { LoggerService } from './services/logger.service';
import { SessionService } from './services/session.service';
import { EmailService } from './services/email.service';
import { SecurityHeadersInterceptor } from './interceptors/security-headers.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    LoggerService,
    SessionService,
    EmailService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
  ],
  exports: [
    LoggerService,
    SessionService,
    EmailService,
    SecurityHeadersInterceptor,
  ],
})
export class CommonModule {} 