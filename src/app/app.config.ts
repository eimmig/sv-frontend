import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { acceptLanguageInterceptor } from './core/accept-language-interceptor';
import { authInterceptor } from './core/auth-interceptor';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding() (feat-016): route `data` binds directly to a routed
    // component's inputs (e.g. shared/catalog-manager's resourcePath, shared/catalog-dashboard's
    // segment/labelKey) - avoids a thin wrapper page per resource, which would reintroduce the
    // SonarCloud duplication finding those shared components were built to avoid (feat-003).
    // Additive: no existing route passes `data` today, so no existing component is affected.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([acceptLanguageInterceptor, authInterceptor])),
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
