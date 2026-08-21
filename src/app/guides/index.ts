/**
 * @fileoverview Public API for the guides feature module.
 * Re-exports both slide-over panel components and domain models.
 */
export { GuidePanelComponent } from './component/guide-panel.component';
export { MetricsGuidePanelComponent } from './component/metrics-guide-panel.component';
export { GuidesStore } from './store/guides.store';
export type { AppType, GuideObjective, GuideContent, MarketingGuide, GuideContext } from './model/guides.model';
export { APP_TYPE_LABELS, OBJECTIVE_LABELS } from './model/guides.model';
