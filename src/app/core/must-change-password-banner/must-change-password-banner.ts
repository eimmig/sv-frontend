import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';

import { Auth } from '../auth';

/**
 * Non-blocking, session-only dismissible notice - auth-service explicitly
 * returns mustChangePassword without blocking login and without a change-
 * password endpoint in its backlog yet (see docs/services/auth-service.md),
 * so there is no action to link to here.
 */
@Component({
  imports: [MatButtonModule, TranslocoPipe],
  selector: 'app-must-change-password-banner',
  styleUrl: './must-change-password-banner.scss',
  templateUrl: './must-change-password-banner.html',
})
export class MustChangePasswordBanner {
  protected readonly auth = inject(Auth);
  protected readonly dismissed = signal(false);

  protected dismiss(): void {
    this.dismissed.set(true);
  }
}
