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

    // Se l'utente è admin, può accedere a tutte le rotte private
    if (userRole === 'admin') {
      return true;
    }

    // Se l'utente non è admin, può accedere solo alla pagina di modifica
    if (state.url.includes('/private/edit')) {
      return true;
    }

    // Per tutte le altre rotte private, reindirizza alla pagina di modifica
    // Solo se non siamo già sulla pagina di modifica per evitare loop
    if (!state.url.includes('/private/edit')) {
      router.navigate(['/private/edit']);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error decoding token:', error);
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return false;
  }
}; 