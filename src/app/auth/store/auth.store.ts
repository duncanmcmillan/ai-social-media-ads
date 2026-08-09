/**
 * @fileoverview NgRx Signal Store for Facebook authentication state.
 * Manages the access token, auth status, ad account selection, and user profile.
 */
import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { AdAccountStatus } from '../model/auth.model';
import type {
  FacebookTokens,
  FacebookConfig,
  FacebookUser,
  FacebookAdAccount,
  FacebookPage,
  FacebookPixel,
} from '../model/auth.model';

// ── Graph API helper ────────────────────────────────────────────────────────

const GRAPH_BASE = 'https://graph.facebook.com/v22.0';

/** Raw shape of a /me/adaccounts entry from the Graph API. */
interface RawAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business?: { name: string };
}

/**
 * Fetches the user's profile and accessible ad accounts from the Graph API.
 * Called after OAuth completes and on app startup when stored tokens exist.
 *
 * APIs:
 *  GET /me?fields=id,name
 *  GET /me/adaccounts?fields=id,name,currency,timezone_name,account_status,business&limit=50
 */
async function fetchUserData(accessToken: string): Promise<{
  user: FacebookUser | null;
  accounts: FacebookAdAccount[];
}> {
  const token = encodeURIComponent(accessToken);
  const [userRes, accountsRes] = await Promise.all([
    fetch(`${GRAPH_BASE}/me?fields=id,name&access_token=${token}`),
    fetch(`${GRAPH_BASE}/me/adaccounts?fields=id,name,currency,timezone_name,account_status,business&limit=50&access_token=${token}`),
  ]);

  let user: FacebookUser | null = null;
  if (userRes.ok) {
    const raw = await userRes.json() as { id: string; name: string };
    user = { id: raw.id, name: raw.name };
  } else {
    const err = await userRes.json().catch(() => ({})) as { error?: { message: string } };
    console.warn('[AuthStore] /me failed:', err?.error?.message ?? userRes.status);
  }

  let accounts: FacebookAdAccount[] = [];
  if (accountsRes.ok) {
    const raw = await accountsRes.json() as { data?: RawAdAccount[] };
    accounts = (raw.data ?? []).map(a => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      timezoneName: a.timezone_name,
      accountStatus: a.account_status as AdAccountStatus,
      businessName: a.business?.name,
    }));
  } else {
    const err = await accountsRes.json().catch(() => ({})) as { error?: { message: string } };
    const msg = err?.error?.message ?? `HTTP ${accountsRes.status}`;
    console.warn('[AuthStore] /me/adaccounts failed:', msg);
    throw new Error(`Could not load ad accounts: ${msg}`);
  }

  return { user, accounts };
}

// ── Store ───────────────────────────────────────────────────────────────────

/** Shape of the authentication store state. */
interface AuthState {
  /** Whether the user is authenticated with a valid access token. */
  isAuthenticated: boolean;
  /** The current Facebook access token, or null if not authenticated. */
  accessToken: string | null;
  /** The selected Ad Account ID shorthand, or null if not yet configured. */
  adAccountId: string | null;
  /** The Facebook App ID, or null if not yet configured. */
  appId: string | null;
  /** Whether an async auth operation is in progress. */
  isLoading: boolean;
  /** Error message from the most recent failed operation, or null. */
  error: string | null;
  /** Authenticated Facebook user profile, or null if not loaded. */
  user: FacebookUser | null;
  /** All ad accounts accessible to the authenticated user. */
  adAccounts: FacebookAdAccount[];
  /** The currently selected ad account, or null if not yet chosen. */
  selectedAccount: FacebookAdAccount | null;
  /** Whether the user has connected a TikTok account (future use). */
  tiktokConnected: boolean;
  /** Facebook Pages administered by the current user. */
  pages: FacebookPage[];
  /** Meta Pixels linked to the selected ad account. */
  pixels: FacebookPixel[];
  /** Whether a page-list fetch is in progress. */
  pagesLoading: boolean;
  /** Whether a pixel-list fetch is in progress. */
  pixelsLoading: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  adAccountId: null,
  appId: null,
  isLoading: false,
  error: null,
  user: null,
  adAccounts: [],
  selectedAccount: null,
  tiktokConnected: false,
  pages: [],
  pixels: [],
  pagesLoading: false,
  pixelsLoading: false,
};

type FacebookBridge = {
  loadTokens: () => Promise<FacebookTokens | null>;
  clearTokens: () => Promise<void>;
  loadConfig: () => Promise<FacebookConfig | null>;
  startOAuth: (authUrl: string) => Promise<{ code: string; state: string }>;
  exchangeToken: (tokenUrl: string, code: string, redirectUri: string) => Promise<FacebookTokens>;
  saveConfig: (appId: string, appSecret: string, adAccountId: string) => Promise<void>;
  saveAccountId: (adAccountId: string) => Promise<void>;
  clearConfig: () => Promise<void>;
};

const bridge = (window as unknown as { facebook?: FacebookBridge }).facebook ?? null;

/** Global authentication signal store. */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    /** True when app credentials and an ad account are both configured. */
    isConfigured: computed(() => !!store.appId() && !!store.selectedAccount()),
    /** Display name of the currently selected ad account, or null. */
    accountDisplayName: computed(() => store.selectedAccount()?.name ?? null),
  })),
  withMethods((store) => ({
    /**
     * Loads stored tokens and config from Electron's encrypted storage.
     * If a valid token is found, also fetches the user profile and ad accounts
     * from the Graph API and restores the previously selected account.
     */
    async loadStoredTokens(): Promise<void> {
      if (!bridge) return;
      patchState(store, { isLoading: true, error: null });
      try {
        const [tokens, config] = await Promise.all([bridge.loadTokens(), bridge.loadConfig()]);
        if (tokens?.accessToken) {
          patchState(store, {
            isAuthenticated: true,
            accessToken: tokens.accessToken,
            adAccountId: config?.adAccountId ?? null,
            appId: config?.appId ?? null,
          });
          // Restore user profile and ad accounts (non-fatal if API is unavailable)
          try {
            const { user, accounts } = await fetchUserData(tokens.accessToken);
            const selectedAccount = accounts.find(a => a.id === config?.adAccountId) ?? null;
            patchState(store, { user, adAccounts: accounts, selectedAccount });
          } catch {
            // Token is still valid; profile data will refresh on next explicit action
          }
        }
      } catch (e: unknown) {
        patchState(store, { error: e instanceof Error ? e.message : 'Failed to load auth state' });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    /**
     * Sets a manually-entered access token (e.g. from the Graph API Explorer).
     * Validates the token by fetching the user profile and ad accounts.
     * The token is held in memory only — it will not survive app restart.
     *
     * @param token - A valid Facebook access token with ads_management scope.
     */
    async setManualToken(token: string): Promise<void> {
      patchState(store, { isLoading: true, error: null });
      try {
        const { user, accounts } = await fetchUserData(token);
        const autoSelect = accounts.length === 1 ? accounts[0] : null;
        patchState(store, {
          isAuthenticated: true,
          accessToken: token,
          user,
          adAccounts: accounts,
          ...(autoSelect ? { selectedAccount: autoSelect, adAccountId: autoSelect.id } : {}),
          isLoading: false,
        });
        if (autoSelect) {
          bridge?.saveAccountId(autoSelect.id).catch(() => {});
        }
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Token validation failed — check scope and expiry',
          isAuthenticated: false,
          accessToken: null,
          isLoading: false,
        });
      }
    },

    /**
     * Signs the user out by clearing stored tokens and resetting profile state.
     */
    async signOut(): Promise<void> {
      if (bridge) {
        try {
          await bridge.clearTokens();
        } catch {
          // ignore — clear local state regardless
        }
      }
      patchState(store, {
        isAuthenticated: false,
        accessToken: null,
        user: null,
        adAccounts: [],
        selectedAccount: null,
        pages: [],
        pixels: [],
        error: null,
      });
    },

    /**
     * Clears all stored credentials and tokens (GDPR erasure).
     */
    async deleteAllData(): Promise<void> {
      if (bridge) {
        try {
          await bridge.clearTokens();
          await bridge.clearConfig();
        } catch {
          // ignore
        }
      }
      patchState(store, initialState);
    },

    /**
     * Sets an error message in the store.
     */
    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },

    /**
     * Stores the authenticated Facebook user's profile.
     */
    setUser(user: FacebookUser): void {
      patchState(store, { user });
    },

    /**
     * Replaces the full list of available ad accounts.
     */
    setAdAccounts(accounts: FacebookAdAccount[]): void {
      patchState(store, { adAccounts: accounts });
    },

    /**
     * Selects an ad account, syncs the adAccountId shorthand, and persists
     * the selection to encrypted storage (without requiring the App Secret again).
     */
    selectAccount(account: FacebookAdAccount): void {
      patchState(store, { selectedAccount: account, adAccountId: account.id });
      bridge?.saveAccountId(account.id).catch(() => {});
    },

    /**
     * Saves the App ID and App Secret to Electron's encrypted storage.
     * The App Secret never enters Angular state; only the App ID is retained.
     */
    async saveCredentials(appId: string, appSecret: string): Promise<void> {
      if (!bridge) return;
      patchState(store, { isLoading: true, error: null });
      try {
        await bridge.saveConfig(appId, appSecret, store.adAccountId() ?? '');
        patchState(store, { appId, isLoading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Failed to save credentials',
          isLoading: false,
        });
      }
    },

    /**
     * Starts the Facebook OAuth flow via the Electron bridge.
     * On success, fetches the user's profile and ad accounts automatically.
     * Auto-selects the account if only one is accessible.
     *
     * APIs called:
     *  facebook.com/v22.0/dialog/oauth → /oauth/access_token (via Electron main)
     *  GET /me?fields=id,name
     *  GET /me/adaccounts?fields=id,name,currency,timezone_name,account_status,business
     */
    async connectFacebook(): Promise<void> {
      if (!bridge) {
        patchState(store, { error: 'Facebook connection requires the desktop app.' });
        return;
      }
      const appId = store.appId();
      if (!appId) {
        patchState(store, { error: 'Save your App ID and App Secret before connecting.' });
        return;
      }
      patchState(store, { isLoading: true, error: null });
      const redirectUri = 'http://localhost:7331/callback';
      const scope = 'ads_management,ads_read,business_management,pages_read_engagement';
      const authUrl = [
        'https://www.facebook.com/v22.0/dialog/oauth',
        `?client_id=${appId}`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&scope=${scope}`,
        '&response_type=code',
      ].join('');
      try {
        const { code } = await bridge.startOAuth(authUrl);
        const tokenUrl = 'https://graph.facebook.com/v22.0/oauth/access_token';
        const tokens = await bridge.exchangeToken(tokenUrl, code, redirectUri);
        patchState(store, { isAuthenticated: true, accessToken: tokens.accessToken });

        // Fetch user profile and ad accounts immediately after OAuth
        try {
          const { user, accounts } = await fetchUserData(tokens.accessToken);
          const autoSelect = accounts.length === 1 ? accounts[0] : null;
          patchState(store, {
            user,
            adAccounts: accounts,
            ...(autoSelect ? { selectedAccount: autoSelect, adAccountId: autoSelect.id } : {}),
          });
          if (autoSelect) {
            bridge.saveAccountId(autoSelect.id).catch(() => {});
          }
        } catch (e: unknown) {
          // Surface the error — OAuth still succeeded so don't clear isAuthenticated
          patchState(store, { error: e instanceof Error ? e.message : 'Failed to load ad accounts' });
        }
        patchState(store, { isLoading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Facebook OAuth failed',
          isLoading: false,
        });
      }
    },

    /**
     * Re-fetches the list of ad accounts from the Graph API.
     * Used by the "Refresh accounts" button in the Account Details panel.
     *
     * API: GET /me/adaccounts?fields=id,name,currency,timezone_name,account_status,business
     */
    async refreshAdAccounts(): Promise<void> {
      const token = store.accessToken();
      if (!token) return;
      patchState(store, { isLoading: true, error: null });
      try {
        const { accounts } = await fetchUserData(token);
        patchState(store, { adAccounts: accounts, isLoading: false });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Failed to refresh ad accounts',
          isLoading: false,
        });
      }
    },

    /**
     * Fetches Facebook Pages administered by the current user.
     * API: GET /me/accounts?fields=id,name,category
     */
    async fetchPages(): Promise<void> {
      const token = store.accessToken();
      if (!token) return;
      patchState(store, { pagesLoading: true });
      try {
        const res = await fetch(
          `${GRAPH_BASE}/me/accounts?fields=id,name,category&limit=50&access_token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message: string } };
          console.warn('[AuthStore] /me/accounts failed:', err?.error?.message ?? res.status);
          return;
        }
        const raw = await res.json() as { data?: { id: string; name: string; category?: string }[] };
        patchState(store, {
          pages: (raw.data ?? []).map(p => ({ id: p.id, name: p.name, category: p.category })),
        });
      } catch (e: unknown) {
        console.warn('[AuthStore] fetchPages error:', e instanceof Error ? e.message : e);
      } finally {
        patchState(store, { pagesLoading: false });
      }
    },

    /**
     * Fetches Meta Pixels linked to the selected ad account.
     * API: GET /{ad-account-id}/adspixels?fields=id,name
     */
    async fetchPixels(adAccountId: string): Promise<void> {
      const token = store.accessToken();
      if (!token || !adAccountId) return;
      patchState(store, { pixelsLoading: true });
      try {
        const res = await fetch(
          `${GRAPH_BASE}/${adAccountId}/adspixels?fields=id,name&limit=50&access_token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: { message: string } };
          console.warn('[AuthStore] /adspixels failed:', err?.error?.message ?? res.status);
          return;
        }
        const raw = await res.json() as { data?: { id: string; name: string }[] };
        patchState(store, {
          pixels: (raw.data ?? []).map(p => ({ id: p.id, name: p.name })),
        });
      } catch (e: unknown) {
        console.warn('[AuthStore] fetchPixels error:', e instanceof Error ? e.message : e);
      } finally {
        patchState(store, { pixelsLoading: false });
      }
    },
  }))
);
