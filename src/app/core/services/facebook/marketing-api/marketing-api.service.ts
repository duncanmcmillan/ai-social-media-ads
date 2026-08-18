/**
 * @fileoverview Facebook Marketing API service.
 * Provides CRUD operations for Campaigns, Ad Sets, and Ads via the Facebook Graph API.
 * All requests are authenticated with the access token stored in the auth signal store.
 * @see README.md for endpoint specifications and payload data sources.
 *
 * IMPORTANT: The Facebook Graph API uses snake_case field names.
 * Each create/update method translates our camelCase TypeScript models to the
 * snake_case format required by the API before making the HTTP call.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../auth';
import type { Campaign, CampaignPayload, AdSet, AdSetPayload, Ad, AdPayload, AdCreative, AdCreativePayload } from '../../../models/index';

/** Base URL for the Facebook Graph API. */
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/** Wraps a Graph API list response. */
interface GraphApiList<T> {
  /** Array of returned items. */
  data: T[];
  /** Pagination cursors for fetching further pages. */
  paging?: { cursors: { before: string; after: string }; next?: string };
}

/**
 * Service wrapping the Facebook Marketing API.
 * Use this service from stores — never inject it directly into components.
 */
@Injectable({ providedIn: 'root' })
export class MarketingApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  /**
   * Returns common Graph API query parameters including the access token.
   * @throws When not authenticated or the selected ad account is not active.
   */
  private authParams(): HttpParams {
    this.authStore.assertAccountActive();
    const token = this.authStore.accessToken();
    if (!token) throw new Error('Not authenticated — no access token available.');
    return new HttpParams().set('access_token', token);
  }

  // ── Campaigns ────────────────────────────────────────────────────────────

  /**
   * Lists all campaigns for the connected ad account.
   * @returns Promise resolving to an array of campaigns.
   * @throws When not authenticated or the API call fails.
   */
  async getCampaigns(): Promise<Campaign[]> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');

    const params = this.authParams().set(
      'fields',
      'id,name,status,objective,buying_type,daily_budget,lifetime_budget,created_time,updated_time'
    );

    const result = await firstValueFrom(
      this.http.get<GraphApiList<Campaign>>(`${GRAPH_API_BASE}/${adAccountId}/campaigns`, { params })
    );
    return result.data;
  }

  /**
   * Creates a new campaign.
   * @param payload - Campaign creation parameters.
   * @returns Promise resolving to the created campaign's ID.
   * @throws When not authenticated or the API call fails.
   */
  async createCampaign(payload: CampaignPayload): Promise<{ id: string }> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');
    const params = this.authParams();

    const body: Record<string, unknown> = {
      name: payload.name,
      objective: payload.objective,
      status: payload.status,
      special_ad_categories: payload.specialAdCategories,
    };
    if (payload.buyingType) body['buying_type'] = payload.buyingType;
    if (payload.dailyBudget != null) {
      body['daily_budget'] = payload.dailyBudget;
      // bid_strategy is required on CBO campaigns (those with a campaign-level budget)
      body['bid_strategy'] = payload.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP';
    }
    if (payload.lifetimeBudget != null) {
      body['lifetime_budget'] = payload.lifetimeBudget;
      body['bid_strategy'] = payload.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP';
    }

    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/campaigns`, body, { params })
    );
  }

  /**
   * Updates an existing campaign.
   * @param campaignId - ID of the campaign to update.
   * @param payload - Fields to update.
   * @returns Promise resolving to a success indicator.
   * @throws When not authenticated or the API call fails.
   */
  async updateCampaign(campaignId: string, payload: Partial<CampaignPayload>): Promise<{ success: boolean }> {
    const params = this.authParams();
    const body: Record<string, unknown> = {};
    if (payload.name != null)               body['name']                  = payload.name;
    if (payload.objective != null)          body['objective']             = payload.objective;
    if (payload.status != null)             body['status']                = payload.status;
    if (payload.specialAdCategories != null) body['special_ad_categories'] = payload.specialAdCategories;
    if (payload.buyingType != null)         body['buying_type']           = payload.buyingType;
    if (payload.dailyBudget != null)        body['daily_budget']          = payload.dailyBudget;
    if (payload.lifetimeBudget != null)     body['lifetime_budget']       = payload.lifetimeBudget;
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${campaignId}`, body, { params })
    );
  }

  // ── Ad Sets ───────────────────────────────────────────────────────────────

  /**
   * Lists all ad sets for a given campaign.
   * @param campaignId - Parent campaign ID.
   * @returns Promise resolving to an array of ad sets.
   * @throws When not authenticated or the API call fails.
   */
  async getAdSets(campaignId: string): Promise<AdSet[]> {
    const params = this.authParams().set(
      'fields',
      'id,name,campaign_id,status,billing_event,optimization_goal,daily_budget,lifetime_budget,bid_amount,created_time,updated_time'
    );
    const result = await firstValueFrom(
      this.http.get<GraphApiList<AdSet>>(`${GRAPH_API_BASE}/${campaignId}/adsets`, { params })
    );
    return result.data;
  }

  /**
   * Updates an existing ad set.
   * @param adSetId - ID of the ad set to update.
   * @param payload - Fields to update.
   * @returns Promise resolving to a success indicator.
   * @throws When not authenticated or the API call fails.
   */
  async updateAdSet(adSetId: string, payload: Partial<AdSetPayload>): Promise<{ success: boolean }> {
    const params = this.authParams();
    const body: Record<string, unknown> = {};
    if (payload.name != null)             body['name']              = payload.name;
    if (payload.status != null)           body['status']            = payload.status;
    if (payload.billingEvent != null)     body['billing_event']     = payload.billingEvent;
    if (payload.optimizationGoal != null) body['optimization_goal'] = payload.optimizationGoal;
    if (payload.dailyBudget != null)      body['daily_budget']      = payload.dailyBudget;
    if (payload.lifetimeBudget != null)   body['lifetime_budget']   = payload.lifetimeBudget;
    if (payload.bidAmount != null)        body['bid_amount']        = payload.bidAmount;
    if (payload.startTime != null)        body['start_time']        = payload.startTime;
    if (payload.endTime != null)          body['end_time']          = payload.endTime;
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${adSetId}`, body, { params })
    );
  }

  /**
   * Creates a new ad set.
   * @param payload - Ad set creation parameters.
   * @returns Promise resolving to the created ad set's ID.
   * @throws When not authenticated or the API call fails.
   */
  async createAdSet(payload: AdSetPayload): Promise<{ id: string }> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');
    const params = this.authParams();

    const targeting: Record<string, unknown> = {
      geo_locations: { countries: payload.targeting.geoLocations.countries },
    };
    const isAdvantageAudience = payload.targeting.targetingAutomation?.advantageAudience === 1;
    // Age constraints are not permitted as hard limits when Advantage+ Audience is enabled.
    // age_min must be ≤ 25 and age_max cannot be set at all. Omit both to let Meta manage the range.
    if (!isAdvantageAudience) {
      if (payload.targeting.ageMin != null) targeting['age_min'] = payload.targeting.ageMin;
      if (payload.targeting.ageMax != null) targeting['age_max'] = payload.targeting.ageMax;
    }
    if (payload.targeting.targetingAutomation != null) {
      targeting['targeting_automation'] = {
        advantage_audience: payload.targeting.targetingAutomation.advantageAudience,
      };
    }

    const body: Record<string, unknown> = {
      campaign_id:       payload.campaignId,
      name:              payload.name,
      status:            payload.status,
      billing_event:     payload.billingEvent,
      optimization_goal: payload.optimizationGoal,
      bid_strategy:      payload.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP',
      targeting,
    };

    if (payload.promotedObject) {
      const po: Record<string, unknown> = {};
      if (payload.promotedObject.pixelId)         po['pixel_id']          = payload.promotedObject.pixelId;
      if (payload.promotedObject.customEventType) po['custom_event_type'] = payload.promotedObject.customEventType;
      body['promoted_object'] = po;
    }

    if (payload.attributionSpec) {
      body['attribution_spec'] = payload.attributionSpec.map(s => ({
        event_type:  s.eventType,
        window_days: s.windowDays,
      }));
    }

    if (payload.dailyBudget != null)    body['daily_budget']    = payload.dailyBudget;
    if (payload.lifetimeBudget != null) body['lifetime_budget'] = payload.lifetimeBudget;
    if (payload.bidAmount != null)      body['bid_amount']      = payload.bidAmount;
    if (payload.startTime)              body['start_time']      = payload.startTime;
    if (payload.endTime)                body['end_time']        = payload.endTime;

    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/adsets`, body, { params })
    );
  }

  // ── Ad Creatives ─────────────────────────────────────────────────────────

  /**
   * Creates a new ad creative.
   * Call after uploading images/videos to obtain their hash/ID.
   * @param payload - Creative creation parameters.
   * @returns Promise resolving to the created creative's ID.
   * @throws When not authenticated or the API call fails.
   */
  async createAdCreative(payload: AdCreativePayload): Promise<{ id: string }> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');
    const params = this.authParams();

    // Build link_data inside object_story_spec
    const linkData: Record<string, unknown> = {
      link: payload.linkUrl ?? '',
    };
    if (payload.body)      linkData['message']     = payload.body;
    if (payload.title)     linkData['name']        = payload.title;
    if (payload.description) linkData['description'] = payload.description;
    if (payload.imageHash) linkData['image_hash']  = payload.imageHash;
    if (payload.callToActionType) {
      linkData['call_to_action'] = {
        type:  payload.callToActionType,
        value: { link: payload.linkUrl ?? '' },
      };
    }

    const objectStorySpec: Record<string, unknown> = {
      page_id:   payload.pageId,
      link_data: linkData,
    };
    if (payload.instagramActorId) {
      objectStorySpec['instagram_actor_id'] = payload.instagramActorId;
    }

    const body: Record<string, unknown> = {
      name:               payload.name,
      object_story_spec:  objectStorySpec,
    };

    if (payload.beneficiary || payload.payer) {
      body['beneficiary'] = payload.beneficiary ?? '';
      body['payer']       = payload.payer ?? '';
    }

    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/adcreatives`, body, { params })
    );
  }

  /**
   * Uploads an image to the ad account's image library.
   * Returns the image hash used when creating ad creatives.
   * API: POST /{ad-account-id}/adimages
   *
   * @param file - Image file to upload.
   * @returns Promise resolving to the image hash.
   * @throws When not authenticated, no account selected, or the API call fails.
   */
  async uploadImage(file: File): Promise<{ hash: string }> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');

    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    // Chunked base64 encoding — avoids call-stack overflow on large files.
    const chunkSize = 8192;
    let binary = '';
    for (let i = 0; i < uint8.length; i += chunkSize) {
      binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
    }
    const bytes = btoa(binary);

    const params = this.authParams();
    const body = new FormData();
    body.append('bytes', bytes);
    body.append('filename', file.name);

    const response = await firstValueFrom(
      this.http.post<{ images: Record<string, { hash: string }> }>(
        `${GRAPH_API_BASE}/${adAccountId}/adimages`,
        body,
        { params }
      )
    );

    // Facebook keys the response by the FormData field name, not the filename.
    const entry = Object.values(response.images)[0];
    if (!entry?.hash) throw new Error('Image upload succeeded but no hash was returned.');
    return { hash: entry.hash };
  }

  // ── Ads ───────────────────────────────────────────────────────────────────

  /**
   * Lists all ads for a given ad set.
   * @param adSetId - Parent ad set ID.
   * @returns Promise resolving to an array of ads.
   * @throws When not authenticated or the API call fails.
   */
  async getAds(adSetId: string): Promise<Ad[]> {
    const params = this.authParams().set(
      'fields',
      'id,name,adset_id,campaign_id,status,creative,created_time,updated_time'
    );
    const result = await firstValueFrom(
      this.http.get<GraphApiList<Ad>>(`${GRAPH_API_BASE}/${adSetId}/ads`, { params })
    );
    return result.data;
  }

  /**
   * Updates an existing ad.
   * @param adId - ID of the ad to update.
   * @param payload - Fields to update.
   * @returns Promise resolving to a success indicator.
   * @throws When not authenticated or the API call fails.
   */
  async updateAd(adId: string, payload: Partial<AdPayload>): Promise<{ success: boolean }> {
    const params = this.authParams();
    const body: Record<string, unknown> = {};
    if (payload.name != null)       body['name']        = payload.name;
    if (payload.status != null)     body['status']      = payload.status;
    if (payload.creativeId != null) body['creative']    = { creative_id: payload.creativeId };
    if (payload.adSetId != null)    body['adset_id']    = payload.adSetId;
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${adId}`, body, { params })
    );
  }

  /**
   * Creates a new ad.
   * @param payload - Ad creation parameters.
   * @returns Promise resolving to the created ad's ID.
   * @throws When not authenticated or the API call fails.
   */
  async createAd(payload: AdPayload): Promise<{ id: string }> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');
    const params = this.authParams();

    const body: Record<string, unknown> = {
      adset_id: payload.adSetId,
      name:     payload.name,
      status:   payload.status,
      creative: { creative_id: payload.creativeId },
    };

    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/ads`, body, { params })
    );
  }
}
