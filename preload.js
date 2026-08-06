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

// ── Settings bridge ─────────────────────────────────────────────────────────
contextBridge.exposeInMainWorld('settings', {
  // Reserved for future app-level settings (notifications, preferences, etc.)
});
