/**
 * @fileoverview Workspace settings domain models.
 * All settings are persisted to localStorage and applied as defaults
 * when creating campaigns and ad sets.
 */

/** The type of app being advertised — used to personalise AI-generated guides. */
export type AppType =
  | 'desktop-app'
  | 'mobile-app'
  | 'ecommerce'
  | 'saas'
  | 'lead-gen'
  | 'local-business'
  | 'content-media'
  | 'other';

/** Meta Defaults — applied to all campaigns unless overridden. */
export interface WorkspaceMetaDefaults {
  /** Facebook Page ID used for ad identity. */
  facebookPageId: string;
  /** When true, uses the Facebook Page for Instagram ads (no linked IG account needed). */
  usePageForInstagram: boolean;
  /** Meta Pixel / Dataset ID for conversion tracking. */
  pixelId: string;
  /** Default landing page URL for ads. */
  websiteUrl: string;
  /** Exclude existing custom audiences from ad targeting. */
  excludeCustomAudiences: boolean;
}

/** Placement and audience automation settings. */
export interface WorkspacePlacements {
  /** Let Meta automatically choose the best placements (Advantage+ Placements). */
  advantagePlacements: boolean;
  /** Let Meta find the best audience automatically (Advantage+ Audience). */
  advantageAudience: boolean;
}

/** Default targeting parameters applied to new ad sets. */
export interface WorkspaceTargeting {
  /** ISO 3166-1 alpha-2 country codes to target. */
  countries: string[];
  /** Minimum audience age. */
  minAge: number;
  /** Maximum audience age. */
  maxAge: number;
}

/** Creative enhancements, attribution, naming templates, and DSA settings. */
export interface WorkspaceEnhancements {
  /** Allow Meta to apply Advantage+ creative optimisations. */
  creativeEnhancements: boolean;
  /** Click-through attribution window in days. */
  clickThroughDays: number;
  /** Engaged-view attribution window in days. */
  engagedViewDays: number;
  /** View-through attribution window in days. */
  viewThroughDays: number;
  /** Handlebars template for creative names. */
  creativeNameTemplate: string;
  /** Handlebars template for ad set names. */
  adSetNameTemplate: string;
  /** UTM parameter string appended to destination URLs. */
  utmParameters: string;
  /**
   * EU DSA beneficiary name — the legal entity the ad represents.
   * Maps to the `beneficiary` field on the Facebook AdCreative object.
   * Required for ads targeting EU audiences.
   */
  beneficiaryName: string;
  /**
   * EU DSA payer name — the entity that funds the ads.
   * Maps to the `payer` field on the Facebook AdCreative object.
   * Required for ads targeting EU audiences.
   */
  payerName: string;
}

/** Thresholds used to evaluate creative performance and fatigue. */
export interface WorkspaceLearningRules {
  /** Minimum impressions before an ad is judged. */
  minImpressions: number;
  /** Minimum spend (account currency) before any verdict. */
  minSpend: number;
  /** Minimum conversions before conversion-rate verdicts. */
  minConversions: number;
  /** Minimum spend before an ad can be called a winner. */
  winnerMinSpend: number;
  /** ROAS floor for the winner label. */
  winnerMinRoas: number;
  /** Minimum CTR (%) — ads below this are flagged Low CTR. */
  minCtr: number;
  /** Maximum CPC — ads above this are flagged High CPC. */
  maxCpc: number;
  /** Flag as loser when CPA exceeds this multiple of target CPA. */
  killCpaMultiple: number;
  /** Frequency ceiling for prospecting audiences before fatigue counts. */
  prospectingFrequencyMax: number;
  /** Higher frequency ceiling for retargeting audiences. */
  retargetingFrequencyMax: number;
  /** CTR drop from peak (%) that marks an ad as fatigued. */
  ctrDropFromPeak: number;
}

/** Full workspace settings state. */
export interface WorkspaceState {
  metaDefaults: WorkspaceMetaDefaults;
  placements: WorkspacePlacements;
  targeting: WorkspaceTargeting;
  enhancements: WorkspaceEnhancements;
  learningRules: WorkspaceLearningRules;
  /** Type of app being advertised — personalises AI-generated guides. */
  appType: AppType;
  /** Slack incoming webhook URL for gate alert notifications. Empty string when not configured. */
  slackWebhookUrl: string;
}

/** Default workspace settings applied to a fresh install. */
export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  appType: 'desktop-app',
  slackWebhookUrl: '',
  metaDefaults: {
    facebookPageId: '',
    usePageForInstagram: true,
    pixelId: '',
    websiteUrl: '',
    excludeCustomAudiences: false,
  },
  placements: {
    advantagePlacements: true,
    advantageAudience: true,
  },
  targeting: {
    countries: [],
    minAge: 18,
    maxAge: 65,
  },
  enhancements: {
    creativeEnhancements: false,
    clickThroughDays: 7,
    engagedViewDays: 1,
    viewThroughDays: 1,
    creativeNameTemplate: '{{campaign.name}},{{adset.name}},{{creative.id}}',
    adSetNameTemplate: '{{campaign.name}},{{targeting.location}},{{date}}',
    utmParameters: 'utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.id}}',
    beneficiaryName: '',
    payerName: '',
  },
  learningRules: {
    minImpressions: 1000,
    minSpend: 50,
    minConversions: 5,
    winnerMinSpend: 300,
    winnerMinRoas: 2,
    minCtr: 1.0,
    maxCpc: 5.0,
    killCpaMultiple: 3,
    prospectingFrequencyMax: 3.5,
    retargetingFrequencyMax: 8,
    ctrDropFromPeak: 20,
  },
};
