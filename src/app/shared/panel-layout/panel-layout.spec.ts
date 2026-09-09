import { TestBed } from '@angular/core/testing';

import { PanelLayout } from './panel-layout';

describe('PanelLayout', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PanelLayout] });
  });

  it('exposes the columns input as a CSS custom property for the grid', () => {
    const fixture = TestBed.createComponent(PanelLayout);
    fixture.componentRef.setInput('columns', '320px 1fr');
    fixture.detectChanges();

    const grid = (fixture.nativeElement as HTMLElement).querySelector('.panel-layout') as HTMLElement;
    expect(grid.style.getPropertyValue('--panel-columns')).toBe('320px 1fr');
  });

  it('defaults to a single column when no columns input is provided', () => {
    const fixture = TestBed.createComponent(PanelLayout);
    fixture.detectChanges();

    const grid = (fixture.nativeElement as HTMLElement).querySelector('.panel-layout') as HTMLElement;
    expect(grid.style.getPropertyValue('--panel-columns')).toBe('1fr');
  });
});
