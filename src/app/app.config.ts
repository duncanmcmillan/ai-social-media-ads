/**
 * @fileoverview Application-level provider configuration.
 * Bootstraps routing, HTTP client, animation support, and ECharts for the Angular app.
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideEchartsCore } from 'ngx-echarts';

import { routes } from './app.routes';

/** Root application configuration with all required providers. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    provideEchartsCore({ echarts: () => import('echarts') }),
  ]
};
