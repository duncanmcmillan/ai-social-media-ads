import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SlackService } from './slack.service';
import type { Gate } from '../../../dashboard/model/dashboard.model';

const WEBHOOK_URL = 'https://hooks.slack.com/services/test/webhook';

const fatigue: Gate = {
  type: 'fatigue',
  label: 'Ad Fatigue',
  detail: 'Prospecting UK (Frequency: 4.2)',
  severity: 1.2,
};

const learningPhase: Gate = {
  type: 'learning-phase',
  label: 'Learning Phase',
  detail: '12 / 50 conversions — generate more events to exit the learning phase.',
  severity: 0.76,
};

describe('SlackService', () => {
  let service: SlackService;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service         = TestBed.inject(SlackService);
    httpController  = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpController.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('POSTs to the webhook URL with a Block Kit payload for a fatigue gate', async () => {
    const sendPromise = service.sendGateAlert(fatigue, WEBHOOK_URL);

    const req = httpController.expectOne(WEBHOOK_URL);
    expect(req.request.method).toBe('POST');

    const body = req.request.body as { blocks: { type: string }[] };
    expect(body.blocks[0].type).toBe('header');
    expect((body.blocks[0] as { type: string; text: { text: string } }).text.text).toContain('Ad Fatigue');

    req.flush('ok');
    await sendPromise;
  });

  it('POSTs a learning-phase payload without extracting entity from detail', async () => {
    const sendPromise = service.sendGateAlert(learningPhase, WEBHOOK_URL);

    const req = httpController.expectOne(WEBHOOK_URL);
    const body = req.request.body as { blocks: { type: string; text?: { text: string } }[] };
    const sectionText = (body.blocks[1] as { type: string; text: { text: string } }).text.text;
    // Should contain the full detail, not a split entity
    expect(sectionText).toContain('Learning Phase');

    req.flush('ok');
    await sendPromise;
  });

  it('rejects when the webhook POST fails', async () => {
    const sendPromise = service.sendGateAlert(fatigue, WEBHOOK_URL);

    const req = httpController.expectOne(WEBHOOK_URL);
    req.flush('invalid_token', { status: 403, statusText: 'Forbidden' });

    await expect(sendPromise).rejects.toThrow();
  });
});
