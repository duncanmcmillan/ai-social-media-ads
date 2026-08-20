/**
 * @fileoverview New Campaign shell component.
 * Renders the step navigator (Campaign → Ad Sets → Creatives → Review & Launch),
 * a right-hand summary panel, and a child router outlet for the active step.
 */
import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NewCampaignStore } from '../store/new-campaign.store';
import { WorkspaceStore } from '../../workspace';
import { LicenceStore } from '../../core';
import { GuidePanelComponent, GuidesStore } from '../../guides';

const STEPS = [
  { label: 'Campaign',        path: '/new-campaign/campaign'  },
  { label: 'Ad Sets',         path: '/new-campaign/ad-sets'   },
  { label: 'Creatives',       path: '/new-campaign/creatives' },
  { label: 'Review & Launch', path: '/new-campaign/review'    },
] as const;

/** Maps CampaignObjective enum values to human-readable labels. */
const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS:      'Awareness',
  OUTCOME_TRAFFIC:        'Traffic',
  OUTCOME_ENGAGEMENT:     'Engagement',
  OUTCOME_LEADS:          'Lead Generation',
  OUTCOME_APP_PROMOTION:  'App Promotion',
  OUTCOME_SALES:          'Sales',
};

/** Shell component that wraps all four New Campaign wizard steps. */
@Component({
  selector: 'app-new-campaign',
  imports: [RouterOutlet, RouterLink, GuidePanelComponent],
  templateUrl: './new-campaign.component.html',
  styleUrl: './new-campaign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCampaignComponent {
  protected readonly store         = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  protected readonly guidesStore   = inject(GuidesStore);
  protected readonly licenceStore  = inject(LicenceStore);
  private readonly router          = inject(Router);

  protected readonly steps = STEPS;
  protected readonly objectiveLabels = OBJECTIVE_LABELS;

  /** Controls visibility of the Marketing Guide slide-over panel. */
  protected readonly guidePanelOpen = signal(false);

  constructor() {
    // Background guide generation: triggers when both App Type (Workspace) and
    // campaign Objective (wizard step 1) are set, Pro licence only.
    effect(() => {
      const appType   = this.workspaceStore.appType();
      const objective = this.store.campaign().objective;
      untracked(() => {
        if (appType && objective && this.licenceStore.tier() === 'pro' && !this.guidesStore.isGenerating()) {
          void this.generateGuide(appType, objective as string);
        }
      });
    });
  }

  /**
   * Triggers background guide generation with wizard context.
   * Gates, spend, and campaign count are not yet available here so default to empty/zero.
   * @param appType - Workspace app type setting.
   * @param objective - The campaign objective selected in step 1.
   */
  private async generateGuide(appType: string, objective: string): Promise<void> {
    await this.guidesStore.generate({
      appType:       appType as Parameters<typeof this.guidesStore.generate>[0]['appType'],
      objective:     objective as Parameters<typeof this.guidesStore.generate>[0]['objective'],
      gates:         [],
      totalSpend:    0,
      campaignCount: 0,
    });
  }

  /** Returns the 0-based index of the current step from the URL. */
  protected get currentStepIndex(): number {
    const url = this.router.url;
    if (url.includes('/review'))    return 3;
    if (url.includes('/creatives')) return 2;
    if (url.includes('/ad-sets'))   return 1;
    return 0;
  }

  /** Navigates to the next step. */
  protected async nextStep(): Promise<void> {
    const idx = this.currentStepIndex;
    if (idx < STEPS.length - 1) {
      await this.router.navigateByUrl(STEPS[idx + 1].path);
    }
  }

  /** Navigates to the previous step. */
  protected async prevStep(): Promise<void> {
    const idx = this.currentStepIndex;
    if (idx > 0) {
      await this.router.navigateByUrl(STEPS[idx - 1].path);
    }
  }

  /** Resets the wizard and navigates back to step 1. */
  protected async startNew(): Promise<void> {
    this.store.reset();
    await this.router.navigateByUrl('/new-campaign/campaign');
  }

}
