import { Component, inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';

import { Language, Locale } from '../language';

@Component({
  imports: [MatSelectModule, TranslocoPipe],
  selector: 'app-language-selector',
  styleUrl: './language-selector.scss',
  templateUrl: './language-selector.html',
})
export class LanguageSelector {
  protected readonly language = inject(Language);
  protected readonly locales: ReadonlyArray<{ value: Locale; label: string }> = [
    { value: 'pt-BR', label: 'Português' },
    { value: 'en-US', label: 'English' },
    { value: 'es', label: 'Español' },
  ];

  protected onLocaleSelected(locale: Locale): void {
    this.language.set(locale);
  }
}
