/**
 * @fileoverview Domain models for the AI-generated Marketing Guides feature.
 * Defines app types, campaign objectives, guide content structure, and context types.
 */

/** The type of app being advertised — shapes the generated guide content. */
export type AppType =
  | 'desktop-app'
  | 'mobile-app'
  | 'ecommerce'
  | 'saas'
  | 'lead-gen'
  | 'local-business'
  | 'content-media'
  | 'other';

/** Facebook campaign objective used to tailor the guide. */
export type GuideObjective =
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION';

/** The four-section content structure Claude generates. */
export interface GuideContent {
  /** 2-3 sentence executive summary of the playbook. */
  summary: string;
  /** Section 1: how to use this objective for this app type. */
  campaignObjectiveDetails: string;
  /** Section 2: daily/weekly monitoring techniques and signals to watch. */
  monitoringTechniques: string;
  /** Section 3: TOFU / MOFU / BOFU metrics and target ranges. */
  funnelMetrics: string;
  /** Section 4: best creative formats and the optimisation process. */
  creativeTypesAndOptimisation: string;
  /** 4-6 actionable bullet-point takeaways. */
  keyTakeaways: string[];
}

/** A saved generated guide with metadata. */
export interface MarketingGuide {
  /** Unique identifier (UUID). */
  id: string;
  /** App type the guide was generated for. */
  appType: AppType;
  /** Campaign objective the guide was generated for. */
  objective: GuideObjective;
  /** ISO timestamp of when the guide was generated. */
  generatedAt: string;
  /** The AI-generated guide content. */
  content: GuideContent;
  /** Live dashboard context captured at generation time. */
  contextSnapshot: {
    /** Gate labels active at generation time. */
    gates: string[];
    /** Total spend at generation time. */
    totalSpend: number;
    /** Number of campaigns at generation time. */
    campaignCount: number;
  };
}

/** Input to the IPC handler — passed from Angular to the main process. */
export interface GuideContext {
  /** App type for the guide. */
  appType: AppType;
  /** Campaign objective for the guide. */
  objective: GuideObjective;
  /** Labels of active dashboard gate alerts. */
  gates: string[];
  /** Total spend in the current date range. */
  totalSpend: number;
  /** Number of campaigns in the current date range. */
  campaignCount: number;
}

/** Human-readable labels for each app type. */
export const APP_TYPE_LABELS: Record<AppType, string> = {
  'desktop-app':    'Desktop App',
  'mobile-app':     'Mobile App',
  'ecommerce':      'E-commerce',
  'saas':           'SaaS',
  'lead-gen':       'Lead Generation',
  'local-business': 'Local Business',
  'content-media':  'Content / Media',
  'other':          'Other',
};

/** Human-readable labels for each campaign objective. */
export const OBJECTIVE_LABELS: Record<GuideObjective, string> = {
  'OUTCOME_SALES':         'Sales',
  'OUTCOME_LEADS':         'Lead Generation',
  'OUTCOME_TRAFFIC':       'Traffic',
  'OUTCOME_AWARENESS':     'Brand Awareness',
  'OUTCOME_ENGAGEMENT':    'Engagement',
  'OUTCOME_APP_PROMOTION': 'App Promotion',
};
