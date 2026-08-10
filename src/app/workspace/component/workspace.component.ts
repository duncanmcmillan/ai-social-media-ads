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
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { AuthStore } from '../../auth';
import { AdAccountStatus } from '../../auth';
import { WorkspaceStore } from '../store/workspace.store';
import { AiService } from '../../core/services/ai/ai.service';
import { VideoModalComponent } from '../../shared/video-modal/video-modal.component';

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
  { id: 'ws-ai',         label: 'AI Settings'           },
];

/**
 * Workspace settings page. All sections auto-save to localStorage on change.
 * The three required fields (Facebook Page, Pixel, Website URL) gate campaign creation.
 */
@Component({
  selector: 'app-workspace',
  imports: [VideoModalComponent],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceComponent implements AfterViewInit {
  protected readonly authStore = inject(AuthStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  private readonly aiService = inject(AiService);
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

  /** Literal token reference shown beneath the naming template fields. */
  protected readonly namingTokens =
    '{{campaign.name}} · {{adset.name}} · {{creative.id}} · {{ad.id}} · {{targeting.location}} · {{date}}';

  // ── Account Details — credential form draft state ─────────────────────────

  /** Draft App ID input — pre-populated from store on first load. */
  protected readonly appIdDraft = signal('');
  /** Draft App Secret input — always starts blank (write-only field). */
  protected readonly appSecretDraft = signal('');
  /** Draft manual access token (Graph API Explorer bypass). */
  protected readonly manualTokenDraft = signal('');

  // ── AI Settings — API key draft state ────────────────────────────────────

  /** True when an Anthropic API key is stored in encrypted storage. */
  protected readonly aiKeyIsSaved = signal(false);
  /** Draft key input — write-only, cleared after save. */
  protected readonly aiKeyInput = signal('');

  /** Map of section id → collapsed state (true = collapsed). */
  protected readonly collapsed = signal<Record<string, boolean>>({});

  /** ID of the section currently most visible in the scroll area. */
  protected readonly activeSection = signal<string>(SECTIONS[0].id);

  // ── Video help modal ───────────────────────────────────────────────────

  /**
   * Maps each section ID to its help video filename inside the `videos/` directory.
   * Set the value to null until the screencast for that section has been recorded.
   * Example: 'ws-account': 'videos/account-details.mp4'
   */
  private readonly sectionVideos: Record<string, string | null> = {
    'ws-account':    null,
    'ws-meta':       null,
    'ws-placements': null,
    'ws-targeting':  null,
    'ws-enhance':    null,
    'ws-rules':      null,
    'ws-ai':         null,
  };

  /** ID of the section whose video is currently open, or null. */
  protected readonly videoKey = signal<string | null>(null);

  /** Resolved video src for the open modal (null when no video is recorded yet). */
  protected readonly videoModalSrc = computed(() => {
    const key = this.videoKey();
    return key ? (this.sectionVideos[key] ?? null) : null;
  });

  /** Title for the open video modal. */
  protected readonly videoModalTitle = computed(() => {
    const key = this.videoKey();
    return SECTIONS.find(s => s.id === key)?.label ?? '';
  });

  /** Returns true when the given section has a recorded video available. */
  protected hasVideo(id: string): boolean {
    return !!this.sectionVideos[id];
  }

  /** Opens the video modal for the given section (no-op if no video recorded yet). */
  protected openVideo(id: string): void {
    this.videoKey.set(id);
  }

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    // Check whether an Anthropic key is already stored.
    void this.aiService.loadApiKey().then(isSaved => {
      this.ngZone.run(() => this.aiKeyIsSaved.set(isSaved));
    });

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
      minCtr: 1.0,
      maxCpc: 5.0,
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

  /** Applies a manually-entered token from the Graph API Explorer. */
  protected async applyManualToken(): Promise<void> {
    const token = this.manualTokenDraft().trim();
    if (!token) return;
    await this.authStore.setManualToken(token);
    this.manualTokenDraft.set('');
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

  // ── AI Settings ───────────────────────────────────────────────────────────

  /** Saves the Anthropic API key to encrypted storage and clears the input. */
  protected async saveAiKey(): Promise<void> {
    const key = this.aiKeyInput().trim();
    if (!key) return;
    await this.aiService.saveApiKey(key);
    this.aiKeyIsSaved.set(true);
    this.aiKeyInput.set('');
  }
}
