/**
 * @fileoverview Step 3 — Creatives.
 * File upload panel, copy editor with tone/hook/length chips, AI copy generation,
 * and support for Single Image, Single Video, Carousel, and Collection ad formats.
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NewCampaignStore } from '../../store/new-campaign.store';
import { WorkspaceStore } from '../../../workspace';
import { AuthStore } from '../../../auth';
import { VideoModalComponent } from '../../../shared/video-modal/video-modal.component';
import { AdFormatGuideComponent } from '../ad-format-guide/ad-format-guide.component';
import type { DraftCreative, CarouselCard, CollectionCard, WebsiteUrlMode } from '../../model/draft.model';

const TONES = ['Conversational', 'Professional', 'Urgent', 'Bold', 'Emotional'];
const HOOKS = ['Humorous', 'Questions', 'Bold Claims', 'Statistics', 'Stories', 'Pain Points'];
const LENGTHS = ['Short', 'Medium', 'Long'] as const;
/** Facebook API enum values for call-to-action type. */
const CTA_OPTIONS = [
  'LEARN_MORE', 'SHOP_NOW', 'SIGN_UP', 'GET_OFFER', 'BOOK_NOW',
  'CONTACT_US', 'SUBSCRIBE', 'WATCH_MORE', 'APPLY_NOW', 'DOWNLOAD',
] as const;

/** Human-readable labels for each CTA enum value. */
const CTA_LABELS: Record<string, string> = {
  LEARN_MORE: 'Learn More',
  SHOP_NOW:   'Shop Now',
  SIGN_UP:    'Sign Up',
  GET_OFFER:  'Get Offer',
  BOOK_NOW:   'Book Now',
  CONTACT_US: 'Contact Us',
  SUBSCRIBE:  'Subscribe',
  WATCH_MORE: 'Watch More',
  APPLY_NOW:  'Apply Now',
  DOWNLOAD:   'Download',
};

/** Generates a client-side UUID. */
function uuid(): string { return crypto.randomUUID(); }

/** Creates a blank carousel card with no media. */
function blankCarouselCard(): CarouselCard {
  return { id: uuid(), objectUrl: '', fileName: '', fileType: 'image', headline: '', description: '', url: '', cta: 'LEARN_MORE' };
}

/** Creates a blank collection card with no media. */
function blankCollectionCard(): CollectionCard {
  return { id: uuid(), objectUrl: '', fileName: '', fileType: 'image' };
}

/** Step 3 of the New Campaign wizard — Creative upload and copy. */
@Component({
  selector: 'app-creatives-step',
  imports: [VideoModalComponent, AdFormatGuideComponent],
  templateUrl: './creatives-step.component.html',
  styleUrl: './creatives-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreativesStepComponent {
  protected readonly store = inject(NewCampaignStore);
  protected readonly workspaceStore = inject(WorkspaceStore);
  protected readonly authStore = inject(AuthStore);

  /** Controls the help video modal. */
  protected readonly videoOpen = signal(false);

  /** Controls the Ad Format Guide modal. */
  protected readonly showFormatGuide = signal(false);

  protected readonly tones = TONES;
  protected readonly hooks = HOOKS;
  protected readonly lengths = LENGTHS;
  protected readonly ctaOptions = CTA_OPTIONS;

  /** Returns the display label for a CTA enum value. */
  protected ctaLabel(value: string): string {
    return CTA_LABELS[value] ?? value;
  }

  protected readonly showPreview = signal(false);

  /** Tracks which carousel card is active in the editor. */
  protected readonly activeCarouselCardIndex = signal(0);

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

  /** Primary text character limit for the active creative's format. */
  protected readonly primaryTextLimit = computed(() => {
    const fmt = this.store.activeCreative()?.adFormat;
    if (fmt === 'CAROUSEL') return 80;
    if (fmt === 'COLLECTION') return 125;
    return 150;
  });

  /** Headline character limit for the active creative's format. */
  protected readonly headlineLimit = computed(() => {
    const fmt = this.store.activeCreative()?.adFormat;
    if (fmt === 'COLLECTION') return 40;
    return 27;
  });

  /** @param mode - URL source mode. */
  protected setUrlMode(mode: WebsiteUrlMode): void {
    this.store.setWebsiteUrlMode(mode);
  }

  /** @param index - Creative to activate. */
  protected selectCreative(index: number): void {
    this.store.setActiveCreative(index);
    this.activeCarouselCardIndex.set(0);
  }

  /** @param index - Creative to remove. */
  protected removeCreative(index: number): void {
    const creative = this.store.creatives()[index];
    if (creative) {
      if (creative.objectUrl) URL.revokeObjectURL(creative.objectUrl);
      creative.carouselCards.forEach(c => { if (c.objectUrl) URL.revokeObjectURL(c.objectUrl); });
      creative.collectionCards.forEach(c => { if (c.objectUrl) URL.revokeObjectURL(c.objectUrl); });
    }
    this.store.removeCreative(index);
  }

  /**
   * Handles file selection from the drag-and-drop or click upload area.
   * Automatically sets adFormat based on MIME type.
   * @param event - File input change event.
   */
  protected onFilesSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video');
      const creative: DraftCreative = {
        id: uuid(),
        fileName: file.name,
        fileType: isVideo ? 'video' : 'image',
        adFormat: isVideo ? 'SINGLE_VIDEO' : 'SINGLE_IMAGE',
        objectUrl,
        file,
        tones: [],
        hook: '',
        length: 'Medium',
        primaryText: '',
        headline: '',
        description: '',
        cta: 'LEARN_MORE',
        launchStatus: 'paused',
        adCreationMode: 'separate',
        carouselCards: [],
        collectionCards: [],
        instantExperienceId: '',
      };
      this.store.addCreative(creative);
    });
    // Reset input so the same file can be re-selected.
    (event.target as HTMLInputElement).value = '';
  }

  /** Creates a blank Carousel creative with 2 empty cards. */
  protected createCarousel(): void {
    const creative: DraftCreative = {
      id: uuid(),
      fileName: 'New Carousel',
      fileType: 'image',
      adFormat: 'CAROUSEL',
      objectUrl: '',
      tones: [],
      hook: '',
      length: 'Medium',
      primaryText: '',
      headline: '',
      description: '',
      cta: 'LEARN_MORE',
      launchStatus: 'paused',
      adCreationMode: 'separate',
      carouselCards: [blankCarouselCard(), blankCarouselCard()],
      collectionCards: [],
      instantExperienceId: '',
    };
    this.store.addCreative(creative);
    this.activeCarouselCardIndex.set(0);
  }

  /** Creates a blank Collection creative with a cover slot and 3 product card slots. */
  protected createCollection(): void {
    const creative: DraftCreative = {
      id: uuid(),
      fileName: 'New Collection',
      fileType: 'image',
      adFormat: 'COLLECTION',
      objectUrl: '',
      tones: [],
      hook: '',
      length: 'Medium',
      primaryText: '',
      headline: '',
      description: '',
      cta: 'LEARN_MORE',
      launchStatus: 'paused',
      adCreationMode: 'separate',
      carouselCards: [],
      collectionCards: [blankCollectionCard(), blankCollectionCard(), blankCollectionCard()],
      instantExperienceId: '',
    };
    this.store.addCreative(creative);
  }

  /**
   * Adds a new blank card to the active carousel creative (up to 10).
   * @param creativeIndex - Index of the creative to update.
   */
  protected addCarouselCard(creativeIndex: number): void {
    const creative = this.store.creatives()[creativeIndex];
    if (!creative || creative.carouselCards.length >= 10) return;
    this.store.addCarouselCard(creativeIndex, blankCarouselCard());
    this.activeCarouselCardIndex.set(creative.carouselCards.length);
  }

  /**
   * Removes a carousel card, revoking its object URL.
   * @param creativeIndex - Index of the creative.
   * @param cardIndex - Index of the card to remove.
   */
  protected removeCarouselCard(creativeIndex: number, cardIndex: number): void {
    const card = this.store.creatives()[creativeIndex]?.carouselCards[cardIndex];
    if (card?.objectUrl) URL.revokeObjectURL(card.objectUrl);
    this.store.removeCarouselCard(creativeIndex, cardIndex);
    const remaining = (this.store.creatives()[creativeIndex]?.carouselCards.length ?? 1) - 1;
    this.activeCarouselCardIndex.set(Math.min(this.activeCarouselCardIndex(), Math.max(0, remaining - 1)));
  }

  /**
   * Handles file selection for a specific carousel card slot.
   * @param creativeIndex - Index of the creative.
   * @param cardIndex - Index of the carousel card.
   * @param event - File input change event.
   */
  protected onCarouselCardFileSelected(creativeIndex: number, cardIndex: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const card = this.store.creatives()[creativeIndex]?.carouselCards[cardIndex];
    if (card?.objectUrl) URL.revokeObjectURL(card.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    this.store.updateCarouselCard(creativeIndex, cardIndex, {
      file,
      objectUrl,
      fileName: file.name,
      fileType: file.type.startsWith('video') ? 'video' : 'image',
    });
    (event.target as HTMLInputElement).value = '';
  }

  /**
   * Handles file selection for a collection cover or product card slot.
   * @param creativeIndex - Index of the creative.
   * @param cardIndex - Index of the collection card (0 = cover for the creative itself).
   * @param event - File input change event.
   * @param isCover - Whether this is the cover slot (updates the creative itself).
   */
  protected onCollectionCardFileSelected(creativeIndex: number, cardIndex: number, event: Event, isCover: boolean): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    if (isCover) {
      const old = this.store.creatives()[creativeIndex];
      if (old?.objectUrl) URL.revokeObjectURL(old.objectUrl);
      this.store.updateCreative(creativeIndex, { file, objectUrl, fileName: file.name, fileType: file.type.startsWith('video') ? 'video' : 'image' });
    } else {
      const card = this.store.creatives()[creativeIndex]?.collectionCards[cardIndex];
      if (card?.objectUrl) URL.revokeObjectURL(card.objectUrl);
      this.store.updateCollectionCard(creativeIndex, cardIndex, { file, objectUrl, fileName: file.name, fileType: file.type.startsWith('video') ? 'video' : 'image' });
    }
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

  /**
   * Replaces the file on a template-loaded creative, preserving all copy fields.
   * @param index - Index of the creative to update.
   * @param event - File input change event.
   */
  protected onReplaceFile(index: number, event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const old = this.store.creatives()[index];
    if (old?.objectUrl) URL.revokeObjectURL(old.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    this.store.updateCreative(index, {
      file,
      objectUrl,
      fileName: file.name,
      fileType: file.type.startsWith('video') ? 'video' : 'image',
    });
    (event.target as HTMLInputElement).value = '';
  }

  /** Duplicates the active creative with a fresh id and deep-copies card arrays. */
  protected duplicateCreative(): void {
    const source = this.store.activeCreative();
    if (!source) return;
    const name = source.fileName.replace(/(\.[^.]+)?$/, ' (copy)$1');
    // Deep-copy cards with fresh IDs; no file/objectUrl carried over (user must re-upload)
    const carouselCards = source.carouselCards.map(c => ({ ...c, id: uuid(), file: undefined, objectUrl: '', fileName: '' }));
    const collectionCards = source.collectionCards.map(c => ({ ...c, id: uuid(), file: undefined, objectUrl: '', fileName: '' }));
    this.store.addCreative({
      ...source,
      id: uuid(),
      fileName: name,
      file: undefined,
      objectUrl: '',
      carouselCards,
      collectionCards,
    });
  }

  /**
   * Returns a human-readable format badge label for the file list.
   * @param creative - The creative to label.
   */
  protected formatBadge(creative: DraftCreative): string {
    switch (creative.adFormat) {
      case 'CAROUSEL':   return `Carousel · ${creative.carouselCards.length} cards`;
      case 'COLLECTION': return `Collection · ${creative.collectionCards.length + 1} cards`;
      case 'SINGLE_VIDEO': return 'Video';
      default: return 'Image';
    }
  }
}
