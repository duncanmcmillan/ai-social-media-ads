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
  /** Maps ad set IDs to their display names for the Ad Set column. */
  protected readonly adSetNames = signal(new Map<string, string>());
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  /** ID of the ad currently being toggled, to show per-row loading state. */
  protected readonly togglingId = signal<string | null>(null);

  /**
   * Fetches ads from the Facebook Marketing API by walking campaigns → ad sets → ads.
   * Also builds the adSetNames map for display in the table.
   */
  protected async sync(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const campaigns = await this.marketingApi.getCampaigns();
      const adSetArrays = await Promise.all(campaigns.map(c => this.marketingApi.getAdSets(c.id)));
      const allAdSets: AdSet[] = adSetArrays.flat();

      const namesMap = new Map<string, string>(allAdSets.map(a => [a.id, a.name]));
      this.adSetNames.set(namesMap);

      const adArrays = await Promise.all(allAdSets.map(a => this.marketingApi.getAds(a.id)));
      this.ads.set(adArrays.flat());
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load ads.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Toggles the status of an ad between ACTIVE and PAUSED.
   * @param ad - Ad to toggle.
   */
  protected async toggleStatus(ad: Ad): Promise<void> {
    const newStatus = ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.togglingId.set(ad.id);
    try {
      await this.marketingApi.updateAd(ad.id, { status: newStatus });
      this.ads.update(list =>
        list.map(a => a.id === ad.id ? { ...a, status: newStatus } : a)
      );
    } catch (e: unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to update ad status.');
    } finally {
      this.togglingId.set(null);
    }
  }
}
