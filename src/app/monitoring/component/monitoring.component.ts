/**
 * @fileoverview Monitoring & Tools component.
 * Displays account-level summary metrics and a per-campaign breakdown table.
 * Data is fetched from the Facebook Insights API on demand.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../auth';
import {
  InsightsApiService,
  type CampaignInsightRow,
  type DatePreset,
  type InsightMetrics,
} from '../../core/services/facebook/insights-api/insights-api.service';

/** Human-readable labels for each date preset. */
const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today:       'Today',
  yesterday:   'Yesterday',
  last_7d:     'Last 7 days',
  last_14d:    'Last 14 days',
  last_28d:    'Last 28 days',
  last_30d:    'Last 30 days',
  last_month:  'Last month',
  this_month:  'This month',
  this_year:   'This year',
};

/** Ordered list of available date presets for the selector. */
const DATE_PRESETS: DatePreset[] = [
  'today', 'yesterday', 'last_7d', 'last_14d', 'last_28d',
  'last_30d', 'last_month', 'this_month', 'this_year',
];

/** Performance monitoring dashboard. */
@Component({
  selector: 'app-monitoring',
  imports: [],
  templateUrl: './monitoring.component.html',
  styleUrl: './monitoring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly insightsApi = inject(InsightsApiService);

  protected readonly datePresets = DATE_PRESETS;
  protected readonly datePresetLabels = DATE_PRESET_LABELS;

  protected readonly selectedPreset = signal<DatePreset>('last_30d');
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Account-level summary metrics (null until first fetch). */
  protected readonly summary = signal<InsightMetrics | null>(null);

  /** Per-campaign breakdown rows. */
  protected readonly campaignRows = signal<CampaignInsightRow[]>([]);

  /** Account currency for formatting — falls back to USD. */
  private get currency(): string {
    return this.authStore.selectedAccount()?.currency ?? 'USD';
  }

  /** Metric card definitions derived from summary signal. */
  protected readonly cards = computed(() => {
    const s = this.summary();
    if (!s) return [];
    const fmt = (v: string) => this.fmtCurrency(parseFloat(v));
    const fmtN = (v: string) => this.fmtNumber(parseInt(v, 10));
    const fmtPct = (v: string) => `${parseFloat(v).toFixed(2)}%`;
    return [
      { label: 'Spend',       value: fmt(s.spend),                  sub: 'Total spend' },
      { label: 'Impressions', value: fmtN(s.impressions),           sub: 'Total impressions' },
      { label: 'Reach',       value: fmtN(s.reach),                 sub: 'Unique people' },
      { label: 'Clicks',      value: fmtN(s.clicks),                sub: 'Link clicks' },
      { label: 'CTR',         value: fmtPct(s.ctr),                 sub: 'Click-through rate' },
      { label: 'CPC',         value: fmt(s.cpc),                    sub: 'Cost per click' },
      { label: 'CPM',         value: fmt(s.cpm),                    sub: 'Per 1,000 impressions' },
    ];
  });

  /** Fetches account summary and per-campaign insights. */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    this.summary.set(null);
    this.campaignRows.set([]);
    const preset = this.selectedPreset();
    try {
      const [accountData, campaignData] = await Promise.all([
        this.insightsApi.getAccountInsights(preset),
        this.insightsApi.getCampaignLevelInsights(preset),
      ]);
      this.summary.set(accountData[0] ?? null);
      this.campaignRows.set(campaignData);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load insights.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Formats a currency value using the selected account's currency. */
  protected fmtCurrency(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /** Formats a large integer with locale-appropriate thousands separators. */
  protected fmtNumber(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined).format(value);
  }

  /** Formats a CTR percentage string to 2 decimal places. */
  protected fmtCtr(value: string): string {
    const n = parseFloat(value);
    return isNaN(n) ? '—' : `${n.toFixed(2)}%`;
  }
}
