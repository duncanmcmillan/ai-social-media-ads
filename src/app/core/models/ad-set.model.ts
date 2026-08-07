/**
 * @fileoverview Ad Set data models matching the Facebook Marketing API schema.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-campaign
 */

/** Effective status values for a Facebook ad set. */
export type AdSetStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';

/** Billing event — when the advertiser is charged. */
export type BillingEvent =
  | 'APP_INSTALLS'
  | 'CLICKS'
  | 'IMPRESSIONS'
  | 'LINK_CLICKS'
  | 'NONE'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'THRUPLAY';

/** Optimisation goal for the ad set. */
export type OptimizationGoal =
  | 'NONE'
  | 'APP_INSTALLS'
  | 'BRAND_AWARENESS'
  | 'CLICKS'
  | 'ENGAGED_USERS'
  | 'EVENT_RESPONSES'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'
  | 'LINK_CLICKS'
  | 'OFFSITE_CONVERSIONS'
  | 'PAGE_ENGAGEMENT'
  | 'PAGE_LIKES'
  | 'POST_ENGAGEMENT'
  | 'REACH'
  | 'SOCIAL_IMPRESSIONS'
  | 'VALUE'
  | 'THRUPLAY';

/** Represents a Facebook ad set. */
export interface AdSet {
  /** Unique ad set identifier. */
  id: string;
  /** Parent campaign ID. */
  campaignId: string;
  /** Ad set display name. */
  name: string;
  /** Effective status. */
  status: AdSetStatus;
  /** Billing event — when charges are incurred. */
  billingEvent: BillingEvent;
  /** Optimisation goal. */
  optimizationGoal: OptimizationGoal;
  /** Daily budget in minor currency units, or null. */
  dailyBudget: number | null;
  /** Lifetime budget in minor currency units, or null. */
  lifetimeBudget: number | null;
  /** Bid amount in minor currency units, or null for auto-bid. */
  bidAmount: number | null;
  /** ISO 8601 creation timestamp. */
  createdTime: string;
  /** ISO 8601 last-update timestamp. */
  updatedTime: string;
}

/** Geographic and demographic targeting for an ad set. */
export interface AdSetTargeting {
  /** Country-level geo location targeting. */
  geoLocations: { countries: string[] };
  /** Minimum audience age. */
  ageMin?: number;
  /** Maximum audience age. */
  ageMax?: number;
}

/**
 * The Facebook object (pixel, app, page) being promoted.
 * Required for conversion and lead objectives.
 * API field: promoted_object
 */
export interface PromotedObject {
  /**
   * Meta Pixel ID.
   * Required for OUTCOME_SALES and OUTCOME_LEADS objectives.
   */
  pixelId?: string;
  /**
   * Pixel custom event type (e.g. PURCHASE, LEAD, COMPLETE_REGISTRATION).
   * Required when pixelId is set.
   */
  customEventType?: string;
}

/**
 * A single entry in the ad set's attribution window spec.
 * API field: attribution_spec
 * Inherits from Workspace → Enhancements → Attribution Window settings.
 */
export interface AttributionSpec {
  /** Attribution event type. */
  eventType: 'CLICK_THROUGH' | 'ENGAGED_VIDEO_VIEW' | 'VIEW_THROUGH';
  /** Attribution window in days (1, 7, or 28). */
  windowDays: number;
}

/** Facebook bid strategy for an ad set. */
export type BidStrategy =
  | 'LOWEST_COST_WITHOUT_CAP'
  | 'LOWEST_COST_WITH_BID_CAP'
  | 'COST_CAP'
  | 'TARGET_COST';

/** Payload for creating or updating an ad set. */
export interface AdSetPayload {
  /** Parent campaign ID. */
  campaignId: string;
  /** Ad set display name. */
  name: string;
  /** Desired status. */
  status: 'ACTIVE' | 'PAUSED';
  /** Billing event. */
  billingEvent: BillingEvent;
  /** Optimisation goal. */
  optimizationGoal: OptimizationGoal;
  /**
   * Bid strategy. Defaults to LOWEST_COST_WITHOUT_CAP when not provided.
   * LOWEST_COST_WITH_BID_CAP and TARGET_COST require bidAmount.
   */
  bidStrategy?: BidStrategy;
  /**
   * Audience and geographic targeting.
   * Inherits defaults from Workspace → Default Targeting.
   */
  targeting: AdSetTargeting;
  /**
   * The Facebook object being promoted (pixel, app, page).
   * Derived from campaign objective + workspace pixel ID.
   */
  promotedObject?: PromotedObject;
  /**
   * Attribution window configuration.
   * Inherits from Workspace → Enhancements → Attribution Window.
   */
  attributionSpec?: AttributionSpec[];
  /** Daily budget in minor currency units (e.g. pence, cents). */
  dailyBudget?: number;
  /** Lifetime budget in minor currency units. */
  lifetimeBudget?: number;
  /** Bid amount in minor currency units. */
  bidAmount?: number;
  /** ISO 8601 start time. Omit for immediate start. */
  startTime?: string;
  /** ISO 8601 end time. Omit for no end date. */
  endTime?: string;
}
