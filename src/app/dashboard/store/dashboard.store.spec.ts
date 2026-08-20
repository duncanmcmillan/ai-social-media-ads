import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardStore } from './dashboard.store';

describe('DashboardStore', () => {
  let store: InstanceType<typeof DashboardStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    store = TestBed.inject(DashboardStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('has selectedPreset of last_30d', () => {
      expect(store.selectedPreset()).toBe('last_30d');
    });

    it('has isLoading false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('has no error', () => {
      expect(store.error()).toBeNull();
    });

    it('has empty campaigns', () => {
      expect(store.campaigns()).toEqual([]);
    });

    it('has empty ads', () => {
      expect(store.ads()).toEqual([]);
    });

    it('has empty events', () => {
      expect(store.events()).toEqual([]);
    });

    it('has empty gates', () => {
      expect(store.gates()).toEqual([]);
    });

    it('has empty recommendations', () => {
      expect(store.recommendations()).toEqual([]);
    });
  });

  describe('setPreset()', () => {
    it('updates selectedPreset', () => {
      store.setPreset('last_7d');
      expect(store.selectedPreset()).toBe('last_7d');
    });
  });

  describe('availablePresets()', () => {
    it('returns at least the free preset list', () => {
      const presets = store.availablePresets();
      expect(presets).toContain('today');
      expect(presets).toContain('yesterday');
      expect(presets).toContain('last_7d');
    });
  });

  describe('seedTestData()', () => {
    beforeEach(() => {
      store.seedTestData();
    });

    it('populates campaigns', () => {
      expect(store.campaigns().length).toBeGreaterThan(0);
    });

    it('populates ads', () => {
      expect(store.ads().length).toBeGreaterThan(0);
    });

    it('sets summary', () => {
      expect(store.summary()).not.toBeNull();
    });

    it('sets isLoading to false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('clears error', () => {
      expect(store.error()).toBeNull();
    });

    it('derives events from ad actions', () => {
      expect(store.events().length).toBeGreaterThan(0);
    });

    it('derives at least one gate', () => {
      expect(store.gates().length).toBeGreaterThan(0);
    });

    it('derives at least one recommendation', () => {
      expect(store.recommendations().length).toBeGreaterThan(0);
    });

    it('includes a fatigue gate', () => {
      const gates = store.gates();
      expect(gates.some(g => g.type === 'fatigue')).toBe(true);
    });

    it('includes a learning-phase gate', () => {
      const gates = store.gates();
      expect(gates.some(g => g.type === 'learning-phase')).toBe(true);
    });

    it('includes a low-roas gate', () => {
      const gates = store.gates();
      expect(gates.some(g => g.type === 'low-roas')).toBe(true);
    });

    it('links ads to their campaigns', () => {
      for (const campaign of store.campaigns()) {
        expect(campaign.ads.every(a => a.campaignId === campaign.campaignId)).toBe(true);
      }
    });
  });
});
