import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: '',
        loadChildren: () => import('./public/auth-routing.module').then(m => m.routes)
    },
    {
        path: 'private',
        loadChildren: () => import('./private/private-routing.module').then(m => m.routes)
    }
];
