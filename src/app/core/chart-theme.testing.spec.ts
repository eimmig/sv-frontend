import { ResizeObserverStub, restoreLocale, stubBrazilianLocale, stubCanvasContext } from './chart-theme.testing';

describe('ResizeObserverStub', () => {
  it('exposes the observer methods as no-ops', () => {
    const observer = new ResizeObserverStub();

    expect(() => observer.observe()).not.toThrow();
    expect(() => observer.unobserve()).not.toThrow();
    expect(() => observer.disconnect()).not.toThrow();
  });
});

describe('stubCanvasContext', () => {
  it('lets HTMLCanvasElement.getContext() return a proxy that tolerates any ECharts call', () => {
    stubCanvasContext();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as unknown as Record<string, unknown>;

    expect(context['canvas']).toBe(canvas);
    expect((context['createLinearGradient'] as () => { addColorStop: () => void })().addColorStop).toBeInstanceOf(
      Function,
    );
    expect((context['createRadialGradient'] as () => { addColorStop: () => void })().addColorStop).toBeInstanceOf(
      Function,
    );
    expect((context['measureText'] as () => { width: number })()).toEqual({ width: 0 });
    expect(() => (context['fillRect'] as (...args: unknown[]) => void)(0, 0, 1, 1)).not.toThrow();

    (context as { fillStyle: string }).fillStyle = '#000';
    expect((context as { fillStyle: string }).fillStyle).toBe('#000');
  });
});

describe('stubBrazilianLocale / restoreLocale', () => {
  afterEach(() => {
    restoreLocale();
  });

  it('forces navigator.language to pt-BR and clears any stored language override', () => {
    localStorage.setItem('stakevault.language', 'en-US');

    stubBrazilianLocale();

    expect(navigator.language).toBe('pt-BR');
    expect(localStorage.getItem('stakevault.language')).toBeNull();
  });

  it('restoreLocale() removes the navigator.language override', () => {
    stubBrazilianLocale();
    restoreLocale();

    expect(navigator.language).not.toBe('pt-BR');
  });
});
