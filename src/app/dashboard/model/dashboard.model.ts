/**
 * @fileoverview Domain models for the Dashboard feature.
 * Provides types for campaign cards, ad rows, conversion events,
 * gate alerts, recommendations, and the ad-verdict evaluation function.
 */
import type { WorkspaceLearningRules } from '../../workspace/model/workspace.model';

/** The performance verdict assigned to an ad after evaluating learning rules. */
export type Verdict =
  | 'winner'
  | 'needs-data'
  | 'low-ctr'
  | 'high-cpc'
  | 'low-volume'
  | 'paused'
  | 'ok';

/** A single conversion event aggregated from the Facebook Insights API. */
export interface EventAction {
  /** Facebook action type identifier (e.g. 'purchase', 'lead'). */
  actionType: string;
  /** Event count or monetary value. */
  value: number;
}

/** Ad-level row enriched with a verdict for display in a campaign card. */
export interface AdDashboardRow {
  /** Facebook ad ID. */
  adId: string;
  /** Ad display name. */
  adName: string;
  /** Parent campaign ID, used to group ads under their campaign. */
  campaignId: string;
  /** ID of the ad set this ad belongs to. */
  adSetId: string;
  /** Display name of the ad set this ad belongs to. */
  adSetName: string;
  /** Total spend in account currency. */
  spend: number;
  /** Total impressions. */
  impressions: number;
  /** Total link clicks. */
  clicks: number;
  /** Click-through rate as a decimal percentage. */
  ctr: number;
  /** Cost per click in account currency. */
  cpc: number;
  /** Average frequency (times each person saw the ad). */
  frequency: number;
  /** Purchase ROAS, or null when no purchase events are tracked. */
  purchaseRoas: number | null;
  /** Conversion events for this ad. */
  actions: EventAction[];
  /** Performance verdict. */
  verdict: Verdict;
  /** Human-readable explanation of the verdict. */
  reason: string;
}

/** Campaign-level row summarising spend and listing its child ad rows. */
export interface CampaignDashboardRow {
  /** Facebook campaign ID. */
  campaignId: string;
  /** Campaign display name. */
  campaignName: string;
  /** Total spend across all ads in account currency. */
  spend: number;
  /** Total impressions across all ads. */
  impressions: number;
  /** Total link clicks across all ads. */
  clicks: number;
  /** Blended click-through rate. */
  ctr: number;
  /** Blended cost per click. */
  cpc: number;
  /** Average frequency for this campaign. */
  frequency: number;
  /** Ad rows belonging to this campaign. */
  ads: AdDashboardRow[];
}

/** Type of threshold breach detected by a gate. */
export type GateType = 'learning-phase' | 'fatigue' | 'low-roas';

/** An alert card shown when a performance threshold is breached. */
export interface Gate {
  /** Type of gate that triggered. */
  type: GateType;
  /** Short heading for the alert card. */
  label: string;
  /** Supporting detail with relevant metrics. */
  detail: string;
}

/** An action card derived from gate alerts and ad verdicts. */
export interface Recommendation {
  /** Concise action label. */
  label: string;
  /** Supporting detail with relevant metrics. */
  detail: string;
}

/** Minimal numeric ad metrics required by {@link evaluateAd}. */
export interface RawAdInsight {
  /** Total spend in account currency. */
  spend: number;
  /** Total impressions. */
  impressions: number;
  /** Click-through rate as a decimal percentage. */
  ctr: number;
  /** Cost per click in account currency. */
  cpc: number;
}

/**
 * Evaluates ad metrics against workspace learning rules and returns a verdict.
 * Pure function — no side effects, no DI dependencies.
 *
 * @param ad - Parsed numeric metrics for one ad.
 * @param rules - Workspace-configured evaluation thresholds.
 * @param currency - ISO 4217 currency code used for formatting reason strings.
 * @returns A verdict label and a human-readable explanation.
 */
export function evaluateAd(
  ad: RawAdInsight,
  rules: WorkspaceLearningRules,
  currency = 'GBP',
): { verdict: Verdict; reason: string } {
  const fmt = (v: number): string =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(v);
  const fmtN = (v: number): string => new Intl.NumberFormat(undefined).format(v);

  if (ad.spend < rules.minSpend || ad.impressions < rules.minImpressions) {
    return {
      verdict: 'needs-data',
      reason: `Spend ${fmt(ad.spend)} and ${fmtN(ad.impressions)} impressions — below thresholds (${fmt(rules.minSpend)} spend / ${fmtN(rules.minImpressions)} impressions needed).`,
    };
  }
  if (ad.spend >= rules.winnerMinSpend && ad.ctr >= rules.minCtr) {
    return {
      verdict: 'winner',
      reason: `Spend ${fmt(ad.spend)} with ${ad.ctr.toFixed(2)}% CTR — meets winner criteria (min spend ${fmt(rules.winnerMinSpend)}, min CTR ${rules.minCtr}%).`,
    };
  }
  if (ad.ctr < rules.minCtr) {
    return {
      verdict: 'low-ctr',
      reason: `CTR of ${ad.ctr.toFixed(2)}% is below the ${rules.minCtr}% threshold set in Workspace Learning Rules.`,
    };
  }
  if (ad.cpc > rules.maxCpc) {
    return {
      verdict: 'high-cpc',
      reason: `CPC of ${fmt(ad.cpc)} exceeds the ${fmt(rules.maxCpc)} limit set in Workspace Learning Rules.`,
    };
  }
  return {
    verdict: 'ok',
    reason: `Spend ${fmt(ad.spend)}, CTR ${ad.ctr.toFixed(2)}% — within normal range.`,
  };
}
