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

    it('has selectedCampaignId of null', () => {
      expect(store.selectedCampaignId()).toBeNull();
    });

    it('has selectedFunnelLevel of all', () => {
      expect(store.selectedFunnelLevel()).toBe('all');
    });
  });

  describe('setPreset()', () => {
    it('updates selectedPreset', () => {
      store.setPreset('last_7d');
      expect(store.selectedPreset()).toBe('last_7d');
    });
  });

  describe('selectCampaign()', () => {
    it('sets selectedCampaignId to a specific id', () => {
      store.selectCampaign('c-123');
      expect(store.selectedCampaignId()).toBe('c-123');
    });

    it('resets selectedCampaignId to null', () => {
      store.selectCampaign('c-123');
      store.selectCampaign(null);
      expect(store.selectedCampaignId()).toBeNull();
    });
  });

  describe('selectFunnelLevel()', () => {
    it('sets selectedFunnelLevel to tofu', () => {
      store.selectFunnelLevel('tofu');
      expect(store.selectedFunnelLevel()).toBe('tofu');
    });

    it('sets selectedFunnelLevel back to all', () => {
      store.selectFunnelLevel('bofu');
      store.selectFunnelLevel('all');
      expect(store.selectedFunnelLevel()).toBe('all');
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

    it('adds reach to each campaign', () => {
      for (const campaign of store.campaigns()) {
        expect(typeof campaign.reach).toBe('number');
        expect(campaign.reach).toBeGreaterThan(0);
      }
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

    it('gates have severity values', () => {
      for (const gate of store.gates()) {
        expect(typeof gate.severity).toBe('number');
        expect(gate.severity).toBeGreaterThan(0);
      }
    });

    it('gates are sorted descending by severity', () => {
      const gates = store.gates();
      for (let i = 0; i < gates.length - 1; i++) {
        expect(gates[i].severity).toBeGreaterThanOrEqual(gates[i + 1].severity);
      }
    });

    it('recommendations have sourceType', () => {
      for (const rec of store.recommendations()) {
        expect(typeof rec.sourceType).toBe('string');
        expect(rec.sourceType.length).toBeGreaterThan(0);
      }
    });

    it('links ads to their campaigns', () => {
      for (const campaign of store.campaigns()) {
        expect(campaign.ads.every(a => a.campaignId === campaign.campaignId)).toBe(true);
      }
    });

    it('orderedCampaigns sorts worst-scoring campaign first', () => {
      const ordered = store.orderedCampaigns();
      // Prospecting (seed-c-2) has high-cpc ad → lower score than Retargeting
      expect(ordered[0].campaignId).toBe('seed-c-2');
    });

    it('funnelMetrics totalSpend matches sum of all ads', () => {
      const expectedSpend = store.ads().reduce((s, a) => s + a.spend, 0);
      expect(store.funnelMetrics().totalSpend).toBeCloseTo(expectedSpend, 2);
    });

    it('funnelMetrics tofu includes impressions and reach', () => {
      const metrics = store.funnelMetrics();
      expect(metrics.tofu.impressions).toBeGreaterThan(0);
      expect(metrics.tofu.reach).toBeGreaterThan(0);
    });

    it('funnelMetrics bofu includes purchases and leads', () => {
      const metrics = store.funnelMetrics();
      expect(metrics.bofu.purchases).toBeGreaterThan(0);
      expect(metrics.bofu.leads).toBeGreaterThan(0);
    });
  });

  describe('filteredAds()', () => {
    beforeEach(() => {
      store.seedTestData();
    });

    it('returns all ads when selectedCampaignId is null', () => {
      store.selectCampaign(null);
      expect(store.filteredAds().length).toBe(store.ads().length);
    });

    it('returns only ads for the selected campaign', () => {
      store.selectCampaign('seed-c-1');
      const filtered = store.filteredAds();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(a => a.campaignId === 'seed-c-1')).toBe(true);
    });

    it('excludes ads from other campaigns', () => {
      store.selectCampaign('seed-c-1');
      expect(store.filteredAds().some(a => a.campaignId === 'seed-c-2')).toBe(false);
    });
  });

  describe('funnel level filtering', () => {
    beforeEach(() => {
      store.seedTestData();
    });

    it('tofu filter shows only fatigue gates', () => {
      store.selectFunnelLevel('tofu');
      const gates = store.gates();
      expect(gates.every(g => g.type === 'fatigue')).toBe(true);
    });

    it('bofu filter shows only low-roas and learning-phase gates', () => {
      store.selectFunnelLevel('bofu');
      const gates = store.gates();
      expect(gates.every(g => g.type === 'low-roas' || g.type === 'learning-phase')).toBe(true);
    });

    it('mofu filter shows fatigue and learning-phase gates', () => {
      store.selectFunnelLevel('mofu');
      const gates = store.gates();
      expect(gates.every(g => g.type === 'fatigue' || g.type === 'learning-phase')).toBe(true);
    });

    it('tofu filter excludes low-ctr and high-cpc recommendations', () => {
      store.selectFunnelLevel('tofu');
      const recs = store.recommendations();
      expect(recs.every(r => r.sourceType !== 'low-ctr' && r.sourceType !== 'high-cpc')).toBe(true);
    });

    it('bofu filter excludes low-ctr and high-cpc recommendations', () => {
      store.selectFunnelLevel('bofu');
      const recs = store.recommendations();
      expect(recs.every(r => r.sourceType !== 'low-ctr' && r.sourceType !== 'high-cpc')).toBe(true);
    });

    it('mofu filter includes low-ctr and high-cpc recommendations', () => {
      store.selectFunnelLevel('mofu');
      const recs = store.recommendations();
      expect(recs.some(r => r.sourceType === 'low-ctr' || r.sourceType === 'high-cpc')).toBe(true);
    });

    it('all filter shows all gate types', () => {
      store.selectFunnelLevel('all');
      const gates = store.gates();
      const types = new Set(gates.map(g => g.type));
      expect(types.has('fatigue')).toBe(true);
      expect(types.has('learning-phase')).toBe(true);
      expect(types.has('low-roas')).toBe(true);
    });
  });
});
