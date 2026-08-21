/**
 * @fileoverview Metrics Contextual Guide panel slide-over component.
 * Renders as a fixed-position overlay in both Dashboard and Workspace contexts.
 * Shows AI-generated funnel and monitoring insights from the active Marketing Guide,
 * alongside a static reference for all 11 learning-rule thresholds with their
 * funnel-stage and gate connections.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { GuidesStore } from '../store/guides.store';
import { WorkspaceStore } from '../../workspace';
import type { WorkspaceLearningRules } from '../../workspace/model/workspace.model';

/** A single learning rule with display metadata. */
interface RuleInfo {
  /** Property key in WorkspaceLearningRules. */
  key: keyof WorkspaceLearningRules;
  /** Display label. */
  label: string;
  /** Plain-English description of what this threshold controls. */
  description: string;
  /** Which funnel stage this rule primarily relates to. */
  funnel: 'TOFU' | 'MOFU' | 'BOFU' | 'All';
  /** Which dashboard gate type this rule feeds, when applicable. */
  gate?: 'fatigue' | 'learning-phase' | 'low-roas' | 'verdict';
}

/** A named group of related learning rules. */
interface RuleCategory {
  /** Category display name. */
  label: string;
  /** Rules belonging to this category. */
  rules: RuleInfo[];
}

/** Static metadata for all 11 learning rules across 5 categories. */
const RULE_CATEGORIES: RuleCategory[] = [
  {
    label: 'Data Floors',
    rules: [
      {
        key: 'minImpressions',
        label: 'Min Impressions',
        description: 'An ad must serve at least this many impressions before any performance verdict is applied. Below this, it is labelled "Needs Data" and kept out of winner/loser scoring.',
        funnel: 'TOFU',
        gate: 'learning-phase',
      },
      {
        key: 'minSpend',
        label: 'Min Spend',
        description: 'Minimum budget consumed before verdicts can fire. Prevents judging ads that have barely been served.',
        funnel: 'TOFU',
        gate: 'learning-phase',
      },
      {
        key: 'minConversions',
        label: 'Min Conversions',
        description: 'Required number of bottom-funnel events (purchases, leads) before conversion-rate metrics are considered statistically meaningful.',
        funnel: 'BOFU',
        gate: 'learning-phase',
      },
    ],
  },
  {
    label: 'Winner Gate',
    rules: [
      {
        key: 'winnerMinSpend',
        label: 'Winner Min Spend',
        description: 'An ad must have spent at least this much before it can earn the Winner label, regardless of how strong its ROAS looks.',
        funnel: 'All',
        gate: 'low-roas',
      },
      {
        key: 'winnerMinRoas',
        label: 'Winner Min ROAS',
        description: 'Return on Ad Spend floor. Only ads meeting both the spend and ROAS minimums are called winners. Ads with ROAS below this and sufficient spend are flagged via the Low ROAS gate.',
        funnel: 'BOFU',
        gate: 'low-roas',
      },
    ],
  },
  {
    label: 'Performance Flags',
    rules: [
      {
        key: 'minCtr',
        label: 'Min CTR (%)',
        description: 'Click-Through Rate below this value flags the ad as Low CTR. Indicates weak creative, poor headline, or audience–creative mismatch.',
        funnel: 'MOFU',
        gate: 'verdict',
      },
      {
        key: 'maxCpc',
        label: 'Max CPC',
        description: 'Cost Per Click above this value flags the ad as High CPC. Often co-occurs with low CTR or excessively narrow audiences.',
        funnel: 'MOFU',
        gate: 'verdict',
      },
    ],
  },
  {
    label: 'Kill Rule',
    rules: [
      {
        key: 'killCpaMultiple',
        label: 'Kill CPA Multiple',
        description: 'If Cost Per Acquisition exceeds this multiple of your target CPA the ad is flagged as a loser. Set a target CPA, multiply by this value — that is the ceiling before pausing.',
        funnel: 'BOFU',
        gate: 'low-roas',
      },
    ],
  },
  {
    label: 'Fatigue',
    rules: [
      {
        key: 'prospectingFrequencyMax',
        label: 'Prospecting Frequency Max',
        description: 'Maximum average exposures per cold-audience user before fatigue is flagged. Cold audiences tire quickly — exceeding this triggers the Fatigue gate on the dashboard.',
        funnel: 'TOFU',
        gate: 'fatigue',
      },
      {
        key: 'retargetingFrequencyMax',
        label: 'Retargeting Frequency Max',
        description: 'Higher frequency ceiling for warm retargeting audiences who need more exposures before converting. Distinct from the prospecting ceiling.',
        funnel: 'MOFU',
        gate: 'fatigue',
      },
      {
        key: 'ctrDropFromPeak',
        label: 'CTR Drop from Peak (%)',
        description: 'If an ad\'s CTR drops by this percentage from its own historical peak, creative fatigue is flagged even when the absolute CTR is still above the floor.',
        funnel: 'MOFU',
        gate: 'fatigue',
      },
    ],
  },
];

/**
 * Slide-over panel providing contextual guidance on metrics, learning rules,
 * and their relationship to funnel stages and dashboard gate alerts.
 * Uses `position: fixed` so it overlays correctly in both Dashboard and Workspace.
 */
@Component({
  selector: 'app-metrics-guide-panel',
  imports: [],
  templateUrl: './metrics-guide-panel.component.html',
  styleUrl: './metrics-guide-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsGuidePanelComponent {
  /** Emitted when the user closes the panel. */
  @Output() closed = new EventEmitter<void>();

  /** Whether the panel is expanded to fill the full viewport width. */
  protected readonly fullscreen = signal(false);

  /** Applies the fullscreen CSS modifier to the host element. */
  @HostBinding('class.metrics-guide-panel--fullscreen') get isFullscreen(): boolean {
    return this.fullscreen();
  }

  /** Reference to the scrollable panel body element. */
  @ViewChild('panelBody') private panelBodyRef!: ElementRef<HTMLElement>;

  protected readonly guidesStore = inject(GuidesStore);
  protected readonly workspaceStore = inject(WorkspaceStore);

  /** Static rule category definitions. */
  protected readonly ruleCategories = RULE_CATEGORIES;

  /**
   * Returns the current threshold value for a learning rule key.
   * @param key - The WorkspaceLearningRules property to read.
   * @returns The current numeric threshold.
   */
  protected ruleValue(key: keyof WorkspaceLearningRules): number {
    return this.workspaceStore.learningRules()[key];
  }

  /**
   * Splits an AI-generated text block on double newlines into individual paragraph strings.
   * @param text - Raw AI text with double-newline paragraph separators.
   * @returns Array of non-empty paragraph strings.
   */
  protected paragraphs(text: string): string[] {
    return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  }

  /**
   * Scrolls the panel body to the top.
   */
  protected scrollToTop(): void {
    this.panelBodyRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Scrolls a named section into view within the panel body.
   * @param id - The element ID to scroll to.
   */
  protected scrollToSection(id: string): void {
    const el = document.getElementById(id);
    const container = this.panelBodyRef?.nativeElement;
    if (!el || !container) return;
    const elTop = el.getBoundingClientRect().top;
    const containerTop = container.getBoundingClientRect().top;
    container.scrollBy({ top: elTop - containerTop, behavior: 'smooth' });
  }
}
