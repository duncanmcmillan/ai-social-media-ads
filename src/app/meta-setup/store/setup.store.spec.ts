// Set up an in-memory localStorage mock before any module code runs.
// The test environment does not provide a full localStorage implementation.
const localStorageData: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem:    (key: string) => localStorageData[key] ?? null,
  setItem:    (key: string, value: string) => { localStorageData[key] = value; },
  removeItem: (key: string) => { delete localStorageData[key]; },
  clear:      () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); },
});

import { TestBed } from '@angular/core/testing';
import { SetupStore } from './setup.store';
import { SETUP_STEPS } from '../model/setup.model';

const STORAGE_KEY = 'ai-fb-ads:setup-progress';

describe('SetupStore', () => {
  let store: InstanceType<typeof SetupStore>;

  beforeEach(() => {
    Object.keys(localStorageData).forEach(k => delete localStorageData[k]);
    TestBed.configureTestingModule({ providers: [SetupStore] });
    store = TestBed.inject(SetupStore);
  });

  afterEach(() => {
    Object.keys(localStorageData).forEach(k => delete localStorageData[k]);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have correct initial state', () => {
    expect(store.completedSteps()).toEqual([]);
    expect(store.openStep()).toBe('business-portfolio');
    expect(store.businessPortfolioId()).toBe('');
    expect(store.manualAdAccountId()).toBe('');
    expect(store.isComplete()).toBe(false);
  });

  describe('completeStep()', () => {
    it('adds the key to completedSteps', () => {
      store.completeStep('business-portfolio');
      expect(store.completedSteps()).toContain('business-portfolio');
    });

    it('advances openStep to the next incomplete step', () => {
      store.completeStep('business-portfolio');
      expect(store.openStep()).toBe('developer-app');
    });

    it('does not add duplicate entries when called twice', () => {
      store.completeStep('business-portfolio');
      store.completeStep('business-portfolio');
      const count = store.completedSteps().filter(k => k === 'business-portfolio').length;
      expect(count).toBe(1);
    });

    it('sets openStep to null when all steps complete', () => {
      for (const step of SETUP_STEPS) {
        store.completeStep(step.key);
      }
      expect(store.openStep()).toBeNull();
    });

    it('persists to localStorage', () => {
      store.completeStep('business-portfolio');
      const raw = localStorageData[STORAGE_KEY];
      expect(raw).not.toBeUndefined();
      const parsed = JSON.parse(raw) as { completedSteps: string[] };
      expect(parsed.completedSteps).toContain('business-portfolio');
    });
  });

  describe('isComplete computed', () => {
    it('returns false when no steps are complete', () => {
      expect(store.isComplete()).toBe(false);
    });

    it('returns true only when all steps are complete', () => {
      for (const step of SETUP_STEPS) {
        expect(store.isComplete()).toBe(false);
        store.completeStep(step.key);
      }
      expect(store.isComplete()).toBe(true);
    });
  });

  describe('setOpenStep()', () => {
    it('expands the specified step', () => {
      store.setOpenStep('developer-app');
      expect(store.openStep()).toBe('developer-app');
    });

    it('collapses all steps when passed null', () => {
      store.setOpenStep('developer-app');
      store.setOpenStep(null);
      expect(store.openStep()).toBeNull();
    });

    it('persists to localStorage', () => {
      store.setOpenStep('pixel');
      const parsed = JSON.parse(localStorageData[STORAGE_KEY]) as { openStep: string };
      expect(parsed.openStep).toBe('pixel');
    });
  });

  describe('setBusinessPortfolioId()', () => {
    it('stores the provided ID', () => {
      store.setBusinessPortfolioId('bp-12345');
      expect(store.businessPortfolioId()).toBe('bp-12345');
    });

    it('persists to localStorage', () => {
      store.setBusinessPortfolioId('bp-12345');
      const parsed = JSON.parse(localStorageData[STORAGE_KEY]) as { businessPortfolioId: string };
      expect(parsed.businessPortfolioId).toBe('bp-12345');
    });
  });

  describe('setManualAdAccountId()', () => {
    it('stores the provided ID', () => {
      store.setManualAdAccountId('act_999');
      expect(store.manualAdAccountId()).toBe('act_999');
    });

    it('persists to localStorage', () => {
      store.setManualAdAccountId('act_999');
      const parsed = JSON.parse(localStorageData[STORAGE_KEY]) as { manualAdAccountId: string };
      expect(parsed.manualAdAccountId).toBe('act_999');
    });
  });

  describe('reset()', () => {
    it('clears completed steps', () => {
      store.completeStep('business-portfolio');
      store.completeStep('developer-app');
      store.reset();
      expect(store.completedSteps()).toEqual([]);
    });

    it('re-opens the first step', () => {
      store.setOpenStep(null);
      store.reset();
      expect(store.openStep()).toBe('business-portfolio');
    });

    it('clears reference IDs', () => {
      store.setBusinessPortfolioId('bp-123');
      store.setManualAdAccountId('act_456');
      store.reset();
      expect(store.businessPortfolioId()).toBe('');
      expect(store.manualAdAccountId()).toBe('');
    });

    it('persists the cleared state to localStorage', () => {
      store.completeStep('business-portfolio');
      store.reset();
      const parsed = JSON.parse(localStorageData[STORAGE_KEY]) as { completedSteps: string[] };
      expect(parsed.completedSteps).toEqual([]);
    });
  });
});
