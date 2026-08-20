/**
 * @fileoverview Root application route definitions.
 * All feature routes are lazy-loaded to minimise the initial bundle.
 */
import { Routes } from '@angular/router';

/** Top-level routes — each feature module is lazy-loaded on demand. */
export const routes: Routes = [
  { path: '', redirectTo: 'workspace', pathMatch: 'full' },
  {
    path: 'workspace',
    loadChildren: () => import('./workspace/workspace.routes').then(m => m.WORKSPACE_ROUTES),
  },
  {
    path: 'new-campaign',
    loadChildren: () => import('./new-campaign/new-campaign.routes').then(m => m.NEW_CAMPAIGN_ROUTES),
  },
  {
    path: 'campaign-manager',
    loadChildren: () =>
      import('./campaign-manager/campaign-manager.routes').then(m => m.CAMPAIGN_MANAGER_ROUTES),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
  { path: 'optimisation', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'monitoring',   redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'meta-setup',
    loadChildren: () =>
      import('./meta-setup/meta-setup.routes').then(m => m.META_SETUP_ROUTES),
  },
];
