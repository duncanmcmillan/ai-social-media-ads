/**
 * @fileoverview Workspace component.
 * Central settings hub: account connection, Meta defaults, targeting,
 * enhancements, and learning-rule thresholds.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../auth';
import { WorkspaceStore } from '../store/workspace.store';

/**
 * Workspace settings page. All sections auto-save to localStorage on change.
 * The three required fields (Facebook Page, Pixel, Website URL) gate campaign creation.
 */
@Component({
  selector: 'app-workspace',
  imports: [RouterLink],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent {
  protected readonly authStore = inject(AuthStore);
  protected readonly workspaceStore = inject(WorkspaceStore);

  // ── Meta Defaults ──────────────────────────────────────────────────────────

  /** @param value - New Facebook Page ID. */
  protected setPageId(value: string): void {
    this.workspaceStore.updateMetaDefaults({ facebookPageId: value });
  }

  /** @param value - Toggle: use Facebook Page for Instagram. */
  protected setUsePageForInstagram(value: boolean): void {
    this.workspaceStore.updateMetaDefaults({ usePageForInstagram: value });
  }

  /** @param value - Meta Pixel / Dataset ID. */
  protected setPixelId(value: string): void {
    this.workspaceStore.updateMetaDefaults({ pixelId: value });
  }

  /** @param value - Default landing page URL. */
  protected setWebsiteUrl(value: string): void {
    this.workspaceStore.updateMetaDefaults({ websiteUrl: value });
  }

  /** @param value - Toggle: exclude custom audiences. */
  protected setExcludeCustomAudiences(value: boolean): void {
    this.workspaceStore.updateMetaDefaults({ excludeCustomAudiences: value });
  }

  // ── Placements & Audience ─────────────────────────────────────────────────

  /** @param value - Toggle Advantage+ Placements. */
  protected setAdvantagePlacements(value: boolean): void {
    this.workspaceStore.updatePlacements({ advantagePlacements: value });
  }

  /** @param value - Toggle Advantage+ Audience. */
  protected setAdvantageAudience(value: boolean): void {
    this.workspaceStore.updatePlacements({ advantageAudience: value });
  }

  // ── Targeting ──────────────────────────────────────────────────────────────

  /** @param value - Comma-separated country codes entered by the user. */
  protected setCountries(value: string): void {
    const countries = value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    this.workspaceStore.updateTargeting({ countries });
  }

  /** @param value - Minimum audience age. */
  protected setMinAge(value: number): void {
    this.workspaceStore.updateTargeting({ minAge: value });
  }

  /** @param value - Maximum audience age. */
  protected setMaxAge(value: number): void {
    this.workspaceStore.updateTargeting({ maxAge: value });
  }

  // ── Enhancements ──────────────────────────────────────────────────────────

  /** @param value - Toggle creative enhancements. */
  protected setCreativeEnhancements(value: boolean): void {
    this.workspaceStore.updateEnhancements({ creativeEnhancements: value });
  }

  /** @param field - Attribution window field name. @param value - Days. */
  protected setAttributionWindow(field: 'clickThroughDays' | 'engagedViewDays' | 'viewThroughDays', value: number): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  /** @param field - Template field name. @param value - Template string. */
  protected setTemplate(field: 'creativeNameTemplate' | 'adSetNameTemplate' | 'utmParameters', value: string): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  /** @param field - DSA field. @param value - Name string. */
  protected setDsa(field: 'beneficiaryName' | 'payerName', value: string): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  // ── Learning Rules ────────────────────────────────────────────────────────

  /** @param field - Learning rule field. @param value - Threshold value. */
  protected setLearningRule(
    field: keyof import('../model/workspace.model').WorkspaceLearningRules,
    value: number
  ): void {
    this.workspaceStore.updateLearningRules({ [field]: value });
  }

  /** Resets all learning rules to factory defaults. */
  protected resetLearningRules(): void {
    this.workspaceStore.updateLearningRules({
      minImpressions: 1000,
      minSpend: 50,
      minConversions: 5,
      winnerMinSpend: 300,
      winnerMinRoas: 2,
      killCpaMultiple: 3,
      prospectingFrequencyMax: 3.5,
      retargetingFrequencyMax: 8,
      ctrDropFromPeak: 20,
    });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────

  /**
   * Signs out of Facebook and clears stored tokens.
   * @returns Promise that resolves when sign-out is complete.
   */
  protected async signOut(): Promise<void> {
    await this.authStore.signOut();
  }
}
