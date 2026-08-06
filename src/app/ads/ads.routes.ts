/**
 * @fileoverview Ads feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the ads feature. */
export const ADS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/ads.component').then(m => m.AdsComponent),
  },
];
