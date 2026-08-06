/**
 * @fileoverview Campaigns list component.
 * Displays all campaigns for the connected ad account.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Campaigns feature component — placeholder for the campaign list. */
@Component({
  selector: 'app-campaigns',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Campaigns</h2>
      <p class="placeholder-sub">Campaign list and management coming soon.</p>
    </div>
  `,
})
export class CampaignsComponent {}
