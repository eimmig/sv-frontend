import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { LanguageSelector } from './core/language-selector/language-selector';
import { ThemeToggle } from './core/theme-toggle/theme-toggle';

@Component({
  imports: [RouterOutlet, LanguageSelector, ThemeToggle],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
