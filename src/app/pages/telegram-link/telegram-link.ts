import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { submitForm } from '../../core/api-request';
import { formatDateTime } from '../../core/date-format';
import { Language } from '../../core/language';
import { TelegramLink, TelegramLinkApi } from '../../core/telegram-link-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

@Component({
  imports: [MatButtonModule, MatIconModule, TranslocoPipe, Panel, PanelLayout],
  selector: 'app-telegram-link',
  styleUrl: './telegram-link.scss',
  templateUrl: './telegram-link.html',
})
export class TelegramLinkPage {
  private readonly telegramLinkApi = inject(TelegramLinkApi);
  private readonly language = inject(Language);
  private readonly transloco = inject(TranslocoService);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly link = signal<TelegramLink | null>(null);

  protected generate(): void {
    if (this.submitting()) {
      return;
    }
    submitForm(
      this.telegramLinkApi.create(),
      this.submitting,
      this.formError,
      () => this.transloco.translate('telegramLink.genericError'),
      (result) => this.link.set(result),
    );
  }

  protected formatExpiresAt(value: string): string {
    return formatDateTime(value, this.language.current());
  }
}
