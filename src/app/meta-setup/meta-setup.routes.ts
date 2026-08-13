import { Routes } from '@angular/router';

export const META_SETUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./component/meta-setup.component').then(m => m.MetaSetupComponent),
  },
];
