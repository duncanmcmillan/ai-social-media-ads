/**
 * @fileoverview Ads list component.
 * Displays all ads across campaigns for the connected ad account.
 * Data is persisted in CampaignManagerStore so it survives tab navigation.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthStore } from '../../../auth';
import { CampaignManagerStore } from '../../store/campaign-manager.store';
import type { Ad } from '../../../core/models';

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
  protected readonly store = inject(CampaignManagerStore);

  /** Triggers a fresh sync from the Facebook Marketing API. */
  protected sync(): void {
    void this.store.syncAds();
  }

  /** Toggles the status of an ad between ACTIVE and PAUSED. */
  protected toggleStatus(ad: Ad): void {
    void this.store.toggleAdStatus(ad);
  }
}
