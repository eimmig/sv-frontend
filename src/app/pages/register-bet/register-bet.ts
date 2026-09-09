import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { BetsApi } from '../../core/bets-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

interface FormOptions {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: FormOptions = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

function nowForDatetimeLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
  ],
  selector: 'app-register-bet',
  styleUrl: './register-bet.scss',
  templateUrl: './register-bet.html',
})
export class RegisterBet implements OnInit {
  private readonly betsApi = inject(BetsApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);

  protected readonly options = signal<FormOptions>(EMPTY_OPTIONS);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  private idempotencyKey = crypto.randomUUID();

  protected readonly form = this.formBuilder.nonNullable.group({
    bettingHouseId: ['', Validators.required],
    sportId: ['', Validators.required],
    leagueId: ['', Validators.required],
    marketId: ['', Validators.required],
    tipsterId: [''],
    ticketNumber: [''],
    team1: [''],
    team2: [''],
    description: [''],
    betType: [''],
    playType: [''],
    stake: [0, [Validators.required, Validators.min(0.01)]],
    odd: [1.01, [Validators.required, Validators.min(1.01)]],
    betDate: [nowForDatetimeLocal(), Validators.required],
  });

  ngOnInit(): void {
    this.reload();
  }

  private reload(): void {
    loadInto(
      forkJoin({
        bettingHouses: this.bettingHousesApi.list().pipe(map((page) => page.content)),
        sports: catalogApi(this.http, 'sports').list(),
        leagues: catalogApi(this.http, 'leagues').list(),
        markets: catalogApi(this.http, 'markets').list(),
        tipsters: catalogApi(this.http, 'tipsters').list(),
      }),
      this.options,
      this.loadError,
      () => this.transloco.translate('registerBet.genericError'),
    );
  }

  protected reset(): void {
    this.form.reset({
      bettingHouseId: '',
      sportId: '',
      leagueId: '',
      marketId: '',
      tipsterId: '',
      ticketNumber: '',
      team1: '',
      team2: '',
      description: '',
      betType: '',
      playType: '',
      stake: 0,
      odd: 1.01,
      betDate: nowForDatetimeLocal(),
    });
    this.idempotencyKey = crypto.randomUUID();
    this.formError.set(null);
    this.successMessage.set(null);
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }
    const raw = this.form.getRawValue();
    this.successMessage.set(null);
    submitForm(
      this.betsApi.create(
        {
          bettingHouseId: raw.bettingHouseId,
          sportId: raw.sportId,
          leagueId: raw.leagueId,
          marketId: raw.marketId,
          tipsterId: raw.tipsterId || null,
          ticketNumber: raw.ticketNumber || null,
          team1: raw.team1 || null,
          team2: raw.team2 || null,
          description: raw.description || null,
          betType: raw.betType || null,
          playType: raw.playType || null,
          stake: raw.stake,
          odd: raw.odd,
          betDate: new Date(raw.betDate).toISOString(),
        },
        this.idempotencyKey,
      ),
      this.submitting,
      this.formError,
      () => this.transloco.translate('registerBet.genericError'),
      () => {
        this.reset();
        this.successMessage.set(this.transloco.translate('registerBet.success'));
      },
    );
  }
}
