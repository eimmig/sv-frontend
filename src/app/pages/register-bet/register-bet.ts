import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { BetType, BetsApi } from '../../core/bets-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, Team, catalogApi, teamsApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

interface FormOptions {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
  readonly teams: Team[];
}

const EMPTY_OPTIONS: FormOptions = {
  bettingHouses: [],
  sports: [],
  leagues: [],
  markets: [],
  tipsters: [],
  teams: [],
};

// betDateOnly/betTimeOnly nunca compartilham valor (mat-datepicker e mat-timepicker, ver
// docs/DECISIONS-LOG.md 2026-09-16 - o merge de data/hora do proprio Angular Material e
// assimetrico: trocar a data zera a hora pra meia-noite, mas trocar a hora preserva a data) -
// cada um so e tocado pelo seu picker, combinados aqui so no limite do submit.
function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
  return combined;
}

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
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

  protected readonly formatBrl = formatBrl;
  protected readonly betTypes: readonly BetType[] = ['pre', 'live'];
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
    team1Id: [''],
    team2Id: [''],
    description: [''],
    betType: [''],
    playType: [''],
    stake: [0, [Validators.required, Validators.min(0.01)]],
    odd: [1.01, [Validators.required, Validators.min(1.01)]],
    betDateOnly: new FormControl<Date | null>(new Date(), Validators.required),
    betTimeOnly: new FormControl<Date | null>(new Date(), Validators.required),
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
        teams: teamsApi(this.http).list(),
      }),
      this.options,
      this.loadError,
      () => this.transloco.translate('registerBet.genericError'),
    );
  }

  /** Live preview next to stake/odd - purely derived, no new business rule (stake × odd). */
  protected potentialReturn(): number {
    const raw = this.form.getRawValue();
    return raw.stake > 0 && raw.odd > 0 ? raw.stake * raw.odd : 0;
  }

  protected reset(): void {
    this.form.reset({
      bettingHouseId: '',
      sportId: '',
      leagueId: '',
      marketId: '',
      tipsterId: '',
      ticketNumber: '',
      team1Id: '',
      team2Id: '',
      description: '',
      betType: '',
      playType: '',
      stake: 0,
      odd: 1.01,
      betDateOnly: new Date(),
      betTimeOnly: new Date(),
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
          team1Id: raw.team1Id || null,
          team2Id: raw.team2Id || null,
          description: raw.description || null,
          betType: (raw.betType || null) as BetType | null,
          playType: raw.playType || null,
          stake: raw.stake,
          odd: raw.odd,
          betDate: combineDateAndTime(raw.betDateOnly ?? new Date(), raw.betTimeOnly ?? new Date()).toISOString(),
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
