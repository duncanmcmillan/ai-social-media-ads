/**
 * @fileoverview Campaign Template model.
 * Defines the serialisable shape of a saved campaign draft template.
 */
import type { DraftCampaign, DraftAdSet, DraftCreative } from '../../new-campaign/model/draft.model';

/**
 * A saved campaign template that can be loaded to pre-fill the wizard.
 * File objects are excluded because they are not JSON-serialisable.
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
   * Saved creative drafts without `file` or `objectUrl`.
   * Both are session-temporary and cannot be persisted; re-upload is required on launch.
   */
  creatives: Omit<DraftCreative, 'file' | 'objectUrl'>[];
}
