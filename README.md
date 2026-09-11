# AI Ads Manager

Build Facebook campaigns in minutes with AI. Monitor performance, optimise creatives, and manage your ad account — all in one desktop app.

## Stack

| Layer | Technology |
|---|---|
| UI framework | Angular 21 (standalone components, Signals) |
| State | NgRx Signal Store |
| UI components | Angular Material |
| Charts | Apache ECharts via ngx-echarts |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) |
| Desktop shell | Electron 41 |
| Packaging | Electron Forge |
| Testing | Vitest (unit), Playwright (e2e) |
| Language | TypeScript 5.9, strict mode |

## Prerequisites

- Node.js >= 20 (22 recommended)
- npm >= 11
- A Facebook App with Marketing API access (configured in-app via Meta Setup)

## Local development

```bash
npm install
npm start          # Angular dev server at http://localhost:4200 (hot reload, no Electron)
npm run dev        # Full Electron app (builds Angular first, then launches desktop window)
npm run watch      # Angular build in watch mode (pair with npm run start-electron)
```

## Testing

```bash
npm test           # Run unit tests with Vitest
```

Always use `npm test`, not `npx vitest run` — the Angular build wrapper is required for jsdom to work correctly.

## Building for release

```bash
npm run build      # Production Angular build to dist/
npm run make       # Package desktop app with Electron Forge (outputs to out/)
```

Releases are built automatically by GitHub Actions on any `v*.*.*` tag push:

```bash
git tag v1.2.3 && git push origin v1.2.3
```

The workflow produces signed-ready artifacts for macOS (arm64 + x64), Windows (x64), and Linux (deb + rpm). Artifacts are attached to the GitHub Release automatically.

> **macOS note:** Builds are ad-hoc signed (no Apple Developer account). First launch: right-click → Open → Open.
> **Windows note:** SmartScreen may warn for unsigned apps. Click More info → Run anyway.

## Project structure

```
src/
├── main.ts                    # Angular bootstrap
├── app/
│   ├── app.ts                 # Root component
│   ├── app.config.ts          # Application providers
│   ├── app.routes.ts          # Top-level routes (all lazy-loaded)
│   ├── core/                  # Services, stores, models shared across features
│   │   ├── models/            # Campaign, AdSet, Ad, AdCreative interfaces
│   │   ├── services/facebook/ # Marketing API, Insights API, Ad Preview API
│   │   └── store/             # App-wide NgRx Signal Stores (licence, workspace)
│   ├── shared/                # Reusable UI components (upgrade prompt, video modal, etc.)
│   ├── workspace/             # Home screen
│   ├── new-campaign/          # Multi-step campaign creation wizard
│   ├── campaign-manager/      # Live campaign list with Edit & Relaunch
│   ├── dashboard/             # Performance metrics and insights
│   └── meta-setup/            # Facebook App credentials and OAuth config
├── styles.scss                # Global styles
main.js                        # Electron main process
preload.js                     # Electron preload (IPC bridge)
```

## Architecture notes

- **No NgModules** — all components are standalone and declare their own imports.
- **Signals throughout** — use `signal()` and `computed()` for reactive state; avoid RxJS `subscribe()` in components.
- **IPC bridge** — all Facebook API calls go through Electron IPC (`preload.js` → `main.js`), never directly from the Angular renderer. This keeps tokens out of the renderer process.
- **OnPush everywhere** — all components use `ChangeDetectionStrategy.OnPush`.
- **GDPR consent gate** — runs on startup (Electron only). Never bypass or remove the check in `App.ngAfterViewInit`.

## Licensing

Free tier: 3 campaigns, 1 ad set per campaign. Pro licence (£40/yr) via LemonSqueezy removes all limits. Licence keys are validated and stored encrypted via Electron `safeStorage`.
