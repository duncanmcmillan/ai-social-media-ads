/**
 * @fileoverview Guide panel slide-over component.
 * Renders inside the dashboard grid as a right-anchored overlay.
 * Allows users to select app type and objective, generate an AI marketing guide,
 * and browse the history of previously generated guides.
 */
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { LicenceStore } from '../../core';
import { DashboardStore } from '../../dashboard/store/dashboard.store';
import { WorkspaceStore } from '../../workspace';
import { GuidesStore } from '../store/guides.store';
import {
  APP_TYPE_LABELS,
  OBJECTIVE_LABELS,
  type AppType,
  type GuideContext,
  type GuideObjective,
} from '../model/guides.model';

/** Option shape used by the selector dropdowns. */
interface SelectOption<T> {
  /** Option key value. */
  key: T;
  /** Display label. */
  label: string;
}

/**
 * Slide-over panel that displays AI-generated marketing guides.
 * Emits `closed` when the user clicks the close button.
 * App Type selector is kept in sync with WorkspaceStore.
 * Background guide generation is triggered by DashboardComponent when
 * both App Type and campaign objective are available.
 */
@Component({
  selector: 'app-guide-panel',
  imports: [],
  templateUrl: './guide-panel.component.html',
  styleUrl: './guide-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuidePanelComponent {
  /** Emitted when the user closes the panel. */
  @Output() closed = new EventEmitter<void>();

  /** Whether the panel is expanded to fill the full parent container. */
  protected readonly fullscreen = signal(false);

  /** Applies the fullscreen CSS modifier to the host element. */
  @HostBinding('class.guide-panel--fullscreen') get isFullscreen(): boolean {
    return this.fullscreen();
  }

  /** Reference to the scrollable panel body element. */
  @ViewChild('panelBody') private panelBodyRef!: ElementRef<HTMLElement>;

  protected readonly store          = inject(GuidesStore);
  protected readonly dashboardStore = inject(DashboardStore);
  protected readonly licenceStore   = inject(LicenceStore);
  protected readonly workspaceStore = inject(WorkspaceStore);

  constructor() {
    // Sync Workspace app type → guide selector so the panel selectors reflect
    // the setting the user configured in Workspace.
    effect(() => {
      const appType = this.workspaceStore.appType();
      untracked(() => this.store.setAppType(appType));
    });
  }

  /** App type options for the selector dropdown. */
  protected readonly appTypeOptions: SelectOption<AppType>[] = (
    Object.entries(APP_TYPE_LABELS) as [AppType, string][]
  ).map(([key, label]) => ({ key, label }));

  /** Objective options for the selector dropdown. */
  protected readonly objectiveOptions: SelectOption<GuideObjective>[] = (
    Object.entries(OBJECTIVE_LABELS) as [GuideObjective, string][]
  ).map(([key, label]) => ({ key, label }));

  /** Dashboard context assembled for the next generation call. */
  private readonly guideCtx = computed((): GuideContext => ({
    appType:       this.store.selectedAppType(),
    objective:     this.store.selectedObjective(),
    gates:         this.dashboardStore.gates().map(g => g.label),
    totalSpend:    this.dashboardStore.funnelMetrics().totalSpend,
    campaignCount: this.dashboardStore.campaigns().length,
  }));

  /**
   * Returns the human-readable label for an app type.
   * @param type - The app type key.
   * @returns A display label string.
   */
  protected appTypeLabel(type: AppType): string {
    return APP_TYPE_LABELS[type] ?? type;
  }

  /**
   * Returns the human-readable label for a campaign objective.
   * @param objective - The objective key.
   * @returns A display label string.
   */
  protected objectiveLabel(objective: GuideObjective): string {
    return OBJECTIVE_LABELS[objective] ?? objective;
  }

  /**
   * Formats an ISO timestamp as a short locale date string.
   * @param iso - ISO 8601 date string.
   * @returns A formatted date string such as "20 Aug 2026".
   */
  protected fmtDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
      day:   'numeric',
      month: 'short',
      year:  'numeric',
    });
  }

  /**
   * Scrolls the panel body to the top.
   * Uses the container's scrollTo directly to avoid scrollIntoView
   * affecting outer containers and pushing the panel header out of view.
   */
  protected scrollToTop(): void {
    this.panelBodyRef?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Scrolls the named section into view within the panel body.
   * Uses getBoundingClientRect delta against the container so that only
   * the inner scrollable area moves, keeping the panel header visible.
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

  /**
   * Triggers AI guide generation using the current dashboard context.
   * @returns Promise that resolves when generation completes or fails.
   */
  protected async generate(): Promise<void> {
    await this.store.generate(this.guideCtx());
  }
}
