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

/**
 * ROI/netProfit comparados por item de um segmento (esporte/liga/mercado/tipster/casa de
 * apostas/tipo de aposta) entre os 2 períodos - componente NOVO e dedicado, não uma adaptação de
 * shared/catalog-dashboard (achado MAJOR do plan review de feat-037: aquele componente busca seu
 * próprio período e 1 dataset só, é usado por 5 rotas hoje - adaptar pra 2 datasets injetados
 * arriscaria regressão desproporcional ali). União dos dimensionId presentes em A OU B (não
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
      const roiDelta = entryA && entryB ? computeDelta(entryA.metrics.roi, entryB.metrics.roi) : null;
      const netProfitDelta = entryA && entryB ? computeDelta(entryA.metrics.netProfit, entryB.metrics.netProfit) : null;
      rows.push({
        dimensionId: id,
        dimensionName: (entryA ?? entryB)!.dimensionName,
        roiA: entryA ? formatPercent(entryA.metrics.roi, locale) : dash,
        roiB: entryB ? formatPercent(entryB.metrics.roi, locale) : dash,
        roiDelta: roiDelta ? formatPercentDelta(roiDelta.absolute, locale) : dash,
        roiSign: roiDelta ? kpiSign(roiDelta.absolute) : 'neutral',
        netProfitA: entryA ? formatBrl(entryA.metrics.netProfit) : dash,
        netProfitB: entryB ? formatBrl(entryB.metrics.netProfit) : dash,
        netProfitDelta: netProfitDelta ? formatBrlDelta(netProfitDelta.absolute) : dash,
        netProfitSign: netProfitDelta ? kpiSign(netProfitDelta.absolute) : 'neutral',
      });
    }
    return rows.sort((a, b) => a.dimensionName.localeCompare(b.dimensionName));
  });
}
