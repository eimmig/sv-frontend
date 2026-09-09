import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-layout',
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.scss',
})
export class PanelLayout {
  /** Desktop (>=1024px) grid-template-columns, e.g. '320px 1fr'. Tablet/mobile always collapse. */
  readonly columns = input<string>('1fr');
}
