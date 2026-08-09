/**
 * @fileoverview Campaign data models matching the Facebook Marketing API schema.
 * @see https://developers.facebook.com/docs/marketing-api/reference/ad-campaign-group
 */

/** Facebook campaign effective status values. */
export type CampaignStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'DELETED'
  | 'ARCHIVED'
  | 'IN_PROCESS'
  | 'WITH_ISSUES';

/** Facebook campaign buying type. */
export type BuyingType = 'AUCTION' | 'RESERVED';

/** Facebook campaign objective. */
export type CampaignObjective =
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_SALES';

/** Represents a Facebook ad campaign. */
export interface Campaign {
  /** The campaign's unique identifier. */
  id: string;
  /** The campaign name. */
  name: string;
  /** Current effective status. */
  status: CampaignStatus;
  /** Campaign objective (determines ad type options). */
  objective: CampaignObjective;
  /** Buying type — typically AUCTION. */
  buyingType: BuyingType;
  /** Daily budget in account currency (minor units), or null if not set. */
  dailyBudget: number | null;
  /** Lifetime budget in account currency (minor units), or null if not set. */
  lifetimeBudget: number | null;
  /** ISO 8601 creation timestamp. */
  createdTime: string;
  /** ISO 8601 timestamp of last update. */
  updatedTime: string;
}

/**
 * Special ad category declarations required by the Facebook Marketing API.
 * Must be passed on every campaign POST, even as an empty array for standard ads.
 * @see https://developers.facebook.com/docs/marketing-api/special-ad-category
 */
export type SpecialAdCategory =
  | 'EMPLOYMENT'
  | 'HOUSING'
  | 'CREDIT'
  | 'ISSUES_ELECTIONS_POLITICS'
  | 'ONLINE_GAMBLING_AND_GAMING'
  | 'FINANCIAL_PRODUCTS_SERVICES';

/** Facebook bid strategy — controls how Meta bids in ad auctions. */
export type CampaignBidStrategy =
  | 'LOWEST_COST_WITHOUT_CAP'
  | 'LOWEST_COST_WITH_BID_CAP'
  | 'COST_CAP'
  | 'MINIMUM_ROAS';

/** Payload for creating or updating a campaign. */
export interface CampaignPayload {
  /** Campaign display name. */
  name: string;
  /** Campaign objective. */
  objective: CampaignObjective;
  /** Desired status. */
  status: 'ACTIVE' | 'PAUSED';
  /** Buying type. */
  buyingType?: BuyingType;
  /** Daily budget in minor currency units (e.g. pence, cents). */
  dailyBudget?: number;
  /** Lifetime budget in minor currency units. */
  lifetimeBudget?: number;
  /**
   * Bid strategy for Campaign Budget Optimisation (CBO) campaigns.
   * Only valid when dailyBudget or lifetimeBudget is set at campaign level.
   * Defaults to LOWEST_COST_WITHOUT_CAP.
   */
  bidStrategy?: CampaignBidStrategy;
  /**
   * Special ad category declarations — required by the API.
   * Pass [] for standard (non-restricted) campaigns.
   */
  specialAdCategories: SpecialAdCategory[];
}
