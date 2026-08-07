/**
 * @fileoverview Facebook Marketing API service.
 * Provides CRUD operations for Campaigns, Ad Sets, and Ads via the Facebook Graph API.
 * All requests are authenticated with the access token stored in the auth signal store.
 * @see README.md for endpoint specifications and payload data sources.
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

  /** Returns common Graph API query parameters including the access token. */
  private authParams(): HttpParams {
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
    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/campaigns`, payload, { params })
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
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${campaignId}`, payload, { params })
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
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${adSetId}`, payload, { params })
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
    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/adsets`, payload, { params })
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
    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/adcreatives`, payload, { params })
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
    const bytes = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const body = new FormData();
    body.append('bytes', bytes);
    body.append('filename', file.name);
    body.append('access_token', this.authStore.accessToken() ?? '');

    const response = await firstValueFrom(
      this.http.post<{ images: Record<string, { hash: string }> }>(
        `${GRAPH_API_BASE}/${adAccountId}/adimages`,
        body
      )
    );

    const entry = response.images[file.name];
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
    return firstValueFrom(
      this.http.post<{ success: boolean }>(`${GRAPH_API_BASE}/${adId}`, payload, { params })
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
    return firstValueFrom(
      this.http.post<{ id: string }>(`${GRAPH_API_BASE}/${adAccountId}/ads`, payload, { params })
    );
  }
}
