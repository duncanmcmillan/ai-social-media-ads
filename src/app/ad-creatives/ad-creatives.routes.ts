/**
 * @fileoverview Ad Creatives feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the ad creatives feature. */
export const AD_CREATIVES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/ad-creatives.component').then(m => m.AdCreativesComponent),
  },
];
