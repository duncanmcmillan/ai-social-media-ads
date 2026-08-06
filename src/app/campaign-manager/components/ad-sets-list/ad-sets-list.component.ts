/**
 * @fileoverview Ad Sets list component.
 * Displays all ad sets across campaigns for the connected ad account.
 * Data is fetched from the Facebook Marketing API on demand.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { MarketingApiService } from '../../../core/services/facebook/marketing-api/marketing-api.service';
import type { AdSet } from '../../../core/models';

/** Displays ad sets fetched from the Facebook Marketing API. */
@Component({
  selector: 'app-ad-sets-list',
  imports: [DatePipe],
  templateUrl: './ad-sets-list.component.html',
  styleUrl: './ad-sets-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdSetsListComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly marketingApi = inject(MarketingApiService);

  protected readonly adSets = signal<AdSet[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  /**
   * Fetches ad sets from the Facebook Marketing API.
   * Requires the user to be authenticated with an ad account selected.
   */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const campaigns = await this.marketingApi.getCampaigns();
      const results = await Promise.all(campaigns.map(c => this.marketingApi.getAdSets(c.id)));
      this.adSets.set(results.flat());
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load ad sets.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
