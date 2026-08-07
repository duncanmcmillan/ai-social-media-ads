/**
 * @fileoverview Re-exports all core domain models.
 */
export type { Campaign, CampaignPayload, CampaignStatus, CampaignObjective, BuyingType, SpecialAdCategory } from './campaign.model';
export type { AdSet, AdSetPayload, AdSetStatus, BillingEvent, OptimizationGoal, BidStrategy, AdSetTargeting, PromotedObject, AttributionSpec } from './ad-set.model';
export type { Ad, AdPayload, AdStatus } from './ad.model';
export type { AdCreative, AdCreativePayload, AdFormat } from './ad-creative.model';
