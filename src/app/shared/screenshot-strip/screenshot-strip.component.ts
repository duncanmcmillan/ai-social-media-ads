/**
 * @fileoverview Reusable screenshot thumbnail strip with scroll navigation.
 * Displays a horizontally scrollable row of screenshot thumbnails flanked by
 * left/right arrow buttons. Clicking a thumbnail emits its index so the parent
 * can open a lightbox at the correct position.
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { LightboxImage } from '../image-modal/image-modal.component';

/** Horizontally scrollable screenshot thumbnail carousel with prev/next arrow navigation. */
@Component({
  selector: 'app-screenshot-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ss-wrap" [attr.aria-label]="ariaLabel" role="list">

      <button class="ss-arrow" type="button"
              aria-label="Scroll screenshots left"
              [disabled]="atStart()"
              (click)="scroll(-1)">&#8249;</button>

      <div class="ss-track" #track (scroll)="updateBounds()">
        @for (img of images; track $index) {
          <button class="ss-thumb" type="button" role="listitem"
                  [attr.aria-label]="img.caption"
                  (click)="open.emit($index)">
            <div class="ss-img-wrap">
              <img [src]="img.src" [alt]="img.caption" loading="lazy" />
            </div>
            <span class="ss-label">{{ img.caption }}</span>
          </button>
        }
      </div>

      <button class="ss-arrow" type="button"
              aria-label="Scroll screenshots right"
              [disabled]="atEnd()"
              (click)="scroll(1)">&#8250;</button>

    </div>
  `,
  styles: [`
    .ss-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 14px;
    }

    /* ── Arrow buttons ──────────────────────────────────────────────── */
    .ss-arrow {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--neutral-300);
      border-radius: 4px;
      background: var(--neutral-0, #fff);
      color: var(--neutral-600);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      transition: background 0.15s, border-color 0.15s;

      &:hover:not(:disabled) {
        background: var(--neutral-50);
        border-color: var(--accent-500, #f97316);
        color: var(--accent-500, #f97316);
      }

      &:disabled {
        opacity: 0.25;
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--accent-500, #f97316);
        outline-offset: 1px;
      }
    }

    /* ── Scrollable track ───────────────────────────────────────────── */
    .ss-track {
      display: flex;
      gap: 8px;
      flex: 1;
      min-width: 0;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding-bottom: 4px;
      /* Hide scrollbar — arrows handle navigation */
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    /* ── Thumbnail card ─────────────────────────────────────────────── */
    .ss-thumb {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 110px;
      flex-shrink: 0;
      border: 1px solid var(--neutral-200);
      border-radius: 5px;
      overflow: hidden;
      padding: 0;
      background: var(--neutral-0, #fff);
      cursor: pointer;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:hover {
        border-color: var(--accent-500, #f97316);
        box-shadow: 0 0 0 2px rgba(249 115 22 / 0.2);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-500, #f97316);
        outline-offset: 2px;
      }
    }

    .ss-img-wrap {
      width: 100%;
      height: 76px;
      background: var(--neutral-100);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
    }

    .ss-label {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      font-size: 10px;
      color: var(--neutral-600);
      line-height: 1.35;
      padding: 5px 6px 6px;
      border-top: 1px solid var(--neutral-200);
    }
  `],
})
export class ScreenshotStripComponent implements AfterViewInit {
  /** Images to display as thumbnails. */
  @Input() images: LightboxImage[] = [];
  /** Accessible label for the strip container. */
  @Input() ariaLabel = 'Setup screenshots';
  /** Emits the index of the thumbnail the user clicked. */
  @Output() readonly open = new EventEmitter<number>();

  private readonly cdr      = inject(ChangeDetectorRef);
  private readonly trackRef = viewChild.required<ElementRef<HTMLDivElement>>('track');

  /** True when the track is scrolled to the leftmost position. */
  protected readonly atStart = signal(true);
  /** True when the track is scrolled to the rightmost position. */
  protected readonly atEnd   = signal(false);

  ngAfterViewInit(): void {
    this.updateBounds();
  }

  /**
   * Scrolls the track left or right by one thumbnail width.
   *
   * @param dir - `-1` for left, `1` for right.
   */
  protected scroll(dir: -1 | 1): void {
    this.trackRef().nativeElement.scrollBy({ left: dir * 126, behavior: 'smooth' });
  }

  /** Recalculates the at-start/at-end flags after each scroll event. */
  protected updateBounds(): void {
    const el = this.trackRef().nativeElement;
    this.atStart.set(el.scrollLeft <= 2);
    this.atEnd.set(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    this.cdr.markForCheck();
  }
}
