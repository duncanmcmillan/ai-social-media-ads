/**
 * @fileoverview Dashboard component — the primary operational view.
 * Displays a 4-column layout covering launched campaigns and ads,
 * funnel metrics, gate alerts, and rule-based recommendations.
 */
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { AuthStore } from '../../auth';
import { LicenceStore, SchedulerService } from '../../core';
import { WorkspaceStore } from '../../workspace';
import { DashboardStore } from '../store/dashboard.store';
import { GuidePanelComponent, MetricsGuidePanelComponent, GuidesStore } from '../../guides';
import {
  gateKey,
  worstVerdict,
  type CampaignDashboardRow,
  type FunnelLevel,
  type Gate,
  type GateSlackStatus,
  type GateType,
  type Verdict,
} from '../model/dashboard.model';

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

/** CSS colour token for each verdict (maps to :host CSS custom properties). */
const VERDICT_COLORS: Partial<Record<Verdict, string>> = {
  winner:    'var(--col-winner)',
  ok:        'var(--col-ok)',
  'low-ctr': 'var(--col-low-ctr)',
  'high-cpc': 'var(--col-high-cpc)',
};

/**
 * Dashboard component providing a high-level at-a-glance operational view
 * of all launched campaigns and ads, funnel metrics, performance gate alerts,
 * and actionable recommendations in a 4-column operational layout.
 */
@Component({
  selector: 'app-dashboard',
  imports: [GuidePanelComponent, MetricsGuidePanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store            = inject(DashboardStore);
  protected readonly authStore        = inject(AuthStore);
  protected readonly licenceStore     = inject(LicenceStore);
  protected readonly workspaceStore   = inject(WorkspaceStore);
  protected readonly guidesStore      = inject(GuidesStore);
  protected readonly schedulerService = inject(SchedulerService);

  protected readonly datePresetLabels = DATE_PRESET_LABELS;

  /** Controls visibility of the Marketing Guide slide-over panel. */
  protected readonly guidePanelOpen = signal(false);

  /** Controls visibility of the Metrics Contextual Guide slide-over panel. */
  protected readonly metricsGuidePanelOpen = signal(false);

  /** Currently selected gate index for gate→recommendation linking. */
  protected readonly selectedGateIndex = signal<number | null>(null);

  /** True when campaign data is loaded and ready to display. */
  protected readonly hasCampaigns = computed(() => this.store.campaigns().length > 0);

  /** Funnel level options for the column 2 toggle. */
  protected readonly funnelLevels: { key: FunnelLevel; label: string }[] = [
    { key: 'all',  label: 'All'  },
    { key: 'tofu', label: 'TOFU' },
    { key: 'mofu', label: 'MOFU' },
    { key: 'bofu', label: 'BOFU' },
  ];

  constructor() {
    // Reset selected gate when campaign or funnel filter changes.
    effect(() => {
      this.store.selectedCampaignId();
      this.store.selectedFunnelLevel();
      untracked(() => this.selectedGateIndex.set(null));
    });

    // Background guide generation: triggers whenever App Type (Workspace) or
    // primary campaign Objective changes, provided we are Pro and not already generating.
    effect(() => {
      const appType   = this.workspaceStore.appType();
      const objective = this.store.primaryObjective();
      untracked(() => {
        if (appType && objective && this.licenceStore.tier() === 'pro' && !this.guidesStore.isGenerating()) {
          void this.generateGuide(appType, objective);
        }
      });
    });
  }

  /**
   * Triggers background guide generation with the current dashboard context.
   * @param appType - Workspace app type setting.
   * @param objective - Primary campaign objective.
   */
  private async generateGuide(appType: string, objective: string): Promise<void> {
    await this.guidesStore.generate({
      appType:       appType as Parameters<typeof this.guidesStore.generate>[0]['appType'],
      objective:     objective as Parameters<typeof this.guidesStore.generate>[0]['objective'],
      gates:         this.store.gates().map(g => g.label),
      totalSpend:    this.store.funnelMetrics().totalSpend,
      campaignCount: this.store.campaigns().length,
    });
  }

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
   * Formats a nullable decimal value as a percentage string.
   * @param value - Decimal percentage or null.
   * @returns A formatted string, or '—' for null/NaN.
   */
  protected fmtPercent(value: number | null): string {
    if (value === null || isNaN(value)) return '—';
    return `${value.toFixed(2)}%`;
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
   * Loads synthetic test data and resets the known-gates set so that all gates
   * are treated as newly breached on the next Update, enabling Slack testing.
   */
  protected seedTestData(): void {
    this.store.seedTestData();
    this.schedulerService.clearKnownGates();
  }

  /**
   * Triggers an immediate sync via the SchedulerService (notifies main process
   * and runs the full sync + Slack diff pipeline).
   * @returns Promise that resolves once the sync completes.
   */
  protected async syncNow(): Promise<void> {
    await this.schedulerService.syncNow();
  }

  /**
   * Returns the display text for a Slack delivery status badge.
   * @param status - The current delivery status.
   * @returns A short label string.
   */
  protected slackBadgeText(status: GateSlackStatus): string {
    switch (status) {
      case 'sending': return '↗ Slack';
      case 'sent':    return '✓ Slack';
      case 'error':   return '✗ Slack';
    }
  }

  /**
   * Formats a Date as HH:MM in the user's local time zone.
   * @param date - The date to format.
   * @returns A string like "14:35".
   */
  protected fmtTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Returns the deduplication key for a gate (delegates to the model helper).
   * Exposed as a protected method so the template can call it.
   * @param gate - The gate to key.
   * @returns The gate's stable string key.
   */
  protected gateKeyOf(gate: Gate): string {
    return gateKey(gate);
  }

  /**
   * Returns the inline left-border CSS colour for a campaign card based on its worst ad verdict.
   * @param campaign - The campaign row to colour.
   * @returns A CSS colour string.
   */
  protected campaignBorderColor(campaign: CampaignDashboardRow): string {
    const verdict = worstVerdict(campaign);
    if (!verdict) return 'var(--neutral-300)';
    return VERDICT_COLORS[verdict] ?? 'var(--neutral-300)';
  }

  /**
   * Returns the CSS class for a frequency KPI chip based on proximity to the fatigue threshold.
   * @param freq - The campaign frequency value.
   * @returns A modifier class name, or empty string when below 70% of threshold.
   */
  protected freqClass(freq: number): string {
    const max = this.workspaceStore.learningRules().prospectingFrequencyMax;
    if (freq >= max) return 'kpi-freq--red';
    if (freq >= max * 0.7) return 'kpi-freq--amber';
    return '';
  }

  /**
   * Toggles the selected gate index for gate→recommendation highlighting.
   * Deselects the gate if it is already selected.
   * @param index - The gate list index to toggle.
   */
  protected toggleGate(index: number): void {
    this.selectedGateIndex.update(current => current === index ? null : index);
  }

  /**
   * Returns true when the given source type matches the currently selected gate.
   * @param sourceType - The recommendation source type to check.
   * @returns True when the recommendation should be highlighted.
   */
  protected isRecHighlighted(sourceType: GateType | 'low-ctr' | 'high-cpc'): boolean {
    const idx = this.selectedGateIndex();
    if (idx === null) return false;
    const gates = this.store.gates();
    const gate = gates[idx];
    return gate?.type === sourceType;
  }

  /**
   * Returns the Unicode icon glyph for a gate type.
   * @param type - The gate type.
   * @returns A single Unicode character.
   */
  protected gateIcon(type: GateType): string {
    switch (type) {
      case 'fatigue':        return '⚠';
      case 'low-roas':       return '📉';
      case 'learning-phase': return '⏳';
    }
  }

  /**
   * Converts a gate severity value to a fill width percentage for the severity bar.
   * Clamps to 100% maximum.
   * @param severity - The gate severity value (>=0).
   * @returns A number between 0 and 100.
   */
  protected severityWidth(severity: number): number {
    return Math.min(severity * 100, 100);
  }
}
