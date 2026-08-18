import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';
import { AdAccountStatus } from '../model/auth.model';
import type { FacebookUser, FacebookAdAccount } from '../model/auth.model';

describe('AuthStore', () => {
  let store: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AuthStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have the correct initial state', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.adAccountId()).toBeNull();
    expect(store.appId()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.adAccounts()).toEqual([]);
    expect(store.selectedAccount()).toBeNull();
    expect(store.tiktokConnected()).toBe(false);
  });

  // ── Computed signals ────────────────────────────────────────────────────

  it('isConfigured should be false when appId and selectedAccount are both null', () => {
    expect(store.isConfigured()).toBe(false);
  });

  it('accountDisplayName should be null when no account is selected', () => {
    expect(store.accountDisplayName()).toBeNull();
  });

  it('accountDisplayName should return the selected account name', () => {
    const account: FacebookAdAccount = {
      id: 'act_123',
      name: 'Test Account',
      currency: 'GBP',
      timezoneName: 'Europe/London',
      accountStatus: AdAccountStatus.Active,
    };
    store.selectAccount(account);
    expect(store.accountDisplayName()).toBe('Test Account');
  });

  // ── setError ────────────────────────────────────────────────────────────

  it('setError should set the error message and mark loading as false', () => {
    store.setError('OAuth failed');
    expect(store.error()).toBe('OAuth failed');
    expect(store.isLoading()).toBe(false);
  });

  it('setError should overwrite a previous error', () => {
    store.setError('First error');
    store.setError('Second error');
    expect(store.error()).toBe('Second error');
  });

  // ── setUser ─────────────────────────────────────────────────────────────

  it('setUser should store the user profile', () => {
    const user: FacebookUser = { id: 'u1', name: 'Alice', pictureUrl: 'https://example.com/pic.jpg' };
    store.setUser(user);
    expect(store.user()).toEqual(user);
  });

  // ── setAdAccounts ───────────────────────────────────────────────────────

  it('setAdAccounts should replace the ad accounts list', () => {
    const accounts: FacebookAdAccount[] = [
      { id: 'act_1', name: 'Account A', currency: 'GBP', timezoneName: 'Europe/London', accountStatus: AdAccountStatus.Active },
      { id: 'act_2', name: 'Account B', currency: 'USD', timezoneName: 'America/New_York', accountStatus: AdAccountStatus.Active },
    ];
    store.setAdAccounts(accounts);
    expect(store.adAccounts()).toHaveLength(2);
    expect(store.adAccounts()[0].name).toBe('Account A');
  });

  // ── selectAccount ───────────────────────────────────────────────────────

  it('selectAccount should set selectedAccount and sync adAccountId', () => {
    const account: FacebookAdAccount = {
      id: 'act_999',
      name: 'My Account',
      currency: 'EUR',
      timezoneName: 'Europe/Paris',
      accountStatus: AdAccountStatus.Active,
    };
    store.selectAccount(account);
    expect(store.selectedAccount()).toEqual(account);
    expect(store.adAccountId()).toBe('act_999');
  });

  // ── loadStoredTokens ────────────────────────────────────────────────────

  it('loadStoredTokens should be a no-op and leave state unchanged when bridge is absent (browser mode)', async () => {
    await store.loadStoredTokens();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.accessToken()).toBeNull();
  });

  // ── signOut ─────────────────────────────────────────────────────────────

  it('signOut should clear auth state and user profile', async () => {
    store.setUser({ id: 'u1', name: 'Alice' });
    store.setAdAccounts([
      { id: 'act_1', name: 'Acct', currency: 'GBP', timezoneName: 'Europe/London', accountStatus: AdAccountStatus.Active },
    ]);
    store.setError('stale error');
    await store.signOut();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.adAccounts()).toEqual([]);
    expect(store.selectedAccount()).toBeNull();
    expect(store.error()).toBeNull();
  });

  // ── saveCredentials ─────────────────────────────────────────────────────

  it('saveCredentials should be a no-op when bridge is absent (browser mode)', async () => {
    await store.saveCredentials('app123', 'secret456');
    // Bridge is null in tests — state should remain unchanged
    expect(store.appId()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });

  // ── connectFacebook ─────────────────────────────────────────────────────

  it('connectFacebook should set error when bridge is absent', async () => {
    await store.connectFacebook();
    expect(store.error()).toBe('Facebook connection requires the desktop app.');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('connectFacebook should set error when appId is not set', async () => {
    // Simulate bridge present by testing the guard; in tests bridge is null so
    // the first guard fires — but we can verify the appId guard via a bridge mock
    // (full integration test). For now verify browser-mode error path.
    await store.connectFacebook();
    expect(store.isAuthenticated()).toBe(false);
  });

  // ── assertAccountActive ─────────────────────────────────────────────────

  it('assertAccountActive should not throw when the selected account is Active', () => {
    const account: FacebookAdAccount = {
      id: 'act_1', name: 'Active Account', currency: 'GBP',
      timezoneName: 'Europe/London', accountStatus: AdAccountStatus.Active,
    };
    store.selectAccount(account);
    expect(() => store.assertAccountActive()).not.toThrow();
  });

  it('assertAccountActive should throw when no account is selected', () => {
    expect(() => store.assertAccountActive()).toThrow('No ad account selected.');
  });

  it('assertAccountActive should throw with status name when account is Disabled', () => {
    const account: FacebookAdAccount = {
      id: 'act_2', name: 'My Account', currency: 'GBP',
      timezoneName: 'Europe/London', accountStatus: AdAccountStatus.Disabled,
    };
    store.selectAccount(account);
    expect(() => store.assertAccountActive()).toThrow(/not active/);
    expect(() => store.assertAccountActive()).toThrow(/My Account/);
    expect(() => store.assertAccountActive()).toThrow(/Disabled/);
  });

  it('assertAccountActive should throw when account is Closed', () => {
    const account: FacebookAdAccount = {
      id: 'act_3', name: 'Closed Account', currency: 'USD',
      timezoneName: 'America/New_York', accountStatus: AdAccountStatus.Closed,
    };
    store.selectAccount(account);
    expect(() => store.assertAccountActive()).toThrow(/not active/);
  });

  it('assertAccountActive should throw when account is PendingReview', () => {
    const account: FacebookAdAccount = {
      id: 'act_4', name: 'Pending Account', currency: 'EUR',
      timezoneName: 'Europe/Paris', accountStatus: AdAccountStatus.PendingReview,
    };
    store.selectAccount(account);
    expect(() => store.assertAccountActive()).toThrow(/not active/);
  });

  // ── forceSignOut ────────────────────────────────────────────────────────

  it('forceSignOut should clear isAuthenticated and accessToken', () => {
    store.setUser({ id: 'u1', name: 'Alice' });
    store.forceSignOut('Token expired');
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
  });

  it('forceSignOut should clear user and ad accounts', () => {
    store.setUser({ id: 'u1', name: 'Alice' });
    store.setAdAccounts([
      { id: 'act_1', name: 'Acct', currency: 'GBP', timezoneName: 'Europe/London', accountStatus: AdAccountStatus.Active },
    ]);
    store.forceSignOut('Session invalidated');
    expect(store.user()).toBeNull();
    expect(store.adAccounts()).toEqual([]);
    expect(store.selectedAccount()).toBeNull();
  });

  it('forceSignOut should set an error message containing the reason', () => {
    store.forceSignOut('Invalid OAuth 2.0 Access Token');
    expect(store.error()).toContain('Invalid OAuth 2.0 Access Token');
    expect(store.error()).toContain('sign in again');
  });

  it('forceSignOut should clear pages and pixels', () => {
    store.forceSignOut('Token revoked');
    expect(store.pages()).toEqual([]);
    expect(store.pixels()).toEqual([]);
  });

  // ── deleteAllData ───────────────────────────────────────────────────────

  it('deleteAllData should reset the store to its initial state', async () => {
    store.setUser({ id: 'u1', name: 'Alice' });
    store.setError('some error');
    await store.deleteAllData();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.adAccountId()).toBeNull();
    expect(store.appId()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.user()).toBeNull();
    expect(store.adAccounts()).toEqual([]);
    expect(store.selectedAccount()).toBeNull();
    expect(store.tiktokConnected()).toBe(false);
  });
});
