import { Router, Request, Response } from 'express';
import { prisma } from '../db/prismaClient';
import { generateCreatives } from '../ai/contentGenerator';
import { MetaAdapter } from '../platforms/meta/metaAdapter';
import { TikTokAdapter } from '../platforms/tiktok/tiktokAdapter';
import { CampaignBrief, IPlatformAdapter } from '../platforms/types';

export const campaignsRouter = Router();

const adapterRegistry: Record<string, IPlatformAdapter> = {
  meta: new MetaAdapter(),
  tiktok: new TikTokAdapter(),
};

// POST /campaigns — create campaign, generate copy, save to DB
campaignsRouter.post('/', async (req: Request, res: Response) => {
  try {
  const brief = req.body as CampaignBrief;

  if (!brief.productName || !brief.productDescription || !brief.platforms?.length) {
    res.status(400).json({
      error: 'Missing required fields: productName, productDescription, platforms',
    });
    return;
  }

  const campaign = await prisma.campaign.create({
    data: {
      brief: brief as object,
      status: 'DRAFT',
    },
  });

  // Generate copy variants via Claude
  let generatedCreatives;
  try {
    generatedCreatives = await generateCreatives(brief);
  } catch (aiErr: any) {
    await prisma.campaign.delete({ where: { id: campaign.id } });
    res.status(502).json({ error: `AI generation failed: ${aiErr?.message ?? aiErr}` });
    return;
  }

  await prisma.generatedCreative.createMany({
    data: generatedCreatives.map((c) => ({
      campaignId: campaign.id,
      platform: c.platform,
      headline: c.headline,
      primaryText: c.primaryText,
      cta: c.cta,
      status: 'PENDING_REVIEW',
    })),
  });

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: 'PENDING_REVIEW' },
  });

  const result = await prisma.campaign.findUnique({
    where: { id: campaign.id },
    include: { creatives: true },
  });

  res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Internal server error' });
  }
});

// GET /campaigns — list all campaigns
campaignsRouter.get('/', async (_req: Request, res: Response) => {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { creatives: { select: { id: true, platform: true, status: true } } },
  });
  res.json(campaigns);
});

// GET /campaigns/:id — campaign detail with all creatives
campaignsRouter.get('/:id', async (req: Request, res: Response) => {
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: { creatives: { include: { publishResult: true } } },
  });

  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  res.json(campaign);
});

// PATCH /campaigns/:id/creatives/:cid/approve — approve and publish
campaignsRouter.patch(
  '/:id/creatives/:cid/approve',
  async (req: Request, res: Response) => {
    const { id, cid } = req.params;

    const creative = await prisma.generatedCreative.findFirst({
      where: { id: cid, campaignId: id },
      include: { campaign: true },
    });

    if (!creative) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }

    if (creative.status !== 'PENDING_REVIEW') {
      res.status(409).json({ error: `Creative is already ${creative.status}` });
      return;
    }

    const adapter = adapterRegistry[creative.platform];
    if (!adapter) {
      res.status(400).json({ error: `No adapter for platform: ${creative.platform}` });
      return;
    }

    const brief = creative.campaign.brief as CampaignBrief;

    const publishResult = await adapter.publishCampaign(brief, {
      platform: creative.platform,
      headline: creative.headline,
      primaryText: creative.primaryText,
      cta: creative.cta,
    });

    await prisma.$transaction([
      prisma.generatedCreative.update({
        where: { id: cid },
        data: { status: 'PUBLISHED' },
      }),
      prisma.publishResult.create({
        data: {
          creativeId: cid,
          campaignId: publishResult.campaignId,
          adSetId: publishResult.adSetId,
          adId: publishResult.adId,
        },
      }),
    ]);

    // Update campaign status if any creative is published
    await prisma.campaign.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    const updatedCreative = await prisma.generatedCreative.findUnique({
      where: { id: cid },
      include: { publishResult: true },
    });

    res.json(updatedCreative);
  }
);

// PATCH /campaigns/:id/creatives/:cid/reject — mark rejected
campaignsRouter.patch(
  '/:id/creatives/:cid/reject',
  async (req: Request, res: Response) => {
    const { id, cid } = req.params;

    const creative = await prisma.generatedCreative.findFirst({
      where: { id: cid, campaignId: id },
    });

    if (!creative) {
      res.status(404).json({ error: 'Creative not found' });
      return;
    }

    if (creative.status !== 'PENDING_REVIEW') {
      res.status(409).json({ error: `Creative is already ${creative.status}` });
      return;
    }

    const updated = await prisma.generatedCreative.update({
      where: { id: cid },
      data: { status: 'REJECTED' },
    });

    res.json(updated);
  }
);
