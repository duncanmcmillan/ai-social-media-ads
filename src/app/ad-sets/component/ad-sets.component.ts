/**
 * @fileoverview Ad Sets list component.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Ad Sets feature component — placeholder. */
@Component({
  selector: 'app-ad-sets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Ad Sets</h2>
      <p class="placeholder-sub">Ad set list and management coming soon.</p>
    </div>
  `,
})
export class AdSetsComponent {}
