import { TestBed } from '@angular/core/testing';
import { AppStore } from './app.store';

describe('AppStore', () => {
  let store: InstanceType<typeof AppStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AppStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have the correct initial state', () => {
    expect(store.selectedAdAccountId()).toBeNull();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('selectAdAccount should set the ad account ID', () => {
    store.selectAdAccount('act_1234567890');
    expect(store.selectedAdAccountId()).toBe('act_1234567890');
  });

  it('selectAdAccount should clear any existing error', () => {
    store.setError('Previous error');
    store.selectAdAccount('act_1234567890');
    expect(store.error()).toBeNull();
  });

  it('clearAdAccount should null out the selected account', () => {
    store.selectAdAccount('act_1234567890');
    store.clearAdAccount();
    expect(store.selectedAdAccountId()).toBeNull();
  });

  it('setError should store the message and mark loading as false', () => {
    store.setError('Something failed');
    expect(store.error()).toBe('Something failed');
    expect(store.isLoading()).toBe(false);
  });

  it('clearError should remove the current error', () => {
    store.setError('Something failed');
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
