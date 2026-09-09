import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageSelector } from './core/language-selector/language-selector';
import { Splash } from './core/splash/splash';
import { ThemeToggle } from './core/theme-toggle/theme-toggle';

@Component({
  imports: [RouterOutlet, LanguageSelector, Splash, ThemeToggle],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly showSplash = signal(true);

  protected onSplashDone(): void {
    this.showSplash.set(false);
  }
}
