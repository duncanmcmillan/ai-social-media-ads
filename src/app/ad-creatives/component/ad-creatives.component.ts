/**
 * @fileoverview Ad Creatives list component.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Ad Creatives feature component — placeholder. */
@Component({
  selector: 'app-ad-creatives',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Ad Creatives</h2>
      <p class="placeholder-sub">Creative library and management coming soon.</p>
    </div>
  `,
})
export class AdCreativesComponent {}
