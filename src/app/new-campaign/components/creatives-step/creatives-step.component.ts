/**
 * @fileoverview Step 3 — Creatives.
 * File upload panel, copy editor with tone/hook/length chips, and AI copy generation.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NewCampaignStore } from '../../store/new-campaign.store';
import { WorkspaceStore } from '../../../workspace';
import { AuthStore } from '../../../auth';
import type { DraftCreative, WebsiteUrlMode } from '../../model/draft.model';

const TONES = ['Conversational', 'Professional', 'Urgent', 'Bold', 'Emotional'];
const HOOKS = ['Humorous', 'Questions', 'Bold Claims', 'Statistics', 'Stories', 'Pain Points'];
const LENGTHS = ['Short', 'Medium', 'Long'] as const;
const CTA_OPTIONS = [
  'Learn More', 'Shop Now', 'Sign Up', 'Get Offer', 'Book Now',
  'Contact Us', 'Subscribe', 'Watch More', 'Apply Now', 'Download',
];

/** Generates a client-side UUID. */
function uuid(): string { return crypto.randomUUID(); }

/** Step 3 of the New Campaign wizard — Creative upload and copy. */
@Component({
  selector: 'app-creatives-step',
  templateUrl: './creatives-step.component.html',
  styleUrl: './creatives-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreativesStepComponent {
  protected readonly store = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  protected readonly authStore = inject(AuthStore);

  protected readonly tones = TONES;
  protected readonly hooks = HOOKS;
  protected readonly lengths = LENGTHS;
  protected readonly ctaOptions = CTA_OPTIONS;

  protected readonly showPreview = signal(false);

  /** Display name for the Facebook page selected in workspace settings. */
  protected readonly previewPageName = computed(() => {
    const pageId = this.workspaceStore.metaDefaults().facebookPageId;
    return this.authStore.pages().find(p => p.id === pageId)?.name ?? 'Your Page';
  });

  /** Uppercased domain extracted from the workspace website URL. */
  protected readonly previewDomain = computed(() => {
    const url = this.workspaceStore.metaDefaults().websiteUrl;
    try {
      return new URL(url).hostname.replace(/^www\./, '').toUpperCase();
    } catch {
      return url ? url.toUpperCase() : 'YOURWEBSITE.COM';
    }
  });

  /** @param mode - URL source mode. */
  protected setUrlMode(mode: WebsiteUrlMode): void {
    this.store.setWebsiteUrlMode(mode);
  }

  /** @param index - Creative to activate. */
  protected selectCreative(index: number): void {
    this.store.setActiveCreative(index);
  }

  /** @param index - Creative to remove. */
  protected removeCreative(index: number): void {
    URL.revokeObjectURL(this.store.creatives()[index]?.objectUrl ?? '');
    this.store.removeCreative(index);
  }

  /**
   * Handles file selection from the drag-and-drop or click upload area.
   * @param event - File input change event.
   */
  protected onFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const creative: DraftCreative = {
        id: uuid(),
        fileName: file.name,
        fileType: file.type.startsWith('video') ? 'video' : 'image',
        objectUrl,
        file,
        tones: [],
        hook: '',
        length: 'Medium',
        primaryText: '',
        headline: '',
        description: '',
        cta: 'Learn More',
        launchStatus: 'paused',
        adCreationMode: 'separate',
        isCarousel: false,
        carouselCards: [],
      };
      this.store.addCreative(creative);
    });
    // Reset input so the same file can be re-selected.
    (event.target as HTMLInputElement).value = '';
  }

  /** @param field - Creative field to update. @param value - New value. */
  protected update(field: keyof DraftCreative, value: unknown): void {
    this.store.updateCreative(this.store.activeCreativeIndex(), { [field]: value } as Partial<DraftCreative>);
  }

  /**
   * Toggles a tone chip on/off for the active creative.
   * @param tone - Tone label to toggle.
   */
  protected toggleTone(tone: string): void {
    const current = this.store.activeCreative()?.tones ?? [];
    const tones = current.includes(tone) ? current.filter(t => t !== tone) : [...current, tone];
    this.update('tones', tones);
  }

  /** Calls Claude to generate ad copy for the active creative. */
  protected generateAiCopy(): void {
    void this.store.generateCopy();
  }

  /** Duplicates the active creative with a fresh id and copies all copy fields. */
  protected duplicateCreative(): void {
    const source = this.store.activeCreative();
    if (!source) return;
    const name = source.fileName.replace(/(\.[^.]+)?$/, ' (copy)$1');
    this.store.addCreative({ ...source, id: uuid(), fileName: name });
  }
}
