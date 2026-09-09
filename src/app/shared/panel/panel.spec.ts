import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `
    <app-panel [title]="title">
      <button panel-actions type="button">action</button>
      <p>body content</p>
    </app-panel>
  `,
})
class HostComponent {
  title: string | undefined = 'Painel de teste';
}

describe('Panel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  it('renders the header with title and projected actions when title is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.panel__header h2')?.textContent).toBe('Painel de teste');
    expect(el.querySelector('[panel-actions]')).toBeTruthy();
    expect(el.querySelector('.panel__body p')?.textContent).toBe('body content');
  });

  it('omits the header entirely when no title is set', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.title = undefined;
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.panel__header')).toBeNull();
  });
});
