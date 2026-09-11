import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { vi } from 'vitest';

import { Splash } from './splash';

describe('Splash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [
        Splash,
        TranslocoTestingModule.forRoot({
          langs: {
            'pt-BR': {
              splash: {
                ariaLabel: 'Animação de carregamento',
                title: 'Splash animado StakeVault',
                desc: 'Descrição',
                tagline: 'GESTÃO DE BANCA',
              },
            },
          },
          translocoConfig: { availableLangs: ['pt-BR'], defaultLang: 'pt-BR' },
        }),
      ],
    });
  });

  afterEach(() => {
    delete (navigator as { matchMedia?: unknown }).matchMedia;
    vi.useRealTimers();
  });

  it('emits done after the 5.4s intro when motion is not reduced', () => {
    Object.defineProperty(navigator, 'matchMedia', {
      value: () => ({ matches: false }),
      configurable: true,
    });
    const fixture = TestBed.createComponent(Splash);
    const doneSpy = vi.fn();
    fixture.componentInstance.done.subscribe(doneSpy);

    fixture.detectChanges();
    expect(doneSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5399);
    expect(doneSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(doneSpy).toHaveBeenCalledTimes(1);
  });

  it('emits done immediately when prefers-reduced-motion is set', () => {
    Object.defineProperty(navigator, 'matchMedia', {
      value: () => ({ matches: true }),
      configurable: true,
    });
    const fixture = TestBed.createComponent(Splash);
    const doneSpy = vi.fn();
    fixture.componentInstance.done.subscribe(doneSpy);

    fixture.detectChanges();
    vi.runAllTimers();

    expect(doneSpy).toHaveBeenCalledTimes(1);
  });
});
