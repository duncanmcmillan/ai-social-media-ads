/**
 * @fileoverview Monitoring & Tools component.
 * Displays account-level summary metrics and a per-campaign breakdown table.
 * Data is fetched from the Facebook Insights API on demand and persisted in
 * MonitoringStore so results survive tab navigation.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthStore } from '../../auth';
import { MonitoringStore } from '../store/monitoring.store';
import type {
  CampaignInsightRow,
  DatePreset,
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

/** Sortable column keys for the campaign breakdown table. */
type SortCol = 'campaignName' | 'spend' | 'impressions' | 'reach' | 'clicks' | 'ctr' | 'cpc' | 'cpm';

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
  protected readonly monitoringStore = inject(MonitoringStore);

  protected readonly datePresets = DATE_PRESETS;
  protected readonly datePresetLabels = DATE_PRESET_LABELS;

  // ── Sorting (view-local — no need to persist in root store) ───────────────

  protected readonly sortCol = signal<SortCol>('spend');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');

  protected sortBy(col: SortCol): void {
    if (this.sortCol() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortCol.set(col);
      // Text columns default ascending; numeric columns default descending.
      this.sortDir.set(col === 'campaignName' ? 'asc' : 'desc');
    }
  }

  protected readonly sortedRows = computed(() => {
    const rows: CampaignInsightRow[] = [...this.monitoringStore.campaignRows()];
    const col = this.sortCol();
    const dir = this.sortDir() === 'asc' ? 1 : -1;

    return rows.sort((a, b) => {
      if (col === 'campaignName') {
        return dir * a.campaignName.localeCompare(b.campaignName);
      }
      return dir * (parseFloat(a[col]) - parseFloat(b[col]));
    });
  });

  /** Maximum spend across all rows — used to scale the inline spend bar. */
  protected readonly maxSpend = computed(() => {
    const rows = this.monitoringStore.campaignRows();
    if (rows.length === 0) return 0;
    return Math.max(...rows.map(r => parseFloat(r.spend) || 0));
  });

  /** Fraction (0–1) of the max spend for a row — drives the spend bar width. */
  protected spendFraction(row: CampaignInsightRow): number {
    const max = this.maxSpend();
    return max === 0 ? 0 : (parseFloat(row.spend) || 0) / max;
  }

  // ── Summary cards ─────────────────────────────────────────────────────────

  /** Account currency for formatting — falls back to USD. */
  private get currency(): string {
    return this.authStore.selectedAccount()?.currency ?? 'USD';
  }

  /** Metric card definitions derived from the store summary. */
  protected readonly cards = computed(() => {
    const s = this.monitoringStore.summary();
    if (!s) return [];
    const fmt  = (v: string) => this.fmtCurrency(parseFloat(v));
    const fmtN = (v: string) => this.fmtNumber(parseInt(v, 10));
    const fmtP = (v: string) => `${parseFloat(v).toFixed(2)}%`;
    return [
      { label: 'Spend',       value: fmt(s.spend),        sub: 'Total spend' },
      { label: 'Impressions', value: fmtN(s.impressions), sub: 'Total impressions' },
      { label: 'Reach',       value: fmtN(s.reach),       sub: 'Unique people' },
      { label: 'Clicks',      value: fmtN(s.clicks),      sub: 'Link clicks' },
      { label: 'CTR',         value: fmtP(s.ctr),         sub: 'Click-through rate' },
      { label: 'CPC',         value: fmt(s.cpc),           sub: 'Cost per click' },
      { label: 'CPM',         value: fmt(s.cpm),           sub: 'Per 1,000 impressions' },
    ];
  });

  // ── CSV export ────────────────────────────────────────────────────────────

  protected exportCsv(): void {
    const rows = this.sortedRows();
    if (rows.length === 0) return;

    const header = ['Campaign', 'Spend', 'Impressions', 'Reach', 'Clicks', 'CTR (%)', 'CPC', 'CPM'];
    const csv = [
      header.join(','),
      ...rows.map(r => [
        `"${r.campaignName.replace(/"/g, '""')}"`,
        r.spend,
        r.impressions,
        r.reach,
        r.clicks,
        r.ctr,
        r.cpc,
        r.cpm,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monitoring-${this.monitoringStore.selectedPreset()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Formatters ────────────────────────────────────────────────────────────

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
