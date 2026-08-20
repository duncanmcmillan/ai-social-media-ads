/**
 * @fileoverview Dashboard component — the primary operational view.
 * Displays a card-based layout covering launched campaigns and ads,
 * conversion events, mid-funnel metrics, volume, gate alerts, and
 * rule-based recommendations.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthStore } from '../../auth';
import { LicenceStore } from '../../core';
import { DashboardStore } from '../store/dashboard.store';
import type { Verdict } from '../model/dashboard.model';

/** Human-readable labels for each date preset. */
const DATE_PRESET_LABELS: Record<string, string> = {
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

/** Human-readable labels for Facebook action type identifiers. */
const ACTION_TYPE_LABELS: Record<string, string> = {
  purchase:                                    'Purchases',
  omni_purchase:                               'Purchases',
  'offsite_conversion.fb_pixel_purchase':      'Purchases',
  lead:                                        'Leads',
  'offsite_conversion.fb_pixel_lead':          'Leads',
  complete_registration:                       'Registrations',
  view_content:                                'Content Views',
  add_to_cart:                                 'Add to Cart',
  initiate_checkout:                           'Checkout Started',
};

/** Human-readable short labels for each verdict type. */
const VERDICT_LABELS: Record<Verdict, string> = {
  winner:       'Winner',
  'needs-data': 'Needs Data',
  'low-ctr':    'Low CTR',
  'high-cpc':   'High CPC',
  'low-volume': 'Low Volume',
  paused:       'Paused',
  ok:           'On Track',
};

/**
 * Dashboard component providing a high-level at-a-glance operational view
 * of all launched campaigns, ads, conversion events, performance metrics,
 * gate alerts, and actionable recommendations.
 */
@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store          = inject(DashboardStore);
  protected readonly authStore      = inject(AuthStore);
  protected readonly licenceStore   = inject(LicenceStore);

  protected readonly datePresetLabels = DATE_PRESET_LABELS;

  /** True when campaign data is loaded and ready to display. */
  protected readonly hasCampaigns = computed(() => this.store.campaigns().length > 0);

  /** Account currency used for number formatting. */
  private get currency(): string {
    return this.authStore.selectedAccount()?.currency ?? 'GBP';
  }

  /**
   * Formats a monetary value in the account currency.
   * @param value - The numeric value to format.
   * @returns A currency-formatted string, or '—' for NaN.
   */
  protected fmtCurrency(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Formats a number with thousands separators.
   * @param value - The numeric value to format.
   * @returns A formatted number string, or '—' for NaN.
   */
  protected fmtNumber(value: number): string {
    if (isNaN(value)) return '—';
    return new Intl.NumberFormat(undefined).format(value);
  }

  /**
   * Formats a CTR value as a percentage string.
   * @param value - CTR as a decimal percentage.
   * @returns A string like '2.34%', or '—' for NaN.
   */
  protected fmtCtr(value: number): string {
    return isNaN(value) ? '—' : `${value.toFixed(2)}%`;
  }

  /**
   * Returns a human-readable label for a Facebook action type identifier.
   * Falls back to title-casing the raw identifier when no mapping exists.
   * @param actionType - The raw Facebook action_type string.
   * @returns A user-friendly label.
   */
  protected formatActionType(actionType: string): string {
    return ACTION_TYPE_LABELS[actionType]
      ?? actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Returns the short display label for a verdict.
   * @param verdict - The verdict type.
   * @returns A label string.
   */
  protected verdictLabel(v: Verdict): string {
    return VERDICT_LABELS[v] ?? v;
  }

  /**
   * Returns the CSS class modifier for a verdict badge.
   * @param verdict - The verdict type.
   * @returns A BEM modifier class string.
   */
  protected verdictClass(v: Verdict): string {
    return `verdict--${v}`;
  }

  /**
   * Updates the date preset and triggers a new sync if authenticated.
   * @param preset - The raw value from the select element.
   */
  protected onPresetChange(preset: string): void {
    this.store.setPreset(preset as Parameters<typeof this.store.setPreset>[0]);
  }

  /**
   * Triggers a full data sync from all Insights API endpoints.
   * @returns Promise that resolves once the sync completes.
   */
  protected async sync(): Promise<void> {
    await this.store.sync();
  }
}
