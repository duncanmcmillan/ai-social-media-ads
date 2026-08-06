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
  /** Daily budget in minor currency units. */
  dailyBudget?: number;
  /** Lifetime budget in minor currency units. */
  lifetimeBudget?: number;
  /** Bid amount in minor currency units. */
  bidAmount?: number;
}
