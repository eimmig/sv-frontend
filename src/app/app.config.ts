import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { acceptLanguageInterceptor } from './core/accept-language-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { loadingInterceptor } from './core/loading-interceptor';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([loadingInterceptor, acceptLanguageInterceptor, authInterceptor])),
    // Native Date (Intl), mesma filosofia de core/date-format.ts - sem moment/date-fns.
    // Locale reativo ao idioma ativo (App, app.ts) - MAT_DATE_LOCALE sozinho e estatico.
    provideNativeDateAdapter(),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en-US', 'es'],
        defaultLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
