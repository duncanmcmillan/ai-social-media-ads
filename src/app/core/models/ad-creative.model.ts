/**
 * @fileoverview Ad Creative data models matching the Facebook Marketing API schema.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-creative
 */

/** Facebook ad format types. */
export type AdFormat = 'SINGLE_IMAGE' | 'SINGLE_VIDEO' | 'CAROUSEL' | 'COLLECTION';

/** Represents a Facebook ad creative. */
export interface AdCreative {
  /** Unique creative identifier. */
  id: string;
  /** Creative display name. */
  name: string;
  /** The ad format. */
  format: AdFormat;
  /** Page-level call to action type. */
  callToActionType: string;
  /** Primary body text of the ad. */
  body: string | null;
  /** Ad headline. */
  title: string | null;
  /** Link destination URL. */
  linkUrl: string | null;
  /** Image hash (for image-based creatives). */
  imageHash: string | null;
  /** Image URL for preview. */
  imageUrl: string | null;
  /** ISO 8601 creation timestamp. */
  createdTime: string;
}

/** Payload for creating an ad creative. */
export interface AdCreativePayload {
  /** Creative display name. */
  name: string;
  /** Ad headline. */
  title?: string;
  /** Primary body text. */
  body?: string;
  /** Link destination URL. */
  linkUrl?: string;
  /** Image hash (upload via ad images endpoint first). */
  imageHash?: string;
  /** Page ID to run the ad from. */
  pageId: string;
  /** Call to action type. */
  callToActionType?: string;
}
