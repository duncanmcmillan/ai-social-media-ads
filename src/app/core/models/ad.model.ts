/**
 * @fileoverview Ad data models matching the Facebook Marketing API schema.
 * @see https://developers.facebook.com/docs/marketing-api/reference/adgroup
 */

/** Effective status values for a Facebook ad. */
export type AdStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';

/** Represents a Facebook ad. */
export interface Ad {
  /** Unique ad identifier. */
  id: string;
  /** Parent ad set ID. */
  adSetId: string;
  /** Parent campaign ID. */
  campaignId: string;
  /** Ad display name. */
  name: string;
  /** Effective status. */
  status: AdStatus;
  /** ID of the associated creative. */
  creativeId: string;
  /** ISO 8601 creation timestamp. */
  createdTime: string;
  /** ISO 8601 last-update timestamp. */
  updatedTime: string;
}

/** Payload for creating or updating an ad. */
export interface AdPayload {
  /** Parent ad set ID. */
  adSetId: string;
  /** Ad display name. */
  name: string;
  /** Desired status. */
  status: 'ACTIVE' | 'PAUSED';
  /** ID of the creative to attach. */
  creativeId: string;
}
