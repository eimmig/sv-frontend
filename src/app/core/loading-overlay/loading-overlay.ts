import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Loading } from '../loading';

/**
 * Arka logo assembling over a blurred app while a backend call is in flight
 * (docs/sistema-de-design.md item 17). Visibility and timing live in Loading.
 */
@Component({
  imports: [TranslocoPipe],
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  protected readonly loading = inject(Loading);
}
