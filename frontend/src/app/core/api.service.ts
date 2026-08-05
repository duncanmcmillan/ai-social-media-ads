import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CampaignBrief {
  productName: string;
  productDescription: string;
  targetAudience: string;
  goal: string;
  tone?: string;
  budget?: number;
  platforms: Array<'meta' | 'tiktok'>;
}

export interface GeneratedCreative {
  id: string;
  campaignId: string;
  platform: string;
  headline: string;
  primaryText: string;
  cta: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  publishResult?: {
    id: string;
    campaignId: string;
    adSetId: string;
    adId: string;
    publishedAt: string;
  };
}

export interface Campaign {
  id: string;
  createdAt: string;
  brief: CampaignBrief;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'REJECTED';
  creatives: GeneratedCreative[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createCampaign(brief: CampaignBrief): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.base}/campaigns`, brief);
  }

  listCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.base}/campaigns`);
  }

  getCampaign(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.base}/campaigns/${id}`);
  }

  approveCreative(campaignId: string, creativeId: string): Observable<GeneratedCreative> {
    return this.http.patch<GeneratedCreative>(
      `${this.base}/campaigns/${campaignId}/creatives/${creativeId}/approve`,
      {}
    );
  }

  rejectCreative(campaignId: string, creativeId: string): Observable<GeneratedCreative> {
    return this.http.patch<GeneratedCreative>(
      `${this.base}/campaigns/${campaignId}/creatives/${creativeId}/reject`,
      {}
    );
  }
}
