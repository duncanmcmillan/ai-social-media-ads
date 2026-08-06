/**
 * @fileoverview New Campaign signal store.
 * Holds the in-progress draft campaign, ad sets, and creatives
 * while the user works through the three-step wizard.
 */
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed } from '@angular/core';
import type { DraftCampaign, DraftAdSet, DraftCreative, WebsiteUrlMode } from '../model/draft.model';

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
  withMethods((store) => ({
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
  }))
);
