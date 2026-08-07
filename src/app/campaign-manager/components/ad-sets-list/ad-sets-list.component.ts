/**
 * @fileoverview Ad Sets list component.
 * Displays all ad sets across campaigns for the connected ad account.
 * Data is fetched from the Facebook Marketing API on demand.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { MarketingApiService } from '../../../core/services/facebook/marketing-api/marketing-api.service';
import type { AdSet, OptimizationGoal, BillingEvent } from '../../../core/models';

/** Maps Facebook optimisation goal enum values to human-readable labels. */
const OPTIMIZATION_LABELS: Record<OptimizationGoal, string> = {
  NONE:                  'None',
  APP_INSTALLS:          'App Installs',
  BRAND_AWARENESS:       'Brand Awareness',
  CLICKS:                'Clicks',
  ENGAGED_USERS:         'Engaged Users',
  EVENT_RESPONSES:       'Event Responses',
  IMPRESSIONS:           'Impressions',
  LEAD_GENERATION:       'Lead Generation',
  LINK_CLICKS:           'Link Clicks',
  OFFSITE_CONVERSIONS:   'Conversions',
  PAGE_ENGAGEMENT:       'Page Engagement',
  PAGE_LIKES:            'Page Likes',
  POST_ENGAGEMENT:       'Post Engagement',
  REACH:                 'Reach',
  SOCIAL_IMPRESSIONS:    'Social Impressions',
  VALUE:                 'Value',
  THRUPLAY:              'ThruPlay',
};

/** Maps Facebook billing event enum values to human-readable labels. */
const BILLING_LABELS: Record<BillingEvent, string> = {
  APP_INSTALLS:    'App Installs',
  CLICKS:          'Clicks',
  IMPRESSIONS:     'Impressions',
  LINK_CLICKS:     'Link Clicks',
  NONE:            'None',
  PAGE_LIKES:      'Page Likes',
  POST_ENGAGEMENT: 'Post Engagement',
  THRUPLAY:        'ThruPlay',
};

/** Displays ad sets fetched from the Facebook Marketing API. */
@Component({
  selector: 'app-ad-sets-list',
  imports: [DatePipe],
  templateUrl: './ad-sets-list.component.html',
  styleUrl: './ad-sets-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdSetsListComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly marketingApi = inject(MarketingApiService);

  protected readonly adSets = signal<AdSet[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** ID of the ad set currently being toggled, to show per-row loading state. */
  protected readonly togglingId = signal<string | null>(null);

  /** Returns a human-readable label for an optimisation goal enum value. */
  protected optimizationLabel(goal: OptimizationGoal): string {
    return OPTIMIZATION_LABELS[goal] ?? goal;
  }

  /** Returns a human-readable label for a billing event enum value. */
  protected billingLabel(event: BillingEvent): string {
    return BILLING_LABELS[event] ?? event;
  }

  /**
   * Formats a budget amount (minor units) using the selected account's currency.
   * Falls back to USD if no account is selected.
   */
  protected formatBudget(amount: number): string {
    const currency = this.authStore.selectedAccount()?.currency ?? 'USD';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount / 100);
  }

  /**
   * Fetches ad sets from the Facebook Marketing API.
   * Requires the user to be authenticated with an ad account selected.
   */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const campaigns = await this.marketingApi.getCampaigns();
      const results = await Promise.all(campaigns.map(c => this.marketingApi.getAdSets(c.id)));
      this.adSets.set(results.flat());
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load ad sets.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggles the status of an ad set between ACTIVE and PAUSED.
   * @param adSet - Ad set to toggle.
   */
  protected async toggleStatus(adSet: AdSet): Promise<void> {
    const newStatus = adSet.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.togglingId.set(adSet.id);
    try {
      await this.marketingApi.updateAdSet(adSet.id, { status: newStatus });
      this.adSets.update(list =>
        list.map(a => a.id === adSet.id ? { ...a, status: newStatus } : a)
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to update ad set status.');
    } finally {
      this.togglingId.set(null);
    }
  }
}
