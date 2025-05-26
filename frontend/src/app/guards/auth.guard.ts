import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  const isTokenExpired = isExpired(token);

  if (isTokenExpired) {
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }

  return true;
};

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiry = payload.exp;
    return expiry ? (Date.now() >= expiry * 1000) : true;
  } catch {
    return true;
  }
} 