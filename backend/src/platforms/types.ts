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
  platform: string;
  headline: string;
  primaryText: string;
  cta: string;
}

export interface PublishResult {
  campaignId: string;
  adSetId: string;
  adId: string;
}

export interface IPlatformAdapter {
  publishCampaign(
    brief: CampaignBrief,
    creative: GeneratedCreative
  ): Promise<PublishResult>;
}
