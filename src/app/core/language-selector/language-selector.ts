import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

import { Language, Locale } from '../language';

@Component({
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatSelectModule, TranslocoPipe],
  selector: 'app-language-selector',
  styleUrl: './language-selector.scss',
  templateUrl: './language-selector.html',
})
export class LanguageSelector {
  protected readonly language = inject(Language);

  // Set by app-side-nav so the trigger can shrink to an icon-only button in its collapsed
  // (72px) state, where the expanded mat-select (min-width 120px) would overflow or get
  // clipped by the sidebar's overflow-x:hidden.
  readonly collapsed = input(false);
  protected readonly locales: ReadonlyArray<{ value: Locale; label: string }> = [
    { value: 'pt-BR', label: 'Português' },
    { value: 'en-US', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  protected onLocaleSelected(locale: Locale): void {
    this.language.set(locale);
  }
}
