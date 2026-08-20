/**
 * @fileoverview Slack integration service.
 * Sends Block Kit alert cards to a Slack incoming webhook URL
 * when performance gate thresholds are breached.
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { Gate, GateType } from '../../../dashboard/model/dashboard.model';

/** @internal Icon emoji for each gate type. */
const GATE_ICONS: Record<GateType, string> = {
  'learning-phase': '⏳',
  'fatigue':        '⚠️',
  'low-roas':       '📉',
};

/** @internal Recommended action copy for each gate type. */
const GATE_ACTIONS: Record<GateType, string> = {
  'learning-phase': 'Generate more conversions to exit the learning phase',
  'fatigue':        'Rotate creatives or expand audience',
  'low-roas':       'Review objective or targeting',
};

/**
 * Service for sending Slack Block Kit alert cards via incoming webhook.
 * Uses `HttpClient` for the POST — no Electron IPC needed because
 * Slack webhook endpoints are standard public HTTPS URLs.
 */
@Injectable({ providedIn: 'root' })
export class SlackService {
  private readonly http = inject(HttpClient);

  /**
   * Sends a Block Kit card for the given gate to the specified webhook URL.
   * @param gate - The performance gate to alert on.
   * @param webhookUrl - The Slack incoming webhook URL.
   * @returns A promise that resolves when the POST succeeds.
   * @throws When the HTTP request fails.
   */
  sendGateAlert(gate: Gate, webhookUrl: string): Promise<void> {
    return firstValueFrom(
      this.http.post(webhookUrl, this.buildPayload(gate), { responseType: 'text' }),
    ).then(() => undefined);
  }

  /**
   * Constructs a Slack Block Kit message payload for the given gate.
   * @param gate - The gate to represent in the payload.
   * @returns A plain object suitable for JSON serialisation.
   */
  private buildPayload(gate: Gate): object {
    const icon   = GATE_ICONS[gate.type];
    const action = GATE_ACTIONS[gate.type];
    // Extract entity name from detail strings like "Campaign Name (Frequency: 4.2)"
    const entity = gate.type !== 'learning-phase' ? gate.detail.split('(')[0].trim() : null;

    return {
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `${icon} Facebook Ads Alert — ${gate.label}` },
        },
        entity
          ? { type: 'section', text: { type: 'mrkdwn', text: `*${gate.label}*\n_${entity}_` } }
          : { type: 'section', text: { type: 'mrkdwn', text: `*${gate.label}*\n${gate.detail}` } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Severity*\n${Math.round(gate.severity * 100)}%` },
            { type: 'mrkdwn', text: `*Action*\n${action}` },
          ],
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: gate.detail }],
        },
      ],
    };
  }
}
