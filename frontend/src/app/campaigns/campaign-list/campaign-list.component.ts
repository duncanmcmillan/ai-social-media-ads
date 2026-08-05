import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, Campaign, CampaignBrief } from '../../core/api.service';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="container">
      <h1>Campaigns</h1>

      <section class="create-form card">
        <h2>Create New Campaign</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="field">
            <label>Product Name</label>
            <input formControlName="productName" type="text" placeholder="e.g. AcmeWidget Pro" />
          </div>
          <div class="field">
            <label>Product Description</label>
            <textarea formControlName="productDescription" rows="3"
              placeholder="Describe your product and its key benefits"></textarea>
          </div>
          <div class="field">
            <label>Target Audience</label>
            <input formControlName="targetAudience" type="text"
              placeholder="e.g. Small business owners aged 25-45" />
          </div>
          <div class="field">
            <label>Goal</label>
            <input formControlName="goal" type="text" placeholder="e.g. Drive website signups" />
          </div>
          <div class="field">
            <label>Tone (optional)</label>
            <input formControlName="tone" type="text" placeholder="e.g. Friendly, urgent, professional" />
          </div>
          <div class="field">
            <label>Budget (USD, optional)</label>
            <input formControlName="budget" type="number" placeholder="100" />
          </div>
          <div class="field">
            <label>Platforms</label>
            <div class="checkboxes">
              <label>
                <input type="checkbox" [checked]="selectedPlatforms.includes('meta')"
                  (change)="togglePlatform('meta')" />
                Meta (Facebook / Instagram)
              </label>
              <label>
                <input type="checkbox" [checked]="selectedPlatforms.includes('tiktok')"
                  (change)="togglePlatform('tiktok')" />
                TikTok
              </label>
            </div>
          </div>
          <button type="submit" [disabled]="form.invalid || selectedPlatforms.length === 0 || submitting">
            {{ submitting ? 'Generating...' : 'Generate Ad Copy' }}
          </button>
          <p *ngIf="error" class="error">{{ error }}</p>
        </form>
      </section>

      <section class="campaign-table card">
        <h2>All Campaigns</h2>
        <p *ngIf="loading">Loading...</p>
        <table *ngIf="!loading && campaigns.length > 0">
          <thead>
            <tr>
              <th>Product</th>
              <th>Status</th>
              <th>Creatives</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of campaigns">
              <td>{{ getBrief(c).productName }}</td>
              <td><span class="badge" [ngClass]="badgeClass(c.status)">{{ c.status }}</span></td>
              <td>{{ c.creatives.length }}</td>
              <td>{{ c.createdAt | date:'short' }}</td>
              <td><a [routerLink]="['/campaigns', c.id]">Review</a></td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading && campaigns.length === 0">No campaigns yet.</p>
      </section>
    </div>
  `,
  styles: [`
    .container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem;
            box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
    h1 { margin-top: 0; }
    h2 { margin-top: 0; font-size: 1.1rem; color: #444; }
    .field { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 0.875rem; font-weight: 600; color: #333; }
    input, textarea { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px;
                      font-size: 0.95rem; font-family: inherit; }
    input:focus, textarea:focus { outline: none; border-color: #0066cc; }
    .checkboxes { display: flex; gap: 1.5rem; }
    .checkboxes label { font-weight: normal; display: flex; align-items: center; gap: 6px; }
    button[type=submit] { background: #0066cc; color: white; border: none; padding: 10px 24px;
                           border-radius: 6px; font-size: 0.95rem; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #842029; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    th { font-weight: 600; color: #555; }
  `]
})
export class CampaignListComponent implements OnInit {
  campaigns: Campaign[] = [];
  loading = true;
  submitting = false;
  error = '';
  selectedPlatforms: Array<'meta' | 'tiktok'> = ['meta'];

  form: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      productName: ['', Validators.required],
      productDescription: ['', Validators.required],
      targetAudience: ['', Validators.required],
      goal: ['', Validators.required],
      tone: [''],
      budget: [null],
    });
  }

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.api.listCampaigns().subscribe({
      next: (c) => { this.campaigns = c; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  togglePlatform(platform: 'meta' | 'tiktok'): void {
    const idx = this.selectedPlatforms.indexOf(platform);
    if (idx >= 0) {
      this.selectedPlatforms.splice(idx, 1);
    } else {
      this.selectedPlatforms.push(platform);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.selectedPlatforms.length === 0) return;
    this.submitting = true;
    this.error = '';

    const brief: CampaignBrief = {
      ...this.form.value,
      platforms: [...this.selectedPlatforms],
    };

    this.api.createCampaign(brief).subscribe({
      next: () => {
        this.submitting = false;
        this.form.reset();
        this.selectedPlatforms = ['meta'];
        this.loadCampaigns();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error ?? 'Failed to create campaign';
      },
    });
  }

  getBrief(c: Campaign): CampaignBrief {
    return c.brief as CampaignBrief;
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
}
