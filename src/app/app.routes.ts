import { Routes } from '@angular/router';

import { adminGuard } from './core/admin-guard';
import { authGuard } from './core/auth-guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
    canActivate: [authGuard],
  },
  {
    path: 'historico',
    loadComponent: () => import('./pages/historico/historico').then((m) => m.Historico),
    canActivate: [authGuard],
  },
  {
    path: 'casas-de-apostas',
    loadComponent: () =>
      import('./pages/casas-de-apostas/casas-de-apostas').then((m) => m.CasasDeApostas),
    canActivate: [authGuard],
  },
  {
    path: 'registro-de-aposta',
    loadComponent: () =>
      import('./pages/registro-de-aposta/registro-de-aposta').then((m) => m.RegistroDeAposta),
    canActivate: [authGuard],
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios').then((m) => m.Usuarios),
    canActivate: [authGuard, adminGuard],
  },
];
