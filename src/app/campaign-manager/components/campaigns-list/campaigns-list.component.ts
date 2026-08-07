/**
 * @fileoverview Campaigns list component.
 * Displays all campaigns for the connected ad account in a sortable table.
 * Data is fetched from the Facebook Marketing API on demand.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { MarketingApiService } from '../../../core/services/facebook/marketing-api/marketing-api.service';
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
  private readonly marketingApi = inject(MarketingApiService);

  protected readonly campaigns = signal<Campaign[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** ID of the campaign currently being toggled, to show per-row loading state. */
  protected readonly togglingId = signal<string | null>(null);

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

  /**
   * Fetches campaigns from the Facebook Marketing API.
   * Requires the user to be authenticated with an ad account selected.
   */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.marketingApi.getCampaigns();
      this.campaigns.set(data);
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load campaigns.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggles the status of a campaign between ACTIVE and PAUSED.
   * @param campaign - Campaign to toggle.
   */
  protected async toggleStatus(campaign: Campaign): Promise<void> {
    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.togglingId.set(campaign.id);
    try {
      await this.marketingApi.updateCampaign(campaign.id, { status: newStatus });
      this.campaigns.update(list =>
        list.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to update campaign status.');
    } finally {
      this.togglingId.set(null);
    }
  }
}
