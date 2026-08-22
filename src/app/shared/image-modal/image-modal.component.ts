/**
 * @fileoverview Reusable image lightbox modal with prev/next navigation.
 * Accepts an array of images and opens at a given index.
 * Supports keyboard navigation (Escape to close, ArrowLeft/Right to step).
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';

/** A single image shown in the lightbox. */
export interface LightboxImage {
  /** Relative URL passed to `src` on an `<img>` element. */
  src: string;
  /** Short caption shown below the image. */
  caption: string;
}

/** Full-screen image lightbox with previous/next navigation. */
@Component({
  selector: 'app-image-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop — click outside dialog to close -->
    <div class="im-backdrop"
         role="dialog"
         aria-modal="true"
         [attr.aria-label]="current().caption"
         (click)="closed.emit()">

      <!-- Dialog — stop propagation so backdrop click doesn't fire inside -->
      <div class="im-dialog" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="im-header">
          <span class="im-counter" aria-live="polite">
            {{ index() + 1 }} / {{ images.length }}
          </span>
          <span class="im-caption">{{ current().caption }}</span>
          <button class="im-close" type="button" aria-label="Close" (click)="closed.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Image -->
        <div class="im-body">
          <img class="im-image"
               [src]="current().src"
               [alt]="current().caption" />
        </div>

        <!-- Navigation -->
        @if (images.length > 1) {
          <div class="im-nav">
            <button class="im-nav-btn" type="button"
                    aria-label="Previous screenshot"
                    [disabled]="index() === 0"
                    (click)="prev()">&#8592; Prev</button>
            <div class="im-dots" aria-hidden="true">
              @for (img of images; track $index) {
                <span class="im-dot" [class.im-dot--active]="$index === index()"></span>
              }
            </div>
            <button class="im-nav-btn" type="button"
                    aria-label="Next screenshot"
                    [disabled]="index() === images.length - 1"
                    (click)="next()">Next &#8594;</button>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .im-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .im-dialog {
      background: var(--neutral-0, #fff);
      border: 1px solid var(--neutral-200);
      border-radius: 6px;
      width: 90vw;
      max-width: 860px;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 56px rgba(0 0 0 / 0.28), 0 4px 12px rgba(0 0 0 / 0.1);
    }

    /* ── Header ─────────────────────────────────────────────────────── */
    .im-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-bottom: 1px solid var(--neutral-200);
      flex-shrink: 0;
    }

    .im-counter {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.06em;
      color: var(--neutral-400);
      background: var(--neutral-100);
      border: 1px solid var(--neutral-200);
      border-radius: 3px;
      padding: 2px 7px;
      flex-shrink: 0;
    }

    .im-caption {
      font-size: 13px;
      color: var(--neutral-600);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .im-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--neutral-400);
      border-radius: 4px;
      padding: 0;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;

      svg { width: 14px; height: 14px; display: block; }

      &:hover {
        background: var(--neutral-100);
        color: var(--neutral-700);
      }

      &:focus-visible {
        outline: 2px solid var(--accent-500, #f97316);
        outline-offset: 1px;
      }
    }

    /* ── Image ──────────────────────────────────────────────────────── */
    .im-body {
      flex: 1;
      min-height: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--neutral-50, #fafaf9);
      padding: 16px;
      overflow: auto;
    }

    .im-image {
      max-width: 100%;
      max-height: calc(92vh - 100px);
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0 0 0 / 0.12);
      display: block;
    }

    /* ── Navigation ─────────────────────────────────────────────────── */
    .im-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-top: 1px solid var(--neutral-200);
      flex-shrink: 0;
    }

    .im-nav-btn {
      font-size: 12px;
      color: var(--neutral-600);
      background: none;
      border: 1px solid var(--neutral-300);
      border-radius: 4px;
      padding: 4px 12px;
      cursor: pointer;
      height: 28px;

      &:hover:not(:disabled) {
        background: var(--neutral-50);
        border-color: var(--neutral-400);
      }

      &:disabled {
        opacity: 0.35;
        cursor: default;
      }

      &:focus-visible {
        outline: 2px solid var(--accent-500, #f97316);
        outline-offset: 1px;
      }
    }

    .im-dots {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .im-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--neutral-300);
      transition: background 0.15s;

      &--active {
        background: var(--accent-500, #f97316);
      }
    }
  `],
})
export class ImageModalComponent implements OnInit {
  /** The images to display in the lightbox. */
  @Input() images: LightboxImage[] = [];
  /** The index to open at. */
  @Input() startIndex = 0;
  /** Emitted when the user closes the modal. */
  @Output() readonly closed = new EventEmitter<void>();

  /** Currently displayed image index. */
  protected readonly index = signal(0);

  ngOnInit(): void {
    this.index.set(Math.max(0, Math.min(this.startIndex, this.images.length - 1)));
  }

  /** The currently displayed image. */
  protected current(): LightboxImage {
    return this.images[this.index()] ?? { src: '', caption: '' };
  }

  /** Moves to the previous image. */
  protected prev(): void {
    if (this.index() > 0) this.index.update(i => i - 1);
  }

  /** Moves to the next image. */
  protected next(): void {
    if (this.index() < this.images.length - 1) this.index.update(i => i + 1);
  }

  /**
   * Handles keyboard navigation while the modal is open.
   * @param event - The keyboard event from the host document.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape')     { this.closed.emit(); }
    if (event.key === 'ArrowLeft')  { this.prev(); }
    if (event.key === 'ArrowRight') { this.next(); }
  }
}
