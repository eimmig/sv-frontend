import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto, submitForm } from '../../core/api-request';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { ListPager } from '../list-pager/list-pager';
import { clampPage, pageCount, pageSlice } from '../list-pager/paginate';
import { Panel } from '../panel/panel';
import { PanelLayout } from '../panel-layout/panel-layout';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
    ListPager,
  ],
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
  private readonly requestedPage = signal(0);
  protected readonly page = computed(() => clampPage(this.requestedPage(), this.entries().length));
  protected readonly totalPages = computed(() => pageCount(this.entries().length));
  protected readonly visibleEntries = computed(() => pageSlice(this.entries(), this.page()));
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

  protected goToPage(page: number): void {
    this.requestedPage.set(page);
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
