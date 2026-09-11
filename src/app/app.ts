import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AppSideNav } from './core/app-side-nav/app-side-nav';
import { Auth } from './core/auth';
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

  protected onSplashDone(): void {
    this.showSplash.set(false);
  }
}
