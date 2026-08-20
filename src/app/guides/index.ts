/**
 * @fileoverview Public API for the guides feature module.
 * Re-exports the slide-over panel component and domain models.
 */
export { GuidePanelComponent } from './component/guide-panel.component';
export { GuidesStore } from './store/guides.store';
export type { AppType, GuideObjective, GuideContent, MarketingGuide, GuideContext } from './model/guides.model';
export { APP_TYPE_LABELS, OBJECTIVE_LABELS } from './model/guides.model';
