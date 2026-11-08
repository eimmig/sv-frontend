import { BetMetrics, EMPTY_BET_METRICS } from '../../core/statistics-api';
import { formatInterval, roiWithinChance, winRateWithinChance, withinChance } from './chance';

function metrics(overrides: Partial<BetMetrics>): BetMetrics {
  return { ...EMPTY_BET_METRICS, ...overrides };
}

describe('chance', () => {
  // exemplo numerico do TCC: TA 60% [23,07%; 88,24%], implicita 52,97%, ROI 13% [-76,84%; 102,84%]
  const worked = metrics({
    winRate: 0.6,
    winRateLower: 0.2307,
    winRateUpper: 0.8824,
    impliedProbability: 0.5297,
    roi: 0.13,
    roiLower: -0.7684,
    roiUpper: 1.0284,
  });

  it('flags the worked example of the thesis as indistinguishable from chance on both indicators', () => {
    expect(winRateWithinChance(worked)).toBe(true);
    expect(roiWithinChance(worked)).toBe(true);
    expect(withinChance(worked)).toBe(true);
  });

  it('does not flag a win rate whose interval stays above the implied probability', () => {
    const m = metrics({ winRateLower: 0.56, winRateUpper: 0.6, impliedProbability: 0.5 });
    expect(winRateWithinChance(m)).toBe(false);
  });

  it('does not flag a ROI whose interval excludes zero on either side', () => {
    expect(roiWithinChance(metrics({ roiLower: 0.01, roiUpper: 0.2 }))).toBe(false);
    expect(roiWithinChance(metrics({ roiLower: -0.3, roiUpper: -0.05 }))).toBe(false);
  });

  it('treats the interval bounds as inclusive', () => {
    expect(roiWithinChance(metrics({ roiLower: 0, roiUpper: 0.2 }))).toBe(true);
    expect(winRateWithinChance(metrics({ winRateLower: 0.5, winRateUpper: 0.7, impliedProbability: 0.5 }))).toBe(true);
  });

  it('does not warn when the backend sent no interval (old cache or undefined interval)', () => {
    expect(withinChance(EMPTY_BET_METRICS)).toBe(false);
    expect(withinChance(metrics({ winRateLower: null, winRateUpper: 0.9, impliedProbability: 0.5 }))).toBe(false);
  });

  it('formats an interval only when both bounds exist', () => {
    const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
    expect(formatInterval(0.2307, 0.8824, pct)).toBe('23.1% – 88.2%');
    expect(formatInterval(null, 0.8824, pct)).toBeNull();
    expect(formatInterval(undefined, undefined, pct)).toBeNull();
  });
});
