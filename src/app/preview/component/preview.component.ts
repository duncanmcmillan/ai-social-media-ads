/**
 * @fileoverview Ad preview component.
 * Wraps the Facebook Ad Preview API to show creative previews.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Preview feature component — placeholder. */
@Component({
  selector: 'app-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <span class="placeholder-label">Feature</span>
      <h2 class="placeholder-title">Preview</h2>
      <p class="placeholder-sub">Ad preview via Facebook AdPreview API coming soon.</p>
    </div>
  `,
})
export class PreviewComponent {}
