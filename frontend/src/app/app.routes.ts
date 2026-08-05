import { Routes } from '@angular/router';
import { CampaignListComponent } from './campaigns/campaign-list/campaign-list.component';
import { CampaignDetailComponent } from './campaigns/campaign-detail/campaign-detail.component';

export const routes: Routes = [
  { path: '', component: CampaignListComponent },
  { path: 'campaigns/:id', component: CampaignDetailComponent },
  { path: '**', redirectTo: '' },
];
