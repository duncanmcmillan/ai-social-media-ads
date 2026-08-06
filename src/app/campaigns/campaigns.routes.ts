/**
 * @fileoverview Campaigns feature route definitions.
 */
import { Routes } from '@angular/router';

/** Routes for the campaigns feature. */
export const CAMPAIGNS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/campaigns.component').then(m => m.CampaignsComponent),
  },
];
