/**
 * @fileoverview Chart modal component for time-series performance visualisation.
 * Renders a full-screen overlay with an ECharts line chart, allowing the user to
 * select level (campaign / ad set), metric, date range, and up to five entities.
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';
import { InsightsApiService, type TimeSeriesInsightRow } from '../../../core/services/facebook/insights-api/insights-api.service';
import { AuthStore } from '../../../auth';

/** Metric keys available for chart selection. */
export type ChartMetric = 'spend' | 'impressions' | 'clicks' | 'ctr' | 'cpc' | 'cpm' | 'reach' | 'frequency';

/** Human-readable labels for each metric. */
const METRIC_LABELS: Record<ChartMetric, string> = {
  spend:       'Spend',
  impressions: 'Impressions',
  clicks:      'Clicks',
  ctr:         'CTR (%)',
  cpc:         'CPC',
  cpm:         'CPM',
  reach:       'Reach',
  frequency:   'Frequency',
};

/** Date range preset definitions. */
const DATE_RANGES: { key: '7d' | '14d' | '30d'; label: string; days: number }[] = [
  { key: '7d',  label: '7 days',  days: 7  },
  { key: '14d', label: '14 days', days: 14 },
  { key: '30d', label: '30 days', days: 30 },
];

/** Chart palette — up to 5 distinct colours for entity lines. */
const LINE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];

/** Max simultaneous entities that can be selected. */
const MAX_SELECTED = 5;

/** Computes a YYYY-MM-DD string offset by `days` from today. */
function offsetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Full-screen modal that renders a time-series ECharts line chart for
 * campaign or ad-set metrics across a selected date range.
 */
@Component({
  selector: 'app-chart-modal',
  imports: [NgxEchartsDirective],
  templateUrl: './chart-modal.component.html',
  styleUrl: './chart-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartModalComponent {
  /** Emitted when the user closes the modal. */
  @Output() readonly closed = new EventEmitter<void>();

  private readonly insightsApi = inject(InsightsApiService);
  private readonly authStore   = inject(AuthStore);

  // ── State signals ────────────────────────────────────────────────────────

  /** Whether the chart is fetching data. */
  protected readonly isLoading  = signal(false);
  /** Error message, or null when none. */
  protected readonly error      = signal<string | null>(null);
  /** Raw time-series rows from the API. */
  protected readonly rows       = signal<TimeSeriesInsightRow[]>([]);
  /** Currently selected level. */
  protected readonly level      = signal<'campaign' | 'adset'>('campaign');
  /** Currently selected metric. */
  protected readonly metric     = signal<ChartMetric>('spend');
  /** Currently selected date range preset. */
  protected readonly dateRange  = signal<'7d' | '14d' | '30d'>('14d');
  /** Entity IDs currently shown as chart lines (max 5). */
  protected readonly selectedIds = signal<Set<string>>(new Set());

  // ── Derived values ────────────────────────────────────────────────────────

  /** Ordered, deduplicated list of entities found in the fetched rows. */
  protected readonly entities = computed(() => {
    const map = new Map<string, string>();
    for (const r of this.rows()) {
      if (!map.has(r.entityId)) map.set(r.entityId, r.entityName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  });

  /** ECharts option object re-derived whenever metric, rows, or selection changes. */
  protected readonly chartOptions = computed((): EChartsOption => {
    const allDates  = [...new Set(this.rows().map(r => r.date))].sort();
    const metric    = this.metric();
    const ids       = this.selectedIds();
    const selected  = this.entities().filter(e => ids.has(e.id));

    if (selected.length === 0) {
      return {
        title: { text: 'Select entities from the left panel', left: 'center', top: 'middle', textStyle: { color: '#a8a29e', fontSize: 13, fontWeight: 400 } },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
      };
    }

    return {
      tooltip:   { trigger: 'axis' },
      legend:    { bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
      grid:      { left: 60, right: 20, top: 20, bottom: 60 },
      xAxis:     { type: 'category', data: allDates, axisLabel: { fontSize: 11 } },
      yAxis:     { type: 'value', name: METRIC_LABELS[metric], nameTextStyle: { fontSize: 11 } },
      color:     LINE_COLORS,
      series: selected.map(e => ({
        name: e.name,
        type: 'line' as const,
        smooth: true,
        data: allDates.map(d => {
          const row = this.rows().find(r => r.entityId === e.id && r.date === d);
          return row ? (row[metric] as number) : null;
        }),
        connectNulls: false,
      })),
    };
  });

  // ── Constants exposed to template ─────────────────────────────────────────

  /** All metric options for the radio list. */
  protected readonly metricOptions: { key: ChartMetric; label: string }[] = (
    Object.entries(METRIC_LABELS) as [ChartMetric, string][]
  ).map(([key, label]) => ({ key, label }));

  /** Date range options. */
  protected readonly dateRangeOptions = DATE_RANGES;

  constructor() {
    // Fetch when level or date range changes.
    effect(() => {
      const level     = this.level();
      const dateRange = this.dateRange();
      untracked(() => void this.fetchData(level, dateRange));
    });
  }

  /**
   * Fetches time-series data (or generates seed data when not authenticated or no
   * ad account is selected) and auto-selects the top 3 entities by total spend
   * when no selection exists yet.
   * @param level - Campaign or ad-set level.
   * @param dateRange - Date range preset key.
   */
  private async fetchData(level: 'campaign' | 'adset', dateRange: '7d' | '14d' | '30d'): Promise<void> {
    const days  = DATE_RANGES.find(d => d.key === dateRange)!.days;
    const until = offsetDate(0);
    const since = offsetDate(days);

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const canFetchLive = this.authStore.isAuthenticated() && !!this.authStore.adAccountId();
      const data = canFetchLive
        ? await this.insightsApi.getTimeSeriesInsights({ level, since, until })
        : this.generateSeedRows(level, days);

      this.rows.set(data);

      // Auto-select top 3 by total spend only when selection is empty.
      if (this.selectedIds().size === 0) {
        const spendById = new Map<string, number>();
        for (const r of data) {
          spendById.set(r.entityId, (spendById.get(r.entityId) ?? 0) + r.spend);
        }
        const top3 = [...spendById.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => id);
        this.selectedIds.set(new Set(top3));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load chart data.';
      this.error.set(msg);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Generates synthetic day-by-day rows matching the seeded test campaign/ad-set data.
   * Used when the user is not authenticated so the chart is still explorable.
   * Values are deterministic (no `Math.random`) so re-renders stay stable.
   * @param level - Campaign or ad-set level.
   * @param days - Number of days to generate rows for.
   * @returns Array of synthetic time-series rows.
   */
  private generateSeedRows(level: 'campaign' | 'adset', days: number): TimeSeriesInsightRow[] {
    const entities = level === 'campaign'
      ? [
          { id: 'seed-c-1', name: 'Summer Sale — Retargeting', spend: 20.26, impr: 3283, ctr: 1.81, cpc: 0.34, reach: 2364, cpm: 6.17, freq: 1.8 },
          { id: 'seed-c-2', name: 'Prospecting — UK',          spend:  8.70, impr: 1134, ctr: 1.68, cpc: 0.46, reach:  860, cpm: 7.67, freq: 4.2 },
        ]
      : [
          { id: 'seed-as-1', name: 'Retargeting — Website Visitors 30d', spend: 17.71, impr: 2677, ctr: 2.00, cpc: 0.34, reach: 1927, cpm: 6.61, freq: 1.7 },
          { id: 'seed-as-2', name: 'Retargeting — Website Visitors 7d',  spend:  2.55, impr:  607, ctr: 1.00, cpc: 0.42, reach:  437, cpm: 4.20, freq: 2.1 },
          { id: 'seed-as-3', name: 'Prospecting — UK — 25–44',          spend:  5.90, impr:  976, ctr: 1.72, cpc: 0.33, reach:  703, cpm: 6.05, freq: 4.2 },
          { id: 'seed-as-4', name: 'Lead Gen — Decision Makers',        spend:  2.80, impr:  140, ctr: 1.50, cpc: 1.34, reach:  101, cpm:20.00, freq: 3.8 },
        ];

    const rows: TimeSeriesInsightRow[] = [];

    for (let day = 0; day < days; day++) {
      const date = offsetDate(days - 1 - day);
      for (let ei = 0; ei < entities.length; ei++) {
        const e = entities[ei];
        // Deterministic variance: sine waves out of phase per entity give realistic shape
        const v1 = 0.78 + 0.44 * Math.abs(Math.sin((day * 0.7 + ei * 2.3)));
        const v2 = 0.80 + 0.40 * Math.abs(Math.cos((day * 0.5 + ei * 1.7)));
        const spend       = Math.round(e.spend * v1 * 100) / 100;
        const impressions = Math.round(e.impr  * v1);
        const ctr         = Math.round(e.ctr   * v2 * 100) / 100;
        const clicks      = Math.round(impressions * ctr / 100);
        const cpc         = clicks > 0 ? Math.round(spend / clicks * 100) / 100 : e.cpc;
        const reach       = Math.round(e.reach * v1);
        const cpm         = impressions > 0 ? Math.round(spend / impressions * 1000 * 100) / 100 : e.cpm;
        const frequency   = Math.round(e.freq * (0.85 + 0.30 * Math.abs(Math.sin(day * 0.4 + ei))) * 10) / 10;

        rows.push({ entityId: e.id, entityName: e.name, date, impressions, clicks, ctr, cpc, cpm, spend, reach, frequency });
      }
    }

    return rows;
  }

  /**
   * Loads deterministic seed rows for the current level and date range.
   * Clears any existing error so the chart recovers without needing a live API call.
   */
  protected loadSeedData(): void {
    const days = DATE_RANGES.find(d => d.key === this.dateRange())!.days;
    const data = this.generateSeedRows(this.level(), days);
    this.error.set(null);
    this.rows.set(data);
    this.selectedIds.set(new Set());
    const spendById = new Map<string, number>();
    for (const r of data) {
      spendById.set(r.entityId, (spendById.get(r.entityId) ?? 0) + r.spend);
    }
    const top3 = [...spendById.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    this.selectedIds.set(new Set(top3));
  }

  /**
   * Switches the reporting level and clears the entity selection so auto-select runs.
   * @param level - The new level to switch to.
   */
  protected setLevel(level: 'campaign' | 'adset'): void {
    this.selectedIds.set(new Set());
    this.level.set(level);
  }

  /**
   * Toggles an entity ID in the selected set (max 5 at once).
   * @param id - Entity ID to toggle.
   */
  protected toggleEntity(id: string): void {
    this.selectedIds.update(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTED) {
        next.add(id);
      }
      return next;
    });
  }

  /**
   * Returns true when an entity is currently selected.
   * @param id - Entity ID to check.
   */
  protected isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  /**
   * Returns true when the entity limit is reached and the given entity is not selected.
   * @param id - Entity ID to check.
   */
  protected isDisabled(id: string): boolean {
    return this.selectedIds().size >= MAX_SELECTED && !this.selectedIds().has(id);
  }
}
