/**
 * @fileoverview Review & Launch step component.
 * Shows creatives prominently at the top with per-card "Mark reviewed" toggles.
 * Campaign and Ad Set summaries are in a collapsed accordion below.
 * The Launch Ads button is gated on all creatives being marked reviewed.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NewCampaignStore } from '../../store/new-campaign.store';
import { WorkspaceStore } from '../../../workspace';
import { AuthStore } from '../../../auth';
import type { DraftAdSet } from '../../model/draft.model';

/** Maps CampaignObjective enum values to human-readable labels. */
const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS:     'Awareness',
  OUTCOME_TRAFFIC:       'Traffic',
  OUTCOME_ENGAGEMENT:    'Engagement',
  OUTCOME_LEADS:         'Lead Generation',
  OUTCOME_APP_PROMOTION: 'App Promotion',
  OUTCOME_SALES:         'Sales',
};

/** Human-readable labels for each CTA enum value. */
const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Learn More',
  SHOP_NOW:   'Shop Now',
  SIGN_UP:    'Sign Up',
  GET_OFFER:  'Get Offer',
  BOOK_NOW:   'Book Now',
  CONTACT_US: 'Contact Us',
  SUBSCRIBE:  'Subscribe',
  WATCH_MORE: 'Watch More',
  APPLY_NOW:  'Apply Now',
  DOWNLOAD:   'Download',
};

/** A single item in the pre-flight checklist. */
export interface PreflightItem {
  /** Display label for this checklist item. */
  label: string;
  /** Whether this item passes. */
  ok: boolean;
}

/** Step 4 of the New Campaign wizard — Review & Launch. */
@Component({
  selector: 'app-review-step',
  imports: [RouterLink],
  templateUrl: './review-step.component.html',
  styleUrl: './review-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  protected readonly store = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  protected readonly authStore = inject(AuthStore);

  /**
   * Set of creative IDs that the user has explicitly marked as reviewed.
   * Component-scoped only — not persisted to the store or to disk.
   */
  protected readonly reviewedIds = signal<ReadonlySet<string>>(new Set());

  /** Whether the Campaign & Ad Sets accordion is expanded. */
  protected readonly summaryOpen = signal(false);

  /** Whether the user has explicitly marked the Campaign summary as reviewed. */
  protected readonly campaignReviewed = signal(false);

  /** Whether the user has explicitly marked the Ad Sets summary as reviewed. */
  protected readonly adSetsReviewed = signal(false);

  /** Number of creatives the user has reviewed. */
  protected readonly reviewedCount = computed(() =>
    this.store.creatives().filter(c => this.reviewedIds().has(c.id)).length
  );

  /** Whether every creative has been marked reviewed. */
  protected readonly allReviewed = computed(() => {
    const creatives = this.store.creatives();
    return creatives.length > 0 && creatives.every(c => this.reviewedIds().has(c.id));
  });

  /** Human-readable label for the campaign objective. */
  protected readonly objectiveLabel = computed(() =>
    OBJECTIVE_LABELS[this.store.campaign().objective ?? ''] ?? '—'
  );

  /** Whether the campaign objective requires a pixel (Sales or Leads). */
  protected readonly needsPixel = computed(() =>
    ['OUTCOME_SALES', 'OUTCOME_LEADS'].includes(this.store.campaign().objective ?? '')
  );

  /** Whether all creatives have non-empty primary text. */
  protected readonly creativesHaveCopy = computed(() =>
    this.store.creatives().length > 0 &&
    this.store.creatives().every(c => c.primaryText.trim().length > 0)
  );

  /** Sum of all ad-set budgets when budgetType is 'adset'. Returns null when not applicable. */
  protected readonly adSetBudgetTotal = computed(() => {
    if (this.store.campaign().budgetType !== 'adset') return null;
    return this.store.adSets().reduce((sum, a) => sum + (a.budgetAmount ?? 0), 0);
  });

  /** Facebook Page name resolved from the auth store pages list. */
  protected readonly pageName = computed(() => {
    const id = this.workspaceStore.metaDefaults().facebookPageId;
    return this.authStore.pages().find(p => p.id === id)?.name ?? 'Your Page';
  });

  /** Uppercased domain extracted from the workspace website URL. */
  protected readonly previewDomain = computed(() => {
    const url = this.workspaceStore.metaDefaults().websiteUrl;
    try {
      return new URL(url).hostname.replace(/^www\./, '').toUpperCase();
    } catch {
      return url ? url.toUpperCase() : 'YOURWEBSITE.COM';
    }
  });

  /** Currency symbol derived from the selected ad account; defaults to £ (GBP). */
  protected readonly currencySymbol = computed(() => {
    const currency = this.authStore.selectedAccount()?.currency ?? 'GBP';
    try {
      return (
        new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0 })
          .formatToParts(0)
          .find(p => p.type === 'currency')?.value ?? currency
      );
    } catch {
      return currency;
    }
  });

  /** Pre-flight checklist items, including the "all reviewed" gate. */
  protected readonly preflightItems = computed<PreflightItem[]>(() => {
    const meta = this.workspaceStore.metaDefaults();
    const items: PreflightItem[] = [
      { label: 'Facebook Page configured',  ok: !!meta.facebookPageId },
      { label: 'Website URL configured',    ok: !!meta.websiteUrl },
    ];
    if (this.needsPixel()) {
      items.push({ label: 'Meta Pixel configured', ok: !!meta.pixelId });
    }
    items.push(
      { label: 'Ad sets configured',       ok: this.store.hasAdSets() },
      { label: 'Creatives uploaded',       ok: this.store.hasCreatives() },
      { label: 'Copy written',             ok: this.creativesHaveCopy() },
      { label: 'Campaign reviewed',        ok: this.campaignReviewed() },
      { label: 'Ad sets reviewed',         ok: this.adSetsReviewed() },
      { label: 'All creatives reviewed',   ok: this.allReviewed() },
    );
    return items;
  });

  /** Whether all pre-flight checklist items pass. */
  protected readonly preflightOk = computed(() =>
    this.preflightItems().every(i => i.ok)
  );

  /** Whether the Launch Ads button should be disabled. */
  protected readonly launchDisabled = computed(() =>
    this.store.isPublishing() ||
    !this.workspaceStore.isConfigured() ||
    !this.store.hasAdSets() ||
    !this.store.hasCreatives() ||
    !this.campaignReviewed() ||
    !this.adSetsReviewed() ||
    !this.allReviewed()
  );

  /**
   * Toggles the reviewed state for a single creative by ID.
   * Creates a new Set each time to ensure signal reactivity.
   * @param id - The creative's client-side ID.
   */
  protected toggleReviewed(id: string): void {
    const next = new Set(this.reviewedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.reviewedIds.set(next);
  }

  /**
   * Formats a numeric budget amount as a currency string.
   * @param value - Amount in account currency, or null.
   * @returns Formatted string such as "£50", or "—" when zero or null.
   */
  protected fmtCurrency(value: number | null): string {
    if (value === null || value === 0) return '—';
    return `${this.currencySymbol()}${value.toLocaleString()}`;
  }

  /**
   * Returns a human-readable schedule label for an ad set.
   * @param adSet - The draft ad set.
   * @returns Schedule description string.
   */
  protected scheduleLabel(adSet: DraftAdSet): string {
    if (adSet.scheduleMode === 'continuous') return 'Runs continuously';
    const start = adSet.startDate ? this.fmtDate(adSet.startDate) : 'Now';
    const end   = adSet.endDate   ? this.fmtDate(adSet.endDate)   : 'No end';
    return `${start} → ${end}`;
  }

  /**
   * Truncates text to a maximum length, appending an ellipsis if needed.
   * @param text - Source text.
   * @param max - Maximum character count.
   * @returns Truncated string.
   */
  protected truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }

  /**
   * Returns the human-readable label for a CTA enum value.
   * @param cta - Facebook API CTA enum value.
   * @returns Display label string.
   */
  protected ctaLabel(cta: string): string {
    return CTA_LABELS[cta] ?? cta;
  }

  /**
   * Formats an ISO date string to a short locale date.
   * @param iso - ISO 8601 date string.
   * @returns Formatted locale date string.
   */
  protected fmtDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  /** Publishes the current wizard draft to the Facebook Marketing API. */
  protected launch(): void {
    void this.store.publishCampaign();
  }
}
