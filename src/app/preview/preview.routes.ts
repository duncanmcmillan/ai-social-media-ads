/**
 * @fileoverview Preview feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the ad preview feature. */
export const PREVIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/preview.component').then(m => m.PreviewComponent),
  },
];
