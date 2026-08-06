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
