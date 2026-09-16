import { Component, effect, inject, signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { RouterOutlet } from '@angular/router';

import { AppSideNav } from './core/app-side-nav/app-side-nav';
import { Auth } from './core/auth';
import { Language } from './core/language';
import { LanguageSelector } from './core/language-selector/language-selector';
import { MustChangePasswordBanner } from './core/must-change-password-banner/must-change-password-banner';
import { Splash } from './core/splash/splash';
import { ThemeToggle } from './core/theme-toggle/theme-toggle';

@Component({
  imports: [RouterOutlet, AppSideNav, LanguageSelector, MustChangePasswordBanner, Splash, ThemeToggle],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(Auth);
  protected readonly showSplash = signal(true);

  private readonly language = inject(Language);
  private readonly dateAdapter = inject(DateAdapter);

  constructor() {
    // MAT_DATE_LOCALE sozinho e um DI token estatico - o app troca idioma em runtime
    // (Language.current, ja fonte de verdade do TranslocoService em todo o app), entao o
    // DateAdapter (mat-datepicker/mat-timepicker) precisa ser rebindado explicitamente.
    effect(() => this.dateAdapter.setLocale(this.language.current()));
  }

  protected onSplashDone(): void {
    this.showSplash.set(false);
  }
}
