/**
 * @fileoverview One-click Meta Performance Recommendations strip.
 * Displays actionable recommendations fetched from the Meta Performance
 * Recommendations API as horizontal cards above the main dashboard grid.
 * Budget changes require an inline confirm step; placement changes are instant.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DashboardStore } from '../../store/dashboard.store';
import type { MetaRecommendation } from '../../../core/models/index';

/** Recommendation types that map to a budget increase (+20%). */
const BUDGET_TYPES = new Set(['BUDGET_LIMITED', 'SCALE_GOOD_CAMPAIGN']);

/** Recommendation types that map to an instant placement apply. */
const PLACEMENT_TYPES = new Set(['AUTOMATIC_PLACEMENTS']);

/** One-click Meta Performance Recommendations strip shown above the dashboard grid. */
@Component({
  selector: 'app-meta-recommendations',
  imports: [],
  templateUrl: './meta-recommendations.component.html',
  styleUrl: './meta-recommendations.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetaRecommendationsComponent {
  protected readonly store = inject(DashboardStore);

  /** Recommendations visible to the user (excludes dismissed entries). */
  protected readonly visibleRecs = computed(() =>
    this.store.metaRecommendations().filter(r => r.status !== 'dismissed')
  );

  /** True when there is at least one visible recommendation or the load is in progress. */
  protected readonly hasContent = computed(() =>
    this.store.isLoadingMetaRecs() || this.visibleRecs().length > 0
  );

  /**
   * Returns true for recommendation types that have a one-click action.
   * @param type - The recommendation type string.
   */
  protected isActionable(type: string): boolean {
    return BUDGET_TYPES.has(type) || PLACEMENT_TYPES.has(type);
  }

  /**
   * Returns true when the recommendation requires a budget confirm step.
   * @param type - The recommendation type string.
   */
  protected isBudgetType(type: string): boolean {
    return BUDGET_TYPES.has(type);
  }

  /**
   * Returns true when this recommendation is awaiting budget confirm.
   * @param rec - The recommendation to check.
   */
  protected isPendingConfirm(rec: MetaRecommendation): boolean {
    return this.store.pendingBudgetConfirm()?.signature === rec.signature;
  }

  /**
   * Handles the Apply button click — either opens confirm or applies instantly.
   * @param rec - The recommendation to act on.
   */
  protected onApply(rec: MetaRecommendation): void {
    if (this.isBudgetType(rec.type)) {
      this.store.requestBudgetConfirm(rec);
    } else if (PLACEMENT_TYPES.has(rec.type)) {
      void this.store.applyPlacementRecommendation(rec);
    }
  }
}
