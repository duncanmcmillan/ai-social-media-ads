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
