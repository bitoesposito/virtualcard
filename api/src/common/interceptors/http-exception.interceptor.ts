import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException, HttpStatus } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class HttpExceptionInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            catchError(error => {
                let status = HttpStatus.INTERNAL_SERVER_ERROR;
                let message = 'Internal server error';

                if (error instanceof HttpException) {
                    status = error.getStatus();
                    const response = error.getResponse();
                    message = typeof response === 'string' ? response : response['message'];
                }

                return throwError(() => {
                    return ApiResponseDto.error(message, status);
                });
            }),
        );
    }
} 