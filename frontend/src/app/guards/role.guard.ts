import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole = payload.role;

    // Se l'utente è admin, può accedere a tutte le rotte private
    if (userRole === 'admin') {
      return true;
    }

    // Se l'utente non è admin, può accedere solo alla pagina di modifica
    if (state.url.includes('/private/edit')) {
      return true;
    }

    // Per tutte le altre rotte private, reindirizza alla pagina di modifica
    router.navigate(['/private/edit']);
    return false;
  } catch {
    router.navigate(['/login']);
    return false;
  }
}; 