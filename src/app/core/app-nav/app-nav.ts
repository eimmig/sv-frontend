import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { filter, map } from 'rxjs';

import { Auth } from '../auth';

@Component({
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatMenuModule, TranslocoPipe],
  selector: 'app-nav',
  styleUrl: './app-nav.scss',
  templateUrl: './app-nav.html',
})
export class AppNav {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  // feat-016: a mat-menu trigger button isn't itself a routerLink, so routerLinkActive (used by
  // the plain links above) can't reach it - this tracks the active route manually to highlight
  // the trigger when the user is on either of its 2 destinations (Cadastrar/Dashboard).
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected isResourceActive(routes: string[]): boolean {
    const url = this.currentUrl();
    return routes.some((route) => url === `/${route}`);
  }

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
