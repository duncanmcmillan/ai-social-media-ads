/**
 * @fileoverview Dashboard feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the dashboard feature. */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./component/dashboard.component').then(m => m.DashboardComponent),
  },
];
