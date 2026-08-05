import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { CampaignBrief, GeneratedCreative } from '../platforms/types';

const client = new Anthropic({ apiKey: env.anthropicApiKey });

const PLATFORM_CONSTRAINTS: Record<string, string> = {
  meta: `Rules for Meta (Facebook/Instagram):
- headline: max 40 characters
- primaryText: max 125 characters
- cta: short call-to-action phrase (e.g. "Shop Now", "Learn More", "Sign Up")`,

  tiktok: `Rules for TikTok:
- headline: max 40 characters (used as ad title)
- primaryText: max 100 characters (the main ad text shown)
- cta: short call-to-action phrase (e.g. "Shop Now", "Learn More", "Download")`,
};

const VARIANTS_PER_PLATFORM = 2;

export async function generateCreatives(
  brief: CampaignBrief
): Promise<GeneratedCreative[]> {
  const results: GeneratedCreative[] = [];

  for (const platform of brief.platforms) {
    const constraints = PLATFORM_CONSTRAINTS[platform];
    if (!constraints) {
      console.warn(`Unknown platform: ${platform}, skipping`);
      continue;
    }

    const prompt = `You are an expert social media ad copywriter.

Generate ${VARIANTS_PER_PLATFORM} distinct ad copy variants for the following campaign brief:

Product: ${brief.productName}
Description: ${brief.productDescription}
Target Audience: ${brief.targetAudience}
Goal: ${brief.goal}
Tone: ${brief.tone ?? 'professional and engaging'}

${constraints}

Return ONLY a JSON array with exactly ${VARIANTS_PER_PLATFORM} objects. Each object must have:
- "headline": string
- "primaryText": string
- "cta": string

Do not include any explanation or markdown — only the raw JSON array.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      console.error(`Unexpected content type from Claude: ${content.type}`);
      continue;
    }

    let variants: Array<{ headline: string; primaryText: string; cta: string }>;
    try {
      const stripped = content.text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      variants = JSON.parse(stripped);
    } catch {
      console.error(`Failed to parse Claude response as JSON: ${content.text}`);
      continue;
    }

    for (const variant of variants) {
      results.push({
        platform,
        headline: variant.headline,
        primaryText: variant.primaryText,
        cta: variant.cta,
      });
    }
  }

  return results;
}
