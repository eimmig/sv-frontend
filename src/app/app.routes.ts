import { Route, Routes } from '@angular/router';

import { adminGuard } from './core/admin-guard';
import { authGuard } from './core/auth-guard';

// feat-016 ("menu por cadastro"): the 4 "Cadastrar" + 5 "Dashboard" routes below are
// structurally identical (only resourcePath/segment/labelKey change) - generated from these
// tables instead of 9 near-identical route literals (SonarCloud flagged the literal form as
// duplicated code on the PR, same precedent as the component-level dedup in feat-008/016.2).
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
  // its own route, reached via app-side-nav's per-resource mat-menu instead of an in-page tab switch.
  // "Cadastrar X" routes bind straight to shared/catalog-manager, "Dashboard X" to
  // shared/catalog-dashboard, both via route `data` (withComponentInputBinding, app.config.ts) -
  // no per-resource wrapper page. Generated above from CATALOG_MANAGER_RESOURCES/
  // CATALOG_DASHBOARD_RESOURCES to avoid 9 near-identical route literals.
  ...catalogManagerRoutes,
  ...catalogDashboardRoutes,
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
