/**
 * @fileoverview Inline upgrade prompt shown where free users encounter a Pro-gated feature.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Small inline component shown in place of Pro-gated features for free-tier users.
 * Displays a short message and a link to the LemonSqueezy purchase page.
 */
@Component({
  selector: 'app-upgrade-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="upgrade-prompt">
      <span class="upgrade-label">Available in Pro</span>
      <!-- Update the href to the live LemonSqueezy store URL before release -->
      <a
        href="https://aiads.lemonsqueezy.com"
        target="_blank"
        rel="noopener noreferrer"
        class="upgrade-link"
        aria-label="Upgrade to Pro — opens LemonSqueezy store"
      >Upgrade &mdash; &pound;40/yr</a>
    </div>
  `,
  styles: [`
    .upgrade-prompt {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      border-radius: 5px;
      border: 1px solid var(--neutral-200);
      background: var(--neutral-50, #fafaf9);
    }

    .upgrade-label {
      font-size: 12px;
      color: var(--neutral-500);
    }

    .upgrade-link {
      font-size: 12px;
      font-weight: 500;
      color: var(--neutral-0, #fff);
      background: var(--accent-500, #f97316);
      border-radius: 4px;
      padding: 4px 10px;
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.15s ease;

      &:hover {
        background: var(--accent-600, #ea6c0a);
      }
    }
  `],
})
export class UpgradePromptComponent {}
