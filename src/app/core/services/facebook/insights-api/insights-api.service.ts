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

/** Wraps a Graph API insights list response. */
interface InsightsResponse {
  /** Array of insight metric objects. */
  data: InsightMetrics[];
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
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');
    return this.getInsights(adAccountId, datePreset);
  }
}
