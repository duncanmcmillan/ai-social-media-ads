/**
 * @fileoverview Step 1 — Campaign Details.
 * Handles campaign name, objective, budget, UTM, and AI draft generation.
 */
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { NewCampaignStore } from '../../store/new-campaign.store';
import type { CampaignObjective } from '../../../core/models/index';

const OBJECTIVES: { value: CampaignObjective; label: string; hint: string }[] = [
  { value: 'OUTCOME_SALES',       label: 'Sales',         hint: 'Drive purchases' },
  { value: 'OUTCOME_TRAFFIC',     label: 'Traffic',       hint: 'Send people to a destination' },
  { value: 'OUTCOME_LEADS',       label: 'Leads',         hint: 'Collect leads for your business' },
  { value: 'OUTCOME_ENGAGEMENT',  label: 'Engagement',    hint: 'Get more messages, video views, or page followers' },
  { value: 'OUTCOME_AWARENESS',   label: 'Awareness',     hint: 'Reach the most people for the lowest cost' },
  { value: 'OUTCOME_APP_PROMOTION', label: 'App Promotion', hint: 'Get more installs or interactions' },
];

/** Emitted when the user clicks "Build draft" for AI ad-set generation. */
export interface BuildDraftEvent {
  prompt: string;
}

/** Step 1 of the New Campaign wizard. */
@Component({
  selector: 'app-campaign-step',
  templateUrl: './campaign-step.component.html',
  styleUrl: './campaign-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignStepComponent {
  protected readonly store = inject(NewCampaignStore);

  /** Exposed objective options. */
  protected readonly objectives = OBJECTIVES;

  /** Emitted when the user clicks Build Draft. */
  readonly buildDraft = output<BuildDraftEvent>();

  /** AI prompt text (local only — not stored in the wizard state). */
  protected aiPrompt = '';

  /** Currently selected objective metadata, for the hint text. */
  protected readonly activeObjective = computed(() =>
    this.objectives.find(o => o.value === this.store.campaign().objective) ?? null
  );

  /** @param name - Campaign name. */
  protected setName(name: string): void {
    this.store.updateCampaign({ name });
  }

  /** @param objective - Selected campaign objective. */
  protected setObjective(objective: CampaignObjective): void {
    this.store.updateCampaign({ objective });
  }

  /** @param value - Campaign or ad-set level budget toggle. */
  protected setBudgetType(value: 'campaign' | 'adset'): void {
    this.store.updateCampaign({ budgetType: value });
  }

  /** @param value - Daily or lifetime budget. */
  protected setBudgetPeriod(value: 'daily' | 'lifetime'): void {
    this.store.updateCampaign({ budgetPeriod: value });
  }

  /** @param value - Budget amount. */
  protected setBudgetAmount(value: number): void {
    this.store.updateCampaign({ budgetAmount: value });
  }

  /** @param value - UTM parameter string. */
  protected setUtm(value: string): void {
    this.store.updateCampaign({ utmParameters: value });
  }

  /** @param value - Activate immediately flag. */
  protected setActivateImmediately(value: boolean): void {
    this.store.updateCampaign({ activateImmediately: value });
  }

  /**
   * Emits a buildDraft event with the current AI prompt.
   * The parent shell component handles the actual Claude API call.
   */
  protected onBuildDraft(): void {
    if (!this.aiPrompt.trim()) return;
    this.buildDraft.emit({ prompt: this.aiPrompt.trim() });
  }
}
