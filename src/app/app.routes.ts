import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'historico',
    loadComponent: () => import('./pages/historico/historico').then((m) => m.Historico),
  },
  {
    path: 'casas-de-apostas',
    loadComponent: () =>
      import('./pages/casas-de-apostas/casas-de-apostas').then((m) => m.CasasDeApostas),
  },
  {
    path: 'registro-de-aposta',
    loadComponent: () =>
      import('./pages/registro-de-aposta/registro-de-aposta').then((m) => m.RegistroDeAposta),
  },
];
