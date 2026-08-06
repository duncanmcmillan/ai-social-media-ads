/**
 * @fileoverview Ad Sets feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the ad sets feature. */
export const AD_SETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/ad-sets.component').then(m => m.AdSetsComponent),
  },
];
