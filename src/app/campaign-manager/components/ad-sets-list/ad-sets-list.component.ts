/**
 * @fileoverview Ad Sets list component.
 * Displays all ad sets across campaigns for the connected ad account.
 * Data is persisted in CampaignManagerStore so it survives tab navigation.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { CampaignManagerStore } from '../../store/campaign-manager.store';
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
  protected readonly store = inject(CampaignManagerStore);

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

  /** Triggers a fresh sync from the Facebook Marketing API. */
  protected sync(): void {
    void this.store.syncAdSets();
  }

  /** Toggles the status of an ad set between ACTIVE and PAUSED. */
  protected toggleStatus(adSet: AdSet): void {
    void this.store.toggleAdSetStatus(adSet);
  }
}
