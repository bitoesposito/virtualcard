import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: any = jwtDecode(token);
    const userRole = decoded.role;

    // If user is admin, they can access all private routes
    if (userRole === 'admin') {
      return true;
    }

    // If user is not admin, they can only access the edit page
    if (state.url.includes('/private/edit')) {
      return true;
    }

    // For all other private routes, redirect to edit page
    // Only if we're not already on the edit page to avoid loops
    router.navigate(['/private/edit']);
    return false;
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }
}; 