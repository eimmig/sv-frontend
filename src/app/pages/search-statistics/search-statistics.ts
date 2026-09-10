import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { catchError, forkJoin, map, of, switchMap, tap } from 'rxjs';

import { loadInto } from '../../core/api-request';
import { BettingHouse, BettingHousesApi } from '../../core/betting-houses-api';
import { CatalogEntry, catalogApi } from '../../core/catalog-api';
import { formatBrl } from '../../core/currency';
import { Language } from '../../core/language';
import { formatOdd } from '../../core/number-format';
import { formatPercent } from '../../core/percent';
import { toProblemDetail } from '../../core/problem-detail';
import { StatisticsSearchApi, StatisticsSearchResult, StatisticsTeam } from '../../core/statistics-search-api';
import { EquityCurveChart } from '../../shared/equity-curve-chart/equity-curve-chart';
import { KpiCard, KpiCardSign } from '../../shared/kpi-card/kpi-card';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

interface Options {
  readonly bettingHouses: BettingHouse[];
  readonly sports: CatalogEntry[];
  readonly leagues: CatalogEntry[];
  readonly markets: CatalogEntry[];
  readonly tipsters: CatalogEntry[];
}

const EMPTY_OPTIONS: Options = { bettingHouses: [], sports: [], leagues: [], markets: [], tipsters: [] };

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    EquityCurveChart,
    KpiCard,
    Panel,
    PanelLayout,
    TranslocoPipe,
  ],
  selector: 'app-search-statistics',
  styleUrl: './search-statistics.scss',
  templateUrl: './search-statistics.html',
})
export class SearchStatistics implements OnInit {
  private readonly statisticsSearchApi = inject(StatisticsSearchApi);
  private readonly bettingHousesApi = inject(BettingHousesApi);
  private readonly http = inject(HttpClient);
  private readonly formBuilder = inject(FormBuilder);
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  protected readonly formatBrl = formatBrl;

  protected readonly options = signal<Options>(EMPTY_OPTIONS);
  protected readonly optionsError = signal<string | null>(null);

  protected readonly teamOptions = signal<StatisticsTeam[]>([]);
  protected readonly teamsError = signal<string | null>(null);

  protected readonly hasSearched = signal(false);
  protected readonly result = signal<StatisticsSearchResult | null>(null);
  protected readonly resultError = signal<string | null>(null);

  protected readonly filterForm = this.formBuilder.nonNullable.group({
    sportId: ['', Validators.required],
    leagueId: ['', Validators.required],
    teamId: [{ value: '', disabled: true }],
    bettingHouseId: [''],
    marketId: [''],
    tipsterId: [''],
    from: [''],
    to: [''],
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
      () => this.transloco.translate('searchStatistics.genericError'),
    );

    // Team autocomplete is scoped by sport (docs/API-CONTRACTS.md) - switchMap
    // cancels a slow in-flight listTeams() for a sport the user already
    // navigated away from, so it can never overwrite the current selection.
    this.filterForm.controls.sportId.valueChanges
      .pipe(
        tap((sportId) => {
          this.filterForm.controls.teamId.setValue('');
          this.teamsError.set(null);
          // Disabling via the control (not a template [disabled] binding) avoids the
          // "disabled attribute with reactive form directive" conflict Angular warns about.
          if (sportId) {
            this.filterForm.controls.teamId.enable();
          } else {
            this.filterForm.controls.teamId.disable();
          }
        }),
        switchMap((sportId) => {
          if (!sportId) {
            return of<StatisticsTeam[]>([]);
          }
          return this.statisticsSearchApi.listTeams(sportId).pipe(
            catchError((httpError: HttpErrorResponse) => {
              const problem = toProblemDetail(httpError);
              this.teamsError.set(problem.detail ?? this.transloco.translate('searchStatistics.genericError'));
              return of<StatisticsTeam[]>([]);
            }),
          );
        }),
      )
      .subscribe((teams) => this.teamOptions.set(teams));
  }

  protected formatPercent(value: number): string {
    return formatPercent(value, this.language.current());
  }

  protected formatOdd(value: number): string {
    return formatOdd(value, this.language.current());
  }

  /** Money/ROI values are colored consistently with the dashboard's kpi-card usage. */
  protected sign(value: number): KpiCardSign {
    if (value > 0) {
      return 'positive';
    }
    if (value < 0) {
      return 'negative';
    }
    return 'neutral';
  }

  protected search(): void {
    if (this.filterForm.invalid) {
      return;
    }
    this.hasSearched.set(true);
    const raw = this.filterForm.getRawValue();
    loadInto(
      this.statisticsSearchApi.search({
        sportId: raw.sportId,
        leagueId: raw.leagueId,
        teamId: raw.teamId || undefined,
        bettingHouseId: raw.bettingHouseId || undefined,
        marketId: raw.marketId || undefined,
        tipsterId: raw.tipsterId || undefined,
        from: raw.from || undefined,
        to: raw.to || undefined,
      }),
      this.result,
      this.resultError,
      () => this.transloco.translate('searchStatistics.genericError'),
    );
  }
}
