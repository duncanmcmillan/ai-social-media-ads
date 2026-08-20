/** @fileoverview Public API for the dashboard feature module. */
export { DashboardComponent } from './component/dashboard.component';
export { DashboardStore } from './store/dashboard.store';
export type {
  AdDashboardRow,
  CampaignDashboardRow,
  EventAction,
  Gate,
  GateType,
  Recommendation,
  RawAdInsight,
  Verdict,
} from './model/dashboard.model';
export { evaluateAd } from './model/dashboard.model';
