import { Routes } from '@angular/router';

export const MONITORING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./component/monitoring.component').then(m => m.MonitoringComponent),
  },
];
