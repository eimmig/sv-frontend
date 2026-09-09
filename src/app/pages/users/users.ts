import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { UserSummary, UsersApi } from '../../core/users-api';
import { toProblemDetail } from '../../core/problem-detail';
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
    this.usersApi.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loadError.set(null);
      },
      error: (error: HttpErrorResponse) => {
        const problem = toProblemDetail(error);
        this.loadError.set(problem.detail ?? this.transloco.translate('users.genericError'));
      },
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const input = this.form.getRawValue();
    this.submitting.set(true);
    this.formError.set(null);

    this.usersApi.create(input).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.reload();
      },
      error: (error: HttpErrorResponse) => {
        this.submitting.set(false);
        const problem = toProblemDetail(error);
        this.formError.set(problem.detail ?? this.transloco.translate('users.genericError'));
      },
    });
  }
}
