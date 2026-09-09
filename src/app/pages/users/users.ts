import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto, submitForm } from '../../core/api-request';
import { UserSummary, UsersApi } from '../../core/users-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

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

  protected readonly users = signal<UserSummary[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    this.reload();
  }

  private reload(): void {
    loadInto(this.usersApi.list(), this.users, this.loadError, () =>
      this.transloco.translate('users.genericError'),
    );
  }

  /** Avatar/badge de iniciais (docs/DESIGN-SYSTEM.md item 14) - circulo, fundo muted, negrito. */
  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
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
}
