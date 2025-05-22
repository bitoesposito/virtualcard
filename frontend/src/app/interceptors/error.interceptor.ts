import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('Error Interceptor - Raw Error:', error);
      console.log('Error Interceptor - Error Status:', error.status);
      console.log('Error Interceptor - Error Body:', error.error);
      
      let errorMessage = 'An error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        if (error.error?.message) {
          if (Array.isArray(error.error.message)) {
            errorMessage = error.error.message.join(', ');
          } else {
            errorMessage = error.error.message;
          }
        } else if (error.error?.data?.message) {
          if (Array.isArray(error.error.data.message)) {
            errorMessage = error.error.data.message.join(', ');
          } else {
            errorMessage = error.error.data.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      console.log('Error Interceptor - Final Error Message:', errorMessage);

      // Create a new error object with the processed message
      const processedError = {
        ...error,
        error: {
          ...error.error,
          message: errorMessage
        }
      };

      return throwError(() => processedError);
    })
  );
}; 