/**
 * @fileoverview Facebook Ad Preview API service.
 * Generates creative previews for ads before publishing.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-preview
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../../auth';

/** Base URL for the Facebook Graph API. */
const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

/** Supported ad preview formats. */
export type PreviewFormat =
  | 'DESKTOP_FEED_STANDARD'
  | 'MOBILE_FEED_STANDARD'
  | 'MOBILE_FEED_BASIC'
  | 'INSTAGRAM_STANDARD'
  | 'INSTAGRAM_STORY'
  | 'AUDIENCE_NETWORK_OUTSTREAM_VIDEO'
  | 'RIGHT_COLUMN_STANDARD';

/** A preview iframe HTML returned by the Ad Preview API. */
export interface AdPreview {
  /** The HTML snippet containing the preview iframe. */
  body: string;
}

/** Wraps the Ad Preview API response. */
interface AdPreviewResponse {
  /** Array with a single preview object. */
  data: AdPreview[];
}

/**
 * Service for generating Facebook ad previews.
 * Use this service from stores — never inject it directly into components.
 */
@Injectable({ providedIn: 'root' })
export class AdPreviewApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  /** Returns common Graph API query parameters including the access token. */
  private authParams(): HttpParams {
    const token = this.authStore.accessToken();
    if (!token) throw new Error('Not authenticated — no access token available.');
    return new HttpParams().set('access_token', token);
  }

  /**
   * Generates a preview HTML snippet for an existing ad.
   * @param adId - The ID of the ad to preview.
   * @param format - The ad preview format (placement).
   * @returns Promise resolving to the preview HTML iframe snippet.
   * @throws When not authenticated or the API call fails.
   */
  async getAdPreview(adId: string, format: PreviewFormat = 'DESKTOP_FEED_STANDARD'): Promise<AdPreview> {
    const params = this.authParams()
      .set('ad_format', format);

    const result = await firstValueFrom(
      this.http.get<AdPreviewResponse>(`${GRAPH_API_BASE}/${adId}/previews`, { params })
    );

    const preview = result.data[0];
    if (!preview) throw new Error('No preview available for this ad.');
    return preview;
  }

  /**
   * Generates a preview HTML snippet from a creative ID (no ad required).
   * @param creativeId - The ID of the ad creative to preview.
   * @param format - The ad preview format (placement).
   * @returns Promise resolving to the preview HTML iframe snippet.
   * @throws When not authenticated or the API call fails.
   */
  async getCreativePreview(creativeId: string, format: PreviewFormat = 'DESKTOP_FEED_STANDARD'): Promise<AdPreview> {
    const adAccountId = this.authStore.adAccountId();
    if (!adAccountId) throw new Error('No ad account selected.');

    const params = this.authParams()
      .set('ad_format', format)
      .set('creative', JSON.stringify({ creative_id: creativeId }));

    const result = await firstValueFrom(
      this.http.get<AdPreviewResponse>(`${GRAPH_API_BASE}/${adAccountId}/generatepreviews`, { params })
    );

    const preview = result.data[0];
    if (!preview) throw new Error('No preview available for this creative.');
    return preview;
  }
}
