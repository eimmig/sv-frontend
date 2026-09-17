import { Component, ViewChild, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroupDirective,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { submitForm } from '../../core/api-request';
import { Auth } from '../../core/auth';
import { ChangePasswordApi } from '../../core/change-password-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return newPassword && confirmPassword && newPassword !== confirmPassword ? { passwordMismatch: true } : null;
}

@Component({
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslocoPipe, Panel, PanelLayout],
  selector: 'app-change-password',
  styleUrl: './change-password.scss',
  templateUrl: './change-password.html',
})
export class ChangePassword {
  private readonly auth = inject(Auth);
  private readonly changePasswordApi = inject(ChangePasswordApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  // FormGroup.reset() alone does not clear FormGroupDirective's own `submitted` flag, which
  // Material's default ErrorStateMatcher also checks - without resetting through the directive,
  // the 3 password fields would show red/invalid immediately after a successful, cleared submit.
  @ViewChild(FormGroupDirective) private formDirective!: FormGroupDirective;

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly success = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.success.set(false);
    submitForm(
      this.changePasswordApi.change(currentPassword, newPassword),
      this.submitting,
      this.formError,
      () => this.transloco.translate('changePassword.genericError'),
      () => {
        this.auth.clearMustChangePassword();
        this.formDirective.resetForm();
        this.success.set(true);
      },
    );
  }
}
