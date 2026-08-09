/**
 * @fileoverview Facebook Insights API service.
 * Retrieves performance metrics for campaigns, ad sets, and ads.
 * @see https://developers.facebook.com/docs/marketing-api/insights
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../auth';

/** Base URL for the Facebook Graph API. */
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/** Performance metric fields returned by the Insights API. */
export interface InsightMetrics {
  /** Total ad impressions. */
  impressions: string;
  /** Total link clicks. */
  clicks: string;
  /** Click-through rate as a percentage string. */
  ctr: string;
  /** Cost per click (account currency). */
  cpc: string;
  /** Cost per 1,000 impressions. */
  cpm: string;
  /** Total amount spent in account currency. */
  spend: string;
  /** Total reach (unique people). */
  reach: string;
  /** Date range start (YYYY-MM-DD). */
  dateStart: string;
  /** Date range end (YYYY-MM-DD). */
  dateStop: string;
}

/** Campaign-level insight row (one entry per campaign in the date range). */
export interface CampaignInsightRow extends InsightMetrics {
  /** Facebook campaign ID. */
  campaignId: string;
  /** Campaign display name. */
  campaignName: string;
}

/** Ad-level insight row (one entry per ad in the date range). */
export interface AdInsightRow extends InsightMetrics {
  /** Facebook ad ID. */
  adId: string;
  /** Ad display name. */
  adName: string;
  /** ID of the ad set this ad belongs to. */
  adSetId: string;
  /** Display name of the ad set this ad belongs to. */
  adSetName: string;
}

/** Wraps a Graph API insights list response. */
interface InsightsResponse {
  /** Array of insight metric objects. */
  data: InsightMetrics[];
}

/** Raw campaign-level row from the Graph API (snake_case). */
interface RawCampaignInsightRow {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  reach: string;
  date_start: string;
  date_stop: string;
}

/** Raw ad-level row from the Graph API (snake_case). */
interface RawAdInsightRow {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  reach: string;
  date_start: string;
  date_stop: string;
}

/** Date preset options for insights queries. */
export type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last_7d'
  | 'last_14d'
  | 'last_28d'
  | 'last_30d'
  | 'last_month'
  | 'this_month'
  | 'this_year';

/**
 * Service for fetching Facebook Ads performance insights.
 * Use this service from stores — never inject it directly into components.
 */
@Injectable({ providedIn: 'root' })
export class InsightsApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  /** Returns common Graph API query parameters including the access token. */
  private authParams(): HttpParams {
    const token = this.authStore.accessToken();
    if (!token) throw new Error('Not authenticated — no access token available.');
    return new HttpParams().set('access_token', token);
  }

  /** Returns the ad account ID, throwing if none is selected. */
  private requireAdAccountId(): string {
    const id = this.authStore.adAccountId();
    if (!id) throw new Error('No ad account selected.');
    return id;
  }

  /**
   * Fetches insights for a given object (campaign, ad set, or ad).
   * @param objectId - The campaign, ad set, or ad ID to query.
   * @param datePreset - The relative date range.
   * @returns Promise resolving to an array of insight metric snapshots.
   * @throws When not authenticated or the API call fails.
   */
  async getInsights(objectId: string, datePreset: DatePreset = 'last_30d'): Promise<InsightMetrics[]> {
    const params = this.authParams()
      .set('fields', 'impressions,clicks,ctr,cpc,cpm,spend,reach,date_start,date_stop')
      .set('date_preset', datePreset);

    const result = await firstValueFrom(
      this.http.get<InsightsResponse>(`${GRAPH_API_BASE}/${objectId}/insights`, { params })
    );
    return result.data;
  }

  /**
   * Fetches account-level insights for the connected ad account.
   * @param datePreset - The relative date range.
   * @returns Promise resolving to an array of insight metric snapshots.
   * @throws When not authenticated or the API call fails.
   */
  async getAccountInsights(datePreset: DatePreset = 'last_30d'): Promise<InsightMetrics[]> {
    const adAccountId = this.requireAdAccountId();
    return this.getInsights(adAccountId, datePreset);
  }

  /**
   * Fetches per-campaign insights for the connected ad account in a single API call.
   * Uses `level=campaign` so each row represents one campaign.
   * @param datePreset - The relative date range.
   * @returns Promise resolving to campaign-level insight rows, sorted by spend descending.
   */
  async getCampaignLevelInsights(datePreset: DatePreset = 'last_30d'): Promise<CampaignInsightRow[]> {
    const adAccountId = this.requireAdAccountId();
    const params = this.authParams()
      .set('level', 'campaign')
      .set('fields', 'campaign_id,campaign_name,impressions,clicks,ctr,cpc,cpm,spend,reach,date_start,date_stop')
      .set('date_preset', datePreset)
      .set('limit', '200');

    const result = await firstValueFrom(
      this.http.get<{ data: RawCampaignInsightRow[] }>(
        `${GRAPH_API_BASE}/${adAccountId}/insights`, { params }
      )
    );

    return (result.data ?? [])
      .map(r => ({
        campaignId:   r.campaign_id,
        campaignName: r.campaign_name,
        impressions:  r.impressions,
        clicks:       r.clicks,
        ctr:          r.ctr,
        cpc:          r.cpc,
        cpm:          r.cpm,
        spend:        r.spend,
        reach:        r.reach,
        dateStart:    r.date_start,
        dateStop:     r.date_stop,
      }))
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend));
  }

  /**
   * Fetches per-ad insights for the connected ad account in a single API call.
   * Uses `level=ad` so each row represents one ad, with its ad set name included.
   * @param datePreset - The relative date range.
   * @returns Promise resolving to ad-level insight rows, sorted by spend descending.
   */
  async getAdLevelInsights(datePreset: DatePreset = 'last_30d'): Promise<AdInsightRow[]> {
    const adAccountId = this.requireAdAccountId();
    const params = this.authParams()
      .set('level', 'ad')
      .set('fields', 'ad_id,ad_name,adset_id,adset_name,impressions,clicks,ctr,cpc,cpm,spend,reach,date_start,date_stop')
      .set('date_preset', datePreset)
      .set('limit', '500');

    const result = await firstValueFrom(
      this.http.get<{ data: RawAdInsightRow[] }>(
        `${GRAPH_API_BASE}/${adAccountId}/insights`, { params }
      )
    );

    return (result.data ?? [])
      .map(r => ({
        adId:        r.ad_id,
        adName:      r.ad_name,
        adSetId:     r.adset_id,
        adSetName:   r.adset_name,
        impressions: r.impressions,
        clicks:      r.clicks,
        ctr:         r.ctr,
        cpc:         r.cpc,
        cpm:         r.cpm,
        spend:       r.spend,
        reach:       r.reach,
        dateStart:   r.date_start,
        dateStop:    r.date_stop,
      }))
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend));
  }
}
