export class ResizeObserverStub {
  observe(): void {
    // no-op: JSDOM has no layout engine, so there is nothing to observe
  }

  unobserve(): void {
    // no-op: see observe()
  }

  disconnect(): void {
    // no-op: see observe()
  }
}

export function stubCanvasContext(): void {
  const noop = () => {};
  const context: Record<string, unknown> = {};
  const proxy = new Proxy(context, {
    get: (target, prop) => {
      if (prop === 'canvas' || prop in target) {
        return target[prop as string];
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
        return () => ({ addColorStop: noop });
      }
      if (prop === 'measureText') {
        return () => ({ width: 0 });
      }
      return noop;
    },
    set: (target, prop, value) => {
      target[prop as string] = value;
      return true;
    },
  });
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement) {
    context['canvas'] = this;
    return proxy;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

export function stubBrazilianLocale(): void {
  localStorage.removeItem('stakevault.language');
  Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
}

export function restoreLocale(): void {
  delete (navigator as { language?: string }).language;
}
