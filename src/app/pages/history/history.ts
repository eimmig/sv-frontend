import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, map } from 'rxjs';

import { loadInto, submitForm } from '../../core/api-request';
import { Bet, BetsApi } from '../../core/bets-api';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { formatDateTime } from '../../core/date-format';
import { Language } from '../../core/language';
import { PagedResponse } from '../../core/paged-response';
import { toProblemDetail } from '../../core/problem-detail';
import { Transaction, TransactionsApi, TransactionType } from '../../core/transactions-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

type SettledBetStatus = 'won' | 'lost' | 'void';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

function emptyPage<T>(): PagedResponse<T> {
  return { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };
}

const BET_STATUS_BADGE: Record<Bet['status'], 'positive' | 'negative' | 'neutral'> = {
  pending: 'neutral',
  won: 'positive',
  lost: 'negative',
  void: 'neutral',
};

const TRANSACTION_TYPE_BADGE: Record<TransactionType, 'positive' | 'neutral'> = {
  deposit: 'positive',
  withdrawal: 'neutral',
};

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    TranslocoPipe,
    Panel,
    PanelLayout,
  ],
  selector: 'app-history',
  styleUrl: './history.scss',
  templateUrl: './history.html',
})
export class History implements OnInit {
  private readonly betsApi = inject(BetsApi);
  private readonly transactionsApi = inject(TransactionsApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;
  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  protected readonly betsPage = signal<PagedResponse<Bet>>(emptyPage());
  protected readonly betsError = signal<string | null>(null);
  protected readonly settlingBetId = signal<string | null>(null);
  protected readonly settleError = signal<string | null>(null);
  protected readonly betFilterForm = this.formBuilder.nonNullable.group({
    bettingHouseId: [''],
    sportId: [''],
    leagueId: [''],
    marketId: [''],
    tipsterId: [''],
    from: [''],
    to: [''],
  });

  protected readonly transactionsPage = signal<PagedResponse<Transaction>>(emptyPage());
  protected readonly transactionsError = signal<string | null>(null);
  protected readonly transactionFilterForm = this.formBuilder.nonNullable.group({
    bettingHouseId: [''],
    from: [''],
    to: [''],
  });

  protected readonly creatingTransaction = signal(false);
  protected readonly createTransactionError = signal<string | null>(null);
  protected readonly createTransactionSuccess = signal<string | null>(null);
  protected readonly createTransactionForm = this.formBuilder.nonNullable.group({
    bettingHouseId: ['', Validators.required],
    type: ['' as '' | TransactionType, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
  });

  ngOnInit(): void {
    loadInto(
      forkJoin({
        bettingHouses: this.bettingHousesApi.list().pipe(map((page) => page.content)),
        sports: catalogApi(this.http, 'sports').list(),
        leagues: catalogApi(this.http, 'leagues').list(),
        markets: catalogApi(this.http, 'markets').list(),
        tipsters: catalogApi(this.http, 'tipsters').list(),
      }),
      this.options,
      this.optionsError,
      () => this.transloco.translate('history.genericError'),
    );
    this.applyBetFilter();
    this.applyTransactionFilter();
  }

  protected nameOf(list: { id: string; name: string }[], id: string | null): string {
    if (!id) {
      return '';
    }
    return list.find((entry) => entry.id === id)?.name ?? id;
  }

  protected formatDateTime(value: string): string {
    return formatDateTime(value, this.language.current());
  }

  /** Tonal badge (docs/DESIGN-SYSTEM.md item 16, "Badge de resultado de aposta"). */
  protected betStatusBadge(status: Bet['status']): string {
    return `badge--${BET_STATUS_BADGE[status]}`;
  }

  protected transactionTypeBadge(type: TransactionType): string {
    return `badge--${TRANSACTION_TYPE_BADGE[type]}`;
  }

  protected applyBetFilter(): void {
    this.loadBets(0);
  }

  protected betsNextPage(): void {
    this.loadBets(this.betsPage().page + 1);
  }

  protected betsPrevPage(): void {
    this.loadBets(this.betsPage().page - 1);
  }

  private loadBets(page: number): void {
    const raw = this.betFilterForm.getRawValue();
    loadInto(
      this.betsApi.list(
        {
          bettingHouseId: raw.bettingHouseId || undefined,
          sportId: raw.sportId || undefined,
          leagueId: raw.leagueId || undefined,
          marketId: raw.marketId || undefined,
          tipsterId: raw.tipsterId || undefined,
          from: raw.from || undefined,
          to: raw.to || undefined,
        },
        page,
      ),
      this.betsPage,
      this.betsError,
      () => this.transloco.translate('history.genericError'),
    );
  }

  protected markStatus(bet: Bet, status: SettledBetStatus): void {
    this.settlingBetId.set(bet.id);
    this.settleError.set(null);
    this.betsApi.updateStatus(bet.id, status).subscribe({
      next: (updated) => {
        this.settlingBetId.set(null);
        const page = this.betsPage();
        this.betsPage.set({
          ...page,
          content: page.content.map((current) => (current.id === updated.id ? updated : current)),
        });
      },
      error: (httpError: HttpErrorResponse) => {
        this.settlingBetId.set(null);
        const problem = toProblemDetail(httpError);
        this.settleError.set(problem.detail ?? this.transloco.translate('history.genericError'));
      },
    });
  }

  protected applyTransactionFilter(): void {
    this.loadTransactions(0);
  }

  protected transactionsNextPage(): void {
    this.loadTransactions(this.transactionsPage().page + 1);
  }

  protected transactionsPrevPage(): void {
    this.loadTransactions(this.transactionsPage().page - 1);
  }

  private loadTransactions(page: number): void {
    const raw = this.transactionFilterForm.getRawValue();
    loadInto(
      this.transactionsApi.list(
        {
          bettingHouseId: raw.bettingHouseId || undefined,
          from: raw.from || undefined,
          to: raw.to || undefined,
        },
        page,
      ),
      this.transactionsPage,
      this.transactionsError,
      () => this.transloco.translate('history.genericError'),
    );
  }

  protected createTransaction(): void {
    if (this.createTransactionForm.invalid || this.creatingTransaction()) {
      return;
    }
    const raw = this.createTransactionForm.getRawValue();
    this.createTransactionSuccess.set(null);
    submitForm(
      this.transactionsApi.create({
        bettingHouseId: raw.bettingHouseId,
        type: raw.type as TransactionType,
        amount: raw.amount,
      }),
      this.creatingTransaction,
      this.createTransactionError,
      () => this.transloco.translate('history.genericError'),
      () => {
        this.createTransactionForm.reset({ bettingHouseId: '', type: '', amount: 0 });
        this.createTransactionSuccess.set(this.transloco.translate('history.transactionSuccess'));
        this.loadTransactions(this.transactionsPage().page);
      },
    );
  }
}
