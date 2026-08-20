const { contextBridge, ipcRenderer } = require('electron');

// ── Electron version info ──────────────────────────────────────────────────
contextBridge.exposeInMainWorld('versions', {
  node:      () => process.versions.node,
  chrome:    () => process.versions.chrome,
  electron:  () => process.versions.electron,
  ping:      () => ipcRenderer.invoke('ping'),
});

// ── Accessibility bridge ────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('accessibility', {
  /** Query current platform accessibility preferences (AT active, high contrast, inverted). */
  getPreferences: () =>
    ipcRenderer.invoke('a11y:get-preferences'),

  /** Register a callback invoked whenever native preferences change. */
  onPreferencesChanged: (callback) =>
    ipcRenderer.on('a11y:preferences-changed', (_event, prefs) => callback(prefs)),

  /** Remove all onPreferencesChanged listeners. */
  removePreferencesChangedListener: () =>
    ipcRenderer.removeAllListeners('a11y:preferences-changed'),
});

// ── GDPR / privacy bridge ───────────────────────────────────────────────────
contextBridge.exposeInMainWorld('gdpr', {
  /** Returns `{ consented: boolean }` — reads `gdpr-consent.json` from userData. */
  checkConsent: () => ipcRenderer.invoke('gdpr:check-consent'),

  /** Writes consent record `{ consented, version, date }` to `gdpr-consent.json`. */
  setConsent: () => ipcRenderer.invoke('gdpr:set-consent'),

  /** Deletes tokens, config, and consent files from userData. */
  deleteAllData: () => ipcRenderer.invoke('gdpr:delete-all-data'),
});

// ── Facebook API bridge ─────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('facebook', {
  /** Open system browser with Facebook OAuth URL, resolves with { code, state } */
  startOAuth: (authUrl) =>
    ipcRenderer.invoke('facebook:start-oauth', { authUrl }),

  /** Exchange auth code for access token (reads stored app credentials from main) */
  exchangeToken: (tokenUrl, code, redirectUri) =>
    ipcRenderer.invoke('facebook:exchange-token', { tokenUrl, code, redirectUri }),

  /** Refresh a short-lived access token (stub) */
  refreshToken: () =>
    ipcRenderer.invoke('facebook:refresh-token'),

  /** Load previously stored tokens */
  loadTokens: () =>
    ipcRenderer.invoke('facebook:load-tokens'),

  /** Clear stored tokens (sign out) */
  clearTokens: () =>
    ipcRenderer.invoke('facebook:clear-tokens'),

  /** Revoke the access token server-side (best-effort, returns boolean success) */
  revokeToken: (accessToken) =>
    ipcRenderer.invoke('facebook:revoke-token', { accessToken }),

  /** Save Facebook App credentials securely (encrypted at rest) */
  saveConfig: (appId, appSecret, adAccountId) =>
    ipcRenderer.invoke('facebook:save-config', { appId, appSecret, adAccountId }),

  /** Persist the selected Ad Account ID without requiring the App Secret again */
  saveAccountId: (adAccountId) =>
    ipcRenderer.invoke('facebook:save-account-id', { adAccountId }),

  /** Load stored App ID and Ad Account ID (secret is never returned to renderer) */
  loadConfig: () =>
    ipcRenderer.invoke('facebook:load-config'),

  /** Clear stored app credentials */
  clearConfig: () =>
    ipcRenderer.invoke('facebook:clear-config'),
});

// ── AI bridge ────────────────────────────────────────────────────────────────
// NOTE: 'ai' is taken by Chromium's built-in AI API (window.ai) in Chrome 127+,
// so we use 'claudeAi' to avoid the conflict.
contextBridge.exposeInMainWorld('claudeAi', {
  /** Save Anthropic API key to encrypted system storage. */
  saveApiKey: (key) =>
    ipcRenderer.invoke('ai:save-api-key', { key }),

  /** Returns true if an API key is stored, false otherwise (key never leaves main). */
  loadApiKey: () =>
    ipcRenderer.invoke('ai:load-api-key'),

  /** Generate campaign draft (name, objective, ad sets) from a business description. */
  generateDraft: (prompt) =>
    ipcRenderer.invoke('ai:generate-draft', { prompt }),

  /** Generate ad copy (primaryText, headline, description) for a creative. */
  generateCopy: (context) =>
    ipcRenderer.invoke('ai:generate-copy', { context }),

  /** Generate a full marketing guide (four sections + key takeaways) for an app type and objective. */
  generateGuide: (ctx) =>
    ipcRenderer.invoke('ai:generate-guide', { ctx }),
});

// ── Licence bridge ───────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('licence', {
  /** Activate a LemonSqueezy licence key on this machine. Resolves with { tier, expiresAt }. */
  activate: (key) =>
    ipcRenderer.invoke('licence:activate', { key }),

  /** Validate the stored key against LemonSqueezy with offline grace period. Always resolves. */
  validate: () =>
    ipcRenderer.invoke('licence:validate'),

  /** Deactivate the stored key on this machine (for moving to another device). */
  deactivate: () =>
    ipcRenderer.invoke('licence:deactivate'),

  /** Read cached licence status from licence.enc without a network call. */
  getStatus: () =>
    ipcRenderer.invoke('licence:get-status'),
});

// ── Settings bridge ─────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('settings', {
  // Reserved for future app-level settings (notifications, preferences, etc.)
});

// ── Scheduler bridge ─────────────────────────────────────────────────────────
// NOTE: 'scheduler' is taken by the native Chromium Prioritized Task Scheduling
// API (window.scheduler), so we use 'appScheduler' to avoid the conflict.
contextBridge.exposeInMainWorld('appScheduler', {
  /** Returns `{ lastSyncAt, nextSyncAt }` ISO strings (or null) from scheduler.json. */
  getTimestamps: () =>
    ipcRenderer.invoke('scheduler:get-timestamps'),

  /** Triggers an immediate sync and returns updated `{ lastSyncAt, nextSyncAt }`. */
  syncNow: () =>
    ipcRenderer.invoke('scheduler:sync-now'),

  /**
   * Resets the timer and timestamps WITHOUT firing sync-due.
   * Used by the "Update now" button when the renderer drives the sync itself.
   */
  resetTimer: () =>
    ipcRenderer.invoke('scheduler:reset-timer'),

  /** Registers a callback invoked when the scheduler timer fires. */
  onSyncDue: (cb) =>
    ipcRenderer.on('scheduler:sync-due', cb),

  /** Registers a callback invoked whenever timestamps change (sync fired or timer reset). */
  onTimestampsUpdated: (cb) =>
    ipcRenderer.on('scheduler:timestamps-updated', (_e, ts) => cb(ts)),

  /** Removes all scheduler IPC listeners. Call in ngOnDestroy. */
  removeListeners: () => {
    ipcRenderer.removeAllListeners('scheduler:sync-due');
    ipcRenderer.removeAllListeners('scheduler:timestamps-updated');
  },
});
