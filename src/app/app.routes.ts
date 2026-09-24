import { Route, Routes } from '@angular/router';

import { adminGuard } from './core/admin-guard';
import { authGuard } from './core/auth-guard';

const CATALOG_MANAGER_RESOURCES: { path: string; resourcePath: string }[] = [
  { path: 'sports', resourcePath: 'sports' },
  { path: 'leagues', resourcePath: 'leagues' },
  { path: 'markets', resourcePath: 'markets' },
  { path: 'tipsters', resourcePath: 'tipsters' },
];

const CATALOG_DASHBOARD_RESOURCES: { path: string; segment: string; labelKey: string }[] = [
  { path: 'sports-dashboard', segment: 'bySport', labelKey: 'catalogDashboard.sportNameLabel' },
  { path: 'leagues-dashboard', segment: 'byLeague', labelKey: 'catalogDashboard.leagueNameLabel' },
  { path: 'markets-dashboard', segment: 'byMarket', labelKey: 'catalogDashboard.marketNameLabel' },
  { path: 'tipsters-dashboard', segment: 'byTipster', labelKey: 'catalogDashboard.tipsterNameLabel' },
  { path: 'betting-houses-dashboard', segment: 'byBettingHouse', labelKey: 'catalogDashboard.bettingHouseNameLabel' },
];

const catalogManagerRoutes: Route[] = CATALOG_MANAGER_RESOURCES.map(({ path, resourcePath }) => ({
  path,
  loadComponent: () => import('./shared/catalog-manager/catalog-manager').then((m) => m.CatalogManager),
  data: { resourcePath },
  canActivate: [authGuard],
}));

const catalogDashboardRoutes: Route[] = CATALOG_DASHBOARD_RESOURCES.map(({ path, segment, labelKey }) => ({
  path,
  loadComponent: () => import('./shared/catalog-dashboard/catalog-dashboard').then((m) => m.CatalogDashboard),
  data: { segment, labelKey },
  canActivate: [authGuard],
}));

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'bet-type-dashboard', redirectTo: 'search-statistics' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'overview',
    loadComponent: () => import('./pages/overview/overview').then((m) => m.Overview),
    canActivate: [authGuard],
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
  ...catalogManagerRoutes,
  ...catalogDashboardRoutes,
  {
    path: 'teams',
    loadComponent: () => import('./shared/team-manager/team-manager').then((m) => m.TeamManager),
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
    path: 'period-comparison',
    loadComponent: () =>
      import('./pages/period-comparison/period-comparison').then((m) => m.PeriodComparison),
    canActivate: [authGuard],
  },
  {
    path: 'telegram-link',
    loadComponent: () =>
      import('./pages/telegram-link/telegram-link').then((m) => m.TelegramLinkPage),
    canActivate: [authGuard],
  },
  {
    path: 'users',
    loadComponent: () => import('./pages/users/users').then((m) => m.Users),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/change-password/change-password').then((m) => m.ChangePassword),
    canActivate: [authGuard],
  },
];
