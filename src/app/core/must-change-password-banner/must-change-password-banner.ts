import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { Auth } from '../auth';

/**
 * Non-blocking, session-only dismissible notice - auth-service explicitly returns
 * mustChangePassword without blocking login, so the dismiss button stays even though
 * /change-password now exists.
 */
@Component({
  imports: [MatButtonModule, RouterLink, TranslocoPipe],
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
