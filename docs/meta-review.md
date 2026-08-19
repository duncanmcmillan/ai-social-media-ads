# Meta App Review — Technical Implementation Reference

This document summarises what has been built and how it maps to Meta's four app review criteria. It is intended as a reference for the Meta reviewer and for internal use during the submission process.

---

## 1. Business Use Case

**App name:** AI Social Media Ads
**App type:** Desktop application (Electron + Angular), not a web service or SaaS platform.
**Audience:** Marketing teams and freelance media buyers who manage Facebook ad campaigns on behalf of clients or their own business.

### What the app does

The app provides an end-to-end workflow for creating and managing Facebook advertising campaigns from a single desktop interface:

- **Workspace configuration** — the user sets global defaults (Meta Page, Pixel, URL, targeting parameters, learning-phase rules, AI settings) that are applied automatically to new campaigns.
- **Campaign creation wizard** — a guided, multi-step flow covering campaign objective and budget, ad set targeting and scheduling, ad creative upload (images), and ad copy. An AI assistant (Claude) can generate a campaign structure from a plain-language business description.
- **Campaign monitoring** — a live dashboard displaying campaign, ad set, and ad status; performance metrics (impressions, clicks, spend, ROAS) via the Insights API; and one-click pause/resume controls.
- **Optimisation recommendations** — AI-generated suggestions based on current performance data, referencing the workspace's learning rules.

### Why `ads_management` is needed

Every write operation in the app — creating a campaign, an ad set, an ad creative, uploading an image, or updating a status — requires `ads_management`. The app cannot function without it. There is no read-only mode; the core value proposition is creating and managing ads, not just viewing them.

### Why each permission is requested

| Permission | Where it is used | Why it cannot be omitted |
|---|---|---|
| `ads_management` | Creating and updating campaigns, ad sets, ads, creatives; uploading images via `/{ad-account-id}/adimages` | Required for all write operations to the Marketing API |
| `ads_read` | Reading campaign/ad-set/ad status; fetching Insights metrics for the monitoring dashboard | Required to display live performance data and current statuses |
| `business_management` | Fetching the list of ad accounts accessible to the user via `GET /me/adaccounts` | Required when the user's accounts are held inside a Business Manager |
| `pages_read_engagement` | Populating the Facebook Page selector (used as `page_id` in ad creative `object_story_spec`) | Required to list pages the user administers for use in creatives |

---

## 2. OAuth Flow and Permission Request

### How authentication works

The app uses Facebook Login with an Electron `BrowserWindow` and a GitHub Pages redirect URI — not an embedded WebView and not a localhost server. Facebook's policy prohibits OAuth in embedded browsers; the app opens a `BrowserWindow` that loads the Facebook OAuth dialog and intercepts the redirect to extract the auth code before the redirect target page is loaded.

**Step-by-step:**

1. User clicks "Connect Facebook" in the app.
2. App verifies that App ID and App Secret have been configured and stored.
3. Electron opens a `BrowserWindow` and loads:
   ```
   https://www.facebook.com/v22.0/dialog/oauth
     ?client_id={APP_ID}
     &redirect_uri=https://duncanmcmillan.github.io/ai-social-media-ads/oauth/callback
     &scope=ads_management,ads_read,business_management,pages_read_engagement
     &response_type=code
   ```
4. The user logs in to Facebook (if not already) and reviews the permission consent screen.
5. Facebook redirects to `https://duncanmcmillan.github.io/ai-social-media-ads/oauth/callback?code=...`.
6. Electron intercepts the `will-redirect` event before the BrowserWindow loads the redirect target, extracts the `code` parameter, calls `event.preventDefault()` to block the navigation, and closes the window. The GitHub Pages page never loads.
7. The main process exchanges the code for an access token via `POST https://graph.facebook.com/v22.0/oauth/access_token`, using the stored App Secret (which **never passes through the renderer process**).
8. The access token is encrypted and stored locally (see Section 4).
9. The app immediately calls `GET /me` and `GET /me/adaccounts` to load the user's profile and available ad accounts.

### Scope of data accessed

The app only reads:
- User display name and ID (for display purposes)
- Ad account IDs, names, currency, timezone, and status (for account selection)
- Facebook Pages administered by the user (for creative `page_id` selection)
- Meta Pixels linked to the selected ad account (for conversion tracking configuration)
- Campaign, ad set, and ad performance metrics for the selected account

No data is transmitted to any server controlled by the app developer. All API calls are made directly from the user's device to `graph.facebook.com`.

---

## 3. Data Protection and Privacy

### What personal data is stored

All data is stored locally on the user's device inside Electron's `userData` directory. Nothing is sent to any third-party server or cloud service controlled by the app.

| File | Contents | Encryption |
|---|---|---|
| `fb-tokens.enc` | Facebook access token, token type, expiry timestamp | Electron `safeStorage` (OS keychain-backed AES) |
| `fb-config.enc` | Facebook App ID, App Secret, selected Ad Account ID | Electron `safeStorage` |
| `gdpr-consent.json` | Consent record (boolean, version, ISO timestamp) | Plaintext (not personal data) |

The **App Secret is never passed to the Angular renderer process**. It is read exclusively in the Electron main process during the token exchange step and stored encrypted. The renderer only ever holds the App ID (not a secret) and the access token.

### GDPR / privacy compliance

A **consent gate** runs on every app launch (Electron mode only). The user must accept the privacy notice before any Facebook API calls are made or any personal data is stored.

**"Delete all my data" flow:**

1. The app calls `DELETE https://graph.facebook.com/me/permissions?access_token={TOKEN}` to revoke the token server-side.
2. `fb-tokens.enc`, `fb-config.enc`, `ai-key.enc`, and `gdpr-consent.json` are deleted from `userData`.
3. All in-memory auth state is cleared (access token, user profile, ad accounts, pages, pixels).

This means that after deletion, the token is invalid both locally and at Facebook's end.

### Minimum permissions

The app requests exactly the four permissions listed in Section 1. No additional permissions are requested speculatively or for future features.

---

## 4. Technical Implementation

### Handling token revocation and permission loss

**Proactive revocation on sign-out:**
`AuthStore.signOut()` calls `bridge.revokeToken(token)` before clearing local storage. This calls `DELETE /me/permissions` via the Electron main process so the token is invalidated at Facebook's end, not just removed locally.

**Reactive detection during API calls:**
All caught API errors are passed through `parseFacebookError()` (in `src/app/core/utils/facebook-error.utils.ts`), which inspects the Facebook error `code` field:

| Code | Meaning | `isAuthError` | `isPermissionError` |
|---|---|---|---|
| 190 | Invalid OAuth 2.0 Access Token | true | false |
| 102 | Session has been invalidated | true | false |
| 10 | Application does not have permission | false | true |
| 200 | Permissions error | false | true |

When `isAuthError` or `isPermissionError` is true, the store calls `AuthStore.forceSignOut(reason)`, which:
- Immediately clears `isAuthenticated`, `accessToken`, `user`, `adAccounts`, `selectedAccount`, `pages`, and `pixels` from state
- Sets an error message surfaced to the user: "Session ended: {reason} — please sign in again."
- Calls `bridge.clearTokens()` to remove the stored token (best-effort, non-blocking)

**Error shape handling:**
`parseFacebookError()` handles both the direct Facebook API error shape (`{ error: { code, message } }`) and Angular's `HttpErrorResponse` body shape (`{ error: { error: { code, message } } }`), ensuring error codes are correctly extracted regardless of the call path.

### Handling ad account restrictions

Before every Marketing API call, `MarketingApiService.authParams()` calls `AuthStore.assertAccountActive()`.

`assertAccountActive()` checks the selected account's `account_status` field (fetched at login via `GET /me/adaccounts?fields=account_status`) against the `AdAccountStatus` enum:

```
Active = 1, Disabled = 2, Unsettled = 3, PendingReview = 7,
InGracePeriod = 9, PendingClosure = 100, Closed = 101
```

If the status is anything other than `Active`, a clear error is thrown before the API call is made:

> `Ad account "Account Name" is not active (Disabled). Select an active account or contact Meta support.`

This prevents the app from attempting operations on restricted accounts and surfaces a meaningful message to the user rather than a raw API error.

### Key source files

| Concern | File |
|---|---|
| OAuth flow (Electron) | `main.js` — `facebook:start-oauth`, `facebook:exchange-token` |
| Token storage / revocation | `main.js` — `facebook:revoke-token`, `facebook:clear-tokens` |
| Auth store (Angular) | `src/app/auth/store/auth.store.ts` |
| Error code detection | `src/app/core/utils/facebook-error.utils.ts` |
| Account status guard | `src/app/auth/store/auth.store.ts` — `assertAccountActive()` |
| Marketing API calls | `src/app/core/services/facebook/marketing-api/marketing-api.service.ts` |
| GDPR consent gate | `src/app/app.ts` — `ngAfterViewInit` |
| GDPR data deletion | `main.js` — `gdpr:delete-all-data` |
