import { Directive, ElementRef, OnDestroy, afterNextRender, inject, output } from '@angular/core';

import { LIST_PAGE_SIZE } from './paginate';

/** Altura de uma linha da lista antes de haver linha para medir (padding 8px + texto 14px + borda). */
const DEFAULT_ROW_HEIGHT = 37;
/** Espaço sempre reservado ao paginador, apareça ele ou não: o tamanho da página não oscila. */
const PAGER_RESERVE = 56;
const MIN_PAGE_SIZE = 5;

/**
 * Calcula quantas linhas da lista cabem na altura do elemento e emite esse número como tamanho da
 * página. Com 10 fixos, a lista ocupava só o topo do panel em telas altas. Sem ResizeObserver
 * (ambiente de teste) ou sem altura medida, fica o tamanho padrão.
 */
@Directive({ selector: '[appFitPageSize]' })
export class FitPageSize implements OnDestroy {
  readonly pageSizeChange = output<number>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: ResizeObserver;
  private current = LIST_PAGE_SIZE;

  constructor() {
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') {
        return;
      }
      this.observer = new ResizeObserver(() => this.measure());
      this.observer.observe(this.host.nativeElement);
      this.measure();
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private measure(): void {
    const element = this.host.nativeElement;
    const available = element.clientHeight - PAGER_RESERVE;
    if (available <= 0) {
      return;
    }
    const row = element.querySelector('li');
    const rowHeight = row?.offsetHeight || DEFAULT_ROW_HEIGHT;
    const size = Math.max(MIN_PAGE_SIZE, Math.floor(available / rowHeight));
    if (size !== this.current) {
      this.current = size;
      this.pageSizeChange.emit(size);
    }
  }
}
