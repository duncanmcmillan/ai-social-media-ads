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
          <span class="vm-title">{{ title }}</span>
          <button
            class="vm-close"
            type="button"
            aria-label="Close video"
            (click)="closed.emit()"
          >&#10005;</button>
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
              <span class="vm-placeholder-icon">&#9654;</span>
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
      background: rgba(0, 0, 0, 0.65);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .vm-dialog {
      background: var(--neutral-0, #fff);
      border-radius: 8px;
      width: 90vw;
      max-width: 880px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
    }

    .vm-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-bottom: 1px solid var(--neutral-200);
      flex-shrink: 0;
    }

    .vm-title {
      font-size: 14px;
      font-weight: 500;
      color: var(--neutral-700);
    }

    .vm-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--neutral-400);
      font-size: 14px;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--neutral-100);
        color: var(--neutral-700);
      }
    }

    .vm-body {
      flex: 1;
      min-height: 0;
      display: flex;
      background: #000;
    }

    .vm-video {
      width: 100%;
      height: 100%;
      max-height: calc(90vh - 54px);
      display: block;
      outline: none;
    }

    .vm-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 240px;
      gap: 12px;
      color: #666;
    }

    .vm-placeholder-icon {
      font-size: 40px;
      opacity: 0.3;
    }

    .vm-placeholder-text {
      font-size: 14px;
      opacity: 0.6;
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
