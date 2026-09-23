import { Component, computed, inject, input } from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { formatBrl, formatBrlDelta } from '../../../core/currency';
import { Language } from '../../../core/language';
import { formatPercent, formatPercentDelta } from '../../../core/percent';
import { SegmentedBetMetrics } from '../../../core/statistics-api';
import { KpiCardSign, kpiSign } from '../../../shared/kpi-card/kpi-card';
import { computeDelta } from '../period-comparison-metrics';

export interface SegmentComparisonRow {
  readonly dimensionId: string;
  readonly dimensionName: string;
  readonly roiA: string;
  readonly roiB: string;
  readonly roiDelta: string;
  readonly roiSign: KpiCardSign;
  readonly netProfitA: string;
  readonly netProfitB: string;
  readonly netProfitDelta: string;
  readonly netProfitSign: KpiCardSign;
}

interface ComparedField {
  readonly a: string;
  readonly b: string;
  readonly delta: string;
  readonly sign: KpiCardSign;
}

/** Collapses the 2 near-identical roi/netProfit blocks that used to live inline in `rows` (each
 *  with its own "both sides present?" ternary chain) into 1 reusable helper - cuts the cognitive
 *  complexity SonarCloud flagged (typescript:S3776, 23 > 15 allowed) by moving the branching out
 *  of the loop body into a small, separately-testable function. */
function compareMetric(
  valueA: number | undefined,
  valueB: number | undefined,
  dash: string,
  format: (value: number) => string,
  formatDelta: (value: number) => string,
): ComparedField {
  const delta = valueA !== undefined && valueB !== undefined ? computeDelta(valueA, valueB) : null;
  return {
    a: valueA === undefined ? dash : format(valueA),
    b: valueB === undefined ? dash : format(valueB),
    delta: delta === null ? dash : formatDelta(delta.absolute),
    sign: delta === null ? 'neutral' : kpiSign(delta.absolute),
  };
}

/**
 * ROI/netProfit comparados por item de um segmento (esporte/liga/mercado/tipster/casa de
 * apostas/tipo de aposta) entre os 2 períodos - componente NOVO e dedicado, não uma adaptação de
 * shared/catalog-dashboard (aquele componente busca seu próprio período e 1 dataset só, é usado
 * por 5 rotas hoje - adaptar pra 2 datasets injetados arriscaria regressão desproporcional ali).
 * União dos dimensionId presentes em A OU B (não
 * interseção) - um item pode só ter tido aposta liquidada em um dos 2 períodos; o lado ausente
 * mostra "—" (indeterminado), não 0 (0 significaria "teve aposta, lucro zero", diferente de "não
 * teve aposta neste período").
 */
@Component({
  imports: [TranslocoPipe],
  selector: 'app-segment-comparison-table',
  templateUrl: './segment-comparison-table.html',
  styleUrl: './segment-comparison-table.scss',
})
export class SegmentComparisonTable {
  private readonly transloco = inject(TranslocoService);
  protected readonly language = inject(Language);

  readonly title = input.required<string>();
  readonly nameLabel = input.required<string>();
  readonly testId = input.required<string>();
  readonly segmentA = input<SegmentedBetMetrics[]>([]);
  readonly segmentB = input<SegmentedBetMetrics[]>([]);

  protected readonly rows = computed<SegmentComparisonRow[]>(() => {
    const locale = this.language.current();
    const dash = this.transloco.translate('periodComparison.indeterminate');
    const byIdA = new Map(this.segmentA().map((segment) => [segment.dimensionId, segment]));
    const byIdB = new Map(this.segmentB().map((segment) => [segment.dimensionId, segment]));
    const ids = new Set([...byIdA.keys(), ...byIdB.keys()]);

    const rows: SegmentComparisonRow[] = [];
    for (const id of ids) {
      const entryA = byIdA.get(id);
      const entryB = byIdB.get(id);
      const roi = compareMetric(entryA?.metrics.roi, entryB?.metrics.roi, dash, (value) => formatPercent(value, locale), (value) =>
        formatPercentDelta(value, locale),
      );
      const netProfit = compareMetric(entryA?.metrics.netProfit, entryB?.metrics.netProfit, dash, formatBrl, formatBrlDelta);
      rows.push({
        dimensionId: id,
        dimensionName: (entryA ?? entryB)!.dimensionName,
        roiA: roi.a,
        roiB: roi.b,
        roiDelta: roi.delta,
        roiSign: roi.sign,
        netProfitA: netProfit.a,
        netProfitB: netProfit.b,
        netProfitDelta: netProfit.delta,
        netProfitSign: netProfit.sign,
      });
    }
    return rows.sort((a, b) => a.dimensionName.localeCompare(b.dimensionName));
  });
}
