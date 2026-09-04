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

/** A single child attachment for a Carousel ad creative. */
export interface CarouselChildAttachment {
  /** Image hash returned from POST /{ad-account-id}/adimages (for image cards). */
  imageHash?: string;
  /** Video ID returned from POST /{ad-account-id}/advideos (for video cards). */
  videoId?: string;
  /** Destination URL for this card. */
  link: string;
  /** Per-card headline (max 20 chars). */
  name: string;
  /** Per-card description (max 18 chars). */
  description: string;
  /** Call to action type (e.g. LEARN_MORE, SHOP_NOW). */
  callToActionType: string;
}

/** Payload for creating an ad creative. */
export interface AdCreativePayload {
  /** Creative display name. */
  name: string;
  /**
   * Facebook Page ID to run the ad from.
   * Inherited from Workspace → Meta Defaults → Facebook Page.
   */
  pageId: string;
  /** Ad headline. Maps to object_story_spec.link_data.name. */
  title?: string;
  /** Primary body text. Maps to object_story_spec.link_data.message. */
  body?: string;
  /** Supporting description. Maps to object_story_spec.link_data.description. */
  description?: string;
  /**
   * Link destination URL.
   * Inherited from Workspace → Meta Defaults → Website URL (unless overridden).
   */
  linkUrl?: string;
  /** Image hash returned from POST /{ad-account-id}/adimages. */
  imageHash?: string;
  /** Video ID returned from POST /{ad-account-id}/advideos. */
  videoId?: string;
  /**
   * Instagram actor ID for Instagram placements.
   * Set when Workspace → usePageForInstagram is false and a linked IG account exists.
   */
  instagramActorId?: string;
  /** Call to action type (e.g. LEARN_MORE, SHOP_NOW, SIGN_UP). */
  callToActionType?: string;
  /**
   * EU DSA: legal entity the ad represents.
   * Inherited from Workspace → Enhancements → Beneficiary Name.
   * Required for ads targeting EU audiences.
   */
  beneficiary?: string;
  /**
   * EU DSA: entity that funds the ads.
   * Inherited from Workspace → Enhancements → Payer Name.
   * Required for ads targeting EU audiences.
   */
  payer?: string;
  /** Child card attachments for Carousel ad creatives. */
  carouselChildAttachments?: CarouselChildAttachment[];
  /**
   * Instant Experience (Canvas) ID for Collection ad creatives.
   * Created in Meta Ads Manager and pasted by the user.
   */
  instantExperienceId?: string;
}
