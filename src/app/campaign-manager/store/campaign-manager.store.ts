/**
 * @fileoverview NgRx Signal Store for Campaign Manager state.
 * Provided at root so data persists across tab navigation — no need to re-sync
 * every time the user switches back to the Campaign Manager tab.
 */
import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { MarketingApiService } from '../../core/services/facebook/marketing-api/marketing-api.service';
import type { Campaign, AdSet, Ad } from '../../core/models';

/** Shape of the campaign manager store state. */
interface CampaignManagerState {
  /** All campaigns for the selected ad account. */
  campaigns: Campaign[];
  /** All ad sets across all campaigns. */
  adSets: AdSet[];
  /** Maps ad set ID → name, used for the Ads list Ad Set column. */
  adSetNames: Record<string, string>;
  /** All ads across all ad sets. */
  ads: Ad[];

  /** Whether a campaigns sync is in progress. */
  campaignsLoading: boolean;
  /** Whether an ad sets sync is in progress. */
  adSetsLoading: boolean;
  /** Whether an ads sync is in progress. */
  adsLoading: boolean;

  /** Error from the most recent campaigns operation, or null. */
  campaignsError: string | null;
  /** Error from the most recent ad sets operation, or null. */
  adSetsError: string | null;
  /** Error from the most recent ads operation, or null. */
  adsError: string | null;

  /**
   * ID of the entity (campaign, ad set, or ad) currently being status-toggled.
   * Used to show per-row loading state without blocking the whole list.
   */
  togglingId: string | null;
}

const initialState: CampaignManagerState = {
  campaigns:       [],
  adSets:          [],
  adSetNames:      {},
  ads:             [],
  campaignsLoading: false,
  adSetsLoading:   false,
  adsLoading:      false,
  campaignsError:  null,
  adSetsError:     null,
  adsError:        null,
  togglingId:      null,
};

/** Root-level store that keeps Campaign Manager data alive across navigation. */
export const CampaignManagerStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const marketingApi = inject(MarketingApiService);

    return {
      /**
       * Fetches all campaigns for the connected ad account.
       * Existing data is replaced on success.
       */
      async syncCampaigns(): Promise<void> {
        patchState(store, { campaignsLoading: true, campaignsError: null });
        try {
          const campaigns = await marketingApi.getCampaigns();
          patchState(store, { campaigns });
        } catch (e: unknown) {
          patchState(store, {
            campaignsError: e instanceof Error ? e.message : 'Failed to load campaigns.',
          });
        } finally {
          patchState(store, { campaignsLoading: false });
        }
      },

      /**
       * Fetches all ad sets by walking the campaigns list.
       * Falls back to a fresh campaigns fetch if none are loaded yet.
       */
      async syncAdSets(): Promise<void> {
        patchState(store, { adSetsLoading: true, adSetsError: null });
        try {
          let campaigns = store.campaigns();
          if (campaigns.length === 0) {
            campaigns = await marketingApi.getCampaigns();
            patchState(store, { campaigns });
          }
          const results = await Promise.all(campaigns.map(c => marketingApi.getAdSets(c.id)));
          const adSets = results.flat();
          const adSetNames = Object.fromEntries(adSets.map(a => [a.id, a.name]));
          patchState(store, { adSets, adSetNames });
        } catch (e: unknown) {
          patchState(store, {
            adSetsError: e instanceof Error ? e.message : 'Failed to load ad sets.',
          });
        } finally {
          patchState(store, { adSetsLoading: false });
        }
      },

      /**
       * Fetches all ads by walking campaigns → ad sets → ads.
       * Falls back to fresh fetches of campaigns and ad sets if not yet loaded.
       */
      async syncAds(): Promise<void> {
        patchState(store, { adsLoading: true, adsError: null });
        try {
          let campaigns = store.campaigns();
          if (campaigns.length === 0) {
            campaigns = await marketingApi.getCampaigns();
            patchState(store, { campaigns });
          }
          let adSets = store.adSets();
          if (adSets.length === 0) {
            const results = await Promise.all(campaigns.map(c => marketingApi.getAdSets(c.id)));
            adSets = results.flat();
            const adSetNames = Object.fromEntries(adSets.map(a => [a.id, a.name]));
            patchState(store, { adSets, adSetNames });
          }
          const adArrays = await Promise.all(adSets.map(a => marketingApi.getAds(a.id)));
          patchState(store, { ads: adArrays.flat() });
        } catch (e: unknown) {
          patchState(store, {
            adsError: e instanceof Error ? e.message : 'Failed to load ads.',
          });
        } finally {
          patchState(store, { adsLoading: false });
        }
      },

      /**
       * Toggles a campaign between ACTIVE and PAUSED and updates the store.
       * @param campaign - Campaign to toggle.
       */
      async toggleCampaignStatus(campaign: Campaign): Promise<void> {
        const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        patchState(store, { togglingId: campaign.id });
        try {
          await marketingApi.updateCampaign(campaign.id, { status: newStatus });
          patchState(store, {
            campaigns: store.campaigns().map(c =>
              c.id === campaign.id ? { ...c, status: newStatus } : c
            ),
          });
        } catch (e: unknown) {
          patchState(store, {
            campaignsError: e instanceof Error ? e.message : 'Failed to update campaign status.',
          });
        } finally {
          patchState(store, { togglingId: null });
        }
      },

      /**
       * Toggles an ad set between ACTIVE and PAUSED and updates the store.
       * @param adSet - Ad set to toggle.
       */
      async toggleAdSetStatus(adSet: AdSet): Promise<void> {
        const newStatus = adSet.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        patchState(store, { togglingId: adSet.id });
        try {
          await marketingApi.updateAdSet(adSet.id, { status: newStatus });
          patchState(store, {
            adSets: store.adSets().map(a =>
              a.id === adSet.id ? { ...a, status: newStatus } : a
            ),
          });
        } catch (e: unknown) {
          patchState(store, {
            adSetsError: e instanceof Error ? e.message : 'Failed to update ad set status.',
          });
        } finally {
          patchState(store, { togglingId: null });
        }
      },

      /**
       * Toggles an ad between ACTIVE and PAUSED and updates the store.
       * @param ad - Ad to toggle.
       */
      async toggleAdStatus(ad: Ad): Promise<void> {
        const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        patchState(store, { togglingId: ad.id });
        try {
          await marketingApi.updateAd(ad.id, { status: newStatus });
          patchState(store, {
            ads: store.ads().map(a =>
              a.id === ad.id ? { ...a, status: newStatus } : a
            ),
          });
        } catch (e: unknown) {
          patchState(store, {
            adsError: e instanceof Error ? e.message : 'Failed to update ad status.',
          });
        } finally {
          patchState(store, { togglingId: null });
        }
      },
    };
  })
);
