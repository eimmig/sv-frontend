import { Component, input, linkedSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

const STORAGE_PREFIX = 'stakevault.panelCollapsed.';

let nextBodyId = 0;

function storedCollapsed(key: string | undefined): boolean {
  if (!key || typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(STORAGE_PREFIX + key) === 'true';
}

@Component({
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  selector: 'app-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
  host: {
    '[class.panel-host--collapsible]': 'collapsible()',
    '[class.panel-host--collapsed]': 'isCollapsed()',
  },
})
export class Panel {
  readonly title = input<string>();
  readonly collapsible = input(false);
  readonly collapseKey = input<string>();
  readonly badge = input<number | null>(null);

  protected readonly bodyId = `panel-body-${nextBodyId++}`;

  protected readonly collapsed = linkedSignal(() => storedCollapsed(this.collapseKey()));

  protected isCollapsed(): boolean {
    return this.collapsible() && !!this.title() && this.collapsed();
  }

  protected toggleCollapsed(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    const key = this.collapseKey();
    if (key && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, String(next));
    }
  }
}
