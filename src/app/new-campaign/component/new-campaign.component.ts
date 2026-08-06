/**
 * @fileoverview New Campaign shell component.
 * Renders the step navigator (Campaign → Ad Sets → Creatives), a right-hand
 * summary panel, and a child router outlet for the active step.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NewCampaignStore } from '../store/new-campaign.store';
import { WorkspaceStore } from '../../workspace';

const STEPS = [
  { label: 'Campaign',  path: '/new-campaign/campaign'  },
  { label: 'Ad Sets',   path: '/new-campaign/ad-sets'   },
  { label: 'Creatives', path: '/new-campaign/creatives' },
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

/** Shell component that wraps all three New Campaign wizard steps. */
@Component({
  selector: 'app-new-campaign',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './new-campaign.component.html',
  styleUrl: './new-campaign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCampaignComponent {
  protected readonly store = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  private readonly router = inject(Router);

  protected readonly steps = STEPS;
  protected readonly objectiveLabels = OBJECTIVE_LABELS;

  /** Returns the 0-based index of the current step from the URL. */
  protected get currentStepIndex(): number {
    const url = this.router.url;
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
