/**
 * @fileoverview New Campaign signal store.
 * Holds the in-progress draft campaign, ad sets, and creatives
 * while the user works through the three-step wizard.
 */
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import type { DraftCampaign, DraftAdSet, DraftCreative, WebsiteUrlMode } from '../model/draft.model';
import type { CampaignObjective, CampaignPayload, AdSetPayload, AdCreativePayload, AdPayload, PromotedObject, AttributionSpec } from '../../core/models/index';
import { MarketingApiService } from '../../core/services/facebook/marketing-api/marketing-api.service';
import { WorkspaceStore } from '../../workspace';
import { AiService } from '../../core/services/ai/ai.service';

// ── Module-level publish helpers ─────────────────────────────────────────────

/**
 * Derives the promoted_object for an AdSet from the campaign objective and workspace pixel.
 * Required for OUTCOME_SALES (PURCHASE event) and OUTCOME_LEADS (LEAD event).
 */
function derivePromotedObject(
  objective: CampaignObjective,
  pixelId: string
): PromotedObject | null {
  if (!pixelId) return null;
  switch (objective) {
    case 'OUTCOME_SALES': return { pixelId, customEventType: 'PURCHASE' };
    case 'OUTCOME_LEADS': return { pixelId, customEventType: 'LEAD' };
    default: return null;
  }
}

/**
 * Builds the attribution_spec array from workspace attribution window settings.
 * Inherits click-through, engaged-view, and view-through windows.
 */
function buildAttributionSpec(
  clickThroughDays: number,
  engagedViewDays: number,
  viewThroughDays: number
): AttributionSpec[] {
  return [
    { eventType: 'CLICK_THROUGH', windowDays: clickThroughDays },
    { eventType: 'ENGAGED_VIEW',  windowDays: engagedViewDays  },
    { eventType: 'VIEW_THROUGH',  windowDays: viewThroughDays  },
  ];
}

/** Full state for the new-campaign wizard. */
interface NewCampaignState {
  campaign: DraftCampaign;
  adSets: DraftAdSet[];
  activeAdSetIndex: number;
  websiteUrlMode: WebsiteUrlMode;
  creatives: DraftCreative[];
  activeCreativeIndex: number;
  isGeneratingAdSets: boolean;
  isGeneratingCopy: boolean;
  isPublishing: boolean;
  publishedCampaignId: string | null;
  error: string | null;
}

const DEFAULT_CAMPAIGN: DraftCampaign = {
  name: '',
  objective: null,
  budgetType: 'campaign',
  budgetPeriod: 'daily',
  budgetAmount: 100,
  utmParameters: '',
  activateImmediately: false,
};

const initialState: NewCampaignState = {
  campaign: { ...DEFAULT_CAMPAIGN },
  adSets: [],
  activeAdSetIndex: 0,
  websiteUrlMode: 'default',
  creatives: [],
  activeCreativeIndex: 0,
  isGeneratingAdSets: false,
  isGeneratingCopy: false,
  isPublishing: false,
  publishedCampaignId: null,
  error: null,
};

/**
 * New Campaign wizard store.
 * Scoped to the current wizard session; reset when starting a new campaign.
 */
export const NewCampaignStore = signalStore(
  { providedIn: 'root' },
  withState<NewCampaignState>(initialState),
  withComputed((store) => ({
    /** Whether step 1 (Campaign) is complete enough to proceed. */
    isCampaignStepValid: computed(() => {
      const c = store.campaign();
      return !!c.name && !!c.objective && c.budgetAmount > 0;
    }),

    /** Whether there is at least one ad set defined. */
    hasAdSets: computed(() => store.adSets().length > 0),

    /** Whether there is at least one creative uploaded. */
    hasCreatives: computed(() => store.creatives().length > 0),

    /** The currently active ad set, or null. */
    activeAdSet: computed(() => store.adSets()[store.activeAdSetIndex()] ?? null),

    /** The currently active creative, or null. */
    activeCreative: computed(() => store.creatives()[store.activeCreativeIndex()] ?? null),

    /** Total ads that will be created (creatives × ad sets). */
    totalAdsToCreate: computed(() => store.creatives().length * store.adSets().length),

    /** Setup score out of 5 — used by the right panel. */
    setupScore: computed(() => {
      let score = 0;
      if (store.campaign().name) score++;
      if (store.campaign().objective) score++;
      if (store.adSets().length > 0) score++;
      if (store.creatives().length > 0) score++;
      return score;
    }),
  })),
  withMethods((store) => {
    const marketingApi = inject(MarketingApiService);
    const workspaceStore = inject(WorkspaceStore);
    const aiService = inject(AiService);

    return {
    // ── Campaign ──────────────────────────────────────────────────────────

    /**
     * Updates the draft campaign fields.
     * @param patch - Partial campaign fields to merge.
     */
    updateCampaign(patch: Partial<DraftCampaign>): void {
      patchState(store, { campaign: { ...store.campaign(), ...patch } });
    },

    // ── Ad Sets ───────────────────────────────────────────────────────────

    /**
     * Replaces all ad sets (used after AI generation).
     * @param adSets - New ad set array.
     */
    setAdSets(adSets: DraftAdSet[]): void {
      patchState(store, { adSets, activeAdSetIndex: 0 });
    },

    /**
     * Adds a single blank ad set.
     */
    addAdSet(adSet: DraftAdSet): void {
      const adSets = [...store.adSets(), adSet];
      patchState(store, { adSets, activeAdSetIndex: adSets.length - 1 });
    },

    /**
     * Updates a specific ad set by index.
     * @param index - Index of the ad set to update.
     * @param patch - Partial ad set fields to merge.
     */
    updateAdSet(index: number, patch: Partial<DraftAdSet>): void {
      const adSets = store.adSets().map((a, i) => i === index ? { ...a, ...patch } : a);
      patchState(store, { adSets });
    },

    /**
     * Removes an ad set by index.
     * @param index - Index of the ad set to remove.
     */
    removeAdSet(index: number): void {
      const adSets = store.adSets().filter((_, i) => i !== index);
      const activeAdSetIndex = Math.min(store.activeAdSetIndex(), Math.max(0, adSets.length - 1));
      patchState(store, { adSets, activeAdSetIndex });
    },

    /**
     * Sets the active ad set tab.
     * @param index - Index to activate.
     */
    setActiveAdSet(index: number): void {
      patchState(store, { activeAdSetIndex: index });
    },

    /** @param loading - Whether AI is currently generating ad sets. */
    setGeneratingAdSets(loading: boolean): void {
      patchState(store, { isGeneratingAdSets: loading });
    },

    // ── Creatives ─────────────────────────────────────────────────────────

    /**
     * Adds a creative to the list.
     * @param creative - Creative to add.
     */
    addCreative(creative: DraftCreative): void {
      const creatives = [...store.creatives(), creative];
      patchState(store, { creatives, activeCreativeIndex: creatives.length - 1 });
    },

    /**
     * Updates a creative by index.
     * @param index - Index to update.
     * @param patch - Partial creative fields.
     */
    updateCreative(index: number, patch: Partial<DraftCreative>): void {
      const creatives = store.creatives().map((c, i) => i === index ? { ...c, ...patch } : c);
      patchState(store, { creatives });
    },

    /**
     * Removes a creative by index.
     * @param index - Index to remove.
     */
    removeCreative(index: number): void {
      const creatives = store.creatives().filter((_, i) => i !== index);
      const activeCreativeIndex = Math.min(store.activeCreativeIndex(), Math.max(0, creatives.length - 1));
      patchState(store, { creatives, activeCreativeIndex });
    },

    /**
     * Sets the active creative.
     * @param index - Index to activate.
     */
    setActiveCreative(index: number): void {
      patchState(store, { activeCreativeIndex: index });
    },

    /** @param mode - Website URL source mode. */
    setWebsiteUrlMode(mode: WebsiteUrlMode): void {
      patchState(store, { websiteUrlMode: mode });
    },

    /** @param loading - Whether AI is generating copy. */
    setGeneratingCopy(loading: boolean): void {
      patchState(store, { isGeneratingCopy: loading });
    },

    // ── Publish ───────────────────────────────────────────────────────────

    /** @param loading - Whether publish is in progress. */
    setPublishing(loading: boolean): void {
      patchState(store, { isPublishing: loading });
    },

    /** @param id - Facebook campaign ID after successful publish. */
    setPublished(id: string): void {
      patchState(store, { publishedCampaignId: id, isPublishing: false, error: null });
    },

    /** @param error - Error message to display. */
    setError(error: string): void {
      patchState(store, { error, isPublishing: false, isGeneratingAdSets: false, isGeneratingCopy: false });
    },

    /** Resets the wizard to its initial blank state. */
    reset(): void {
      patchState(store, { ...initialState, campaign: { ...DEFAULT_CAMPAIGN } });
    },

    // ── AI Draft Generation ───────────────────────────────────────────────

    /**
     * Calls Claude to generate a campaign name, objective, and ad sets from a
     * natural-language business description. Populates campaign + ad set fields.
     * @param prompt - User's description of their business or campaign goal.
     */
    async generateDraft(prompt: string): Promise<void> {
      patchState(store, { isGeneratingAdSets: true, error: null });
      try {
        const draft = await aiService.generateDraft(prompt);
        patchState(store, {
          campaign: {
            ...store.campaign(),
            name: draft.campaignName,
            objective: draft.objective as CampaignObjective,
          },
          adSets: draft.adSets.map((as, i) => ({
            id: crypto.randomUUID(),
            name: as.name,
            status: 'PAUSED' as const,
            placementMode: 'advantage' as const,
            optimizationGoal: as.optimizationGoal as import('../model/draft.model').DraftAdSet['optimizationGoal'],
            billingEvent: as.billingEvent as import('../model/draft.model').DraftAdSet['billingEvent'],
            budgetPeriod: 'daily' as const,
            budgetAmount: null,
            scheduleMode: 'continuous' as const,
            startDate: null,
            endDate: null,
            targeting: {
              countries: as.targeting?.countries ?? [],
              minAge: as.targeting?.minAge ?? 18,
              maxAge: as.targeting?.maxAge ?? 65,
              interests: [],
            },
          })),
          activeAdSetIndex: 0,
          isGeneratingAdSets: false,
        });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'AI draft generation failed',
          isGeneratingAdSets: false,
        });
      }
    },

    // ── AI Copy Generation ────────────────────────────────────────────────

    /**
     * Calls Claude to generate primaryText, headline, and description for the
     * active creative, using its tone/hook/length settings and campaign context.
     */
    async generateCopy(): Promise<void> {
      const creative = store.creatives()[store.activeCreativeIndex()];
      if (!creative) return;
      patchState(store, { isGeneratingCopy: true, error: null });
      try {
        const campaign = store.campaign();
        const copy = await aiService.generateCopy({
          campaignName: campaign.name || 'Untitled Campaign',
          objective: campaign.objective ?? '',
          fileName: creative.fileName,
          tones: creative.tones,
          hook: creative.hook,
          length: creative.length,
        });
        const updatedCreatives = store.creatives().map((c, i) =>
          i === store.activeCreativeIndex()
            ? { ...c, primaryText: copy.primaryText, headline: copy.headline, description: copy.description }
            : c
        );
        patchState(store, { creatives: updatedCreatives, isGeneratingCopy: false });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'AI copy generation failed',
          isGeneratingCopy: false,
        });
      }
    },

    // ── Publish ───────────────────────────────────────────────────────────

    /**
     * Publishes the wizard draft to the Facebook Marketing API.
     *
     * Sequence:
     *  1. POST /{ad-account-id}/campaigns              → campaignId
     *  2. POST /{ad-account-id}/adsets (×N ad sets)   → adSetId[]
     *  3. For each creative:
     *     a. POST /{ad-account-id}/adimages            → imageHash  (not yet implemented)
     *     b. POST /{ad-account-id}/adcreatives         → creativeId
     *     c. POST /{ad-account-id}/ads (×N ad sets)   → adId[]
     *
     * Workspace values applied automatically:
     *  - pageId          from metaDefaults.facebookPageId
     *  - pixelId         from metaDefaults.pixelId  (→ promotedObject on AdSet)
     *  - websiteUrl      from metaDefaults.websiteUrl
     *  - attributionSpec from enhancements attribution windows
     *  - beneficiary     from enhancements.beneficiaryName  (EU DSA)
     *  - payer           from enhancements.payerName        (EU DSA)
     */
    async publishCampaign(): Promise<void> {
      patchState(store, { isPublishing: true, error: null });
      try {
        const draft = store.campaign();
        const adSets = store.adSets();
        const creatives = store.creatives();
        const meta = workspaceStore.metaDefaults();
        const enhancements = workspaceStore.enhancements();
        const objective = draft.objective!;
        const status = draft.activateImmediately ? 'ACTIVE' : 'PAUSED';

        // Step 1 — Create campaign
        const campaignPayload: CampaignPayload = {
          name: draft.name,
          objective,
          status,
          specialAdCategories: [],
          ...(draft.budgetType === 'campaign' && draft.budgetPeriod === 'daily'
            ? { dailyBudget: draft.budgetAmount * 100 }
            : draft.budgetType === 'campaign'
            ? { lifetimeBudget: draft.budgetAmount * 100 }
            : {}),
        };
        const { id: campaignId } = await marketingApi.createCampaign(campaignPayload);

        // Step 2 — Create ad sets
        const adSetIds: string[] = [];
        const promotedObject = derivePromotedObject(objective, meta.pixelId);
        const attributionSpec = buildAttributionSpec(
          enhancements.clickThroughDays,
          enhancements.engagedViewDays,
          enhancements.viewThroughDays
        );
        for (const adSet of adSets) {
          const adSetPayload: AdSetPayload = {
            campaignId,
            name: adSet.name,
            status,
            billingEvent: adSet.billingEvent,
            optimizationGoal: adSet.optimizationGoal,
            targeting: {
              geoLocations: { countries: adSet.targeting.countries },
              ageMin: adSet.targeting.minAge,
              ageMax: adSet.targeting.maxAge,
            },
            attributionSpec,
            ...(promotedObject ? { promotedObject } : {}),
            ...(adSet.scheduleMode === 'scheduled' && adSet.startDate ? { startTime: adSet.startDate } : {}),
            ...(adSet.scheduleMode === 'scheduled' && adSet.endDate   ? { endTime:   adSet.endDate   } : {}),
            ...(draft.budgetType === 'adset' && adSet.budgetPeriod === 'daily' && adSet.budgetAmount
              ? { dailyBudget: adSet.budgetAmount * 100 } : {}),
            ...(draft.budgetType === 'adset' && adSet.budgetPeriod === 'lifetime' && adSet.budgetAmount
              ? { lifetimeBudget: adSet.budgetAmount * 100 } : {}),
          };
          const { id: adSetId } = await marketingApi.createAdSet(adSetPayload);
          adSetIds.push(adSetId);
        }

        // Step 3 — Create creatives and ads (image upload not yet implemented)
        for (const creative of creatives) {
          // 3a — Upload image/video to get image hash or video ID
          const { hash: imageHash } = await marketingApi.uploadImage(
            // uploadImage currently throws — implement multipart upload to resolve
            new File([], creative.fileName)
          );

          // 3b — Create ad creative
          const creativePayload: AdCreativePayload = {
            name: `${creative.fileName} — ${draft.name}`,
            pageId: meta.facebookPageId,
            body: creative.primaryText,
            title: creative.headline,
            description: creative.description,
            linkUrl: meta.websiteUrl,
            callToActionType: creative.cta,
            imageHash,
            ...(enhancements.beneficiaryName ? { beneficiary: enhancements.beneficiaryName } : {}),
            ...(enhancements.payerName       ? { payer:       enhancements.payerName       } : {}),
          };
          const { id: creativeId } = await marketingApi.createAdCreative(creativePayload);

          // 3c — Create one ad per ad set
          for (const adSetId of adSetIds) {
            const adPayload: AdPayload = {
              adSetId,
              name: `${draft.name} — ${creative.fileName}`,
              status: creative.launchStatus === 'active' ? 'ACTIVE' : 'PAUSED',
              creativeId,
            };
            await marketingApi.createAd(adPayload);
          }
        }

        patchState(store, { publishedCampaignId: campaignId, isPublishing: false });
      } catch (e: unknown) {
        patchState(store, {
          error: e instanceof Error ? e.message : 'Failed to publish campaign',
          isPublishing: false,
        });
      }
    },
  }; // end return
  }) // end withMethods
);
