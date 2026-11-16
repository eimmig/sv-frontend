import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto, submitForm } from '../../core/api-request';
import { Auth } from '../../core/auth';
import { UserSummary, UsersApi } from '../../core/users-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/;

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
  ],
  selector: 'app-users',
  styleUrl: './users.scss',
  templateUrl: './users.html',
})
export class Users {
  private readonly usersApi = inject(UsersApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly users = signal<UserSummary[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    username: ['', [Validators.required, Validators.pattern(USERNAME_PATTERN)]],
    password: ['', Validators.required],
  });

  protected readonly deleteConfirmation = signal('');
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);
  protected readonly canDelete = computed(() => {
    const slug = this.auth.session()?.tenantSlug;
    return !!slug && this.deleteConfirmation().trim() === slug && !this.deleting();
  });

  constructor() {
    this.reload();
  }

  private reload(): void {
    loadInto(this.usersApi.list(), this.users, this.loadError, () =>
      this.transloco.translate('users.genericError'),
    );
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    const first = parts[0][0];
    const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    submitForm(
      this.usersApi.create(this.form.getRawValue()),
      this.submitting,
      this.formError,
      () => this.transloco.translate('users.genericError'),
      () => {
        this.form.reset();
        this.reload();
      },
    );
  }

  protected onDeleteConfirmationInput(event: Event): void {
    this.deleteConfirmation.set((event.target as HTMLInputElement).value);
  }

  protected deleteOrganization(): void {
    if (!this.canDelete()) {
      return;
    }
    submitForm(
      this.usersApi.deleteOrganization(),
      this.deleting,
      this.deleteError,
      () => this.transloco.translate('users.deleteOrganization.genericError'),
      () => {
        this.auth.logout();
        void this.router.navigate(['/login'], { queryParams: { organizationDeleted: 1 } });
      },
    );
  }
}
