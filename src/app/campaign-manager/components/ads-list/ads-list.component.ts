/**
 * @fileoverview Ads list component.
 * Displays all ads across campaigns for the connected ad account.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { MarketingApiService } from '../../../core/services/facebook/marketing-api/marketing-api.service';
import type { Ad, AdSet } from '../../../core/models';

/** Displays ads fetched from the Facebook Marketing API. */
@Component({
  selector: 'app-ads-list',
  imports: [DatePipe],
  templateUrl: './ads-list.component.html',
  styleUrl: './ads-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdsListComponent {
  protected readonly authStore = inject(AuthStore);
  private readonly marketingApi = inject(MarketingApiService);

  protected readonly ads = signal<Ad[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);

  /**
   * Fetches ads from the Facebook Marketing API by walking campaigns → ad sets → ads.
   */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const campaigns = await this.marketingApi.getCampaigns();
      const adSetArrays = await Promise.all(campaigns.map(c => this.marketingApi.getAdSets(c.id)));
      const allAdSets: AdSet[] = adSetArrays.flat();
      const adArrays = await Promise.all(allAdSets.map(a => this.marketingApi.getAds(a.id)));
      this.ads.set(adArrays.flat());
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load ads.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
