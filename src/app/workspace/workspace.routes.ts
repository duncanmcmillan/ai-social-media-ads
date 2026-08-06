import { Routes } from '@angular/router';

export const WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/workspace.component').then(m => m.WorkspaceComponent),
  },
];
