/**
 * @fileoverview Public API for the core module.
 * Re-exports shared services, stores, models, and utilities.
 */
export { AppStore } from './store/app.store';
export { MarketingApiService } from './services/facebook/marketing-api/marketing-api.service';
export { InsightsApiService } from './services/facebook/insights-api/insights-api.service';
export type { InsightMetrics, DatePreset } from './services/facebook/insights-api/insights-api.service';
export { AdPreviewApiService } from './services/facebook/ad-preview-api/ad-preview-api.service';
export type { AdPreview, PreviewFormat } from './services/facebook/ad-preview-api/ad-preview-api.service';
export { extractFacebookError } from './utils/facebook-error.utils';
export type { Campaign, CampaignPayload, AdSet, AdSetPayload, Ad, AdPayload, AdCreative, AdCreativePayload } from './models/index';
