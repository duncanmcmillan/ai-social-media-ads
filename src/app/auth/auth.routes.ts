/**
 * @fileoverview Auth feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the Facebook authentication feature. */
export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/auth.component').then(m => m.AuthComponent),
  },
];
