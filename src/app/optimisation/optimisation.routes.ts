/**
 * @fileoverview Optimisation feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the optimisation feature. */
export const OPTIMISATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/optimisation.component').then(m => m.OptimisationComponent),
  },
];
