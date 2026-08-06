/**
 * @fileoverview Ads list component.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Ads feature component — placeholder. */
@Component({
  selector: 'app-ads',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Ads</h2>
      <p class="placeholder-sub">Ad list and management coming soon.</p>
    </div>
  `,
})
export class AdsComponent {}
