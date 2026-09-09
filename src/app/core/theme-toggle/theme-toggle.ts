import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { Theme } from '../theme';

@Component({
  imports: [MatButtonModule],
  selector: 'app-theme-toggle',
  styleUrl: './theme-toggle.scss',
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle {
  protected readonly theme = inject(Theme);
}
