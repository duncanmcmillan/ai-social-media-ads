/**
 * @fileoverview NgRx Signal Store for the Monitoring tab.
 * Root-level store so fetched insights persist across tab navigation —
 * users do not need to re-fetch every time they return to the tab.
 */
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import {
  InsightsApiService,
  type CampaignInsightRow,
  type DatePreset,
  type InsightMetrics,
} from '../../core/services/facebook/insights-api/insights-api.service';

interface MonitoringState {
  selectedPreset: DatePreset;
  isLoading: boolean;
  error: string | null;
  summary: InsightMetrics | null;
  campaignRows: CampaignInsightRow[];
}

const initialState: MonitoringState = {
  selectedPreset: 'last_30d',
  isLoading: false,
  error: null,
  summary: null,
  campaignRows: [],
};

/** Persists monitoring insights data across navigation. */
export const MonitoringStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, insightsApi = inject(InsightsApiService)) => ({
    setPreset(preset: DatePreset): void {
      patchState(store, { selectedPreset: preset });
    },
    /** Populates the store with synthetic data for development — no API calls required. */
    seedTestData(): void {
      const dateStart = '2026-07-20';
      const dateStop  = '2026-08-19';
      patchState(store, {
        isLoading: false,
        error: null,
        summary: {
          spend: '847.32', impressions: '124530', reach: '89420',
          clicks: '2341', ctr: '1.88', cpc: '0.36', cpm: '6.80',
          dateStart, dateStop,
        },
        campaignRows: [
          { campaignId: 'seed-1', campaignName: 'Summer Sale — Retargeting',  spend: '312.40', impressions: '42100', reach: '31200', clicks: '987', ctr: '2.34', cpc: '0.32', cpm: '7.42', dateStart, dateStop },
          { campaignId: 'seed-2', campaignName: 'Brand Awareness — UK',        spend: '218.90', impressions: '38200', reach: '29400', clicks: '612', ctr: '1.60', cpc: '0.36', cpm: '5.73', dateStart, dateStop },
          { campaignId: 'seed-3', campaignName: 'Prospecting — 18–34',         spend: '164.50', impressions: '28900', reach: '21800', clicks: '498', ctr: '1.72', cpc: '0.33', cpm: '5.69', dateStart, dateStop },
          { campaignId: 'seed-4', campaignName: 'DPA — Catalogue',             spend: '98.20',  impressions: '12400', reach: '9800',  clicks: '198', ctr: '1.60', cpc: '0.50', cpm: '7.92', dateStart, dateStop },
          { campaignId: 'seed-5', campaignName: 'Lead Gen — UK B2B',           spend: '53.32',  impressions: '2930',  reach: '2220',  clicks: '46',  ctr: '1.57', cpc: '1.16', cpm: '18.20', dateStart, dateStop },
        ],
      });
    },

    async sync(): Promise<void> {
      patchState(store, { isLoading: true, error: null, summary: null, campaignRows: [] });
      try {
        const [accountData, campaignData] = await Promise.all([
          insightsApi.getAccountInsights(store.selectedPreset()),
          insightsApi.getCampaignLevelInsights(store.selectedPreset()),
        ]);
        patchState(store, {
          summary: accountData[0] ?? null,
          campaignRows: campaignData,
        });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Failed to load insights.',
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },
  }))
);
