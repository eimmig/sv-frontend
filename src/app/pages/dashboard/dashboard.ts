import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

@Component({
  imports: [PanelLayout, Panel, TranslocoPipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly placeholderRows = Array.from({ length: 30 }, (_, i) => i);
}
