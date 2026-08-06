/**
 * @fileoverview Optimisation dashboard component.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Optimisation feature component — placeholder. */
@Component({
  selector: 'app-optimisation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Optimisation</h2>
      <p class="placeholder-sub">Performance insights and recommendations coming soon.</p>
    </div>
  `,
})
export class OptimisationComponent {}
