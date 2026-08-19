const { app, BrowserWindow, ipcMain, shell, safeStorage, nativeTheme } = require('electron/main');
const path = require('node:path');
const fs   = require('node:fs');
const os   = require('node:os');
const { URL } = require('node:url');

// ── Paths ──────────────────────────────────────────────────────────────────
const TOKEN_PATH   = () => path.join(app.getPath('userData'), 'fb-tokens.enc');
const CONFIG_PATH  = () => path.join(app.getPath('userData'), 'fb-config.enc');
const AI_KEY_PATH  = () => path.join(app.getPath('userData'), 'ai-key.enc');
const CONSENT_PATH = () => path.join(app.getPath('userData'), 'gdpr-consent.json');
// NOTE: licence.enc is intentionally NOT deleted by gdpr:delete-all-data.
// It is a purchase record, not personal tracking data.
const LICENCE_PATH = () => path.join(app.getPath('userData'), 'licence.enc');

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

/** Strips markdown code fences from a Claude response before JSON.parse(). */
function stripCodeFences(text) {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
}

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

  // ── OAuth: open Electron BrowserWindow to handle the Facebook OAuth callback ──
  // Uses a GitHub Pages URL as the redirect URI so the flow works in Facebook
  // Live mode (localhost is dev-only; custom schemes like fb-ads:// are not
  // accepted by Facebook Login for Business).
  //
  // The GitHub Pages page does NOT need to exist — Electron intercepts the
  // will-redirect event before the BrowserWindow loads the page, extracts the
  // auth code, and closes the window via event.preventDefault().
  //
  // Register the CALLBACK_URI below as a Valid OAuth Redirect URI in the
  // Facebook app dashboard: App → Facebook Login for Business → Settings.
  ipcMain.handle('facebook:start-oauth', (_event, { authUrl }) => {
    return new Promise((resolve, reject) => {
      const CALLBACK_PREFIX = 'https://duncanmcmillan.github.io/ai-social-media-ads/oauth/callback';
      let settled = false;

      const authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        title: 'Connect Facebook',
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          authWindow.close();
          reject(new Error('OAuth timed out after 5 minutes'));
        }
      }, 5 * 60 * 1000);

      function handleCallbackUrl(event, url) {
        if (!url.startsWith(CALLBACK_PREFIX)) return;

        // Prevent the BrowserWindow from attempting to load the custom scheme.
        event.preventDefault();

        const parsed = new URL(url);
        const code   = parsed.searchParams.get('code');
        const error  = parsed.searchParams.get('error');
        const state  = parsed.searchParams.get('state') ?? '';

        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        authWindow.close();

        if (error) reject(new Error(`Facebook OAuth error: ${error}`));
        else if (code) resolve({ code, state });
        else           reject(new Error('OAuth callback missing code'));
      }

      authWindow.webContents.on('will-navigate', (e, url) => handleCallbackUrl(e, url));
      authWindow.webContents.on('will-redirect', (e, url) => handleCallbackUrl(e, url));

      authWindow.on('closed', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error('OAuth window was closed'));
        }
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

  // ── Tokens: revoke access token server-side ──────────────────────────
  // Called on sign-out and GDPR deletion so the token is invalidated at
  // Facebook's end, not just locally.  Best-effort — a network failure here
  // must not block the local sign-out.
  ipcMain.handle('facebook:revoke-token', async (_event, { accessToken }) => {
    try {
      const res = await fetch(
        `https://graph.facebook.com/me/permissions?access_token=${encodeURIComponent(accessToken)}`,
        { method: 'DELETE' }
      );
      return res.ok;
    } catch {
      return false;
    }
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

  // ── Config: update Ad Account ID without touching the App Secret ──────
  ipcMain.handle('facebook:save-account-id', (_event, { adAccountId }) => {
    const json = safeRead(CONFIG_PATH());
    if (!json) return;
    const config = JSON.parse(json);
    safeWrite(CONFIG_PATH(), { ...config, adAccountId });
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

  // ── AI: save Anthropic API key to encrypted storage ──────────────────
  ipcMain.handle('ai:save-api-key', (_event, { key }) => {
    safeWrite(AI_KEY_PATH(), key);
  });

  // ── AI: check whether an API key is stored (returns boolean) ─────────
  ipcMain.handle('ai:load-api-key', () => {
    return !!safeRead(AI_KEY_PATH());
  });

  // ── AI: generate campaign draft from a business/goal description ──────
  // Loads the stored API key internally — key never passes through renderer.
  ipcMain.handle('ai:generate-draft', async (_event, { prompt }) => {
    const raw = safeRead(AI_KEY_PATH());
    if (!raw) throw new Error('No Claude API key configured. Add it in Workspace → AI Settings.');
    const { default: Anthropic } = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: raw });
    const system = `You are a Facebook Ads expert. Given a business description or campaign goal, respond with ONLY a valid JSON object — no markdown, no code fences, no explanation.

The JSON must match this exact shape:
{
  "campaignName": "string",
  "objective": "OUTCOME_SALES | OUTCOME_TRAFFIC | OUTCOME_LEADS | OUTCOME_ENGAGEMENT | OUTCOME_AWARENESS | OUTCOME_APP_PROMOTION",
  "adSets": [
    {
      "name": "string",
      "targeting": { "countries": ["GB"], "minAge": 18, "maxAge": 65 },
      "optimizationGoal": "REACH | LINK_CLICKS | IMPRESSIONS | OFFSITE_CONVERSIONS | LEAD_GENERATION | PAGE_ENGAGEMENT | VALUE",
      "billingEvent": "IMPRESSIONS | LINK_CLICKS | APP_INSTALLS"
    }
  ]
}

Guidelines:
- Create 2–3 distinct ad sets targeting different audience segments
- Choose the objective that best matches the business goal
- Use sensible country codes (ISO 3166-1 alpha-2) and age ranges for the business type
- Ad set names should be descriptive (e.g. "25–34 Fitness Enthusiasts UK")`;
    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    return JSON.parse(stripCodeFences(text));
  });

  // ── AI: generate ad copy for a creative ──────────────────────────────
  ipcMain.handle('ai:generate-copy', async (_event, { context }) => {
    const raw = safeRead(AI_KEY_PATH());
    if (!raw) throw new Error('No Claude API key configured. Add it in Workspace → AI Settings.');
    const { default: Anthropic } = require('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: raw });
    const { campaignName, objective, fileName, tones, hook, length } = context;
    const charLimits = { Short: '125 chars', Medium: '200 chars', Long: '400 chars' };
    const system = `You are an expert Facebook ad copywriter. Respond with ONLY a valid JSON object — no markdown, no code fences, no explanation.

The JSON must match this exact shape:
{
  "primaryText": "string (${charLimits[length] ?? '200 chars'} max)",
  "headline": "string (40 chars max)",
  "description": "string (30 chars max)"
}`;
    const userMsg = `Campaign: ${campaignName}\nObjective: ${objective}\nCreative: ${fileName}\nTone: ${(tones ?? []).join(', ') || 'Professional'}\nHook: ${hook || 'None'}\nLength: ${length}`;
    const msg = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : '';
    return JSON.parse(stripCodeFences(text));
  });

  // ── Licence: activate a LemonSqueezy licence key on this machine ─────
  ipcMain.handle('licence:activate', async (_event, { key }) => {
    const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key, instance_name: os.hostname() }),
    });
    const data = await res.json();

    if (!res.ok || !data.activated) {
      const msg = data.error ?? data.license_key?.status ?? 'Invalid licence key.';
      throw new Error(msg);
    }

    const instanceId = data.instance?.id;
    const expiresAt  = data.license_key?.expires_at ?? null;

    safeWrite(LICENCE_PATH(), { key, instanceId, tier: 'pro', validatedAt: new Date().toISOString(), expiresAt });
    return { tier: 'pro', expiresAt };
  });

  // ── Licence: validate stored key on launch (with 7-day offline grace) ─
  ipcMain.handle('licence:validate', async () => {
    const GRACE_MS = 7 * 24 * 60 * 60 * 1000;

    const json = safeRead(LICENCE_PATH());
    if (!json) return { tier: 'free', expiresAt: null };

    let cached;
    try { cached = JSON.parse(json); } catch { return { tier: 'free', expiresAt: null }; }

    try {
      const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: cached.key, instance_id: cached.instanceId }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        safeDelete(LICENCE_PATH());
        return { tier: 'free', expiresAt: null };
      }

      // Update validatedAt timestamp so the grace period resets on each successful check.
      safeWrite(LICENCE_PATH(), { ...cached, validatedAt: new Date().toISOString() });
      return { tier: 'pro', expiresAt: cached.expiresAt ?? null };

    } catch (_networkErr) {
      // Offline — apply grace period.
      if (!cached.validatedAt) return { tier: 'free', expiresAt: null };
      const age = Date.now() - new Date(cached.validatedAt).getTime();
      return age <= GRACE_MS
        ? { tier: cached.tier ?? 'free', expiresAt: cached.expiresAt ?? null }
        : { tier: 'free', expiresAt: null };
    }
  });

  // ── Licence: deactivate on this machine (for moving to another device) ─
  ipcMain.handle('licence:deactivate', async () => {
    const json = safeRead(LICENCE_PATH());
    if (!json) return;
    let cached;
    try { cached = JSON.parse(json); } catch { safeDelete(LICENCE_PATH()); return; }

    try {
      await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: cached.key, instance_id: cached.instanceId }),
      });
    } finally {
      safeDelete(LICENCE_PATH());
    }
  });

  // ── Licence: read cached status without a network call ────────────────
  ipcMain.handle('licence:get-status', () => {
    const json = safeRead(LICENCE_PATH());
    if (!json) return { tier: 'free', expiresAt: null };
    try {
      const { tier, expiresAt } = JSON.parse(json);
      return { tier: tier ?? 'free', expiresAt: expiresAt ?? null };
    } catch {
      return { tier: 'free', expiresAt: null };
    }
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
    safeDelete(AI_KEY_PATH());
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
