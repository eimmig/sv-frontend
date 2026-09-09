import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { formatBrl } from '../../core/currency';
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
  selector: 'app-betting-houses',
  styleUrl: './betting-houses.scss',
  templateUrl: './betting-houses.html',
})
export class BettingHouses {
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  protected readonly formatBrl = formatBrl;
  protected readonly bettingHouses = signal<BettingHouse[]>([]);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    initialBalance: [0, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.reload();
  }

  private reload(): void {
    loadInto(
      this.bettingHousesApi.list().pipe(map((page) => page.content)),
      this.bettingHouses,
      this.loadError,
      () => this.transloco.translate('bettingHouses.genericError'),
    );
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    submitForm(
      this.bettingHousesApi.create(this.form.getRawValue()),
      this.submitting,
      this.formError,
      () => this.transloco.translate('bettingHouses.genericError'),
      () => {
        this.form.reset({ name: '', initialBalance: 0 });
        this.reload();
      },
    );
  }
}
