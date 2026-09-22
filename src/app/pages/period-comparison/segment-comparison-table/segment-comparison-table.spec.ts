import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { SegmentComparisonTable } from './segment-comparison-table';
import { SegmentedBetMetrics } from '../../../core/statistics-api';

function segment(id: string, name: string, netProfit: number, roi: number): SegmentedBetMetrics {
  return {
    dimensionId: id,
    dimensionName: name,
    metrics: { totalStaked: 0, netProfit, roi, winRate: 0, settledCount: 1, wonCount: 0, lostCount: 0, voidCount: 0, preCount: 0, liveCount: 0, avgOdd: null },
  };
}

@Component({
  imports: [SegmentComparisonTable],
  template: `<app-segment-comparison-table
    [title]="title"
    [nameLabel]="'Esporte'"
    [testId]="'period-comparison-segment-sport'"
    [segmentA]="segmentA"
    [segmentB]="segmentB"
  />`,
})
class HostComponent {
  title = 'Esportes';
  segmentA: SegmentedBetMetrics[] = [];
  segmentB: SegmentedBetMetrics[] = [];
}

describe('SegmentComparisonTable', () => {
  beforeEach(() => {
    localStorage.removeItem('stakevault.language');
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    TestBed.configureTestingModule({
      imports: [
        HostComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              periodComparison: { roiLabel: 'ROI', netProfitLabel: 'Lucro líquido', deltaLabel: 'Diferença', indeterminate: 'Indeterminado' },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  afterEach(() => {
    delete (navigator as { language?: string }).language;
  });

  it('renders one row per item present in A or B (union, not intersection)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.segmentA = [segment('s1', 'Futebol', 100, 0.1)];
    fixture.componentInstance.segmentB = [segment('s2', 'Basquete', 50, 0.05)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const rows = el.querySelectorAll('[data-testid="period-comparison-segment-sport-row"]');
    expect(rows).toHaveLength(2);
  });

  it('shows the indeterminate placeholder (not 0) for the side missing an item', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.segmentA = [segment('s1', 'Futebol', 100, 0.1)];
    fixture.componentInstance.segmentB = [];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const row = el.querySelector('[data-testid="period-comparison-segment-sport-row"]') as HTMLElement;
    expect(row.textContent).toContain('Futebol');
    expect(row.textContent).toContain('Indeterminado');
  });

  it('computes the ROI/netProfit delta and colors it when the item exists on both sides', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.segmentA = [segment('s1', 'Futebol', 100, 0.1)];
    fixture.componentInstance.segmentB = [segment('s1', 'Futebol', 150, 0.15)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const row = el.querySelector('[data-testid="period-comparison-segment-sport-row"]') as HTMLElement;
    expect(row.querySelector('.segment-comparison-table__delta--positive')).toBeTruthy();
  });

  it('sorts rows alphabetically by name', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.segmentA = [segment('s2', 'Vôlei', 10, 0.1), segment('s1', 'Futebol', 20, 0.2)];
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const names = Array.from(el.querySelectorAll('[data-testid="period-comparison-segment-sport-row"] td:first-child')).map(
      (td) => td.textContent,
    );
    expect(names).toEqual(['Futebol', 'Vôlei']);
  });
});
