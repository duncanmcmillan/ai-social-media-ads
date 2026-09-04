/**
 * @fileoverview Fast AI Mode single-screen campaign creation component.
 * Collapses objective, ad-set count, tone/hook/length pills, and file drop onto
 * one screen. Dropping files triggers parallel AI draft + copy generation and
 * then navigates directly to Review & Launch.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NewCampaignStore } from '../../store/new-campaign.store';
import type { CampaignObjective } from '../../../core/models/index';
import type { DraftCreative } from '../../model/draft.model';

/** Objective pill definitions. */
const OBJECTIVES: { value: CampaignObjective; label: string }[] = [
  { value: 'OUTCOME_SALES',          label: 'Sales' },
  { value: 'OUTCOME_LEADS',          label: 'Leads' },
  { value: 'OUTCOME_TRAFFIC',        label: 'Traffic' },
  { value: 'OUTCOME_AWARENESS',      label: 'Awareness' },
  { value: 'OUTCOME_APP_PROMOTION',  label: 'App Promotion' },
  { value: 'OUTCOME_ENGAGEMENT',     label: 'Engagement' },
];

/** Available tone options. */
const TONES = ['Conversational', 'Professional', 'Urgent', 'Bold', 'Emotional'];

/** Available hook options. */
const HOOKS = ['Humorous', 'Questions', 'Bold Claims', 'Statistics', 'Stories', 'Pain Points'];

/** Available copy-length options. */
const LENGTHS = ['Short', 'Medium', 'Long'] as const;

/** Generates a client-side UUID. */
function uuid(): string { return crypto.randomUUID(); }

/** Fast AI Mode — single-screen campaign creation. */
@Component({
  selector: 'app-fast-campaign',
  imports: [],
  templateUrl: './fast-campaign.component.html',
  styleUrl: './fast-campaign.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FastCampaignComponent {
  protected readonly store  = inject(NewCampaignStore);
  private readonly router   = inject(Router);

  // ── Pill options exposed to template ──────────────────────────────────────
  protected readonly objectives  = OBJECTIVES;
  protected readonly tones       = TONES;
  protected readonly hooks       = HOOKS;
  protected readonly lengths     = LENGTHS;

  // ── Local pill selections (resolved into store only on file drop) ─────────

  /** Selected campaign objective. */
  protected readonly selectedObjective = signal<CampaignObjective | null>(null);

  /** Number of ad sets to generate (1–5). */
  protected readonly adSetCount = signal<number>(1);

  /** Selected tone. */
  protected readonly selectedTone = signal<string>('Conversational');

  /** Selected hook. */
  protected readonly selectedHook = signal<string>('Questions');

  /** Selected copy length. */
  protected readonly selectedLength = signal<'Short' | 'Medium' | 'Long'>('Medium');

  /** Optional free-text campaign prompt. */
  protected readonly prompt = signal<string>('');

  /** Whether the drop zone is being dragged over. */
  protected readonly isDragOver = signal(false);

  // ── Computed helpers ───────────────────────────────────────────────────────

  /** True when an objective is selected — required before uploading. */
  protected readonly canDrop = computed(() => this.selectedObjective() !== null);

  /** Whether any AI generation is running. */
  protected readonly isGenerating = computed(
    () => this.store.isGeneratingAdSets() || this.store.isGeneratingCopy()
  );

  /** Label for the progress bar. */
  protected readonly progressLabel = computed(() => {
    if (this.store.isGeneratingAdSets()) return 'Generating ad sets…';
    if (this.store.isGeneratingCopy())   return 'Generating ad copy…';
    return '';
  });

  // ── Pill selection handlers ────────────────────────────────────────────────

  /**
   * Sets the campaign objective pill selection.
   * @param value - The objective to select.
   */
  protected selectObjective(value: CampaignObjective): void {
    this.selectedObjective.set(value);
  }

  /**
   * Sets the desired number of ad sets.
   * @param count - Number between 1 and 5.
   */
  protected selectAdSetCount(count: number): void {
    this.adSetCount.set(count);
  }

  /**
   * Updates the prompt text.
   * @param event - Input event.
   */
  protected onPromptInput(event: Event): void {
    this.prompt.set((event.target as HTMLTextAreaElement).value);
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────

  /**
   * Prevents default to allow drop.
   * @param event - Drag event.
   */
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  /** Clears the drag-over state when drag leaves the drop zone. */
  protected onDragLeave(): void {
    this.isDragOver.set(false);
  }

  /**
   * Handles dropped files.
   * @param event - Drop event.
   */
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (!this.canDrop()) return;
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) void this.processFiles(files);
  }

  /**
   * Handles file selection via the hidden file input.
   * @param event - Change event from file input.
   */
  protected onFilesSelected(event: Event): void {
    if (!this.canDrop()) return;
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    (event.target as HTMLInputElement).value = '';
    if (files.length > 0) void this.processFiles(files);
  }

  // ── AI generation flow ────────────────────────────────────────────────────

  /**
   * Main flow triggered by file selection or drop.
   * 1. Resets wizard state.
   * 2. Patches campaign objective from pill.
   * 3. Adds each file as a DraftCreative.
   * 4. Runs generateDraft + generateCopy in parallel.
   * 5. Navigates to Review & Launch when both resolve.
   * @param files - Files to process.
   */
  private async processFiles(files: File[]): Promise<void> {
    const objective = this.selectedObjective()!;
    const tone      = this.selectedTone();
    const hook      = this.selectedHook();
    const length    = this.selectedLength();
    const count     = this.adSetCount();
    const prompt    = this.prompt().trim();

    // 1. Reset wizard state.
    this.store.reset();

    // 2. Patch campaign objective (and count hint via prompt suffix).
    this.store.updateCampaign({ objective });

    // 3. Add each file as a DraftCreative.
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const creative: DraftCreative = {
        id: uuid(),
        fileName: file.name,
        fileType: file.type.startsWith('video') ? 'video' : 'image',
        objectUrl,
        file,
        tones: [tone],
        hook,
        length,
        primaryText: '',
        headline: '',
        description: '',
        cta: 'LEARN_MORE',
        launchStatus: 'paused',
        adCreationMode: 'separate',
        adFormat: file.type.startsWith('video') ? 'SINGLE_VIDEO' as const : 'SINGLE_IMAGE' as const,
        carouselCards: [],
        collectionCards: [],
        instantExperienceId: '',
      };
      this.store.addCreative(creative);
    });

    // 4. Build the prompt: include ad set count hint and user description.
    const draftPrompt = [
      prompt,
      `Generate exactly ${count} ad set${count === 1 ? '' : 's'}.`,
    ].filter(Boolean).join(' ');

    // Generate ad sets + campaign name first (copy generation uses campaign context).
    await this.store.generateDraft(draftPrompt);

    // Generate copy for every creative in sequence.
    for (let i = 0; i < files.length; i++) {
      this.store.setActiveCreative(i);
      await this.store.generateCopy();
    }

    // 5. Navigate to Review & Launch.
    await this.router.navigateByUrl('/new-campaign/review');
  }
}
