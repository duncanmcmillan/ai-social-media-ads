import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, GeneratedCreative } from '../../core/api.service';

@Component({
  selector: 'app-review-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="panel" [ngClass]="'panel-' + creative.status.toLowerCase()">
      <div class="panel-header">
        <span class="badge" [ngClass]="badgeClass(creative.status)">{{ creative.status }}</span>
      </div>

      <div class="field">
        <label>Headline</label>
        <p>{{ creative.headline }}</p>
      </div>
      <div class="field">
        <label>Primary Text</label>
        <p>{{ creative.primaryText }}</p>
      </div>
      <div class="field">
        <label>CTA</label>
        <p class="cta-text">{{ creative.cta }}</p>
      </div>

      <div *ngIf="creative.publishResult" class="publish-info">
        <small>Published · Ad ID: {{ creative.publishResult.adId }}</small>
      </div>

      <div class="actions" *ngIf="creative.status === 'PENDING_REVIEW'">
        <button class="btn-approve" [disabled]="busy" (click)="approve()">
          {{ busy ? '...' : 'Approve & Publish' }}
        </button>
        <button class="btn-reject" [disabled]="busy" (click)="reject()">
          Reject
        </button>
      </div>

      <p *ngIf="error" class="error">{{ error }}</p>
    </div>
  `,
  styles: [`
    .panel { background: white; border-radius: 8px; padding: 1rem 1.25rem;
             box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-top: 3px solid #ddd; }
    .panel-pending_review { border-top-color: #ffc107; }
    .panel-published       { border-top-color: #0d6efd; }
    .panel-approved        { border-top-color: #198754; }
    .panel-rejected        { border-top-color: #dc3545; opacity: 0.7; }

    .panel-header { margin-bottom: 12px; }

    .field { margin-bottom: 10px; }
    label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.5px; color: #888; display: block; }
    p { margin: 2px 0 0; font-size: 0.9rem; line-height: 1.4; }

    .cta-text { font-weight: 600; }

    .publish-info { font-size: 0.8rem; color: #555; margin-bottom: 8px; }

    .actions { display: flex; gap: 8px; margin-top: 12px; }
    button { border: none; padding: 8px 16px; border-radius: 6px; font-size: 0.875rem; font-weight: 600; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-approve { background: #198754; color: white; }
    .btn-reject  { background: #f8f9fa; color: #dc3545; border: 1px solid #dc3545; }
    .error { color: #842029; font-size: 0.85rem; margin-top: 8px; }
  `]
})
export class ReviewPanelComponent {
  @Input() creative!: GeneratedCreative;
  @Input() campaignId!: string;
  @Output() approved = new EventEmitter<GeneratedCreative>();
  @Output() rejected = new EventEmitter<GeneratedCreative>();

  busy = false;
  error = '';

  constructor(private api: ApiService) {}

  approve(): void {
    this.busy = true;
    this.error = '';
    this.api.approveCreative(this.campaignId, this.creative.id).subscribe({
      next: (updated) => { this.busy = false; this.approved.emit(updated); },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.error ?? 'Failed to approve';
      },
    });
  }

  reject(): void {
    this.busy = true;
    this.error = '';
    this.api.rejectCreative(this.campaignId, this.creative.id).subscribe({
      next: (updated) => { this.busy = false; this.rejected.emit(updated); },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.error ?? 'Failed to reject';
      },
    });
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      PENDING_REVIEW: 'badge-pending',
      APPROVED: 'badge-approved',
      PUBLISHED: 'badge-published',
      REJECTED: 'badge-rejected',
    };
    return map[status] ?? '';
  }
}
