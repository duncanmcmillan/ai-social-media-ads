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
    } else if (spend >= rules.winnerMinSpend && ctr >= 1.5) {
      verdict = 'winner';
      reason  = `Spend ${this.fmtCurrency(spend)} with ${this.fmtCtr(ctr)} CTR — meets winner criteria.`;
    } else if (ctr < 1.0) {
      verdict = 'low-ctr';
      reason  = `CTR of ${this.fmtCtr(ctr)} is below 1% target after sufficient impressions.`;
    } else if (cpc > 5.0) {
      // Flag high CPC as a rough signal; users can refine thresholds via learning rules
      verdict = 'high-cpc';
      reason  = `CPC of ${this.fmtCurrency(cpc)} is high. Consider narrowing audience or refreshing creative.`;
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
