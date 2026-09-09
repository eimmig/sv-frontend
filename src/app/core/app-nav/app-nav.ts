import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Auth } from '../auth';

@Component({
  imports: [RouterLink, RouterLinkActive, MatButtonModule, TranslocoPipe],
  selector: 'app-nav',
  styleUrl: './app-nav.scss',
  templateUrl: './app-nav.html',
})
export class AppNav {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
