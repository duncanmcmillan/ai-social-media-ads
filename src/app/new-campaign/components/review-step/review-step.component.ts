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
import { TemplateStore } from '../../../templates';
import { LicenceStore } from '../../../core/store/licence.store';
import { UpgradePromptComponent } from '../../../shared/upgrade-prompt/upgrade-prompt.component';
import type { DraftAdSet } from '../../model/draft.model';

/** Maximum number of campaigns allowed on the free tier. */
const FREE_CAMPAIGN_LIMIT = 3;

/** Maps CampaignObjective enum values to human-readable labels. */
const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS:     'Awareness',
  OUTCOME_TRAFFIC:       'Traffic',
  OUTCOME_ENGAGEMENT:    'Engagement',
  OUTCOME_LEADS:         'Lead Generation',
  OUTCOME_APP_PROMOTION: 'App Promotion',
  OUTCOME_SALES:         'Sales',
};

/** Facebook API enum values for call-to-action type. */
const CTA_OPTIONS = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_OFFER', 'BOOK_NOW',
  'CONTACT_US', 'SUBSCRIBE', 'WATCH_MORE', 'APPLY_NOW', 'DOWNLOAD',
] as const;

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
  imports: [RouterLink, UpgradePromptComponent],
  templateUrl: './review-step.component.html',
  styleUrl: './review-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  protected readonly store          = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  protected readonly authStore      = inject(AuthStore);
  protected readonly templateStore  = inject(TemplateStore);
  protected readonly licenceStore   = inject(LicenceStore);

  constructor() {
    // Refresh the campaign count so the limit indicator is accurate when the step opens.
    void this.store.loadCampaignCount();
  }

  /** Available CTA options for the inline select. */
  protected readonly ctaOptions = CTA_OPTIONS;

  /** Whether the "Save as Template" inline name input is visible. */
  protected readonly savingTemplate = signal(false);

  /** Template name typed by the user in the save input. */
  protected readonly templateName = signal('');

  /**
   * Set view of reviewed creative IDs — wraps the store's string array for
   * backwards-compatible `.has()` calls in the template and specs.
   */
  protected readonly reviewedIds = computed<ReadonlySet<string>>(() =>
    new Set(this.store.reviewedCreativeIds())
  );

  /** Whether the Campaign & Ad Sets accordion is expanded. */
  protected readonly summaryOpen = signal(false);

  /**
   * Whether the user has marked the Campaign summary as reviewed.
   * Delegates to the store so state survives navigation away and back.
   */
  protected readonly campaignReviewed = this.store.campaignReviewed;

  /**
   * Whether the user has marked the Ad Sets summary as reviewed.
   * Delegates to the store so state survives navigation away and back.
   */
  protected readonly adSetsReviewed = this.store.adSetsReviewed;

  /** Number of creatives the user has reviewed. */
  protected readonly reviewedCount = computed(() =>
    this.store.creatives().filter(c => this.reviewedIds().has(c.id)).length
  );

  /** Whether every creative has been marked reviewed. */
  protected readonly allReviewed = computed(() => {
    const creatives = this.store.creatives();
    return creatives.length > 0 && creatives.every(c => this.reviewedIds().has(c.id));
  });

  /**
   * Whether the free-tier campaign limit has been reached.
   * True when tier is 'free' and the account already has 3 or more campaigns.
   */
  protected readonly atFreeLimit = computed(() =>
    this.licenceStore.tier() === 'free' &&
    this.store.campaignCount() >= FREE_CAMPAIGN_LIMIT
  );

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

  /**
   * Whether all creatives have actual file objects attached (not just template placeholders).
   * For Carousel creatives, all cards must have a file. For all other formats,
   * the top-level creative file is checked.
   */
  protected readonly hasFilesAttached = computed(() =>
    this.store.creatives().length > 0 &&
    this.store.creatives().every(c => {
      if (c.adFormat === 'CAROUSEL') {
        return c.carouselCards.length >= 2 && c.carouselCards.every(card => !!card.file);
      }
      return !!c.file;
    })
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
      { label: 'Creatives uploaded',       ok: this.hasFilesAttached() },
      { label: 'Copy written',             ok: this.creativesHaveCopy() },
      { label: 'Campaign reviewed',        ok: this.campaignReviewed() },
      { label: 'Ad sets reviewed',         ok: this.adSetsReviewed() },
      { label: 'All creatives reviewed',   ok: this.allReviewed() },
    );
    if (this.licenceStore.tier() === 'free' && this.store.campaignCount() >= 0) {
      items.push({
        label: `Campaign limit (${this.store.campaignCount()}/${FREE_CAMPAIGN_LIMIT} used)`,
        ok: !this.atFreeLimit(),
      });
    }
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
    !this.hasFilesAttached() ||
    !this.campaignReviewed() ||
    !this.adSetsReviewed() ||
    !this.allReviewed() ||
    this.atFreeLimit()
  );

  /**
   * Toggles the reviewed state for a single creative by ID.
   * Delegates to the store so reviewed state persists across navigation.
   * @param id - The creative's client-side ID.
   */
  protected toggleReviewed(id: string): void {
    this.store.toggleReviewedCreative(id);
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

  /**
   * Updates a creative field by index via the store.
   * Used by inline edit inputs in the Review step.
   * @param index - Creative index.
   * @param field - Field key.
   * @param value - New value.
   */
  protected updateCreative(index: number, field: string, value: string): void {
    this.store.updateCreative(index, { [field]: value } as never);
  }

  /** Shows the Save as Template name input. */
  protected startSaveTemplate(): void {
    this.templateName.set('');
    this.savingTemplate.set(true);
  }

  /** Cancels the save template flow. */
  protected cancelSaveTemplate(): void {
    this.savingTemplate.set(false);
  }

  /**
   * Saves the current draft as a named template.
   * Omits File objects so the template is JSON-serialisable.
   */
  protected confirmSaveTemplate(): void {
    const name = this.templateName().trim();
    if (!name) return;

    this.templateStore.save(name, {
      campaign:  this.store.campaign(),
      adSets:    this.store.adSets(),
      creatives: this.store.creatives().map(({ file: _file, objectUrl: _url, ...rest }) => rest),
    });
    this.savingTemplate.set(false);
  }

  /** Publishes the current wizard draft to the Facebook Marketing API. */
  protected launch(): void {
    void this.store.publishCampaign();
  }
}
