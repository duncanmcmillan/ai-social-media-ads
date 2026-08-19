/**
 * @fileoverview Optimisation dashboard component.
 * Fetches per-ad insights and evaluates each ad against the workspace learning rules,
 * producing a verdict badge (Winner / Needs Data / Low CTR / High CPC / Paused).
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../auth';
import { WorkspaceStore } from '../../workspace';
import {
  InsightsApiService,
  type AdInsightRow,
  type DatePreset,
} from '../../core/services/facebook/insights-api/insights-api.service';

/** Date preset labels for the selector. */
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

const DATE_PRESETS: DatePreset[] = [
  'today', 'yesterday', 'last_7d', 'last_14d', 'last_28d',
  'last_30d', 'last_month', 'this_month', 'this_year',
];

/** The verdict assigned to each ad after evaluating learning rules. */
export type Verdict =
  | 'winner'
  | 'needs-data'
  | 'low-ctr'
  | 'high-cpc'
  | 'low-volume'
  | 'paused'
  | 'ok';

export interface AdVerdict {
  adId: string;
  adName: string;
  adSetName: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  verdict: Verdict;
  /** Human-readable explanation of the verdict. */
  reason: string;
}

/** Optimisation dashboard — evaluates per-ad insights against workspace learning rules. */
@Component({
  selector: 'app-optimisation',
  imports: [RouterLink],
  templateUrl: './optimisation.component.html',
  styleUrl: './optimisation.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptimisationComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  private readonly insightsApi = inject(InsightsApiService);

  protected readonly datePresets = DATE_PRESETS;
  protected readonly datePresetLabels = DATE_PRESET_LABELS;

  protected readonly selectedPreset = signal<DatePreset>('last_30d');
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly verdicts = signal<AdVerdict[]>([]);

  /** Account currency for formatting. */
  private get currency(): string {
    return this.authStore.selectedAccount()?.currency ?? 'USD';
  }

  /** Formats a currency value. */
  protected fmtCurrency(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /** Formats a number with thousands separators. */
  protected fmtNumber(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined).format(value);
  }

  /** Formats CTR as a percentage to 2 decimal places. */
  protected fmtCtr(value: number): string {
    return isNaN(value) ? '—' : `${value.toFixed(2)}%`;
  }

  /**
   * Evaluates an ad insight row against the workspace learning rules
   * and returns a verdict with a short explanation.
   */
  private evaluate(row: AdInsightRow): AdVerdict {
    const rules = this.workspaceStore.learningRules();
    const spend       = parseFloat(row.spend)       || 0;
    const impressions = parseInt(row.impressions, 10) || 0;
    const clicks      = parseInt(row.clicks, 10)     || 0;
    const ctr         = parseFloat(row.ctr)          || 0;
    const cpc         = parseFloat(row.cpc)          || 0;

    let verdict: Verdict;
    let reason: string;

    if (spend < rules.minSpend || impressions < rules.minImpressions) {
      verdict = 'needs-data';
      reason  = `Spend ${this.fmtCurrency(spend)} and ${this.fmtNumber(impressions)} impressions — below thresholds (${this.fmtCurrency(rules.minSpend)} spend / ${this.fmtNumber(rules.minImpressions)} impressions needed).`;
    } else if (spend >= rules.winnerMinSpend && ctr >= rules.minCtr) {
      verdict = 'winner';
      reason  = `Spend ${this.fmtCurrency(spend)} with ${this.fmtCtr(ctr)} CTR — meets winner criteria (min spend ${this.fmtCurrency(rules.winnerMinSpend)}, min CTR ${rules.minCtr}%).`;
    } else if (ctr < rules.minCtr) {
      verdict = 'low-ctr';
      reason  = `CTR of ${this.fmtCtr(ctr)} is below the ${rules.minCtr}% threshold set in Workspace Learning Rules.`;
    } else if (cpc > rules.maxCpc) {
      verdict = 'high-cpc';
      reason  = `CPC of ${this.fmtCurrency(cpc)} exceeds the ${this.fmtCurrency(rules.maxCpc)} limit set in Workspace Learning Rules.`;
    } else {
      verdict = 'ok';
      reason  = `Spend ${this.fmtCurrency(spend)}, CTR ${this.fmtCtr(ctr)} — within normal range.`;
    }

    return {
      adId:       row.adId,
      adName:     row.adName,
      adSetName:  row.adSetName,
      spend,
      impressions,
      clicks,
      ctr,
      cpc,
      verdict,
      reason,
    };
  }

  /** Populates the verdicts signal with synthetic data for development — no API calls required. */
  protected loadTestData(): void {
    this.verdicts.set([
      { adId: 'seed-1', adName: 'Summer Sale — Image — UK',           adSetName: 'Retargeting — Website Visitors 30d', spend: 312.40, impressions: 42100, clicks: 987, ctr: 2.34, cpc: 0.32, verdict: 'winner',     reason: 'Spend £312.40 with 2.34% CTR — meets winner criteria (min spend £100, min CTR 1.5%).' },
      { adId: 'seed-2', adName: 'Summer Sale — Video — UK',            adSetName: 'Retargeting — Website Visitors 30d', spend: 218.90, impressions: 38200, clicks: 612, ctr: 1.60, cpc: 0.36, verdict: 'winner',     reason: 'Spend £218.90 with 1.60% CTR — meets winner criteria (min spend £100, min CTR 1.5%).' },
      { adId: 'seed-3', adName: 'Brand Awareness — Carousel — 25–44', adSetName: 'Prospecting — UK — 25–44',           spend: 164.50, impressions: 28900, clicks: 498, ctr: 1.72, cpc: 0.33, verdict: 'ok',         reason: 'Spend £164.50, CTR 1.72% — within normal range.' },
      { adId: 'seed-4', adName: 'Prospecting — Video — 18–34',         adSetName: 'Prospecting — UK — 18–34',           spend: 98.20,  impressions: 12400, clicks: 198, ctr: 1.60, cpc: 0.50, verdict: 'ok',         reason: 'Spend £98.20, CTR 1.60% — within normal range.' },
      { adId: 'seed-5', adName: 'Retargeting — Static — Visitors 7d',  adSetName: 'Retargeting — Website Visitors 7d',  spend: 76.40,  impressions: 18200, clicks: 182, ctr: 1.00, cpc: 0.42, verdict: 'low-ctr',    reason: 'CTR of 1.00% is below the 1.5% threshold set in Workspace Learning Rules.' },
      { adId: 'seed-6', adName: 'DPA — Catalogue — All Products',       adSetName: 'DPA — All Products',                spend: 53.32,  impressions: 9800,  clicks: 88,  ctr: 0.90, cpc: 0.61, verdict: 'low-ctr',    reason: 'CTR of 0.90% is below the 1.5% threshold set in Workspace Learning Rules.' },
      { adId: 'seed-7', adName: 'Lead Gen — Form — UK B2B',             adSetName: 'Lead Gen — Decision Makers',        spend: 84.10,  impressions: 4200,  clicks: 63,  ctr: 1.50, cpc: 1.34, verdict: 'high-cpc',   reason: 'CPC of £1.34 exceeds the £1.00 limit set in Workspace Learning Rules.' },
      { adId: 'seed-8', adName: 'New Creative Test — Image — UK',       adSetName: 'Prospecting — UK — 25–44',          spend: 12.40,  impressions: 930,   clicks: 12,  ctr: 1.29, cpc: 1.03, verdict: 'needs-data', reason: 'Spend £12.40 and 930 impressions — below thresholds (£50 spend / 1,000 impressions needed).' },
    ]);
    this.error.set(null);
  }

  /** Fetches ad-level insights and evaluates each ad against learning rules. */
  protected async analyse(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    this.verdicts.set([]);
    try {
      const rows = await this.insightsApi.getAdLevelInsights(this.selectedPreset());
      this.verdicts.set(rows.map(r => this.evaluate(r)));
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load ad insights.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Returns the CSS class modifier for a verdict badge. */
  protected verdictClass(v: Verdict): string {
    return `verdict--${v}`;
  }

  /** Returns a short label for a verdict badge. */
  protected verdictLabel(v: Verdict): string {
    const labels: Record<Verdict, string> = {
      'winner':     'Winner',
      'needs-data': 'Needs Data',
      'low-ctr':    'Low CTR',
      'high-cpc':   'High CPC',
      'low-volume': 'Low Volume',
      'paused':     'Paused',
      'ok':         'On Track',
    };
    return labels[v] ?? v;
  }

  /** Summary counts per verdict type for the overview strip. */
  protected verdictCount(v: Verdict): number {
    return this.verdicts().filter(x => x.verdict === v).length;
  }
}
