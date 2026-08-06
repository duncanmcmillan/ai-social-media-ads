/**
 * @fileoverview Workspace component.
 * Central settings hub: account connection, Meta defaults, targeting,
 * enhancements, and learning-rule thresholds.
 * Sections are collapsible; a sticky ToC nav on the right tracks the active section.
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AuthStore } from '../../auth';
import { AdAccountStatus } from '../../auth';
import { WorkspaceStore } from '../store/workspace.store';

/** Metadata for each collapsible workspace section. */
interface Section {
  id: string;
  label: string;
}

const SECTIONS: Section[] = [
  { id: 'ws-account',    label: 'Account Details'       },
  { id: 'ws-meta',       label: 'Meta Defaults'         },
  { id: 'ws-placements', label: 'Placements & Audience' },
  { id: 'ws-targeting',  label: 'Default Targeting'     },
  { id: 'ws-enhance',    label: 'Enhancements'          },
  { id: 'ws-rules',      label: 'Learning Rules'        },
];

/**
 * Workspace settings page. All sections auto-save to localStorage on change.
 * The three required fields (Facebook Page, Pixel, Website URL) gate campaign creation.
 */
@Component({
  selector: 'app-workspace',
  imports: [],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent implements AfterViewInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  protected readonly sections = SECTIONS;

  constructor() {
    // Auto-fetch pages when the user authenticates.
    effect(() => {
      if (this.authStore.isAuthenticated()) {
        void this.authStore.fetchPages();
      }
    });
    // Auto-fetch pixels when an ad account is selected.
    effect(() => {
      const accountId = this.authStore.adAccountId();
      if (this.authStore.isAuthenticated() && accountId) {
        void this.authStore.fetchPixels(accountId);
      }
    });
  }

  /** Expose enum to template for status comparisons. */
  protected readonly AdAccountStatus = AdAccountStatus;

  // ── Account Details — credential form draft state ─────────────────────────

  /** Draft App ID input — pre-populated from store on first load. */
  protected readonly appIdDraft = signal('');
  /** Draft App Secret input — always starts blank (write-only field). */
  protected readonly appSecretDraft = signal('');

  /** Map of section id → collapsed state (true = collapsed). */
  protected readonly collapsed = signal<Record<string, boolean>>({});

  /** ID of the section currently most visible in the scroll area. */
  protected readonly activeSection = signal<string>(SECTIONS[0].id);

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      entries => {
        // NgZone.run ensures the signal write triggers CD in ng serve (zone.js) mode.
        this.ngZone.run(() => {
          // Pick the entry closest to the top of the viewport that is intersecting.
          const visible = entries
            .filter(e => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            this.activeSection.set(visible[0].target.id);
          }
        });
      },
      { rootMargin: '0px 0px -75% 0px', threshold: 0 }
    );

    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) this.observer.observe(el);
    }

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  /** Toggles collapse state of a section. */
  protected toggle(id: string): void {
    const c = this.collapsed();
    this.collapsed.set({ ...c, [id]: !c[id] });
  }

  /** Returns true when a section is collapsed. */
  protected isCollapsed(id: string): boolean {
    return !!this.collapsed()[id];
  }

  /**
   * Expands (if needed) and smoothly scrolls to a section.
   * Used by the ToC nav.
   */
  protected scrollTo(id: string): void {
    if (this.isCollapsed(id)) {
      const c = this.collapsed();
      this.collapsed.set({ ...c, [id]: false });
    }
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── Meta Defaults ──────────────────────────────────────────────────────────

  protected setPageId(value: string): void {
    this.workspaceStore.updateMetaDefaults({ facebookPageId: value });
  }

  protected setUsePageForInstagram(value: boolean): void {
    this.workspaceStore.updateMetaDefaults({ usePageForInstagram: value });
  }

  protected setPixelId(value: string): void {
    this.workspaceStore.updateMetaDefaults({ pixelId: value });
  }

  protected setWebsiteUrl(value: string): void {
    this.workspaceStore.updateMetaDefaults({ websiteUrl: value });
  }

  protected setExcludeCustomAudiences(value: boolean): void {
    this.workspaceStore.updateMetaDefaults({ excludeCustomAudiences: value });
  }

  // ── Placements & Audience ─────────────────────────────────────────────────

  protected setAdvantagePlacements(value: boolean): void {
    this.workspaceStore.updatePlacements({ advantagePlacements: value });
  }

  protected setAdvantageAudience(value: boolean): void {
    this.workspaceStore.updatePlacements({ advantageAudience: value });
  }

  // ── Targeting ──────────────────────────────────────────────────────────────

  protected setCountries(value: string): void {
    const countries = value.split(',').map(c => c.trim().toUpperCase()).filter(Boolean);
    this.workspaceStore.updateTargeting({ countries });
  }

  protected setMinAge(value: number): void {
    this.workspaceStore.updateTargeting({ minAge: value });
  }

  protected setMaxAge(value: number): void {
    this.workspaceStore.updateTargeting({ maxAge: value });
  }

  // ── Enhancements ──────────────────────────────────────────────────────────

  protected setCreativeEnhancements(value: boolean): void {
    this.workspaceStore.updateEnhancements({ creativeEnhancements: value });
  }

  protected setAttributionWindow(
    field: 'clickThroughDays' | 'engagedViewDays' | 'viewThroughDays',
    value: number
  ): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  protected setTemplate(
    field: 'creativeNameTemplate' | 'adSetNameTemplate' | 'utmParameters',
    value: string
  ): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  protected setDsa(field: 'beneficiaryName' | 'payerName', value: string): void {
    this.workspaceStore.updateEnhancements({ [field]: value });
  }

  // ── Learning Rules ────────────────────────────────────────────────────────

  protected setLearningRule(
    field: keyof import('../model/workspace.model').WorkspaceLearningRules,
    value: number
  ): void {
    this.workspaceStore.updateLearningRules({ [field]: value });
  }

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

  // ── Account Details ────────────────────────────────────────────────────────

  /** Saves App ID + Secret to Electron encrypted storage, then clears the draft secret. */
  protected async saveCredentials(): Promise<void> {
    await this.authStore.saveCredentials(this.appIdDraft(), this.appSecretDraft());
    this.appSecretDraft.set('');
  }

  /** Triggers the Facebook OAuth flow via the Electron bridge. */
  protected async connectMeta(): Promise<void> {
    await this.authStore.connectFacebook();
  }

  /**
   * Selects the ad account matching the given ID.
   * Called from the account selector `<select>` change event.
   */
  protected onAccountSelect(id: string): void {
    const account = this.authStore.adAccounts().find(a => a.id === id);
    if (account) this.authStore.selectAccount(account);
  }

  /** Re-fetches ad accounts from GET /me/adaccounts and updates the store. */
  protected async refreshAccounts(): Promise<void> {
    await this.authStore.refreshAdAccounts();
  }

  /** Re-fetches Facebook Pages from GET /me/accounts. */
  protected async loadPages(): Promise<void> {
    await this.authStore.fetchPages();
  }

  /** Re-fetches Meta Pixels from GET /{adAccountId}/adspixels. */
  protected async loadPixels(): Promise<void> {
    const accountId = this.authStore.adAccountId();
    if (accountId) await this.authStore.fetchPixels(accountId);
  }

  protected async signOut(): Promise<void> {
    await this.authStore.signOut();
  }
}
