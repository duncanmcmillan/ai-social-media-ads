import { env } from '../../config/env';
import { CampaignBrief, GeneratedCreative, IPlatformAdapter, PublishResult } from '../types';
import { metaPost } from './metaClient';

interface MetaIdResponse {
  id: string;
}

export class MetaAdapter implements IPlatformAdapter {
  private readonly adAccountId: string;

  constructor() {
    this.adAccountId = env.meta.adAccountId;
  }

  async publishCampaign(
    brief: CampaignBrief,
    creative: GeneratedCreative
  ): Promise<PublishResult> {
    if (!this.adAccountId || !env.meta.accessToken) {
      // Stub for development without live API keys
      console.warn('[MetaAdapter] No credentials configured — returning stub publish result');
      return {
        campaignId: `stub_campaign_${Date.now()}`,
        adSetId: `stub_adset_${Date.now()}`,
        adId: `stub_ad_${Date.now()}`,
      };
    }

    const accountPath = `/act_${this.adAccountId}`;

    // Step 1: Create campaign
    const campaign = await metaPost<MetaIdResponse>(`${accountPath}/campaigns`, {
      name: `${brief.productName} — ${brief.goal}`,
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED',
      special_ad_categories: [],
    });

    // Step 2: Create ad set
    const adSet = await metaPost<MetaIdResponse>(`${accountPath}/adsets`, {
      name: `${brief.targetAudience} adset`,
      campaign_id: campaign.id,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'REACH',
      bid_amount: 200,
      daily_budget: brief.budget ? brief.budget * 100 : 1000,
      targeting: {
        geo_locations: { countries: ['US'] },
      },
      status: 'PAUSED',
    });

    // Step 3: Create ad creative
    const adCreative = await metaPost<MetaIdResponse>(`${accountPath}/adcreatives`, {
      name: `${brief.productName} creative`,
      object_story_spec: {
        page_id: env.meta.adAccountId,
        link_data: {
          message: creative.primaryText,
          link: 'https://example.com',
          name: creative.headline,
          call_to_action: {
            type: creative.cta.toUpperCase().replace(/\s+/g, '_'),
          },
        },
      },
    });

    // Step 4: Create ad
    const ad = await metaPost<MetaIdResponse>(`${accountPath}/ads`, {
      name: `${brief.productName} ad`,
      adset_id: adSet.id,
      creative: { creative_id: adCreative.id },
      status: 'PAUSED',
    });

    return {
      campaignId: campaign.id,
      adSetId: adSet.id,
      adId: ad.id,
    };
  }
}
