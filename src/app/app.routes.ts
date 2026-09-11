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
  // feat-016 ("menu por cadastro"): pages/catalogs/ (tab group) retired - each resource is now
  // its own route, reached via app-nav's per-resource mat-menu instead of an in-page tab switch.
  // "Cadastrar X" routes bind straight to shared/catalog-manager via route `data`
  // (withComponentInputBinding, app.config.ts) - no per-resource wrapper page.
  {
    path: 'sports',
    loadComponent: () => import('./shared/catalog-manager/catalog-manager').then((m) => m.CatalogManager),
    data: { resourcePath: 'sports' },
    canActivate: [authGuard],
  },
  {
    path: 'leagues',
    loadComponent: () => import('./shared/catalog-manager/catalog-manager').then((m) => m.CatalogManager),
    data: { resourcePath: 'leagues' },
    canActivate: [authGuard],
  },
  {
    path: 'markets',
    loadComponent: () => import('./shared/catalog-manager/catalog-manager').then((m) => m.CatalogManager),
    data: { resourcePath: 'markets' },
    canActivate: [authGuard],
  },
  {
    path: 'tipsters',
    loadComponent: () => import('./shared/catalog-manager/catalog-manager').then((m) => m.CatalogManager),
    data: { resourcePath: 'tipsters' },
    canActivate: [authGuard],
  },
  // "Dashboard X" routes bind straight to shared/catalog-dashboard the same way.
  {
    path: 'sports-dashboard',
    loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
    data: { segment: 'bySport', labelKey: 'catalogDashboard.sportNameLabel' },
    canActivate: [authGuard],
  },
  {
    path: 'leagues-dashboard',
    loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
    data: { segment: 'byLeague', labelKey: 'catalogDashboard.leagueNameLabel' },
    canActivate: [authGuard],
  },
  {
    path: 'markets-dashboard',
    loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
    data: { segment: 'byMarket', labelKey: 'catalogDashboard.marketNameLabel' },
    canActivate: [authGuard],
  },
  {
    path: 'tipsters-dashboard',
    loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
    data: { segment: 'byTipster', labelKey: 'catalogDashboard.tipsterNameLabel' },
    canActivate: [authGuard],
  },
  {
    path: 'betting-houses-dashboard',
    loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
    data: { segment: 'byBettingHouse', labelKey: 'catalogDashboard.bettingHouseNameLabel' },
    canActivate: [authGuard],
  },
  {
    path: 'search-statistics',
    loadComponent: () =>
      import('./pages/search-statistics/search-statistics').then((m) => m.SearchStatistics),
    canActivate: [authGuard],
  },
  {
    path: 'period-report',
    loadComponent: () =>
      import('./pages/period-report/period-report').then((m) => m.PeriodReport),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then((m) => m.Users),
    canActivate: [authGuard, adminGuard],
  },
];
