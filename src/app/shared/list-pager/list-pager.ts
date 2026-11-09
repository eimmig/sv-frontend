import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslocoPipe } from '@jsverse/transloco';

/**
 * Anterior/Próxima e indicador de página para listas de cadastro. Paginar evita a região com
 * rolagem interna no panel, que o teclado não alcança (axe scrollable-region-focusable).
 */
@Component({
  imports: [MatButtonModule, TranslocoPipe],
  selector: 'app-list-pager',
  styleUrl: './list-pager.scss',
  templateUrl: './list-pager.html',
})
export class ListPager {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly testId = input.required<string>();
  readonly pageChange = output<number>();
}
