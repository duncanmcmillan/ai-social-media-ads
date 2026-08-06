/**
 * @fileoverview Campaigns list component.
 * Displays all campaigns for the connected ad account in a sortable table.
 * Data is fetched from the Facebook Marketing API on demand.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { MarketingApiService } from '../../../core/services/facebook/marketing-api/marketing-api.service';
import type { Campaign } from '../../../core/models';

/** Displays campaigns fetched from the Facebook Marketing API. */
@Component({
  selector: 'app-campaigns-list',
  imports: [DatePipe, DecimalPipe],
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
}
