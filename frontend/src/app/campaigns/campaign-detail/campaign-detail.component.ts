import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService, Campaign, CampaignBrief, GeneratedCreative } from '../../core/api.service';
import { ReviewPanelComponent } from '../../review/review-panel/review-panel.component';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReviewPanelComponent],
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← All Campaigns</a>

      <div *ngIf="loading">Loading...</div>
      <div *ngIf="error" class="error-msg">{{ error }}</div>

      <ng-container *ngIf="campaign">
        <div class="header card">
          <h1>{{ brief.productName }}</h1>
          <span class="badge" [ngClass]="badgeClass(campaign.status)">{{ campaign.status }}</span>
          <p class="meta">Created {{ campaign.createdAt | date:'medium' }}</p>
          <dl class="brief-fields">
            <dt>Description</dt><dd>{{ brief.productDescription }}</dd>
            <dt>Target Audience</dt><dd>{{ brief.targetAudience }}</dd>
            <dt>Goal</dt><dd>{{ brief.goal }}</dd>
            <dt *ngIf="brief.tone">Tone</dt><dd *ngIf="brief.tone">{{ brief.tone }}</dd>
            <dt>Platforms</dt><dd>{{ brief.platforms.join(', ') }}</dd>
          </dl>
        </div>

        <section *ngFor="let platform of platforms">
          <h2 class="platform-heading">{{ platformLabel(platform) }}</h2>
          <div class="creatives-grid">
            <app-review-panel
              *ngFor="let c of creativesFor(platform)"
              [creative]="c"
              [campaignId]="campaign.id"
              (approved)="onCreativeUpdated($event)"
              (rejected)="onCreativeUpdated($event)"
            ></app-review-panel>
          </div>
        </section>
      </ng-container>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .back-link { font-size: 0.875rem; color: #0066cc; display: inline-block; margin-bottom: 1rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    h1 { margin: 0 0 8px; }
    .meta { font-size: 0.85rem; color: #888; margin: 4px 0 1rem; }
    .brief-fields { display: grid; grid-template-columns: auto 1fr; gap: 4px 16px; margin: 0; }
    dt { font-weight: 600; font-size: 0.85rem; color: #555; }
    dd { margin: 0; font-size: 0.9rem; }
    .platform-heading { font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 0.75rem;
                        text-transform: capitalize; color: #333; border-bottom: 2px solid #eee;
                        padding-bottom: 8px; }
    .creatives-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .error-msg { color: #842029; padding: 1rem; }
  `]
})
export class CampaignDetailComponent implements OnInit {
  campaign: Campaign | null = null;
  loading = true;
  error = '';

  get brief(): CampaignBrief {
    return this.campaign!.brief as CampaignBrief;
  }

  get platforms(): string[] {
    return [...new Set(this.campaign!.creatives.map((c) => c.platform))];
  }

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getCampaign(id).subscribe({
      next: (c) => { this.campaign = c; this.loading = false; },
      error: () => { this.error = 'Failed to load campaign'; this.loading = false; },
    });
  }

  creativesFor(platform: string): GeneratedCreative[] {
    return this.campaign!.creatives.filter((c) => c.platform === platform);
  }

  platformLabel(platform: string): string {
    const labels: Record<string, string> = {
      meta: 'Meta (Facebook / Instagram)',
      tiktok: 'TikTok',
    };
    return labels[platform] ?? platform;
  }

  badgeClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'badge-draft',
      PENDING_REVIEW: 'badge-pending',
      APPROVED: 'badge-approved',
      PUBLISHED: 'badge-published',
      REJECTED: 'badge-rejected',
    };
    return map[status] ?? 'badge-draft';
  }

  onCreativeUpdated(updated: GeneratedCreative): void {
    if (!this.campaign) return;
    this.campaign = {
      ...this.campaign,
      creatives: this.campaign.creatives.map((c) =>
        c.id === updated.id ? updated : c
      ),
    };
  }
}
