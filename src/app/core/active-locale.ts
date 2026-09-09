import { Injectable, signal } from '@angular/core';

/**
 * Single source of truth for the active locale, read by the Accept-Language
 * interceptor. Wired to the real language selector in feat-001.3 (transloco) -
 * defaults to pt-BR until then, matching docs/CONVENTIONS.md's i18n default.
 */
@Injectable({ providedIn: 'root' })
export class ActiveLocale {
  readonly current = signal<'pt-BR' | 'en-US' | 'es'>('pt-BR');
}
