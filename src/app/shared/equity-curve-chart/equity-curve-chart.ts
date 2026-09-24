import { Component, computed, inject, input } from '@angular/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { EChartsCoreOption } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TranslocoPipe } from '@jsverse/transloco';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';

import { buildLineChartOption, readCssColor } from '../../core/chart-theme';
import { formatDay, spansMoreThanOneYear } from '../../core/date-format';
import { Language } from '../../core/language';
import { StatisticsTimelinePoint } from '../../core/statistics-search-api';
import { Theme } from '../../core/theme';
import { ChartFrame } from '../chart-frame/chart-frame';

// Same tree-shaken registration as shared/monthly-profit-chart - this
// component is lazy-loaded only by the search-statistics page.
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

function buildChartOption(
  timeline: StatisticsTimelinePoint[],
  locale: string,
  brandColor: string,
  borderColor: string,
  labelColor: string,
): EChartsCoreOption {
  const last = timeline.at(-1);
  const withYear = timeline.length > 1 && last !== undefined && spansMoreThanOneYear(timeline[0].date, last.date);
  const labels = timeline.map((point) => formatDay(point.date, locale, withYear));
  const cumulativeProfit = timeline.map((point) => point.cumulativeProfit);
  return buildLineChartOption(labels, cumulativeProfit, brandColor, borderColor, labelColor);
}

/** Equity curve (cumulative profit) - one series over StatisticsSearchResult.timeline. */
@Component({
  imports: [ChartFrame, NgxEchartsDirective, TranslocoPipe],
  providers: [provideEchartsCore({ echarts })],
  selector: 'app-equity-curve-chart',
  templateUrl: './equity-curve-chart.html',
  styleUrl: './equity-curve-chart.scss',
})
export class EquityCurveChart {
  private readonly theme = inject(Theme);
  private readonly language = inject(Language);

  readonly data = input<StatisticsTimelinePoint[]>([]);

  protected readonly chartOptions = computed<EChartsCoreOption>(() => {
    this.theme.current();
    return buildChartOption(
      this.data(),
      this.language.current(),
      readCssColor('--color-brand'),
      readCssColor('--color-border'),
      readCssColor('--color-text-secondary'),
    );
  });
}
