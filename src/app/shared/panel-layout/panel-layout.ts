import { Component, input } from '@angular/core';

@Component({
  selector: 'app-panel-layout',
  templateUrl: './panel-layout.html',
  styleUrl: './panel-layout.scss',
})
export class PanelLayout {
  readonly columns = input<string>('1fr');
  readonly tabletColumns = input<string>();
}
