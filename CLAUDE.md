# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start dev server at http://localhost:4200 (hot reload)
npm run build      # Production build to dist/
npm run watch      # Dev build in watch mode
npm test           # Run unit tests with Vitest
npm run dev        # Build + launch Electron (desktop preview)
npm run make       # Package desktop app with Electron Forge
```

To scaffold new code: `ng generate component|service|directive|pipe <name>`

## Architecture

This is an **Angular 21** SPA using the modern **standalone component** architecture (no NgModules), running inside **Electron 41** as a cross-platform desktop app.

**Key patterns:**
- **Standalone components** — components declare their own imports directly in `@Component({ imports: [...] })`
- **Signals** — use Angular Signals (`signal()`, `computed()`) for reactive state rather than RxJS Subjects in components
- **Functional providers** — app configuration in `src/app/app.config.ts` uses `provideRouter()`, `provideBrowserGlobalErrorListeners()` etc.
- **SCSS** — default style language; styles are component-scoped; `src/styles.scss` is for global styles only

**Entry points:**
- `src/main.ts` — bootstraps the app
- `src/app/app.ts` — root standalone component
- `src/app/app.config.ts` — application-level providers
- `src/app/app.routes.ts` — route definitions

**Bundle budgets** (enforced in `angular.json`): 500KB warning / 1MB error for initial bundle; 6KB/12KB per component style.

## TypeScript

Strict mode is enabled. Angular-specific strict options are on: `strictTemplates`, `strictInjectionParameters`. Target is ES2022.

## Stack

- State management: NgRx Signal Store
- UI: Angular Material with custom theme
- API: Facebook Marketing API via Electron IPC (no direct HTTP from renderer)
- Testing: Vitest (unit), Playwright (e2e)

## Conventions

- Feature-based folder structure: `feature-name/{component,service,store,model,routes}`
- All components use `OnPush` change detection
- API calls through services, never directly in components
- Barrel exports (`index.ts`) for every feature folder

## Feature Modules

| Route | Module | Purpose |
|---|---|---|
| `/campaigns` | `campaigns/` | Facebook Campaign CRUD and status |
| `/ad-sets` | `ad-sets/` | AdSet targeting and budget config |
| `/ads` | `ads/` | Individual ad management |
| `/ad-creatives` | `ad-creatives/` | Creative assets and copy |
| `/optimisation` | `optimisation/` | Performance insights and recommendations |
| `/preview` | `preview/` | Ad preview via Facebook AdPreview API |
| `/auth` | `auth/` | Facebook OAuth login/logout |

## Core Services

```
src/app/core/
├── models/
│   ├── campaign.model.ts
│   ├── ad-set.model.ts
│   ├── ad.model.ts
│   ├── ad-creative.model.ts
│   └── index.ts
├── services/
│   └── facebook/
│       ├── marketing-api/        # Campaigns, AdSets, Ads CRUD
│       ├── insights-api/         # Performance metrics
│       └── ad-preview-api/       # Creative preview generation
├── store/
│   └── app.store.ts              # Global NgRx Signal Store
└── utils/
    └── facebook-error.utils.ts   # Facebook API error handling
```

## Sub-tab navigation

Feature tabs that display **multiple items** (e.g. multiple campaigns, ad sets) use a **horizontal sub-tab bar** rather than a vertically scrolling list.

**Pattern:**
- A `<nav role="tablist">` bar sits below the page header with one `<button role="tab">` per item.
- Each tab shows: primary label, secondary label, and a status dot + text.
- The **left border** of each tab is colour-coded by item status:
  - `PAUSED` → `var(--neutral-300)` (default)
  - `ACTIVE` → `#15803d` (green)
  - `ERROR` → `var(--color-error)` (red)
  - `IN_PROCESS` → `#f59e0b` (amber)
- Active tab: white background + subtle drop shadow; no override of status border colour.
- Use `linkedSignal` in the component to auto-select the first item; `selectTab(key)` allows user override.
- Only the selected item's content is rendered via `@if (selectedItem(); as item)`.

## Test data / seed pattern

Every feature tab whose content depends on authentication must provide a way to load synthetic data for browser-mode development (`npm start`):

- Add a `seedTestData()` (or equivalent) method to the feature's store that calls `patchState` directly — no API calls, no auth required.
- Show a low-prominence **"Load test data"** button in the empty-state block (visible when the list is empty).
- Use `btn--outline` styling with reduced opacity so it doesn't dominate the empty state.

## API service READMEs

Every feature service directory that makes Facebook API calls **must** contain a `README.md` alongside the service file.

**Required sections:**
- **Facebook API Spec** — link to the Facebook Marketing API docs for the exact endpoint and version
- **Endpoint** — HTTP method, Graph API URL, API version
- **Request** — path parameters, query parameters, and request body; for each field note its **source**
- **Response** — TypeScript interface(s) and an example JSON payload
- **Payload data sources** — a summary table mapping every piece of request data to where it originates

## API calls and error handling

All Facebook API calls go through `MarketingApiService`, `InsightsApiService`, or `AdPreviewApiService` in `src/app/core/services/facebook/` — never use `HttpClient` directly in components or stores.

**Error flow:** services throw, stores catch and translate.
- Services throw `Error` (or let `HttpErrorResponse` propagate) — no swallowing.
- Every `async` store method wraps its service call in `try/catch`.
- Use `extractFacebookError(e, 'Fallback message')` (from `src/app/core`) to convert any caught value into a string.
- Set `{ status: 'error', error: message, isLoading: false }` on failure.

```typescript
import { extractFacebookError } from '../../core';

try {
  await someService.doWork();
  patchState(store, { isLoading: false });
} catch (e: unknown) {
  patchState(store, { status: 'error', error: extractFacebookError(e, 'Operation failed'), isLoading: false });
}
```

## Electron IPC bridge pattern

Every Electron-backed service follows this exact pattern:

```typescript
/** Shape of the Facebook IPC bridge exposed by `preload.js`. */
type FacebookBridge = { startOAuth: (authUrl: string) => Promise<{ code: string; state: string }> };

const bridge = (window as unknown as { facebook?: FacebookBridge }).facebook ?? null;

@Injectable({ providedIn: 'root' })
export class FacebookAuthService {
  readonly isElectron = !!bridge;

  async startOAuth(authUrl: string): Promise<{ code: string; state: string }> {
    if (!bridge) throw new Error('Not running in Electron');
    return bridge.startOAuth(authUrl);
  }
}
```

- Define the bridge type locally in the service file (not in a shared types file).
- Guard every method with `if (!bridge) return` so the service is safe in browser / test environments.
- Expose new IPC channels in `preload.js` and handle them in `main.js`; never call `ipcRenderer` from Angular code directly.

## GDPR / privacy

A **consent gate** runs in `App.ngAfterViewInit` (Electron only). Never remove or bypass this check.

**Invariant:** if you add a new file to `userData` in `main.js` that stores personal data, you **must** also delete it in the `gdpr:delete-all-data` IPC handler.

Current personal-data files tracked by the deletion handler:
- `fb-tokens.enc` — Facebook OAuth tokens
- `fb-config.enc` — Facebook App credentials
- `gdpr-consent.json` — consent record

## Facebook OAuth

The app uses a custom protocol `fb-ads://oauth/callback` for OAuth redirect. The Electron main process:
1. Opens the Facebook OAuth dialog in the system browser
2. Registers itself as the handler for `fb-ads://` protocol URLs
3. Receives the callback, extracts `code` and `state`
4. Exchanges the code for an access token via the Facebook token endpoint
5. Stores the access token encrypted with `safeStorage`

## Vitest

Tests run via Angular's build wrapper — always use `npm test`, not `npx vitest run` (the latter lacks jsdom).

- Test files live alongside source: `feature.spec.ts` next to `feature.ts`
- Use Angular `TestBed` for all component/service/store tests
- Provide HTTP mocking with `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`
- Always call `httpController.verify()` in `afterEach` to catch unexpected requests
- Access `protected` members in tests via `(component as unknown as { member: Type }).member`
- Every new service, store, and component must have a corresponding `.spec.ts` covering: creation, initial state, public methods, and template elements
- Components that import Angular Material (CDK `BreakpointObserver`) need a `matchMedia` polyfill at the top of the spec file — jsdom does not implement `mql.addListener`:
  ```typescript
  import { vi } from 'vitest';
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
  ```

## JSDoc

All exported functions, classes, methods, interfaces, and types must have JSDoc.

- Files: `@fileoverview` block at the top describing the file's purpose
- Interfaces/types: document each field with an inline `/** ... */` comment
- Methods: `@param`, `@returns`, and `@throws` where applicable
- Keep descriptions concise — one sentence is enough for self-evident behaviour
- Do not add JSDoc to private implementation details or test files

## Accessibility (EN 301 549 / WCAG 2.1 AA)

This app targets **EN 301 549 Clause 11** compliance (WCAG 2.1 AA applied to software UIs via WCAG2ICT). Chromium exposes the DOM accessibility tree to platform AT APIs (UIA on Windows, NSAccessibility on macOS) automatically, so correct semantics and ARIA usage are the primary requirements.

**Required in every component:**
- All interactive elements must be keyboard-operable and have visible `:focus-visible` styles (global ring defined in `styles.scss`)
- Never convey information by colour alone — pair colour with text, icons, or patterns
- Provide `aria-label` on icon-only controls (buttons, links) and on landmark elements with ambiguous names
- Announce loading and status changes with `aria-live="polite"` (or `"assertive"` for urgent updates)
- Meaningful images need `alt` text; decorative images and icons need `aria-hidden="true"`

**OS preferences — `AccessibilityService` (`src/app/core`):**

Import and inject to read OS preferences as Angular signals:
```typescript
readonly a11y = inject(AccessibilityService);
// a11y.prefersReducedMotion(), a11y.prefersHighContrast(),
// a11y.forcedColors(), a11y.prefersDarkMode(), a11y.screenReaderActive()
```

**Navigation patterns:**
- Skip link (`<a class="skip-link" href="#main-content">`) at the top of the shell
- `<nav aria-label="...">` for every navigation region
- `aria-current="page"` on the active link (use `routerLinkActive` template ref: `[attr.aria-current]="rla.isActive ? 'page' : null"`)
- `<main id="main-content" tabindex="-1">` as the skip-link target

## Avoid

- No NgModules, no CommonModule imports
- No constructor injection
- No `*ngIf`/`*ngFor` — use `@if`/`@for`
- No `subscribe()` in components
- No direct Facebook Graph API calls from Angular components or stores — always via IPC
