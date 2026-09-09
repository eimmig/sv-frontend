import { Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

import { LineChartSample } from '../../shared/line-chart-sample/line-chart-sample';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

@Component({
  imports: [PanelLayout, Panel, LineChartSample, TranslocoPipe],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly placeholderRows = Array.from({ length: 30 }, (_, i) => i);
}
