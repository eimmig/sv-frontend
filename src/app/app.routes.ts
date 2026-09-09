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
    path: 'history',
    loadComponent: () => import('./pages/history/history').then((m) => m.History),
    canActivate: [authGuard],
  },
  {
    path: 'betting-houses',
    loadComponent: () =>
      import('./pages/betting-houses/betting-houses').then((m) => m.BettingHouses),
    canActivate: [authGuard],
  },
  {
    path: 'register-bet',
    loadComponent: () =>
      import('./pages/register-bet/register-bet').then((m) => m.RegisterBet),
    canActivate: [authGuard],
  },
  {
    path: 'catalogs',
    loadComponent: () => import('./pages/catalogs/catalogs').then((m) => m.Catalogs),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then((m) => m.Users),
    canActivate: [authGuard, adminGuard],
  },
];
