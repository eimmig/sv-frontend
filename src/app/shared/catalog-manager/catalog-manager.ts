import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto, submitForm } from '../../core/api-request';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { Panel } from '../panel/panel';
import { PanelLayout } from '../panel-layout/panel-layout';

/**
 * Reusable list+create screen for a single catalog resource (sports,
 * leagues, markets, tipsters - all structurally identical in bets-service).
 * Instantiated once per catalog route (see app.routes.ts) instead of 4
 * near-identical pages - keeps the SonarCloud duplication finding from
 * feat-003 from reappearing with a 4th near-copy.
 */
@Component({
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslocoPipe, Panel, PanelLayout],
  selector: 'app-catalog-manager',
  styleUrl: './catalog-manager.scss',
  templateUrl: './catalog-manager.html',
})
export class CatalogManager implements OnInit {
  readonly resourcePath = input.required<string>();

  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private api!: ReturnType<typeof catalogApi>;

  protected readonly entries = signal<CatalogEntry[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    this.api = catalogApi(this.http, this.resourcePath());
    this.reload();
  }

  private reload(): void {
    loadInto(this.api.list(), this.entries, this.loadError, () => this.transloco.translate('catalogs.genericError'));
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    submitForm(
      this.api.create(this.form.getRawValue().name),
      this.submitting,
      this.formError,
      () => this.transloco.translate('catalogs.genericError'),
      () => {
        this.form.reset();
        this.reload();
      },
    );
  }
}
