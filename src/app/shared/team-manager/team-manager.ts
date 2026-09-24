import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { CatalogEntry, Team, catalogApi, teamsApi } from '../../core/catalog-api';
import { Panel } from '../panel/panel';
import { PanelLayout } from '../panel-layout/panel-layout';
import { SearchableSelect } from '../searchable-select/searchable-select';

interface FormOptions {
  readonly sports: CatalogEntry[];
  readonly teams: Team[];
}

const EMPTY_OPTIONS: FormOptions = { sports: [], teams: [] };

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
    SearchableSelect,
  ],
  selector: 'app-team-manager',
  styleUrl: './team-manager.scss',
  templateUrl: './team-manager.html',
})
export class TeamManager implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  private readonly teams = teamsApi(this.http);

  protected readonly options = signal<FormOptions>(EMPTY_OPTIONS);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    sportId: ['', Validators.required],
  });

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    loadInto(
      forkJoin({ sports: catalogApi(this.http, 'sports').list(), teams: this.teams.list() }),
      this.options,
      this.loadError,
      () => this.transloco.translate('catalogs.genericError'),
    );
  }

  protected sportName(sportId: string): string {
    return this.options().sports.find((sport) => sport.id === sportId)?.name ?? '';
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const raw = this.form.getRawValue();
    submitForm(
      this.teams.create(raw.name, raw.sportId),
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
