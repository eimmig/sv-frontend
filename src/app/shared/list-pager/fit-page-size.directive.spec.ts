import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { FitPageSize } from './fit-page-size.directive';

@Component({
  imports: [FitPageSize],
  template: `<div appFitPageSize (pageSizeChange)="size.set($event)">
    <ul>
      <li>a</li>
    </ul>
  </div>`,
})
class Host {
  readonly size = signal<number | null>(null);
}

describe('FitPageSize', () => {
  let resizeCallback: (() => void) | undefined;
  const originalResizeObserver = globalThis.ResizeObserver;

  function render(clientHeight: number, rowHeight: number): Host {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(clientHeight);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(rowHeight);
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.tick();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    resizeCallback = undefined;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        resizeCallback = callback;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    vi.restoreAllMocks();
  });

  it('emits how many rows fit below the space reserved for the pager', () => {
    // (800 - 56) / 37 = 20,1 -> 20 linhas
    const host = render(800, 37);
    expect(host.size()).toBe(20);
  });

  it('never goes below five rows', () => {
    const host = render(120, 37);
    expect(host.size()).toBe(5);
  });

  it('recalculates when the element is resized', () => {
    const host = render(800, 37);
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500);
    resizeCallback?.();
    // (500 - 56) / 37 = 12
    expect(host.size()).toBe(12);
  });

  it('keeps the default size when nothing was measured', () => {
    const host = render(0, 37);
    expect(host.size()).toBeNull();
  });
});
