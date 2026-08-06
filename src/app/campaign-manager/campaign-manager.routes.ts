import { Routes } from '@angular/router';

export const CAMPAIGN_MANAGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./component/campaign-manager.component').then(m => m.CampaignManagerComponent),
    children: [
      { path: '', redirectTo: 'campaigns', pathMatch: 'full' },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./components/campaigns-list/campaigns-list.component').then(
            m => m.CampaignsListComponent
          ),
      },
      {
        path: 'ad-sets',
        loadComponent: () =>
          import('./components/ad-sets-list/ad-sets-list.component').then(
            m => m.AdSetsListComponent
          ),
      },
      {
        path: 'ads',
        loadComponent: () =>
          import('./components/ads-list/ads-list.component').then(m => m.AdsListComponent),
      },
    ],
  },
];
