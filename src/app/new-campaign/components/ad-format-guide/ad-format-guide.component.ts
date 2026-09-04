/**
 * @fileoverview Ad Format Guide modal component.
 * Shows Facebook media requirements for all four ad formats:
 * Single Image, Single Video, Carousel, and Collection.
 */
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Output, signal } from '@angular/core';

/** The four Facebook ad formats shown in this guide. */
type GuideTab = 'image' | 'video' | 'carousel' | 'collection';

/** A row of spec data shown in the guide tables. */
interface SpecRow {
  /** Row label. */
  label: string;
  /** Row value. */
  value: string;
}

/** A single ad format's full spec data. */
interface FormatSpec {
  /** Display title. */
  title: string;
  /** Aspect ratio description. */
  aspectRatio: string;
  /** CSS aspect-ratio value for the visual diagram. */
  cssAspectRatio: string;
  /** Media specification rows. */
  mediaSpecs: SpecRow[];
  /** Text limit rows. */
  textLimits: SpecRow[];
  /** Platform-specific note. */
  platformNote: string;
}

/** Spec data for each format. */
const FORMAT_SPECS: Record<GuideTab, FormatSpec> = {
  image: {
    title: 'Single Image',
    aspectRatio: '4:5',
    cssAspectRatio: '4 / 5',
    mediaSpecs: [
      { label: 'File types',    value: 'JPG, PNG' },
      { label: 'Recommended',   value: '1080 × 1350 px' },
      { label: 'Min resolution', value: '600 × 750 px' },
      { label: 'Max file size', value: '30 MB' },
    ],
    textLimits: [
      { label: 'Primary Text',  value: '50–150 chars (125 shown)' },
      { label: 'Headline',      value: '27 chars' },
      { label: 'Description',   value: '27 chars' },
    ],
    platformNote: 'Works across Facebook Feed, Instagram Feed, and Audience Network placements.',
  },
  video: {
    title: 'Single Video',
    aspectRatio: '4:5',
    cssAspectRatio: '4 / 5',
    mediaSpecs: [
      { label: 'File types',    value: 'MP4, MOV, GIF' },
      { label: 'Min resolution', value: '120 × 120 px' },
      { label: 'Max file size', value: '4 GB' },
      { label: 'Duration',      value: '1 sec – 241 min' },
    ],
    textLimits: [
      { label: 'Primary Text',  value: '50–150 chars (125 shown)' },
      { label: 'Headline',      value: '27 chars' },
    ],
    platformNote: 'Video ads auto-play silently. Add captions to maintain engagement without sound.',
  },
  carousel: {
    title: 'Carousel',
    aspectRatio: '1:1',
    cssAspectRatio: '1 / 1',
    mediaSpecs: [
      { label: 'File types',    value: 'JPG, PNG (image) · MP4, MOV (video)' },
      { label: 'Min resolution', value: '1080 × 1080 px' },
      { label: 'Max file size', value: '30 MB (image) · 4 GB (video)' },
      { label: 'Cards',         value: '2–10 cards per carousel' },
    ],
    textLimits: [
      { label: 'Primary Text',  value: '80 chars' },
      { label: 'Headline/card', value: '20 chars' },
      { label: 'Desc/card',     value: '18 chars' },
    ],
    platformNote: 'Meta can auto-optimise card order to show best-performing cards first.',
  },
  collection: {
    title: 'Collection',
    aspectRatio: '1.91:1 – 1:1',
    cssAspectRatio: '1.91 / 1',
    mediaSpecs: [
      { label: 'Cover types',   value: 'Image (JPG, PNG) or Video (MP4, MOV)' },
      { label: 'Min resolution', value: '1080 × 1080 px' },
      { label: 'Max file size', value: '30 MB (image) · 4 GB (video)' },
      { label: 'Cards',         value: 'Cover + 3 product images' },
    ],
    textLimits: [
      { label: 'Primary Text',  value: '125 chars' },
      { label: 'Headline',      value: '40 chars' },
    ],
    platformNote: 'Collection requires an Instant Experience (Canvas) created in Meta Ads Manager. The canvas is shown after a user taps the ad.',
  },
};

/**
 * Right-side panel showing Facebook ad format specifications.
 * Emits a `closed` event when the user dismisses the panel.
 */
@Component({
  selector: 'app-ad-format-guide',
  imports: [],
  templateUrl: './ad-format-guide.component.html',
  styleUrl: './ad-format-guide.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdFormatGuideComponent {
  /** Emitted when the user closes the panel. */
  @Output() readonly closed = new EventEmitter<void>();

  /** Accessibility — host is the panel dialog. */
  @HostBinding('attr.role') readonly role = 'dialog';

  /** Accessibility — panel label for screen readers. */
  @HostBinding('attr.aria-label') readonly ariaLabel = 'Ad Format Guide';

  /** Currently active format tab. */
  protected readonly activeTab = signal<GuideTab>('image');

  /** The four tab options. */
  protected readonly tabs: { key: GuideTab; label: string }[] = [
    { key: 'image',      label: 'Image' },
    { key: 'video',      label: 'Video' },
    { key: 'carousel',   label: 'Carousel' },
    { key: 'collection', label: 'Collection' },
  ];

  /** Returns the spec for the active tab. */
  protected get spec(): FormatSpec {
    return FORMAT_SPECS[this.activeTab()];
  }

  /**
   * Selects a format tab.
   * @param tab - The tab key to activate.
   */
  protected selectTab(tab: GuideTab): void {
    this.activeTab.set(tab);
  }
}
