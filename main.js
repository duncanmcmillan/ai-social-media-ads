const { app, BrowserWindow, ipcMain, safeStorage, nativeTheme } = require('electron/main');
const path = require('node:path');
const fs = require('node:fs');
const { URL } = require('node:url');

// ── Paths ──────────────────────────────────────────────────────────────────
const TOKEN_PATH   = () => path.join(app.getPath('userData'), 'fb-tokens.enc');
const CONFIG_PATH  = () => path.join(app.getPath('userData'), 'fb-config.enc');
const CONSENT_PATH = () => path.join(app.getPath('userData'), 'gdpr-consent.json');

// ── Single-instance lock (focus existing window if re-launched) ────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// ── Accessibility helpers ───────────────────────────────────────────────────

/** Builds the current accessibility preference snapshot from Electron APIs. */
function getA11yPreferences() {
  return {
    accessibilitySupport: app.accessibilitySupportEnabled,
    highContrast:         nativeTheme.shouldUseHighContrastColors,
    invertedColors:       nativeTheme.shouldUseInvertedColorScheme,
  };
}

/** Pushes the current accessibility preferences to all renderer windows. */
function pushA11yPreferences() {
  const prefs = getA11yPreferences();
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send('a11y:preferences-changed', prefs);
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function safeWrite(filePath, data) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Encryption not available');
  const encrypted = safeStorage.encryptString(typeof data === 'string' ? data : JSON.stringify(data));
  fs.writeFileSync(filePath, encrypted);
}

function safeRead(filePath) {
  if (!safeStorage.isEncryptionAvailable()) return null;
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  return safeStorage.decryptString(buf);
}

function safeDelete(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// ── Window ─────────────────────────────────────────────────────────────────
const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  win.loadFile('dist/ai-social-media-ads/browser/index.html');
  win.webContents.openDevTools();
};

// ── IPC Handlers ───────────────────────────────────────────────────────────
if (gotLock) app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.whenReady().then(() => {
  if (!gotLock) return;

  // Legacy ping
  ipcMain.handle('ping', () => 'pong');

  // ── Accessibility: query platform AT and theme preferences ────────────
  ipcMain.handle('a11y:get-preferences', () => getA11yPreferences());

  // Push updated preferences to all renderers when OS settings change
  nativeTheme.on('updated', pushA11yPreferences);
  app.on('accessibility-support-changed', pushA11yPreferences);

  // ── OAuth: open a BrowserWindow for Facebook login and intercept the redirect ──
  // Redirect URI must be registered in the Facebook app as: https://localhost/oauth/callback
  // Facebook accepts localhost URLs; we intercept the navigation before it resolves.
  ipcMain.handle('facebook:start-oauth', (_event, { authUrl }) => {
    return new Promise((resolve, reject) => {
      const REDIRECT_PREFIX = 'https://localhost/oauth/callback';

      const authWindow = new BrowserWindow({
        width:  560,
        height: 680,
        title:  'Connect to Facebook',
        webPreferences: {
          nodeIntegration:  false,
          contextIsolation: true,
        },
      });

      const timeout = setTimeout(() => {
        if (!authWindow.isDestroyed()) authWindow.close();
        reject(new Error('OAuth timed out after 5 minutes'));
      }, 5 * 60 * 1000);

      function handleRedirectUrl(url) {
        if (!url.startsWith(REDIRECT_PREFIX)) return;
        clearTimeout(timeout);
        if (!authWindow.isDestroyed()) authWindow.close();

        try {
          const parsed = new URL(url);
          const code   = parsed.searchParams.get('code');
          const error  = parsed.searchParams.get('error');
          if (error)  reject(new Error(`Facebook OAuth error: ${error}`));
          else if (code) resolve({ code, state: parsed.searchParams.get('state') ?? '' });
          else        reject(new Error('OAuth callback missing code'));
        } catch (e) {
          reject(e);
        }
      }

      // Intercept the redirect before it tries to navigate to localhost
      authWindow.webContents.on('will-redirect',  (_e, url) => handleRedirectUrl(url));
      authWindow.webContents.on('will-navigate',  (_e, url) => handleRedirectUrl(url));
      authWindow.webContents.on('did-navigate',   (_e, url) => handleRedirectUrl(url));

      authWindow.on('closed', () => {
        clearTimeout(timeout);
        reject(new Error('Facebook login window was closed'));
      });

      authWindow.loadURL(authUrl);
    });
  });

  // ── OAuth: exchange auth code for access token ────────────────────────
  ipcMain.handle('facebook:exchange-token', async (_event, { tokenUrl, code, redirectUri }) => {
    const configJson = safeRead(CONFIG_PATH());
    if (!configJson) throw new Error('No Facebook App credentials stored. Set up credentials first.');
    const { appId, appSecret } = JSON.parse(configJson);

    const params = new URLSearchParams({
      client_id:     appId,
      client_secret: appSecret,
      redirect_uri:  redirectUri,
      code,
    });

    const response = await fetch(`${tokenUrl}?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${text}`);
    }

    const tokens = await response.json();

    // Normalise field names and persist
    const normalised = {
      accessToken: tokens.access_token,
      tokenType:   tokens.token_type ?? 'bearer',
      expiresAt:   tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
    };
    safeWrite(TOKEN_PATH(), normalised);

    return normalised;
  });

  // ── Tokens: refresh access token (stub — use long-lived tokens for now) ─
  ipcMain.handle('facebook:refresh-token', async () => {
    // Facebook user tokens can be exchanged for long-lived tokens via
    // /oauth/access_token?grant_type=fb_exchange_token
    // This stub can be implemented when short-lived tokens are in use.
    throw new Error('Token refresh not yet implemented — use long-lived tokens.');
  });

  // ── Tokens: load stored tokens ────────────────────────────────────────
  ipcMain.handle('facebook:load-tokens', () => {
    const json = safeRead(TOKEN_PATH());
    return json ? JSON.parse(json) : null;
  });

  // ── Tokens: clear stored tokens ───────────────────────────────────────
  ipcMain.handle('facebook:clear-tokens', () => {
    safeDelete(TOKEN_PATH());
  });

  // ── Config: save Facebook App credentials ─────────────────────────────
  ipcMain.handle('facebook:save-config', (_event, { appId, appSecret, adAccountId }) => {
    safeWrite(CONFIG_PATH(), { appId, appSecret, adAccountId });
  });

  // ── Config: load App ID and Ad Account ID (never expose secret) ───────
  ipcMain.handle('facebook:load-config', () => {
    const json = safeRead(CONFIG_PATH());
    if (!json) return null;
    const { appId, adAccountId } = JSON.parse(json);
    return { appId, adAccountId };
  });

  // ── Config: clear stored credentials ─────────────────────────────────
  ipcMain.handle('facebook:clear-config', () => {
    safeDelete(CONFIG_PATH());
  });

  // ── GDPR: check whether the user has accepted the privacy notice ──────
  ipcMain.handle('gdpr:check-consent', () => {
    const consentPath = CONSENT_PATH();
    if (!fs.existsSync(consentPath)) return { consented: false };
    try {
      const data = JSON.parse(fs.readFileSync(consentPath, 'utf8'));
      return { consented: !!data.consented };
    } catch {
      return { consented: false };
    }
  });

  // ── GDPR: record the user's consent ──────────────────────────────────
  ipcMain.handle('gdpr:set-consent', () => {
    fs.writeFileSync(CONSENT_PATH(), JSON.stringify({
      consented: true,
      version: '1.0',
      date: new Date().toISOString(),
    }), 'utf8');
  });

  // ── GDPR: delete all locally stored personal data ─────────────────────
  ipcMain.handle('gdpr:delete-all-data', () => {
    safeDelete(TOKEN_PATH());
    safeDelete(CONFIG_PATH());
    safeDelete(CONSENT_PATH());
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
