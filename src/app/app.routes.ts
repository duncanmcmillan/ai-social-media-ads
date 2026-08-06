/**
 * @fileoverview Root application route definitions.
 * All feature routes are lazy-loaded to minimise the initial bundle.
 */
import { Routes } from '@angular/router';

/** Top-level routes — each feature module is lazy-loaded on demand. */
export const routes: Routes = [
  { path: '', redirectTo: 'campaigns', pathMatch: 'full' },
  {
    path: 'campaigns',
    loadChildren: () => import('./campaigns/campaigns.routes').then(m => m.CAMPAIGNS_ROUTES),
  },
  {
    path: 'ad-sets',
    loadChildren: () => import('./ad-sets/ad-sets.routes').then(m => m.AD_SETS_ROUTES),
  },
  {
    path: 'ads',
    loadChildren: () => import('./ads/ads.routes').then(m => m.ADS_ROUTES),
  },
  {
    path: 'ad-creatives',
    loadChildren: () => import('./ad-creatives/ad-creatives.routes').then(m => m.AD_CREATIVES_ROUTES),
  },
  {
    path: 'optimisation',
    loadChildren: () => import('./optimisation/optimisation.routes').then(m => m.OPTIMISATION_ROUTES),
  },
  {
    path: 'preview',
    loadChildren: () => import('./preview/preview.routes').then(m => m.PREVIEW_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
];
