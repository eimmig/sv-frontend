import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { loadInto, submitForm } from '../../core/api-request';
import { formatDate, formatDateTime } from '../../core/date-format';
import { Language } from '../../core/language';
import { TelegramLink, TelegramLinkApi, TelegramLinkStatus } from '../../core/telegram-link-api';
import { Panel } from '../../shared/panel/panel';
import { PanelLayout } from '../../shared/panel-layout/panel-layout';

@Component({
  imports: [MatButtonModule, MatIconModule, TranslocoPipe, Panel, PanelLayout],
  selector: 'app-telegram-link',
  styleUrl: './telegram-link.scss',
  templateUrl: './telegram-link.html',
})
export class TelegramLinkPage implements OnInit {
  private readonly telegramLinkApi = inject(TelegramLinkApi);
  private readonly language = inject(Language);
  private readonly transloco = inject(TranslocoService);

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly link = signal<TelegramLink | null>(null);
  protected readonly status = signal<TelegramLinkStatus | null>(null);
  protected readonly statusError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStatus();
  }

  protected loadStatus(): void {
    loadInto(this.telegramLinkApi.status(), this.status, this.statusError, () =>
      this.transloco.translate('telegramLink.statusError'),
    );
  }

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

  protected formatLinkedAt(value: string): string {
    return formatDate(value, this.language.current());
  }
}
