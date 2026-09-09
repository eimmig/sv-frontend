import { TestBed } from '@angular/core/testing';

import { LineChartSample } from './line-chart-sample';

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('LineChartSample', () => {
  beforeEach(() => {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    TestBed.configureTestingModule({ imports: [LineChartSample] });
  });

  it('renders the echarts host element without console errors', () => {
    const fixture = TestBed.createComponent(LineChartSample);

    expect(() => fixture.detectChanges()).not.toThrow();
    const host = (fixture.nativeElement as HTMLElement).querySelector('[echarts]');
    expect(host).toBeTruthy();
  });
});
