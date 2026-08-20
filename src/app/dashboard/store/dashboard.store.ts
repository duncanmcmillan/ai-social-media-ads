/**
 * @fileoverview NgRx Signal Store for the Dashboard tab.
 * Fetches account-level, campaign-level, and ad-level insights in parallel,
 * evaluates ad verdicts, and derives gates and recommendations as computed signals.
 */
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { InsightsApiService, type InsightMetrics, type DatePreset } from '../../core/services/facebook/insights-api/insights-api.service';
import { AuthStore } from '../../auth';
import { LicenceStore, extractFacebookError } from '../../core';
import { WorkspaceStore } from '../../workspace';
import {
  evaluateAd,
  type AdDashboardRow,
  type CampaignDashboardRow,
  type EventAction,
  type Gate,
  type Recommendation,
} from '../model/dashboard.model';

/** Date presets available to all users. */
const FREE_PRESETS: DatePreset[] = ['today', 'yesterday', 'last_7d'];

/** All date presets, available to Pro users. */
const ALL_PRESETS: DatePreset[] = [
  'today', 'yesterday', 'last_7d', 'last_14d', 'last_28d',
  'last_30d', 'last_month', 'this_month', 'this_year',
];

/** Shape of the dashboard store state. */
interface DashboardState {
  /** Currently selected date preset. */
  selectedPreset: DatePreset;
  /** True while an API sync is in flight. */
  isLoading: boolean;
  /** Error message from the last failed sync, or null. */
  error: string | null;
  /** Account-level summary metrics, or null before first sync. */
  summary: InsightMetrics | null;
  /** Campaign rows with grouped ad data. */
  campaigns: CampaignDashboardRow[];
  /** Flat list of all ad rows (used for events, gates, recommendations). */
  ads: AdDashboardRow[];
}

const initialState: DashboardState = {
  selectedPreset: 'last_30d',
  isLoading: false,
  error: null,
  summary: null,
  campaigns: [],
  ads: [],
};

/**
 * Root-level dashboard store.
 * Persists fetched data across navigation so users do not need to re-sync
 * every time they return to the Dashboard tab.
 */
export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState<DashboardState>(initialState),

  // First computed pass: events, gates, and available presets
  withComputed((store) => {
    const workspaceStore = inject(WorkspaceStore);
    const licenceStore   = inject(LicenceStore);

    return {
      /**
       * Conversion events aggregated across all ads, de-duplicated by action type.
       * Used to populate the Conversions section.
       */
      events: computed((): EventAction[] => {
        const totals = new Map<string, number>();
        for (const ad of store.ads()) {
          for (const action of ad.actions) {
            totals.set(action.actionType, (totals.get(action.actionType) ?? 0) + action.value);
          }
        }
        return Array.from(totals.entries()).map(([actionType, value]) => ({ actionType, value }));
      }),

      /**
       * Gate alerts derived from campaign/ad metrics versus workspace thresholds.
       */
      gates: computed((): Gate[] => {
        const rules = workspaceStore.learningRules();
        const ads = store.ads();
        const campaigns = store.campaigns();
        const result: Gate[] = [];

        // Learning phase: total purchase/lead conversion events across all ads < 50.
        // Only bottom-of-funnel event types count; mid-funnel signals (view_content etc.) are excluded.
        const CONVERSION_ACTIONS = new Set([
          'purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase',
          'lead', 'offsite_conversion.fb_pixel_lead',
          'complete_registration', 'submit_application',
        ]);
        const totalConversions = ads.reduce((sum, ad) =>
          sum + ad.actions
            .filter(a => CONVERSION_ACTIONS.has(a.actionType))
            .reduce((s, a) => s + a.value, 0), 0);
        if (ads.length > 0 && totalConversions < 50) {
          result.push({
            type: 'learning-phase',
            label: 'Learning Phase',
            detail: `${Math.round(totalConversions)} / 50 conversions — generate more events to exit the learning phase.`,
          });
        }

        // Fatigue: campaign frequency above prospecting threshold
        for (const campaign of campaigns) {
          if (campaign.frequency > rules.prospectingFrequencyMax) {
            result.push({
              type: 'fatigue',
              label: 'Ad Fatigue',
              detail: `${campaign.campaignName} (Frequency: ${campaign.frequency.toFixed(1)})`,
            });
          }
        }

        // Low ROAS: ad purchase ROAS below the winner floor
        for (const ad of ads) {
          if (ad.purchaseRoas !== null && ad.purchaseRoas > 0 && ad.purchaseRoas < rules.winnerMinRoas) {
            result.push({
              type: 'low-roas',
              label: 'Low ROAS',
              detail: `${ad.adName} (ROAS: ${ad.purchaseRoas.toFixed(2)})`,
            });
          }
        }

        return result;
      }),

      /**
       * Date presets available to the current licence tier.
       * Free users are limited to the three shortest ranges.
       */
      availablePresets: computed((): DatePreset[] =>
        licenceStore.tier() === 'pro' ? ALL_PRESETS : FREE_PRESETS
      ),
    };
  }),

  // Second computed pass: recommendations depend on gates from the first pass
  withComputed((store) => ({
    /**
     * Rule-based action cards derived from ad verdicts and gate alerts.
     */
    recommendations: computed((): Recommendation[] => {
      const recs: Recommendation[] = [];

      for (const ad of store.ads()) {
        if (ad.verdict === 'low-ctr') {
          recs.push({
            label: `Refresh creative on ${ad.adName}`,
            detail: `CTR: ${ad.ctr.toFixed(2)}%`,
          });
        }
        if (ad.verdict === 'high-cpc') {
          recs.push({
            label: `Narrow audience targeting for ${ad.adName}`,
            detail: `CPC: ${ad.cpc.toFixed(2)}`,
          });
        }
      }

      for (const gate of store.gates()) {
        if (gate.type === 'fatigue') {
          recs.push({
            label: 'Rotate creatives or expand audience',
            detail: gate.detail,
          });
        }
        if (gate.type === 'low-roas') {
          recs.push({
            label: 'Review objective or targeting',
            detail: gate.detail,
          });
        }
        if (gate.type === 'learning-phase') {
          recs.push({
            label: 'Generate more conversions to exit learning phase',
            detail: gate.detail,
          });
        }
      }

      return recs;
    }),
  })),

  withMethods((store,
    insightsApi    = inject(InsightsApiService),
    authStore      = inject(AuthStore),
    workspaceStore = inject(WorkspaceStore),
  ) => ({
    /**
     * Updates the selected date preset.
     * @param preset - The new date preset to apply.
     */
    setPreset(preset: DatePreset): void {
      patchState(store, { selectedPreset: preset });
    },

    /**
     * Fetches account, campaign, and ad-level insights in parallel.
     * Evaluates ad verdicts against workspace learning rules and patches state.
     * @throws Never — errors are caught and stored in `error`.
     */
    async sync(): Promise<void> {
      patchState(store, { isLoading: true, error: null, summary: null, campaigns: [], ads: [] });
      try {
        const preset = store.selectedPreset();
        const [accountData, campaignData, adData] = await Promise.all([
          insightsApi.getAccountInsights(preset),
          insightsApi.getCampaignLevelInsights(preset),
          insightsApi.getAdLevelInsights(preset),
        ]);

        const currency = authStore.selectedAccount()?.currency ?? 'GBP';
        const rules = workspaceStore.learningRules();

        const ads: AdDashboardRow[] = adData.map(r => {
          const spend       = parseFloat(r.spend)         || 0;
          const impressions = parseInt(r.impressions, 10)  || 0;
          const ctr         = parseFloat(r.ctr)            || 0;
          const cpc         = parseFloat(r.cpc)            || 0;
          const frequency   = parseFloat(r.frequency ?? '0') || 0;
          const { verdict, reason } = evaluateAd({ spend, impressions, ctr, cpc }, rules, currency);

          return {
            adId:        r.adId,
            adName:      r.adName,
            campaignId:  r.campaignId ?? '',
            adSetId:     r.adSetId,
            adSetName:   r.adSetName,
            spend,
            impressions,
            clicks:      parseInt(r.clicks, 10) || 0,
            ctr,
            cpc,
            frequency,
            purchaseRoas: r.purchaseRoas ?? null,
            actions:     (r.actions ?? []) as EventAction[],
            verdict,
            reason,
          };
        });

        const campaigns: CampaignDashboardRow[] = campaignData.map(c => ({
          campaignId:   c.campaignId,
          campaignName: c.campaignName,
          spend:        parseFloat(c.spend)         || 0,
          impressions:  parseInt(c.impressions, 10)  || 0,
          clicks:       parseInt(c.clicks, 10)       || 0,
          ctr:          parseFloat(c.ctr)            || 0,
          cpc:          parseFloat(c.cpc)            || 0,
          frequency:    parseFloat(c.frequency ?? '0') || 0,
          ads:          ads.filter(a => a.campaignId === c.campaignId),
        }));

        patchState(store, {
          summary:   accountData[0] ?? null,
          campaigns,
          ads,
          isLoading: false,
        });
      } catch (e: unknown) {
        patchState(store, {
          error:     extractFacebookError(e, 'Failed to load dashboard data.'),
          isLoading: false,
        });
      }
    },

    /**
     * Populates the store with UK-themed synthetic data for browser-mode development.
     * No API calls, no authentication required.
     */
    seedTestData(): void {
      const dateStart = '2026-07-20';
      const dateStop  = '2026-08-19';

      const ads: AdDashboardRow[] = [
        // Campaign 1 — Retargeting (normal frequency)
        {
          adId: 'seed-ad-1', adName: 'Summer Sale — Image — UK',
          campaignId: 'seed-c-1', adSetId: 'seed-as-1', adSetName: 'Retargeting — Website Visitors 30d',
          spend: 312.40, impressions: 42100, clicks: 987, ctr: 2.34, cpc: 0.32, frequency: 1.8,
          purchaseRoas: 3.2,
          actions: [{ actionType: 'purchase', value: 5 }, { actionType: 'view_content', value: 120 }],
          verdict: 'winner', reason: 'Spend £312.40 with 2.34% CTR — meets winner criteria (min spend £100, min CTR 1.0%).',
        },
        {
          adId: 'seed-ad-2', adName: 'Summer Sale — Video — UK',
          campaignId: 'seed-c-1', adSetId: 'seed-as-1', adSetName: 'Retargeting — Website Visitors 30d',
          spend: 218.90, impressions: 38200, clicks: 612, ctr: 1.60, cpc: 0.36, frequency: 1.6,
          purchaseRoas: 2.8,
          actions: [{ actionType: 'purchase', value: 3 }, { actionType: 'view_content', value: 98 }],
          verdict: 'winner', reason: 'Spend £218.90 with 1.60% CTR — meets winner criteria (min spend £100, min CTR 1.0%).',
        },
        {
          adId: 'seed-ad-3', adName: 'Retargeting — Static — Visitors 7d',
          campaignId: 'seed-c-1', adSetId: 'seed-as-2', adSetName: 'Retargeting — Website Visitors 7d',
          spend: 76.40, impressions: 18200, clicks: 182, ctr: 1.00, cpc: 0.42, frequency: 2.1,
          purchaseRoas: null,
          actions: [],
          verdict: 'low-ctr', reason: 'CTR of 1.00% is below the 1.5% threshold set in Workspace Learning Rules.',
        },
        // Campaign 2 — Prospecting (high frequency → fatigue gate)
        {
          adId: 'seed-ad-4', adName: 'Brand Awareness — Carousel — 25–44',
          campaignId: 'seed-c-2', adSetId: 'seed-as-3', adSetName: 'Prospecting — UK — 25–44',
          spend: 164.50, impressions: 28900, clicks: 498, ctr: 1.72, cpc: 0.33, frequency: 4.2,
          purchaseRoas: null,
          actions: [{ actionType: 'lead', value: 12 }],
          verdict: 'ok', reason: 'Spend £164.50, CTR 1.72% — within normal range.',
        },
        {
          adId: 'seed-ad-5', adName: 'Lead Gen — Form — UK B2B',
          campaignId: 'seed-c-2', adSetId: 'seed-as-4', adSetName: 'Lead Gen — Decision Makers',
          spend: 84.10, impressions: 4200, clicks: 63, ctr: 1.50, cpc: 1.34, frequency: 3.8,
          purchaseRoas: 1.2,
          actions: [{ actionType: 'lead', value: 6 }],
          verdict: 'high-cpc', reason: 'CPC of £1.34 exceeds the £1.00 limit set in Workspace Learning Rules.',
        },
        {
          adId: 'seed-ad-6', adName: 'New Creative Test — Image — UK',
          campaignId: 'seed-c-2', adSetId: 'seed-as-3', adSetName: 'Prospecting — UK — 25–44',
          spend: 12.40, impressions: 930, clicks: 12, ctr: 1.29, cpc: 1.03, frequency: 1.2,
          purchaseRoas: null,
          actions: [],
          verdict: 'needs-data', reason: 'Spend £12.40 and 930 impressions — below thresholds (£50 spend / 1,000 impressions needed).',
        },
      ];

      const campaigns: CampaignDashboardRow[] = [
        {
          campaignId: 'seed-c-1', campaignName: 'Summer Sale — Retargeting',
          spend: 607.70, impressions: 98500, clicks: 1781, ctr: 1.81, cpc: 0.34, frequency: 1.8,
          ads: ads.filter(a => a.campaignId === 'seed-c-1'),
        },
        {
          campaignId: 'seed-c-2', campaignName: 'Prospecting — UK',
          spend: 261.00, impressions: 34030, clicks: 573, ctr: 1.68, cpc: 0.46, frequency: 4.2,
          ads: ads.filter(a => a.campaignId === 'seed-c-2'),
        },
      ];

      patchState(store, {
        isLoading: false,
        error: null,
        summary: {
          impressions: '132530', clicks: '2354', ctr: '1.78', cpc: '0.36', cpm: '6.50',
          spend: '868.70', reach: '89420', dateStart, dateStop,
        },
        campaigns,
        ads,
      });
    },
  }))
);
