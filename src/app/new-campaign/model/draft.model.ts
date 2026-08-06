/**
 * @fileoverview Draft (in-memory) models for the New Campaign wizard.
 * These types represent campaign data before it has been published to Facebook.
 */
import type { CampaignObjective, AdSetStatus, BillingEvent, OptimizationGoal } from '../../core/models/index';

/** Step 1 — campaign-level draft data. */
export interface DraftCampaign {
  /** Display name for the campaign. */
  name: string;
  /** Facebook campaign objective. */
  objective: CampaignObjective | null;
  /** Whether the campaign budget is controlled at campaign or ad-set level. */
  budgetType: 'campaign' | 'adset';
  /** Budget period. */
  budgetPeriod: 'daily' | 'lifetime';
  /** Budget amount in account currency minor units. */
  budgetAmount: number;
  /** UTM parameter string appended to destination URLs. */
  utmParameters: string;
  /** Whether to activate immediately or start paused. */
  activateImmediately: boolean;
}

/** Draft targeting settings for a single ad set. */
export interface DraftTargeting {
  /** ISO 3166-1 alpha-2 country codes. */
  countries: string[];
  /** Minimum audience age. */
  minAge: number;
  /** Maximum audience age. */
  maxAge: number;
  /** Interest-based audience keywords. */
  interests: string[];
}

/** Step 2 — ad set draft data. */
export interface DraftAdSet {
  /** Client-side unique identifier (not a Facebook ID). */
  id: string;
  /** Display name for the ad set. */
  name: string;
  /** Effective status for this ad set. */
  status: AdSetStatus;
  /** Whether to use Advantage+ automatic placement or configure manually. */
  placementMode: 'advantage' | 'manual';
  /** How Meta optimises delivery for this ad set. */
  optimizationGoal: OptimizationGoal;
  /** When the advertiser is charged. */
  billingEvent: BillingEvent;
  /** Budget period when budgetType is 'adset'. */
  budgetPeriod: 'daily' | 'lifetime';
  /** Budget amount in account currency minor units, or null to use campaign budget. */
  budgetAmount: number | null;
  /** Schedule mode. */
  scheduleMode: 'continuous' | 'scheduled';
  /** ISO 8601 start date, or null for immediate. */
  startDate: string | null;
  /** ISO 8601 end date, or null for no end. */
  endDate: string | null;
  /** Targeting parameters. */
  targeting: DraftTargeting;
}

/** A single carousel card within a creative. */
export interface CarouselCard {
  /** Client-side unique identifier. */
  id: string;
  /** Object URL for local preview (revoked on component destroy). */
  objectUrl: string;
  /** Original file name. */
  fileName: string;
  /** Per-card headline. */
  headline: string;
  /** Per-card description. */
  description: string;
  /** Per-card destination URL. */
  url: string;
  /** Per-card call to action. */
  cta: string;
}

/** Step 3 — creative draft data. */
export interface DraftCreative {
  /** Client-side unique identifier. */
  id: string;
  /** Original file name. */
  fileName: string;
  /** File media type. */
  fileType: 'image' | 'video';
  /** Object URL for local preview. */
  objectUrl: string;
  /** Selected tone chips (e.g. 'Conversational', 'Professional'). */
  tones: string[];
  /** Selected hook chip. */
  hook: string;
  /** Selected copy length. */
  length: 'Short' | 'Medium' | 'Long';
  /** Primary ad copy text. */
  primaryText: string;
  /** Ad headline. */
  headline: string;
  /** Ad description. */
  description: string;
  /** Call to action label. */
  cta: string;
  /** Whether this creative will launch active or paused. */
  launchStatus: 'active' | 'paused';
  /** Whether each copy variation becomes a separate ad or a flexible ad. */
  adCreationMode: 'separate' | 'flexible';
  /** When true, this creative is a Carousel ad. */
  isCarousel: boolean;
  /** Carousel cards (only used when isCarousel is true). */
  carouselCards: CarouselCard[];
}

/** URL source for the creatives step. */
export type WebsiteUrlMode = 'default' | 'adset' | 'creative';
