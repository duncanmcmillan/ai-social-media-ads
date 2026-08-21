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

/** A raw action/conversion event as returned by the Insights API (snake_case). */
interface RawAction {
  /** Facebook action type identifier (e.g. 'purchase', 'lead'). */
  action_type: string;
  /** Numeric value as a string. */
  value: string;
}

/** A parsed conversion event with a numeric value. */
export interface ActionEntry {
  /** Facebook action type identifier (e.g. 'purchase', 'lead'). */
  actionType: string;
  /** Event count or monetary value. */
  value: number;
}

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
  /** Conversion events broken down by action type, if requested. */
  actions?: ActionEntry[];
}

/** Campaign-level insight row (one entry per campaign in the date range). */
export interface CampaignInsightRow extends InsightMetrics {
  /** Facebook campaign ID. */
  campaignId: string;
  /** Campaign display name. */
  campaignName: string;
  /** Average number of times each person saw the campaign's ads. */
  frequency?: string;
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
  /** ID of the parent campaign. */
  campaignId?: string;
  /** Average number of times each person saw this ad. */
  frequency?: string;
  /** Purchase ROAS (return on ad spend), or null when no purchase events are tracked. */
  purchaseRoas?: number | null;
}

/** Wraps a Graph API insights list response. */
interface InsightsResponse {
  /** Array of insight metric objects. */
  data: InsightMetrics[];
}

/** Raw account-level row from the Graph API (snake_case). */
interface RawAccountInsightRow {
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  reach: string;
  date_start: string;
  date_stop: string;
  actions?: RawAction[];
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
  frequency?: string;
  actions?: RawAction[];
}

/** Raw ad-level row from the Graph API (snake_case). */
interface RawAdInsightRow {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id?: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  spend: string;
  reach: string;
  date_start: string;
  date_stop: string;
  frequency?: string;
  actions?: RawAction[];
  purchase_roas?: RawAction[];
}

/** Raw time-series insight row returned when time_increment=1 is used. */
interface RawTimeSeriesRow {
  campaign_id?:   string;
  campaign_name?: string;
  adset_id?:      string;
  adset_name?:    string;
  impressions:    string;
  clicks:         string;
  ctr:            string;
  cpc:            string;
  cpm:            string;
  spend:          string;
  reach:          string;
  frequency?:     string;
  date_start:     string;
  date_stop:      string;
}

/**
 * A single day's aggregated metrics for one campaign or ad set,
 * returned by {@link InsightsApiService.getTimeSeriesInsights}.
 */
export interface TimeSeriesInsightRow {
  /** Facebook entity ID (campaign_id or adset_id). */
  entityId:    string;
  /** Display name of the entity. */
  entityName:  string;
  /** Date of this data point (YYYY-MM-DD). */
  date:        string;
  /** Total impressions. */
  impressions: number;
  /** Total link clicks. */
  clicks:      number;
  /** Click-through rate as a decimal percentage. */
  ctr:         number;
  /** Cost per click in account currency. */
  cpc:         number;
  /** Cost per 1,000 impressions. */
  cpm:         number;
  /** Total spend in account currency. */
  spend:       number;
  /** Unique reach (people). */
  reach:       number;
  /** Average ad frequency. */
  frequency:   number;
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
   * Includes conversion action events broken down by type.
   * @param datePreset - The relative date range.
   * @returns Promise resolving to an array of insight metric snapshots.
   * @throws When not authenticated or the API call fails.
   */
  async getAccountInsights(datePreset: DatePreset = 'last_30d'): Promise<InsightMetrics[]> {
    const adAccountId = this.requireAdAccountId();
    const params = this.authParams()
      .set('fields', 'impressions,clicks,ctr,cpc,cpm,spend,reach,actions,date_start,date_stop')
      .set('date_preset', datePreset);

    const result = await firstValueFrom(
      this.http.get<{ data: RawAccountInsightRow[] }>(
        `${GRAPH_API_BASE}/${adAccountId}/insights`, { params }
      )
    );

    return (result.data ?? []).map(r => ({
      impressions: r.impressions,
      clicks:      r.clicks,
      ctr:         r.ctr,
      cpc:         r.cpc,
      cpm:         r.cpm,
      spend:       r.spend,
      reach:       r.reach,
      dateStart:   r.date_start,
      dateStop:    r.date_stop,
      actions:     r.actions?.map(a => ({ actionType: a.action_type, value: parseFloat(a.value) || 0 })),
    }));
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
      .set('fields', 'campaign_id,campaign_name,impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions,date_start,date_stop')
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
        frequency:    r.frequency,
        actions:      r.actions?.map(a => ({ actionType: a.action_type, value: parseFloat(a.value) || 0 })),
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
      .set('fields', 'ad_id,ad_name,adset_id,adset_name,campaign_id,impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,actions,purchase_roas,date_start,date_stop')
      .set('date_preset', datePreset)
      .set('limit', '500');

    const result = await firstValueFrom(
      this.http.get<{ data: RawAdInsightRow[] }>(
        `${GRAPH_API_BASE}/${adAccountId}/insights`, { params }
      )
    );

    return (result.data ?? [])
      .map(r => {
        const roasEntry = r.purchase_roas?.find(p => p.action_type === 'omni_purchase') ?? r.purchase_roas?.[0];
        const purchaseRoas = roasEntry ? (parseFloat(roasEntry.value) || null) : null;
        return {
          adId:         r.ad_id,
          adName:       r.ad_name,
          adSetId:      r.adset_id,
          adSetName:    r.adset_name,
          campaignId:   r.campaign_id,
          impressions:  r.impressions,
          clicks:       r.clicks,
          ctr:          r.ctr,
          cpc:          r.cpc,
          cpm:          r.cpm,
          spend:        r.spend,
          reach:        r.reach,
          frequency:    r.frequency,
          actions:      r.actions?.map(a => ({ actionType: a.action_type, value: parseFloat(a.value) || 0 })),
          purchaseRoas,
          dateStart:    r.date_start,
          dateStop:     r.date_stop,
        };
      })
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend));
  }

  /**
   * Fetches day-by-day insights for all campaigns or ad sets in the given date window.
   * Uses `time_increment=1` so each API row represents a single calendar day.
   * @param params.level - 'campaign' or 'adset'.
   * @param params.since - Start date string (YYYY-MM-DD).
   * @param params.until - End date string (YYYY-MM-DD).
   * @returns Promise resolving to an array of daily rows keyed by entity + date.
   * @throws When not authenticated or the API call fails.
   */
  async getTimeSeriesInsights(params: {
    level: 'campaign' | 'adset';
    since: string;
    until: string;
  }): Promise<TimeSeriesInsightRow[]> {
    const adAccountId = this.requireAdAccountId();
    const fields = params.level === 'campaign'
      ? 'campaign_id,campaign_name,impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,date_start,date_stop'
      : 'adset_id,adset_name,impressions,clicks,ctr,cpc,cpm,spend,reach,frequency,date_start,date_stop';

    const httpParams = this.authParams()
      .set('level', params.level)
      .set('time_range', JSON.stringify({ since: params.since, until: params.until }))
      .set('time_increment', '1')
      .set('fields', fields)
      .set('limit', '5000');

    const result = await firstValueFrom(
      this.http.get<{ data: RawTimeSeriesRow[] }>(
        `${GRAPH_API_BASE}/${adAccountId}/insights`, { params: httpParams }
      )
    );

    return (result.data ?? []).map(r => {
      const isCampaign = params.level === 'campaign';
      return {
        entityId:    isCampaign ? (r.campaign_id ?? '')  : (r.adset_id ?? ''),
        entityName:  isCampaign ? (r.campaign_name ?? '') : (r.adset_name ?? ''),
        date:        r.date_start,
        impressions: parseFloat(r.impressions) || 0,
        clicks:      parseFloat(r.clicks)      || 0,
        ctr:         parseFloat(r.ctr)         || 0,
        cpc:         parseFloat(r.cpc)         || 0,
        cpm:         parseFloat(r.cpm)         || 0,
        spend:       parseFloat(r.spend)       || 0,
        reach:       parseFloat(r.reach)       || 0,
        frequency:   parseFloat(r.frequency ?? '0') || 0,
      };
    });
  }
}
