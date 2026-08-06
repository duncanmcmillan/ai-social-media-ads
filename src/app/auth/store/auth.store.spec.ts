import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

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
  });

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

  it('loadStoredTokens should be a no-op and leave state unchanged when bridge is absent (browser mode)', async () => {
    await store.loadStoredTokens();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.accessToken()).toBeNull();
  });

  it('signOut should clear isAuthenticated, accessToken, and error', async () => {
    // Set an error to confirm it gets cleared
    store.setError('stale error');
    await store.signOut();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.error()).toBeNull();
  });

  it('deleteAllData should reset the store to its initial state', async () => {
    store.setError('some error');
    await store.deleteAllData();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.accessToken()).toBeNull();
    expect(store.adAccountId()).toBeNull();
    expect(store.appId()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });
});
