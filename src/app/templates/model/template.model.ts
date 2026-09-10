/**
 * @fileoverview Campaign Template model.
 * Defines the serialisable shape of a saved campaign draft template.
 */
import type { DraftCampaign, DraftAdSet, DraftCreative, CarouselCard, CollectionCard } from '../../new-campaign/model/draft.model';

/** Carousel card with session-temporary fields (`file`, `objectUrl`) removed. */
export type SerializableCarouselCard = Omit<CarouselCard, 'file' | 'objectUrl'>;

/** Collection card with session-temporary fields (`file`, `objectUrl`) removed. */
export type SerializableCollectionCard = Omit<CollectionCard, 'file' | 'objectUrl'>;

/**
 * Creative with all session-temporary fields removed — top-level and nested cards.
 * Both `file` (non-serialisable) and `objectUrl` (blob URL, session-scoped) are excluded.
 */
export type SerializableCreative = Omit<DraftCreative, 'file' | 'objectUrl' | 'carouselCards' | 'collectionCards'> & {
  /** Carousel cards without file or objectUrl. */
  carouselCards: SerializableCarouselCard[];
  /** Collection cards without file or objectUrl. */
  collectionCards: SerializableCollectionCard[];
};

/**
 * A saved campaign template that can be loaded to pre-fill the wizard.
 * File objects and blob URLs are excluded because they are not JSON-serialisable
 * and are session-scoped respectively.
 */
export interface CampaignTemplate {
  /** Client-side UUID generated at save time. */
  id: string;
  /** User-supplied display name for the template. */
  name: string;
  /** ISO 8601 timestamp of when the template was saved. */
  savedAt: string;
  /** Saved campaign-level settings. */
  campaign: DraftCampaign;
  /** Saved ad set drafts. */
  adSets: DraftAdSet[];
  /**
   * Saved creative drafts with session-temporary fields stripped.
   * Re-upload of media is required before launch.
   */
  creatives: SerializableCreative[];
}
