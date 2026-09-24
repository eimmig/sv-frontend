import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { Auth } from '../auth';
import { Language, Locale } from '../language';
import { Theme } from '../theme';

const STORAGE_KEY = 'stakevault.navCollapsed';

function prefersNarrowViewport(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 599px)').matches
  );
}

function storedCollapsed(): boolean {
  if (typeof localStorage === 'undefined') {
    return prefersNarrowViewport();
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? prefersNarrowViewport() : stored === 'true';
}

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  selector: 'app-side-nav',
  styleUrl: './app-side-nav.scss',
  templateUrl: './app-side-nav.html',
})
export class AppSideNav {
  protected readonly auth = inject(Auth);
  protected readonly theme = inject(Theme);
  protected readonly language = inject(Language);
  private readonly router = inject(Router);

  protected readonly locales: ReadonlyArray<{ value: Locale; label: string }> = [
    { value: 'pt-BR', label: 'Português' },
    { value: 'en-US', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  protected readonly languageExpanded = signal(false);

  protected readonly collapsed = signal(storedCollapsed());

  // A mat-menu trigger button isn't itself a routerLink, so routerLinkActive (used by the plain
  // links) can't reach it - this tracks the active route manually to highlight the trigger when
  // the user is on either of its 2 destinations (Cadastrar/Dashboard).
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly logoSrc = computed(() => `assets/logo/arka-mark-${this.theme.current()}.svg`);

  protected readonly primaryLinks: ReadonlyArray<{ route: string; icon: string; labelKey: string; testid: string }> = [
    { route: 'overview', icon: 'insights', labelKey: 'nav.overview', testid: 'nav-overview' },
    { route: 'dashboard', icon: 'space_dashboard', labelKey: 'nav.dashboard', testid: 'nav-dashboard' },
    { route: 'register-bet', icon: 'edit_note', labelKey: 'nav.newBet', testid: 'nav-new-bet' },
    { route: 'history', icon: 'history', labelKey: 'nav.history', testid: 'nav-history' },
  ];

  protected readonly resources: ReadonlyArray<{
    id: string;
    icon: string;
    labelKey: string;
    registerRoute: string;
    dashboardRoute: string;
  }> = [
    { id: 'sports', icon: 'sports_soccer', labelKey: 'catalogs.sports.title', registerRoute: 'sports', dashboardRoute: 'sports-dashboard' },
    { id: 'leagues', icon: 'emoji_events', labelKey: 'catalogs.leagues.title', registerRoute: 'leagues', dashboardRoute: 'leagues-dashboard' },
    { id: 'markets', icon: 'storefront', labelKey: 'catalogs.markets.title', registerRoute: 'markets', dashboardRoute: 'markets-dashboard' },
    { id: 'tipsters', icon: 'groups', labelKey: 'catalogs.tipsters.title', registerRoute: 'tipsters', dashboardRoute: 'tipsters-dashboard' },
    { id: 'betting-houses', icon: 'account_balance', labelKey: 'nav.bettingHouses', registerRoute: 'betting-houses', dashboardRoute: 'betting-houses-dashboard' },
    { id: 'teams', icon: 'groups_2', labelKey: 'catalogs.teams.title', registerRoute: 'teams', dashboardRoute: 'teams-dashboard' },
  ];

  protected readonly secondaryLinks: ReadonlyArray<{ route: string; icon: string; labelKey: string; testid: string }> = [
    { route: 'search-statistics', icon: 'query_stats', labelKey: 'nav.searchStatistics', testid: 'nav-search-statistics' },
    { route: 'period-report', icon: 'calendar_month', labelKey: 'nav.periodReport', testid: 'nav-period-report' },
    { route: 'period-comparison', icon: 'compare_arrows', labelKey: 'nav.periodComparison', testid: 'nav-period-comparison' },
    { route: 'telegram-link', icon: 'telegram', labelKey: 'nav.telegramLink', testid: 'nav-telegram-link' },
  ];

  protected toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    // Only an explicit toggle persists - the initial value (viewport default or a previous
    // explicit choice) must not be written back as if the user had just chosen it, or a mobile
    // visit's viewport-based default would incorrectly become "the user's choice" the next time
    // they open the app from a desktop-width browser.
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(next));
    }
  }

  protected isResourceActive(routes: string[]): boolean {
    const url = this.currentUrl();
    return routes.some((route) => url === `/${route}`);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  protected setLocale(locale: Locale): void {
    this.language.set(locale);
  }

  // stopPropagation: without it the click bubbles out of the mat-menu panel and CDK's
  // outside-click detector closes the whole settings menu instead of just expanding the list.
  protected toggleLanguageExpanded(event: MouseEvent): void {
    event.stopPropagation();
    this.languageExpanded.set(!this.languageExpanded());
  }
}
