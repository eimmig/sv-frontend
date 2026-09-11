import { BetMetrics, DailyBetMetrics } from '../../core/statistics-api';
import { buildDailyTable, computeSummary } from './period-report-metrics';

function metrics(overrides: Partial<BetMetrics> = {}): BetMetrics {
  return {
    totalStaked: 0,
    netProfit: 0,
    roi: 0,
    winRate: 0,
    settledCount: 0,
    wonCount: 0,
    lostCount: 0,
    voidCount: 0,
    preCount: 0,
    liveCount: 0,
    avgOdd: null,
    ...overrides,
  };
}

describe('computeSummary', () => {
  // docs/STATISTICS.md "Métricas da página Relatório do período" - values confirmed by the user
  // against their own reference spreadsheet printout, an oracle independent of this
  // implementation (not re-deriving the expected value from the same formula under test).
  it('matches the reference spreadsheet: roiBankroll = 264.20 / 1195.05 = 22.11%', () => {
    const summary = computeSummary(metrics({ netProfit: 264.2 }), [], 1195.05, 5000, 0.01);

    expect(summary.roiBankroll).toBeCloseTo(0.2211, 4);
  });

  it('matches the reference spreadsheet: taxaAcertoEntradas = 74/(74+126) = 37.00%, +EV = 37.00% - (1/3.22) ≈ 5.94%', () => {
    // NOTE: docs/STATISTICS.md states "= 5,98%" for this example, but 37.00% - (1/3.22) computes
    // to 5.9441...%, not 5.98% - independently re-verified here; the doc's stated result has an
    // arithmetic typo (to be corrected in feat-015.4), the formula itself (confirmed by the user)
    // is what this test proves.
    const summary = computeSummary(metrics({ wonCount: 74, lostCount: 126, avgOdd: 3.22 }), [], 1, 1, 0.01);

    expect(summary.evPercent).toBeCloseTo(0.0594, 4);
  });

  it('returns null for every ratio when its denominator is zero, instead of throwing or dividing by zero', () => {
    const summary = computeSummary(metrics(), [], 0, 0, 0);

    expect(summary.roiBankroll).toBeNull();
    expect(summary.roiMedioDiario).toBeNull();
    expect(summary.profitUnidades).toBeNull();
    expect(summary.stakeMedio).toBeNull();
    expect(summary.evPercent).toBeNull();
  });

  it('computes roiMedioDiario as the simple (unweighted) average of each day with a settled bet, ignoring volume', () => {
    const daily: DailyBetMetrics[] = [
      { date: '2026-01-01', totalStaked: 1000, netProfit: 100, roi: 0.1, betCount: 10 },
      { date: '2026-01-02', totalStaked: 10, netProfit: -3, roi: -0.3, betCount: 1 },
    ];

    const summary = computeSummary(metrics(), daily, 1, 1, 0.01);

    // (0.1 + -0.3) / 2 = -0.1, NOT weighted toward the higher-volume day.
    expect(summary.roiMedioDiario).toBeCloseTo(-0.1, 6);
  });

  it('counts diasVerdes/diasVermelhos only from days with a settled bet, ignoring netProfit = 0', () => {
    const daily: DailyBetMetrics[] = [
      { date: '2026-01-01', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 1 },
      { date: '2026-01-02', totalStaked: 100, netProfit: -50, roi: -0.5, betCount: 1 },
      { date: '2026-01-03', totalStaked: 100, netProfit: 0, roi: 0, betCount: 1 },
    ];

    const summary = computeSummary(metrics(), daily, 1, 1, 0.01);

    expect(summary.diasVerdes).toBe(1);
    expect(summary.diasVermelhos).toBe(1);
  });

  it('profitReais/unitPercentTotal pass through overall.netProfit/the given unitPercent unchanged', () => {
    const summary = computeSummary(metrics({ netProfit: 234.5 }), [], 1, 1, 0.02);

    expect(summary.profitReais).toBe(234.5);
    expect(summary.unitPercentTotal).toBe(0.02);
  });
});

describe('buildDailyTable', () => {
  it('fills days missing from the sparse API response with zero, one row per calendar day in [from, to]', () => {
    const daily: DailyBetMetrics[] = [
      { date: '2026-01-01', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 2 },
      { date: '2026-01-03', totalStaked: 200, netProfit: -20, roi: -0.1, betCount: 1 },
    ];

    const rows = buildDailyTable(daily, '2026-01-01', '2026-01-03', 5000, 0.01);

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.date)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    expect(rows[1]).toEqual({ date: '2026-01-02', roiPercent: 0, roiUnidades: 0, roiReais: 0, apostas: 0 });
    expect(rows[0].roiReais).toBe(50);
    expect(rows[2].roiReais).toBe(-20);
  });

  it('computes roiUnidades as netProfit(dia) / (saldoFinal x unitPercent)', () => {
    const daily: DailyBetMetrics[] = [{ date: '2026-01-01', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 2 }];

    const rows = buildDailyTable(daily, '2026-01-01', '2026-01-01', 5000, 0.01);

    // 50 / (5000 * 0.01) = 50 / 50 = 1
    expect(rows[0].roiUnidades).toBe(1);
  });

  it('returns null roiUnidades (not a divide-by-zero) when saldoFinal x unitPercent is 0', () => {
    const daily: DailyBetMetrics[] = [{ date: '2026-01-01', totalStaked: 100, netProfit: 50, roi: 0.5, betCount: 2 }];

    const rows = buildDailyTable(daily, '2026-01-01', '2026-01-01', 0, 0.01);

    expect(rows[0].roiUnidades).toBeNull();
  });

  it('returns a single row when from equals to', () => {
    const rows = buildDailyTable([], '2026-01-15', '2026-01-15', 5000, 0.01);

    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe('2026-01-15');
  });
});
