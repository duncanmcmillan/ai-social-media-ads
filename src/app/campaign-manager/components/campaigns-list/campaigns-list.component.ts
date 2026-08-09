/**
 * @fileoverview Campaigns list component.
 * Displays all campaigns for the connected ad account in a sortable table.
 * Data is persisted in CampaignManagerStore so it survives tab navigation.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { CampaignManagerStore } from '../../store/campaign-manager.store';
import type { Campaign, CampaignObjective } from '../../../core/models';

/** Maps Facebook campaign objective enum values to human-readable labels. */
const OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  OUTCOME_AWARENESS:     'Awareness',
  OUTCOME_TRAFFIC:       'Traffic',
  OUTCOME_ENGAGEMENT:    'Engagement',
  OUTCOME_LEADS:         'Leads',
  OUTCOME_APP_PROMOTION: 'App Promotion',
  OUTCOME_SALES:         'Sales',
};

/** Displays campaigns fetched from the Facebook Marketing API. */
@Component({
  selector: 'app-campaigns-list',
  imports: [DatePipe],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsListComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly store = inject(CampaignManagerStore);

  /** Returns a human-readable label for a campaign objective enum value. */
  protected objectiveLabel(obj: CampaignObjective): string {
    return OBJECTIVE_LABELS[obj] ?? obj;
  }

  /**
   * Formats a budget amount (minor units) using the selected account's currency.
   * Falls back to USD if no account is selected.
   */
  protected formatBudget(amount: number): string {
    const currency = this.authStore.selectedAccount()?.currency ?? 'USD';
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount / 100);
  }

  /** Triggers a fresh sync from the Facebook Marketing API. */
  protected sync(): void {
    void this.store.syncCampaigns();
  }

  /** Toggles the status of a campaign between ACTIVE and PAUSED. */
  protected toggleStatus(campaign: Campaign): void {
    void this.store.toggleCampaignStatus(campaign);
  }
}
