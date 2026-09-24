import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Loading } from '../loading';

@Component({
  imports: [TranslocoPipe],
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.html',
  styleUrl: './loading-overlay.scss',
})
export class LoadingOverlay {
  protected readonly loading = inject(Loading);
}
