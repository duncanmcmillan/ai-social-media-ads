/**
 * @fileoverview Monitoring & Tools placeholder component.
 * Future home for performance dashboards, A/B test results, and diagnostic tools.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Placeholder component for Monitoring & Tools section. */
@Component({
  selector: 'app-monitoring',
  imports: [],
  template: `
    <div class="placeholder">
      <div class="placeholder-dot"></div>
      <div class="placeholder-label">Coming soon</div>
      <div class="placeholder-title">Monitoring &amp; Tools</div>
      <div class="placeholder-sub">
        Performance dashboards, A/B test analysis, and diagnostic tools will appear here.
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringComponent {}
