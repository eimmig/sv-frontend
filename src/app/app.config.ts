import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { acceptLanguageInterceptor } from './core/accept-language-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { httpCacheInterceptor } from './core/http-cache-interceptor';
import { loadingInterceptor } from './core/loading-interceptor';
import { provideLocaleDateAdapter } from './core/locale-date-adapter';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([acceptLanguageInterceptor, httpCacheInterceptor, loadingInterceptor, authInterceptor])),
    provideLocaleDateAdapter(),
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
