/**
 * @fileoverview Meta Performance Recommendations API model.
 * Represents a single recommendation returned by the Meta Performance
 * Recommendations API, including its apply status for the UI.
 */

/** Apply lifecycle status for a Meta recommendation card. */
export type MetaRecStatus = 'pending' | 'applying' | 'applied' | 'dismissed';

/**
 * A single recommendation from the Meta Performance Recommendations API.
 * Each recommendation maps to a single actionable Marketing API call,
 * or to a "View guide" link for non-actionable types.
 */
export interface MetaRecommendation {
  /** Unique signature used to identify and confirm the recommendation back to Meta. */
  signature: string;
  /** Recommendation type enum string (e.g. BUDGET_LIMITED, AUTOMATIC_PLACEMENTS). */
  type: string;
  /** Human-readable explanation from Meta — displayed as-is in the UI. */
  body: string;
  /** Estimated performance uplift description (e.g. "15% more conversions"). */
  liftEstimate: string;
  /** Expected opportunity score point increase (0–100 scale). */
  scoreLift: number;
  /** IDs of the campaign, ad set, or ad this recommendation applies to. */
  objectIds: string[];
  /** Object level the recommendation targets: 'campaign' | 'adset' | 'ad' | 'account'. */
  level: string;
  /** Current apply status — drives the card UI state. */
  status: MetaRecStatus;
}
