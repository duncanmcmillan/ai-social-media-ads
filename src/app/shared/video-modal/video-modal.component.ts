/**
 * @fileoverview Reusable video help modal.
 * Renders a centred backdrop overlay with a native <video> player.
 * Usage: <app-video-modal [src]="..." [title]="..." (closed)="..." />
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

/** Full-screen centred video modal for in-app help screencasts. */
@Component({
  selector: 'app-video-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop — click outside to close -->
    <div class="vm-backdrop" (click)="closed.emit()" role="dialog" aria-modal="true" [attr.aria-label]="title + ' help video'">

      <!-- Dialog — stop click propagating to backdrop -->
      <div class="vm-dialog" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="vm-header">
          <div class="vm-header-left">
            <span class="vm-eyebrow">Help Video</span>
            <span class="vm-title">{{ title }}</span>
          </div>
          <button class="vm-close" type="button" aria-label="Close video" (click)="closed.emit()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Video or coming-soon placeholder -->
        <div class="vm-body">
          @if (src) {
            <video
              class="vm-video"
              [src]="src"
              controls
              autoplay
              preload="metadata"
            ></video>
          } @else {
            <div class="vm-placeholder">
              <svg class="vm-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
              </svg>
              <p class="vm-placeholder-text">Help video coming soon</p>
            </div>
          }
        </div>

      </div>
    </div>
  `,
  styles: [`
    .vm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .vm-dialog {
      background: var(--neutral-0, #fff);
      border: 1px solid var(--neutral-200, #e7e5e4);
      border-radius: 6px;
      width: 90vw;
      max-width: 860px;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 20px 48px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    /* ── Header ────────────────────────────────────────────────────────── */
    .vm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--neutral-200, #e7e5e4);
      flex-shrink: 0;
    }

    .vm-header-left {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .vm-eyebrow {
      font-size: 11px;
      font-weight: 400;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--neutral-400, #a8a29e);
      border: 1px solid var(--neutral-200, #e7e5e4);
      border-radius: 3px;
      padding: 2px 6px;
    }

    .vm-title {
      font-family: var(--font-heading, 'Inter Tight', sans-serif);
      font-size: 13px;
      font-weight: 400;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--neutral-600, #57534e);
    }

    .vm-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: var(--neutral-400, #a8a29e);
      border-radius: 4px;
      padding: 0;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s ease, color 0.15s ease;

      svg { width: 14px; height: 14px; display: block; }

      &:hover {
        background: var(--neutral-100, #f5f5f4);
        color: var(--neutral-700, #44403c);
      }
    }

    /* ── Body ──────────────────────────────────────────────────────────── */
    .vm-body {
      flex: 1;
      min-height: 0;
      display: flex;
      background: var(--neutral-900, #0f0f0e);
    }

    .vm-video {
      width: 100%;
      height: 100%;
      max-height: calc(88vh - 53px);
      display: block;
      outline: none;
    }

    /* ── Placeholder ───────────────────────────────────────────────────── */
    .vm-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 280px;
      gap: 16px;
      background: var(--neutral-50, #fafaf9);
    }

    .vm-placeholder-icon {
      width: 48px;
      height: 48px;
      color: var(--orange-500, #f97316);
      opacity: 0.3;
    }

    .vm-placeholder-text {
      font-family: var(--font-body, 'Inter', sans-serif);
      font-size: 13px;
      font-weight: 300;
      color: var(--neutral-400, #a8a29e);
      letter-spacing: 0.02em;
      margin: 0;
    }
  `],
})
export class VideoModalComponent {
  /** Path or URL to the video file. */
  @Input() src = '';
  /** Title displayed in the modal header. */
  @Input() title = 'Help Video';
  /** Emitted when the user closes the modal. */
  @Output() readonly closed = new EventEmitter<void>();
}
