/**
 * @fileoverview NgRx Signal Store for Facebook authentication state.
 * Manages the access token, auth status, ad account selection, and user profile.
 */
import { computed } from '@angular/core';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import type {
  FacebookTokens,
  FacebookConfig,
  FacebookUser,
  FacebookAdAccount,
} from '../model/auth.model';

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
};

type FacebookBridge = {
  loadTokens: () => Promise<FacebookTokens | null>;
  clearTokens: () => Promise<void>;
  loadConfig: () => Promise<FacebookConfig | null>;
  startOAuth: (authUrl: string) => Promise<{ code: string; state: string }>;
  exchangeToken: (tokenUrl: string, code: string, redirectUri: string) => Promise<FacebookTokens>;
  saveConfig: (appId: string, appSecret: string, adAccountId: string) => Promise<void>;
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
     * Sets isAuthenticated to true if a valid token is found.
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
        }
      } catch (e: unknown) {
        patchState(store, { error: e instanceof Error ? e.message : 'Failed to load auth state' });
      } finally {
        patchState(store, { isLoading: false });
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
     * @param error - The error message to display.
     */
    setError(error: string): void {
      patchState(store, { error, isLoading: false });
    },

    /**
     * Stores the authenticated Facebook user's profile.
     * Called after a successful /me API response.
     */
    setUser(user: FacebookUser): void {
      patchState(store, { user });
    },

    /**
     * Replaces the full list of available ad accounts.
     * Called after a successful /me/adaccounts API response.
     */
    setAdAccounts(accounts: FacebookAdAccount[]): void {
      patchState(store, { adAccounts: accounts });
    },

    /**
     * Selects an ad account and syncs the adAccountId shorthand.
     * @param account - The account to activate.
     */
    selectAccount(account: FacebookAdAccount): void {
      patchState(store, { selectedAccount: account, adAccountId: account.id });
    },
  }))
);
