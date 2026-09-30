import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { Bet, BetStatus, BetType, BetsApi } from '../../core/bets-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, Team, catalogApi, teamsApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { DateMaskDirective } from '../../core/date-mask.directive';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';
import { SearchableSelect } from '../../shared/searchable-select/searchable-select';

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

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
  return combined;
}

const SETTLED_STATUSES: readonly BetStatus[] = ['won', 'lost', 'void'];

@Component({
  imports: [
    ReactiveFormsModule,
    DateMaskDirective,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTimepickerModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
    SearchableSelect,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly formatBrl = formatBrl;
  protected readonly betTypes: readonly BetType[] = ['pre', 'live'];
  protected readonly betStatuses: readonly BetStatus[] = SETTLED_STATUSES;
  protected readonly options = signal<FormOptions>(EMPTY_OPTIONS);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly editingBetId = signal<string | null>(null);
  protected readonly loadedBetStatus = signal<BetStatus | null>(null);
  protected readonly showStatusField = computed(() => {
    const status = this.loadedBetStatus();
    return status !== null && SETTLED_STATUSES.includes(status);
  });

  private idempotencyKey = crypto.randomUUID();

  protected readonly form = this.formBuilder.nonNullable.group({
    bettingHouseId: ['', Validators.required],
    sportId: ['', Validators.required],
    leagueId: ['', Validators.required],
    marketId: ['', Validators.required],
    tipsterId: [''],
    ticketNumber: [''],
    team1Id: [{ value: '', disabled: true }],
    team2Id: [{ value: '', disabled: true }],
    description: [''],
    betType: ['pre' as BetType, Validators.required],
    playType: [''],
    stake: [0, [Validators.required, Validators.min(0.01)]],
    odd: [1.01, [Validators.required, Validators.min(1.01)]],
    betDateOnly: new FormControl<Date | null>(new Date(), Validators.required),
    betTimeOnly: new FormControl<Date | null>(new Date(), Validators.required),
    status: ['pending' as BetStatus, Validators.required],
  });

  private readonly sportId = toSignal(this.form.controls.sportId.valueChanges, { initialValue: '' });
  protected readonly teamOptions = computed(() => {
    const sportId = this.sportId();
    return sportId ? this.options().teams.filter((team) => team.sportId === sportId) : [];
  });

  ngOnInit(): void {
    this.reload();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingBetId.set(id);
      this.loadBetForEdit(id);
    }

    this.form.controls.sportId.valueChanges.subscribe((sportId) => {
      this.form.controls.team1Id.setValue('');
      this.form.controls.team2Id.setValue('');
      if (sportId) {
        this.form.controls.team1Id.enable();
        this.form.controls.team2Id.enable();
      } else {
        this.form.controls.team1Id.disable();
        this.form.controls.team2Id.disable();
      }
    });
  }

  private loadBetForEdit(id: string): void {
    this.betsApi.get(id).subscribe({
      next: (bet: Bet) => {
        this.loadedBetStatus.set(bet.status);
        const betDate = new Date(bet.betDate);
        this.form.patchValue({
          bettingHouseId: bet.bettingHouseId,
          sportId: bet.sportId,
          leagueId: bet.leagueId,
          marketId: bet.marketId,
          tipsterId: bet.tipsterId ?? '',
          ticketNumber: bet.ticketNumber ?? '',
          team1Id: bet.team1Id ?? '',
          team2Id: bet.team2Id ?? '',
          description: bet.description ?? '',
          betType: bet.betType ?? 'pre',
          playType: bet.playType ?? '',
          stake: bet.stake,
          odd: bet.odd,
          betDateOnly: betDate,
          betTimeOnly: betDate,
          status: bet.status,
        });
      },
      error: () => this.loadError.set(this.transloco.translate('registerBet.genericError')),
    });
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
      betType: 'pre' as BetType,
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
    const fields = {
      bettingHouseId: raw.bettingHouseId,
      sportId: raw.sportId,
      leagueId: raw.leagueId,
      marketId: raw.marketId,
      tipsterId: raw.tipsterId || null,
      ticketNumber: raw.ticketNumber || null,
      team1Id: raw.team1Id || null,
      team2Id: raw.team2Id || null,
      description: raw.description || null,
      betType: raw.betType,
      playType: raw.playType || null,
      stake: raw.stake,
      odd: raw.odd,
      betDate: combineDateAndTime(raw.betDateOnly ?? new Date(), raw.betTimeOnly ?? new Date()).toISOString(),
    };

    const editingId = this.editingBetId();
    if (editingId) {
      submitForm(
        this.betsApi.update(editingId, { ...fields, status: raw.status }),
        this.submitting,
        this.formError,
        () => this.transloco.translate('registerBet.genericError'),
        () => void this.router.navigateByUrl('/history'),
      );
      return;
    }

    submitForm(
      this.betsApi.create(fields, this.idempotencyKey),
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
