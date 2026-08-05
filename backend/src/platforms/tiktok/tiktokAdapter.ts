import { env } from '../../config/env';
import { CampaignBrief, GeneratedCreative, IPlatformAdapter, PublishResult } from '../types';
import { tiktokPost } from './tiktokClient';

interface TikTokCampaignData {
  campaign_id: string;
}

interface TikTokAdGroupData {
  adgroup_id: string;
}

interface TikTokAdData {
  ad_id: string;
}

export class TikTokAdapter implements IPlatformAdapter {
  async publishCampaign(
    brief: CampaignBrief,
    creative: GeneratedCreative
  ): Promise<PublishResult> {
    if (!env.tiktok.accessToken || !env.tiktok.advertiserId) {
      // Stub for development without live API keys
      console.warn('[TikTokAdapter] No credentials configured — returning stub publish result');
      return {
        campaignId: `stub_campaign_${Date.now()}`,
        adSetId: `stub_adgroup_${Date.now()}`,
        adId: `stub_ad_${Date.now()}`,
      };
    }

    const advertiserId = env.tiktok.advertiserId;

    // Step 1: Create campaign
    const campaignData = await tiktokPost<TikTokCampaignData>('/campaign/create/', {
      advertiser_id: advertiserId,
      campaign_name: `${brief.productName} — ${brief.goal}`,
      objective_type: 'REACH',
      budget_mode: 'BUDGET_MODE_TOTAL',
      budget: brief.budget ?? 100,
    });

    // Step 2: Create ad group
    const adGroupData = await tiktokPost<TikTokAdGroupData>('/adgroup/create/', {
      advertiser_id: advertiserId,
      campaign_id: campaignData.campaign_id,
      adgroup_name: `${brief.targetAudience} adgroup`,
      placement_type: 'PLACEMENT_TYPE_AUTOMATIC',
      budget_mode: 'BUDGET_MODE_DAY',
      budget: 10,
      schedule_type: 'SCHEDULE_FROM_NOW',
      optimization_goal: 'REACH',
      billing_event: 'CPM',
    });

    // Step 3: Create ad
    const adData = await tiktokPost<TikTokAdData>('/ad/create/', {
      advertiser_id: advertiserId,
      adgroup_id: adGroupData.adgroup_id,
      creatives: [
        {
          ad_name: `${brief.productName} ad`,
          ad_text: `${creative.primaryText} ${creative.cta}`,
          call_to_action: creative.cta,
        },
      ],
    });

    return {
      campaignId: campaignData.campaign_id,
      adSetId: adGroupData.adgroup_id,
      adId: adData.ad_id,
    };
  }
}
