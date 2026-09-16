/**
 * @fileoverview Step 2 — Ad Sets.
 * Tab-per-ad-set navigation with audience, placement, and budget fields.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NewCampaignStore } from '../../store/new-campaign.store';
import { LicenceStore } from '../../../core/store/licence.store';
import { VideoModalComponent } from '../../../shared/video-modal/video-modal.component';
import { UpgradePromptComponent } from '../../../shared/upgrade-prompt/upgrade-prompt.component';
import type { DraftAdSet } from '../../model/draft.model';

/** Free-tier limit: one ad set per campaign. */
const FREE_AD_SET_LIMIT = 1;

/** Generates a client-side UUID for draft objects. */
function uuid(): string {
  return crypto.randomUUID();
}

/** Default blank ad set. */
function blankAdSet(name = 'New Ad Set'): DraftAdSet {
  return {
    id: uuid(),
    name,
    status: 'PAUSED',
    placementMode: 'advantage',
    optimizationGoal: 'REACH',
    billingEvent: 'IMPRESSIONS',
    budgetPeriod: 'daily',
    budgetAmount: null,
    scheduleMode: 'continuous',
    startDate: null,
    endDate: null,
    targeting: { countries: [], minAge: 18, maxAge: 65, interests: [], customAudiences: [] },
  } as DraftAdSet;
}

const OPTIMIZATION_GOALS = [
  'REACH', 'LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS', 'OFFSITE_CONVERSIONS',
  'LEAD_GENERATION', 'PAGE_ENGAGEMENT', 'VALUE',
] as const;

const BILLING_EVENTS = ['IMPRESSIONS', 'LINK_CLICKS', 'APP_INSTALLS'] as const;

/** Step 2 of the New Campaign wizard — Ad Set configuration. */
@Component({
  selector: 'app-ad-sets-step',
  imports: [VideoModalComponent, UpgradePromptComponent],
  templateUrl: './ad-sets-step.component.html',
  styleUrl: './ad-sets-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdSetsStepComponent {
  protected readonly store = inject(NewCampaignStore);
  private readonly licenceStore = inject(LicenceStore);

  /** Controls the help video modal. */
  protected readonly videoOpen = signal(false);

  /** True when a free-tier user already has the maximum allowed ad sets. */
  protected readonly atAdSetLimit = computed(() =>
    this.licenceStore.tier() === 'free' && this.store.adSets().length >= FREE_AD_SET_LIMIT
  );

  protected readonly optimizationGoals = OPTIMIZATION_GOALS;
  protected readonly billingEvents = BILLING_EVENTS;

  /** Adds a blank ad set and activates it. */
  protected addAdSet(): void {
    this.store.addAdSet(blankAdSet(`Ad Set ${this.store.adSets().length + 1}`));
  }

  /** @param index - Index of the tab to activate. */
  protected selectTab(index: number): void {
    this.store.setActiveAdSet(index);
  }

  /** @param index - Ad set to remove. */
  protected removeAdSet(index: number): void {
    this.store.removeAdSet(index);
  }

  /** @param field - Ad set field to update. @param value - New value. */
  protected update(field: keyof DraftAdSet, value: unknown): void {
    this.store.updateAdSet(this.store.activeAdSetIndex(), { [field]: value } as Partial<DraftAdSet>);
  }

  /** @param value - Targeting countries string. */
  protected setCountries(value: string): void {
    const countries = value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    const current = this.store.activeAdSet();
    if (!current) return;
    this.store.updateAdSet(this.store.activeAdSetIndex(), {
      targeting: { ...current.targeting, countries },
    });
  }
}
