import { Routes } from '@angular/router';

export const NEW_CAMPAIGN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/new-campaign.component').then(m => m.NewCampaignComponent),
    children: [
      { path: '', redirectTo: 'campaign', pathMatch: 'full' },
      { path: 'campaign',   loadComponent: () => import('./components/campaign-step/campaign-step.component').then(m => m.CampaignStepComponent) },
      { path: 'ad-sets',    loadComponent: () => import('./components/ad-sets-step/ad-sets-step.component').then(m => m.AdSetsStepComponent) },
      { path: 'creatives',  loadComponent: () => import('./components/creatives-step/creatives-step.component').then(m => m.CreativesStepComponent) },
    ],
  },
];
